# Running tic-tac-toe on AWS (EC2 + RDS Postgres)

This guide runs the app on one small EC2 instance with Docker and a managed RDS Postgres database. You drive it all with
the AWS CLI, through the Node.js scripts in `aws/scripts/`. Each script prints every `aws …` command before running it,
so the output shows exactly what happens.

It's sized for **short sessions**: about 1 hour, about 5 people, about 10 requests/min and under 200 MB of data. Between
sessions the project stays **paused**.

There are **two implementations** of the same infrastructure. Use one or the other, not both:

- **v1, [`v1-node-scripts/`](v1-node-scripts)**: Node.js scripts calling the AWS CLI (imperative). This guide describes
  v1.
- **v2, [`v2-terraform/`](v2-terraform)**: the same stack as Terraform code (declarative Infrastructure as Code), and
  the Cloudflare Tunnel and DNS record are managed in code too. See its [README](v2-terraform/README.md) and the
  [Terraform learning guide](v2-terraform/learning/README.md). v2 still uses v1's `deploy`, `connect`, `run`, `logs`
  and `status` scripts to operate the app.

| Task                              | Command                                                                                             |
|-----------------------------------|-----------------------------------------------------------------------------------------------------|
| First-time setup and deploy       | `node aws/scripts/setup.mjs`                                                                        |
| Show status and URL               | `node aws/scripts/status.mjs`                                                                       |
| Shell on the instance             | `node aws/scripts/connect.mjs`                                                                      |
| Run one command remotely          | `node aws/scripts/run.mjs "docker ps"`                                                              |
| Container logs                    | `node aws/scripts/logs.mjs [backend\|frontend] [--tail N] [--since 10m]`                            |
| Deploy the latest code            | `node aws/scripts/deploy.mjs [--branch <name>]`                                                     |
| **Disable** (pause)               | `node aws/scripts/stop.mjs`                                                                         |
| **Enable** (resume)               | `node aws/scripts/start.mjs`                                                                        |
| **Revert everything**             | `node aws/scripts/teardown.mjs --yes`                                                               |
| Store the Cloudflare tunnel token | `node aws/scripts/set-tunnel-token.mjs <token-file>` ([section 7](#7-making-it-publicly-available)) |

Run all scripts from the repository root. Names, sizes and the region live in [
`config.mjs`](v1-node-scripts/config.mjs).

New to AWS? The [learning roadmap](v1-node-scripts/learning/README.md) explains every service used here, in order, with
official docs
and hands-on labs.

---

## 1. Prerequisites

1. **AWS CLI v2** (`aws --version`) with credentials for the account you want to use:
   ```sh
   aws login              # or: aws configure  (access key + secret, region eu-central-1)[README.md](README.md)  
   aws sts get-caller-identity
   ```
   The identity needs permissions for EC2, RDS, IAM, SSM and STS. An admin user is simplest for a personal account.
2. **Session Manager plugin**, used by `connect.mjs`. Get the Windows installer from
   https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe
   and check it with `session-manager-plugin --version`.
3. **Node.js 20 or later.** The scripts have no npm dependencies.
4. **Commit and push the AWS files** (`docker-compose.aws.yml`, `backend/Dockerfile.prod`, `frontend/nginx.aws.conf`).
   The instance **clones the code from GitHub**, not from your disk. By default `setup.mjs` and `deploy.mjs` deploy your
   *current local branch* as it exists on `origin`.

### Sizing and cost (eu-central-1, approximate)

| Resource | Choice                                                                                            |
|----------|---------------------------------------------------------------------------------------------------|
| EC2      | `t4g.micro` (arm64, 1 GB RAM) with 2 GB swap and a 10 GB gp3 disk                                 |
| RDS      | `db.t4g.micro`, Postgres 16, 20 GB gp3 (the minimum), single-AZ, no automated backups, not public |

- **Running:** about **$0.035/hour** (EC2 about $0.0096, RDS about $0.018, public IPv4 $0.005). A 1-hour session costs a
  few cents.
- **Paused:** about **$1–1.5/month**, for the EC2 disk plus a small DB snapshot.
- **After teardown:** $0.

---

## Architecture

```
Browser ──HTTPS──▶ Cloudflare ◀──outgoing tunnel── EC2 t4g.micro (Amazon Linux 2023, default VPC, SG: no inbound rules)
                     └─ docker compose -f docker-compose.aws.yml
                        ├─ migrate   (one-shot)  node-pg-migrate, as master user `postgres`
                        ├─ db-grants (one-shot)  aws/db/app-role.sql, as master user `postgres`
                        ├─ cloudflared       outgoing tunnel to Cloudflare ─▶ frontend:80
                        ├─ frontend (nginx)  serves the SPA
                        │     /api/*  ─▶ backend:3000/*     (/api prefix stripped)
                        │     /api/ws ─▶ backend:3000/ws    (WebSocket)
                        └─ backend (node)    not exposed on the host, connects as `tic_tac_toe_app`
                                 │ TLS, verify-full with the RDS CA bundle
                                 ▼
                     RDS Postgres db.t4g.micro (SG: 5432 only from the EC2 SG, not public)
```

- The browser talks to **one origin**. The frontend is built with `VITE_API_DOMAIN=/api` and nginx proxies `/api` to the
  backend, so no CORS setup is needed and the `UserId` cookie works as-is. The cookie is `HttpOnly` and `SameSite=Lax`.
- **Two database users.** On every deploy, compose starts the containers in this order: `migrate` → `db-grants` →
  `backend` → `frontend`, and each step waits for the previous one to succeed.
    - `migrate` runs the schema migrations as the RDS master user `postgres`.
    - `db-grants` creates or updates the role `tic_tac_toe_app`. It can only `SELECT/INSERT/UPDATE/DELETE` table rows.
      It can't create, alter or drop tables, and it can't touch `pgmigrations`.
    - The long-running `backend` only gets the app role's password. If the backend were ever compromised, the attacker
      couldn't drop tables or read the master password.
- Both DB passwords are generated once and stored in **SSM Parameter Store** as SecureStrings:
  `/tic-tac-toe/db-password` (master) and `/tic-tac-toe/db-app-password` (app role). The RDS hostname is in
  `/tic-tac-toe/db-host`. The instance reads them through its IAM role while deploying and writes them to
  `/opt/tic-tac-toe/.env.aws`, which only root can read.
- **Only the host can reach the instance metadata service** (IMDSv2 with hop limit 1). The metadata service at
  `169.254.169.254` hands out the instance role's temporary AWS credentials. Docker containers are one network hop
  further away, so they can't reach it. A bug in the internet-facing backend therefore can't be used to steal AWS
  credentials or read the passwords from Parameter Store.
- The Docker compose and buildx plugins installed by user-data are **pinned versions checked against their sha256**. A
  mismatch stops the bootstrap.
- Container logs are capped (3 × 10 MB per container), and each deploy removes build cache older than 72 h, so the 10 GB
  disk doesn't fill up.
- Every resource is tagged `Project=tic-tac-toe`.

Resources created:

| Resource                      | Name                                                                                                                                 |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| Security group (app)          | `tic-tac-toe-app-sg`: inbound TCP 80 from 0.0.0.0/0                                                                                  |
| Security group (db)           | `tic-tac-toe-db-sg`: inbound TCP 5432 from `tic-tac-toe-app-sg`                                                                      |
| IAM role and instance profile | `tic-tac-toe-ec2-role` / `tic-tac-toe-ec2-profile` (`AmazonSSMManagedInstanceCore`, plus read access to `/tic-tac-toe/*` parameters) |
| SSM parameters                | `/tic-tac-toe/db-password`, `/tic-tac-toe/db-app-password`, `/tic-tac-toe/db-host`, `/tic-tac-toe/cloudflare-tunnel-token`           |
| DB subnet group               | `tic-tac-toe-db-subnets` (the default VPC subnets)                                                                                   |
| RDS instance                  | `tic-tac-toe-db`                                                                                                                     |
| EC2 instance                  | `tic-tac-toe-app`                                                                                                                    |
| Snapshots (while paused)      | `tic-tac-toe-db-paused-<timestamp>`                                                                                                  |

---

To verify, run the commands below. The tagging API can keep listing a terminated instance for up to about an hour.

```sh
aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=tic-tac-toe
aws iam get-role --role-name tic-tac-toe-ec2-role           # expect NoSuchEntity
aws rds describe-db-snapshots --db-instance-identifier tic-tac-toe-db --snapshot-type manual
```

---

## Making it publicly available

The app is served at **https://ttt.piotrpieprzyk.com** through a Cloudflare Tunnel:

### One-time Cloudflare setup

1. **DNS:** add `piotrpieprzyk.com` to a free Cloudflare account
2. **Tunnel:** in Cloudflare go to *Zero Trust → Networks → Tunnels → Create tunnel* (Cloudflared) and name it
   `tic-tac-toe`. Add a public hostname `ttt.piotrpieprzyk.com` with service `http://frontend:80`. This creates the
   proxied `ttt` CNAME for you.
3. **Token:** get the tunnel token and store it **before** running `setup.mjs`, `deploy.mjs` or `start.mjs`:
    1. Open the tunnel in the Cloudflare dashboard: <https://one.dash.cloudflare.com/> → *Networks → Tunnels* →
       `tic-tac-toe` → *Edit* (the *Overview* / install page). The install command shows
       `cloudflared service install <token>`. Copy only the `<token>` part (a long `eyJ...` string).
    2. Paste it into a file that contains nothing else, for example `ttt-tunnel-token.txt`, **outside the repo** or in a
       git-ignored place.
    3. Upload it:
       ```sh
       node aws/scripts/set-tunnel-token.mjs ttt-tunnel-token.txt
       ```
   The script stores the file's content as the SecureString `/tic-tac-toe/cloudflare-tunnel-token` (the value goes
   through a temp file, never a command line), and **deletes your token file after a successful upload**. If the upload
   fails, the file is kept so you can retry. Running it again replaces the stored token.

### Removing the tunnel (web console)

1. Go to <https://one.dash.cloudflare.com/> → *Networks → Tunnels*, open the menu (⋮) of `tic-tac-toe` and choose
   *Delete*. A tunnel with an active connection can't be deleted, so run `node aws/scripts/stop.mjs` first (or
   `teardown.mjs --yes`), wait a minute, then delete it.
2. Go to <https://dash.cloudflare.com/> → `piotrpieprzyk.com` → *DNS → Records* and delete the `ttt` CNAME (it points to
   `<tunnel-id>.cfargotunnel.com`) if it is still there.
3. Delete the stored token: `aws ssm delete-parameter --name /tic-tac-toe/cloudflare-tunnel-token`.

The site is offline from then on. To bring it back, repeat the one-time setup above.

## Connecting to the instance, running commands, reading logs

### Interactive shell (Session Manager)

```sh
node aws/scripts/connect.mjs
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

To connect to the database with psql, from inside the instance. This uses the master user; replace
`postgres:$DB_PASSWORD` with `$DB_APP_USER:$DB_APP_PASSWORD` to see what the backend is allowed to do.

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
