# Running tic-tac-toe on AWS (EC2 + RDS Postgres)

This guide runs the app on one small EC2 instance with Docker and a managed RDS Postgres database. You drive it all with the AWS CLI, through the Node.js scripts in `aws/scripts/`. Each script prints every `aws …` command before running it, so the output shows exactly what happens.

It's sized for **short sessions**: about 1 hour, about 5 people, about 10 requests/min and under 200 MB of data. Between sessions the project stays **paused**.

| Task | Command |
|---|---|
| First-time setup and deploy | `node aws/scripts/setup.mjs` |
| Show status and URL | `node aws/scripts/status.mjs` |
| Shell on the instance | `node aws/scripts/connect.mjs` |
| Run one command remotely | `node aws/scripts/run.mjs "docker ps"` |
| Container logs | `node aws/scripts/logs.mjs [backend\|frontend] [--tail N] [--since 10m]` |
| Deploy the latest code | `node aws/scripts/deploy.mjs [--branch <name>]` |
| **Disable** (pause) | `node aws/scripts/stop.mjs` |
| **Enable** (resume) | `node aws/scripts/start.mjs` |
| **Revert everything** | `node aws/scripts/teardown.mjs --yes` |

Run all scripts from the repository root. Names, sizes and the region live in [`config.mjs`](config.mjs).

New to AWS? The [learning roadmap](learning/README.md) explains every service used here, in order, with official docs and hands-on labs.

---

## 1. Prerequisites

1. **AWS CLI v2** (`aws --version`) with credentials for the account you want to use:
   ```sh
   aws login              # or: aws configure  (access key + secret, region eu-central-1)
   aws sts get-caller-identity
   ```
   The identity needs permissions for EC2, RDS, IAM, SSM and STS. An admin user is simplest for a personal account.
2. **Session Manager plugin**, used by `connect.mjs`. Get the Windows installer from
   https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe
   and check it with `session-manager-plugin --version`.
3. **Node.js 20 or later.** The scripts have no npm dependencies.
4. **Commit and push the AWS files** (`docker-compose.aws.yml`, `backend/Dockerfile.prod`, `frontend/nginx.aws.conf`). The instance **clones the code from GitHub**, not from your disk. By default `setup.mjs` and `deploy.mjs` deploy your *current local branch* as it exists on `origin`.

### Sizing and cost (eu-central-1, approximate)

| Resource | Choice |
|---|---|
| EC2 | `t4g.micro` (arm64, 1 GB RAM) with 2 GB swap and a 10 GB gp3 disk |
| RDS | `db.t4g.micro`, Postgres 16, 20 GB gp3 (the minimum), single-AZ, no automated backups, not public |

- **Running:** about **$0.035/hour** (EC2 about $0.0096, RDS about $0.018, public IPv4 $0.005). A 1-hour session costs a few cents.
- **Paused:** about **$1–1.5/month**, for the EC2 disk plus a small DB snapshot.
- **After teardown:** $0.

---

## 2. Architecture

```
Browser ──HTTP:80──▶ EC2 t4g.micro (Amazon Linux 2023, default VPC, SG: 80 open, no 22)
                     └─ docker compose -f docker-compose.aws.yml
                        ├─ migrate   (one-shot)  node-pg-migrate, as master user `postgres`
                        ├─ db-grants (one-shot)  aws/db/app-role.sql, as master user `postgres`
                        ├─ frontend (nginx)  serves the SPA
                        │     /api/*  ─▶ backend:3000/*     (/api prefix stripped)
                        │     /api/ws ─▶ backend:3000/ws    (WebSocket)
                        └─ backend (node)    not exposed on the host, connects as `tic_tac_toe_app`
                                 │ TLS, verify-full with the RDS CA bundle
                                 ▼
                     RDS Postgres db.t4g.micro (SG: 5432 only from the EC2 SG, not public)
```

- The browser talks to **one origin**. The frontend is built with `VITE_API_DOMAIN=/api` and nginx proxies `/api` to the backend, so no CORS setup is needed and the `UserId` cookie works as-is. The cookie is `HttpOnly` and `SameSite=Lax`.
- **Two database users.** On every deploy, compose starts the containers in this order: `migrate` → `db-grants` → `backend` → `frontend`, and each step waits for the previous one to succeed.
  - `migrate` runs the schema migrations as the RDS master user `postgres`.
  - `db-grants` creates or updates the role `tic_tac_toe_app`. It can only `SELECT/INSERT/UPDATE/DELETE` table rows. It can't create, alter or drop tables, and it can't touch `pgmigrations`.
  - The long-running `backend` only gets the app role's password. If the backend were ever compromised, the attacker couldn't drop tables or read the master password.
- Both DB passwords are generated once and stored in **SSM Parameter Store** as SecureStrings: `/tic-tac-toe/db-password` (master) and `/tic-tac-toe/db-app-password` (app role). The RDS hostname is in `/tic-tac-toe/db-host`. The instance reads them through its IAM role while deploying and writes them to `/opt/tic-tac-toe/.env.aws`, which only root can read.
- **Only the host can reach the instance metadata service** (IMDSv2 with hop limit 1). The metadata service at `169.254.169.254` hands out the instance role's temporary AWS credentials. Docker containers are one network hop further away, so they can't reach it. A bug in the internet-facing backend therefore can't be used to steal AWS credentials or read the passwords from Parameter Store.
- The Docker compose and buildx plugins installed by user-data are **pinned versions checked against their sha256**. A mismatch stops the bootstrap.
- Container logs are capped (3 × 10 MB per container), and each deploy removes build cache older than 72 h, so the 10 GB disk doesn't fill up.
- Every resource is tagged `Project=tic-tac-toe`.

Resources created:

| Resource | Name |
|---|---|
| Security group (app) | `tic-tac-toe-app-sg`: inbound TCP 80 from 0.0.0.0/0 |
| Security group (db) | `tic-tac-toe-db-sg`: inbound TCP 5432 from `tic-tac-toe-app-sg` |
| IAM role and instance profile | `tic-tac-toe-ec2-role` / `tic-tac-toe-ec2-profile` (`AmazonSSMManagedInstanceCore`, plus read access to `/tic-tac-toe/*` parameters) |
| SSM parameters | `/tic-tac-toe/db-password`, `/tic-tac-toe/db-app-password`, `/tic-tac-toe/db-host` |
| DB subnet group | `tic-tac-toe-db-subnets` (the default VPC subnets) |
| RDS instance | `tic-tac-toe-db` |
| EC2 instance | `tic-tac-toe-app` |
| Snapshots (while paused) | `tic-tac-toe-db-paused-<timestamp>` |

---

## 3. First-time setup

```sh
git push                              # the instance deploys from GitHub
node aws/scripts/setup.mjs            # or: --branch master
```

This takes about 15–20 minutes: RDS creation is about 5–10 minutes, and the first Docker build on the micro instance is about 5–10 minutes. The last line prints `App URL: http://<public-ip>`. The script is safe to re-run. It reuses anything that already exists and re-applies the security group rules and instance metadata settings, so re-running it also repairs a run that failed partway through.

**Upgrading a deployment created by an earlier version of these scripts:** make sure the project is enabled (`start.mjs`), push, then run `setup.mjs` once. It creates the new `/tic-tac-toe/db-app-password` parameter and sets the metadata hop limit to 1 on the existing instance. After that, `deploy.mjs` works as usual. Until then, `deploy.mjs` fails with `ParameterNotFound`.

<details>
<summary>Equivalent raw AWS CLI commands (what setup.mjs does)</summary>

The commands below are written for Git Bash. JSON documents go through `file://` so quoting works the same in PowerShell.

```sh
export AWS_REGION=eu-central-1
TAG='Key=Project,Value=tic-tac-toe'

# Default VPC and its subnets
VPC_ID=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
SUBNETS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC_ID Name=default-for-az,Values=true --query 'Subnets[].SubnetId' --output text)

# Security groups
APP_SG=$(aws ec2 create-security-group --group-name tic-tac-toe-app-sg --description "tic-tac-toe app: public HTTP" \
  --vpc-id $VPC_ID --tag-specifications "ResourceType=security-group,Tags=[{$TAG}]" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $APP_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
DB_SG=$(aws ec2 create-security-group --group-name tic-tac-toe-db-sg --description "tic-tac-toe db: postgres from app only" \
  --vpc-id $VPC_ID --tag-specifications "ResourceType=security-group,Tags=[{$TAG}]" --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $DB_SG --protocol tcp --port 5432 --source-group $APP_SG

# IAM role and instance profile, so the instance can use SSM and read /tic-tac-toe/* parameters
cat > trust.json <<'EOF'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}
EOF
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
cat > params-policy.json <<EOF
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["ssm:GetParameter","ssm:GetParameters"],
 "Resource":"arn:aws:ssm:eu-central-1:$ACCOUNT:parameter/tic-tac-toe/*"}]}
EOF
aws iam create-role --role-name tic-tac-toe-ec2-role --assume-role-policy-document file://trust.json --tags $TAG
aws iam attach-role-policy --role-name tic-tac-toe-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam put-role-policy --role-name tic-tac-toe-ec2-role --policy-name tic-tac-toe-read-params --policy-document file://params-policy.json
aws iam create-instance-profile --instance-profile-name tic-tac-toe-ec2-profile --tags $TAG
aws iam add-role-to-instance-profile --instance-profile-name tic-tac-toe-ec2-profile --role-name tic-tac-toe-ec2-role

# DB passwords in Parameter Store: master user + least-privilege app role
DB_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")
aws ssm put-parameter --name /tic-tac-toe/db-password --type SecureString --value "$DB_PASSWORD" --tags $TAG
aws ssm put-parameter --name /tic-tac-toe/db-app-password --type SecureString \
  --value "$(node -e "console.log(require('crypto').randomBytes(24).toString('hex'))")" --tags $TAG

# RDS
aws rds create-db-subnet-group --db-subnet-group-name tic-tac-toe-db-subnets \
  --db-subnet-group-description "tic-tac-toe default VPC subnets" --subnet-ids $SUBNETS --tags $TAG
aws rds create-db-instance --db-instance-identifier tic-tac-toe-db \
  --engine postgres --engine-version 16 --db-instance-class db.t4g.micro \
  --allocated-storage 20 --storage-type gp3 --storage-encrypted \
  --db-name tic_tac_toe --master-username postgres --master-user-password "$DB_PASSWORD" \
  --db-subnet-group-name tic-tac-toe-db-subnets --vpc-security-group-ids $DB_SG \
  --no-publicly-accessible --no-multi-az --backup-retention-period 0 \
  --no-enable-performance-insights --copy-tags-to-snapshot --tags $TAG
aws rds wait db-instance-available --db-instance-identifier tic-tac-toe-db
DB_HOST=$(aws rds describe-db-instances --db-instance-identifier tic-tac-toe-db --query 'DBInstances[0].Endpoint.Address' --output text)
aws ssm put-parameter --name /tic-tac-toe/db-host --type String --value $DB_HOST --overwrite

# EC2 (user-data: docker, compose, swap, RDS CA bundle, git clone).
# Replace __REPO_URL__ and __APP_DIR__ in a copy of aws/ec2/user-data.sh first.
AMI=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64 --query Parameter.Value --output text)
aws ec2 run-instances --image-id $AMI --instance-type t4g.micro \
  --subnet-id <one-of-$SUBNETS> --security-group-ids $APP_SG --associate-public-ip-address \
  --iam-instance-profile Name=tic-tac-toe-ec2-profile \
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=10,VolumeType=gp3,Encrypted=true,DeleteOnTermination=true}' \
  --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=1 \
  --user-data file://user-data.sh \
  --tag-specifications "ResourceType=instance,Tags=[{$TAG},{Key=Name,Value=tic-tac-toe-app}]" "ResourceType=volume,Tags=[{$TAG}]"
aws ec2 wait instance-running --instance-ids <instance-id>
# Then deploy (section 5).
```
</details>

---

## 4. Connecting to the instance, running commands, reading logs

No SSH key or open port 22 is needed. Access goes through **AWS Systems Manager (SSM)** and is authorized by your AWS credentials.

### Interactive shell (Session Manager)

```sh
node aws/scripts/connect.mjs
# raw equivalent:
INSTANCE_ID=$(aws ec2 describe-instances --filters Name=tag:Name,Values=tic-tac-toe-app Name=instance-state-name,Values=running \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)
aws ssm start-session --target $INSTANCE_ID
```

Once connected (you start as `ssm-user`):

```sh
sudo -i
cd /opt/tic-tac-toe
docker ps                                         # container status
docker logs -f tic-tac-toe-backend-aws            # live backend logs (Ctrl+C to exit)
docker logs -f tic-tac-toe-frontend-aws           # nginx access and error logs
docker compose -f docker-compose.aws.yml --env-file .env.aws restart backend
free -m; df -h /                                  # memory and disk
cat /var/log/cloud-init-output.log                # first-boot (user-data) log
exit; exit                                        # end the session
```

To connect to the database with psql, from inside the instance. This uses the master user; replace `postgres:$DB_PASSWORD` with `$DB_APP_USER:$DB_APP_PASSWORD` to see what the backend is allowed to do.

```sh
source .env.aws
docker run --rm -it -v /opt/rds-ca:/certs:ro postgres:16-alpine \
  psql "postgres://postgres:$DB_PASSWORD@$DB_HOST:5432/tic_tac_toe?sslmode=verify-full&sslrootcert=/certs/rds-global-bundle.pem"
```

Migration and grant output (the one-shot containers stay around after they exit):

```sh
docker logs tic-tac-toe-migrate-aws
docker logs tic-tac-toe-db-grants-aws
```

### One-off commands without an interactive session (SSM Run Command)

```sh
node aws/scripts/run.mjs "docker ps"
node aws/scripts/logs.mjs backend --tail 200
node aws/scripts/logs.mjs --since 15m
```

Raw equivalent:

```sh
CMD_ID=$(aws ssm send-command --instance-ids $INSTANCE_ID --document-name AWS-RunShellScript \
  --parameters 'commands=["docker logs --tail 100 tic-tac-toe-backend-aws 2>&1"]' \
  --query Command.CommandId --output text)
aws ssm get-command-invocation --command-id $CMD_ID --instance-id $INSTANCE_ID \
  --query StandardOutputContent --output text
```

Run Command returns at most about 24 KB of output. For long or live logs, use the interactive session.

---

## 5. Getting the project onto the instance and updating it

- **First download:** on first boot, the EC2 user-data (`aws/ec2/user-data.sh`) clones the public repository into `/opt/tic-tac-toe`.
- **Deploy or update:** push your changes to GitHub, then run:
  ```sh
  node aws/scripts/deploy.mjs                 # current local branch
  node aws/scripts/deploy.mjs --branch master
  node aws/scripts/deploy.mjs --no-pull       # rebuild/restart only
  ```
  The script runs the following on the instance:
  ```sh
  cd /opt/tic-tac-toe
  git fetch --prune origin && git checkout -f -B <branch> origin/<branch>
  # write .env.aws from Parameter Store (DB_HOST, DB_PASSWORD, DB_APP_USER, DB_APP_PASSWORD)
  docker compose -f docker-compose.aws.yml --env-file .env.aws up -d --build --remove-orphans
  docker image prune -f && docker builder prune -f --filter until=72h
  ```
  A rebuild on `t4g.micro` takes a few minutes, mostly the frontend `pnpm install` and `vite build`.

---

## 6. Disable and enable

### Disable (pause) with `node aws/scripts/stop.mjs`

1. Stops the EC2 instance. The disk and Docker images are kept.
2. Deletes the RDS instance with a **final snapshot** `tic-tac-toe-db-paused-<timestamp>`. Only after that snapshot exists are older pause snapshots removed.

```sh
aws ec2 stop-instances --instance-ids $INSTANCE_ID && aws ec2 wait instance-stopped --instance-ids $INSTANCE_ID
aws rds delete-db-instance --db-instance-identifier tic-tac-toe-db \
  --final-db-snapshot-identifier tic-tac-toe-db-paused-20260924120000 --delete-automated-backups
aws rds wait db-instance-deleted --db-instance-identifier tic-tac-toe-db
```

RDS is deleted rather than stopped because a stopped RDS instance **starts again automatically after 7 days**, and you'd be billed from then on. A snapshot has no such limit.

### Enable (resume) with `node aws/scripts/start.mjs`

This takes about 15 minutes, so start it before the session.

1. Restores `tic-tac-toe-db` from the newest pause snapshot. It keeps the same identifier, so it gets the same endpoint hostname.
2. Starts EC2, waits for SSM, and restarts the containers.
3. Prints the URL. **The public IP changes on every start.** You can also get it with `node aws/scripts/status.mjs`.

```sh
aws rds restore-db-instance-from-db-snapshot --db-instance-identifier tic-tac-toe-db \
  --db-snapshot-identifier <newest tic-tac-toe-db-paused-*> --db-instance-class db.t4g.micro --storage-type gp3 \
  --db-subnet-group-name tic-tac-toe-db-subnets --vpc-security-group-ids $DB_SG \
  --no-publicly-accessible --no-multi-az --copy-tags-to-snapshot --tags Key=Project,Value=tic-tac-toe
aws rds wait db-instance-available --db-instance-identifier tic-tac-toe-db
aws ec2 start-instances --instance-ids $INSTANCE_ID && aws ec2 wait instance-running --instance-ids $INSTANCE_ID
aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text
```

The snapshot stays after a restore and is replaced on the next `stop.mjs`.

---

## 7. Making it publicly available

It's public as soon as setup or start finishes:

- The EC2 instance has a public IPv4 address, and `tic-tac-toe-app-sg` allows TCP 80 from anywhere.
- nginx in the `frontend` container listens on host port 80 and proxies `/api` to the backend. The backend and the database aren't reachable from the internet.
- Share the address `http://<public-ip>` from `status.mjs`.

> **Traffic is plain HTTP for now.** Anyone on the same network as a player (for example café Wi-Fi) can read requests, including the `UserId` cookie, which is the player's only credential. That's acceptable for short sessions with friends. HTTPS is planned; see [section 10](#10-roadmap).

Other possible upgrades (not set up):

- **A fixed address across stop/start without a domain:** an Elastic IP with `aws ec2 allocate-address` and `associate-address`. It costs about $3.6/month even while paused. The planned Cloudflare setup makes this unnecessary.
- **Restricting access:** replace `0.0.0.0/0` with your friends' IPs:
  ```sh
  aws ec2 revoke-security-group-ingress --group-id $APP_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
  aws ec2 authorize-security-group-ingress --group-id $APP_SG --protocol tcp --port 80 --cidr 203.0.113.7/32
  ```

---

## 8. Reverting all AWS changes

```sh
node aws/scripts/teardown.mjs          # dry run: lists what would be deleted
node aws/scripts/teardown.mjs --yes    # deletes everything, including ALL game data
```

The order matters because of dependencies. Raw equivalent:

```sh
aws ec2 terminate-instances --instance-ids $INSTANCE_ID          # its EBS volume goes with it
aws rds delete-db-instance --db-instance-identifier tic-tac-toe-db --skip-final-snapshot --delete-automated-backups
aws ec2 wait instance-terminated --instance-ids $INSTANCE_ID
aws rds wait db-instance-deleted --db-instance-identifier tic-tac-toe-db
aws rds describe-db-snapshots --db-instance-identifier tic-tac-toe-db --snapshot-type manual --query 'DBSnapshots[].DBSnapshotIdentifier'
aws rds delete-db-snapshot --db-snapshot-identifier <each tic-tac-toe-db-paused-*>
aws rds delete-db-subnet-group --db-subnet-group-name tic-tac-toe-db-subnets
aws ec2 delete-security-group --group-id $DB_SG                 # retry if DependencyViolation (ENIs detaching)
aws ec2 delete-security-group --group-id $APP_SG
aws iam remove-role-from-instance-profile --instance-profile-name tic-tac-toe-ec2-profile --role-name tic-tac-toe-ec2-role
aws iam delete-instance-profile --instance-profile-name tic-tac-toe-ec2-profile
aws iam detach-role-policy --role-name tic-tac-toe-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
aws iam delete-role-policy --role-name tic-tac-toe-ec2-role --policy-name tic-tac-toe-read-params
aws iam delete-role --role-name tic-tac-toe-ec2-role
aws ssm delete-parameters --names /tic-tac-toe/db-host /tic-tac-toe/db-password /tic-tac-toe/db-app-password
```

To verify, run the commands below. The tagging API can keep listing a terminated instance for up to about an hour.

```sh
aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=tic-tac-toe
aws iam get-role --role-name tic-tac-toe-ec2-role           # expect NoSuchEntity
aws rds describe-db-snapshots --db-instance-identifier tic-tac-toe-db --snapshot-type manual
```

The default VPC and its subnets were only used, never created, so nothing else needs reverting.

---

## 9. Troubleshooting

| Symptom | Where to look / fix |
|---|---|
| `Waiting for the SSM agent…` times out | The instance profile is missing or not attached (`aws ec2 describe-instances … IamInstanceProfile`), or the instance has no internet access. Check the EC2 console → Instance → Monitor → *Get system log*. |
| Deploy says `docker: command not found` or `compose` is missing | User-data failed. Connect and check `/var/log/cloud-init-output.log`. |
| Deploy fails with `docker-compose.aws.yml missing on this branch` | Commit and push the AWS files to the branch you deploy. |
| The backend keeps restarting and logs show `self-signed certificate` or `ENOENT /certs/...` | The RDS CA bundle is missing. On the instance: `curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /opt/rds-ca/rds-global-bundle.pem`. |
| The backend logs `ECONNREFUSED` or a timeout to RDS | The DB isn't `available` yet (`status.mjs`), or the `tic-tac-toe-db-sg` rule is missing. |
| The build dies with `Killed` or exit 137 | Out of memory. Check that swap is on (`free -m`); `swapon /swapfile` if it isn't. |
| Deploy says `service "migrate"` or `"db-grants"` `didn't complete successfully` | A migration or the grant script failed, and the backend was not started. Check `docker logs tic-tac-toe-migrate-aws` or `docker logs tic-tac-toe-db-grants-aws`. |
| Deploy fails with `ParameterNotFound` for `/tic-tac-toe/db-app-password` | The deployment predates the app DB role. Run `setup.mjs` once (section 3). |
| The backend logs `permission denied for table …` | A new table was created outside migrations, or `db-grants` didn't run. Redeploy; `db-grants` re-applies the grants to every table. |
| cloud-init log shows `sha256sum: WARNING: 1 computed checksum did NOT match` | The downloaded compose or buildx binary doesn't match the pinned hash. Don't bypass it: check the release on GitHub and update the version and hash together in `aws/ec2/user-data.sh`. |
| The site loads but the API gives 502 | The backend is down. Run `node aws/scripts/logs.mjs backend`. |
| `connect.mjs`: `SessionManagerPlugin is not found` | Install the Session Manager plugin (section 1). |

---

## 10. Roadmap

Planned, not implemented yet.

### HTTPS on a fixed domain with Cloudflare

Goal: `https://<your-domain>` instead of `http://<ip-that-changes-on-every-start>`.

- **Domain:** already bought, registered at Netlify. The registration stays at Netlify. Only the **DNS** moves: in Netlify, point the domain's nameservers to the two Cloudflare nameservers you get when you add the domain to a free Cloudflare account. Cloudflare's free plan needs the whole domain's DNS, not just a subdomain. Before switching, recreate in Cloudflare any records Netlify DNS currently serves, for example a Netlify site on the root domain, or it goes offline.
- **Cloudflare Tunnel:** a `cloudflared` container runs next to nginx in `docker-compose.aws.yml` and makes an *outgoing* connection to Cloudflare. Cloudflare terminates HTTPS with its own certificate and forwards requests through the tunnel to `frontend:80`. WebSockets (`/api/ws`) work through the tunnel.
- **What it gives us:**
  - A fixed URL even though the EC2 IP changes on every start, with no Elastic IP needed.
  - HTTPS, so the `UserId` cookie can also get the `Secure` flag.
  - **Port 80 can be closed** in `tic-tac-toe-app-sg`, so the instance accepts no inbound connections at all.
- **Work involved:** store the tunnel token in Parameter Store (SecureString, e.g. `/tic-tac-toe/cloudflare-tunnel-token`), write it to `.env.aws` in `deploy.mjs`, add the `cloudflared` service, revoke the port 80 rule in `setup.mjs`, add `secure: true` to the cookie, and update `publicUrl()` and this README.

### Build Docker images in GitHub Actions

Today the `t4g.micro` builds both images on every deploy. That takes minutes, needs 2 GB of swap, and a build can run out of memory.

- A GitHub Actions workflow builds the `linux/arm64` images on push and pushes them to a registry: GHCR (free for public repos) or Amazon ECR (the instance role would then need ECR pull permissions).
- `docker-compose.aws.yml` switches from `build:` to `image: …:<git-sha>`, and `deploy.mjs` runs `docker compose pull && up -d` instead of `up --build`.
- The instance then no longer needs buildx, the swap file, or the build cache cleanup.
