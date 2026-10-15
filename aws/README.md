# tic-tac-toe on AWS: Terraform + ops scripts

One EC2 `t4g.micro` with Docker, RDS Postgres `db.t4g.micro`, HTTPS through a Cloudflare Tunnel. The infrastructure is
**declared as code with Terraform**, including the Cloudflare Tunnel and DNS record, so there are no manual dashboard
steps. Running the app on it is done by small Node scripts.

```
aws/
  bootstrap/   one-time: S3 bucket for the Terraform state
  infra/       provision: VPC lookups, EC2, RDS, IAM, SSM params, Cloudflare   (Terraform)
  ops/         run: deploy, connect, run, logs, status                         (Node scripts)
    lib/       aws CLI wrapper, SSM helpers, terraform-output reader
    ec2/       user-data.sh: first-boot script (Terraform passes it to the instance)
    db/        app-role.sql: Postgres app role (applied by the db-grants container on each deploy)
  learning/    Terraform learning guide
```

New to Terraform? Read the **[learning guide](learning/README.md)**.

| Task                                    | Command (run in `aws/infra/`)                                                  |
|-----------------------------------------|--------------------------------------------------------------------------------|
| Preview changes                         | `terraform plan -out tfplan`                                                   |
| Apply the previewed changes             | `terraform apply tfplan`                                                       |
| **Disable** (pause)                     | `terraform apply -var enabled=false`                                           |
| **Enable** (resume)                     | `terraform apply -var enabled=true`, then deploy with `--no-pull` (see below)  |
| Show outputs (URL, IDs, snapshots)      | `terraform output`                                                             |
| What Terraform manages                  | `terraform state list`                                                         |
| **Revert everything**                   | `terraform destroy` (see [Teardown](#teardown))                                |

Infrastructure is Terraform's job. **Operating the app** is the job of the scripts in [`ops/`](ops) (run them from the
repository root). They have no config of their own: every name (instance, DB, parameters, region) comes from
`terraform output -json` in `infra/`, so `terraform init` must have been run there.

| Task                       | Command                                                  |
|----------------------------|----------------------------------------------------------|
| Deploy the latest code     | `node aws/ops/deploy.mjs [--branch <name>]`              |
| Restart after a resume     | `node aws/ops/deploy.mjs --no-pull`                      |
| Status                     | `node aws/ops/status.mjs`                                |
| Shell on the instance      | `node aws/ops/connect.mjs`                               |
| Run one command            | `node aws/ops/run.mjs "docker ps"`                       |
| Container logs             | `node aws/ops/logs.mjs [backend\|frontend] --tail N`     |

The scripts only read and operate. They never create or change AWS resources, so they can't cause drift.

---

## 1. Prerequisites

1. **Terraform 1.11 or later**: `winget install Hashicorp.Terraform`, then open a new terminal and run `terraform version`.
2. **AWS CLI v2, signed in**: `aws login` (or `aws configure`), then check with `aws sts get-caller-identity`.
   Terraform uses the same credentials as the CLI.
3. **Session Manager plugin** (for `ops/connect.mjs`, [install guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html)) and **Node.js 20+** (for the `ops/` scripts).
4. **Cloudflare:**
   - The domain (`piotrpieprzyk.com`) is on Cloudflare.
   - An **API token**: <https://dash.cloudflare.com/profile/api-tokens> → *Create token* → *Custom token* with these
     permissions:
     - *Account → Cloudflare Tunnel → Edit*
     - *Zone → DNS → Edit* (zone: your domain)
   - Your **account ID** and **zone ID** (domain → *Overview* → right column, *API*). Put them in
     [`infra/terraform.tfvars`](infra/terraform.tfvars). They are IDs, not secrets.
   - Give the token to Terraform through the environment. Never put it in a file in the repo:
     ```powershell
     $env:CLOUDFLARE_API_TOKEN = "<token>"      # PowerShell (this terminal only)
     ```
     ```sh
     export CLOUDFLARE_API_TOKEN=<token>         # Git Bash
     ```

Cost and sizing are the the same as before: about **$0.035/hour** running, **$1–1.5/month** paused, and **$0** after teardown
(the state bucket costs a fraction of a cent).

---

## 2. First-time setup


### 2.1 Create the state bucket (once)

```sh
cd aws/bootstrap
terraform init
terraform apply          # review the plan, type "yes"
```

This creates the private, encrypted, versioned S3 bucket `tic-tac-toe-tfstate-<account-id>`. The bootstrap stack's
own state stays in a local `terraform.tfstate` file (git-ignored). If you lose that file, nothing breaks: the bucket
stays, and only this tiny stack forgets it owns it.

### 2.2 Create the stack

```sh
cd ../infra
terraform init -backend-config="bucket=$(terraform -chdir=../bootstrap output -raw state_bucket)"
terraform plan -out tfplan       # read it! ~25 resources to add
terraform apply tfplan           # ~10 min, mostly RDS
```

Then deploy the app from the repository root:

```sh
node aws/ops/deploy.mjs
```

If the deploy fails with `InvalidInstanceId`, the instance's SSM agent isn't online yet. Wait a minute and run it again.
Open <https://ttt.piotrpieprzyk.com>.

---

## 3. Pause and resume

```sh
terraform apply -var enabled=false
```

- **RDS** is deleted with a final snapshot named `tic-tac-toe-db-paused-<timestamp>`.
- **EC2** is stopped.
- The DB host parameter is removed.

```sh
terraform apply -var enabled=true
node aws/ops/deploy.mjs --no-pull     # from the repo root
```

- **RDS** is recreated from the **newest** pause snapshot. The `restored_from_snapshot` output shows which one.
- **EC2** is started.

`-var` overrides `terraform.tfvars` for one run only. If you mostly keep the stack paused, set `enabled = false` in
`terraform.tfvars` so that a plain `terraform apply` doesn't wake it up.

**Old pause snapshots are not deleted by Terraform.** RDS creates them, not Terraform, so they aren't in the state.
They cost little, but to remove all except the newest:

```sh
terraform output pause_snapshots
aws rds delete-db-snapshot --db-snapshot-identifier tic-tac-toe-db-paused-<old-timestamp>
```

---

## 4. Rotating the database passwords

Passwords are generated by Terraform but **never stored in its state** (see the
[learning guide, stage 8](learning/README.md#stage-8-secrets)). To rotate one, bump its version and apply:

```sh
terraform apply -var db_password_version=2        # master password: SSM and RDS updated together
terraform apply -var db_app_password_version=2    # app role: SSM updated; the next deploy applies it
node aws/ops/deploy.mjs --no-pull
```

Make the bump permanent in `terraform.tfvars`. Otherwise the next plain apply goes back to version 1 and rotates
again.

---

## Teardown

```sh
cd aws/infra
terraform destroy
```

This removes everything in the stack, including the Cloudflare tunnel, its DNS record, and all SSM parameters.
**If the database exists, a final snapshot is taken.** Then remove the snapshots and, if you're done with Terraform
for good, the state bucket:

```sh
aws rds describe-db-snapshots --snapshot-type manual --query "DBSnapshots[?starts_with(DBSnapshotIdentifier,'tic-tac-toe-db-paused')].DBSnapshotIdentifier"
aws rds delete-db-snapshot --db-snapshot-identifier <each one>

# Optional: the state bucket. It is protected by prevent_destroy (bootstrap/main.tf):
# remove that line, then:
cd ../bootstrap
aws s3 rm s3://$(terraform output -raw state_bucket) --recursive    # current versions
terraform destroy                                                    # may need emptying old versions in the console first
```

Check for leftovers:

```sh
aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=tic-tac-toe
```

---

## Files

| File                                                              | What it declares                                                             |
|-------------------------------------------------------------------|------------------------------------------------------------------------------|
| [`bootstrap/`](bootstrap)                                         | The S3 bucket for the state (run once)                                       |
| [`infra/versions.tf`](infra/versions.tf)                          | Required Terraform and provider versions                                     |
| [`infra/backend.tf`](infra/backend.tf)                            | Where state is stored (S3, with locking)                                     |
| [`infra/providers.tf`](infra/providers.tf)                        | AWS (region, default tags) and Cloudflare providers                          |
| [`infra/variables.tf`](infra/variables.tf), [`terraform.tfvars`](infra/terraform.tfvars) | Inputs and their values                               |
| [`infra/locals.tf`](infra/locals.tf)                              | All resource names (read back by `ops/` via outputs)                               |
| [`infra/network.tf`](infra/network.tf)                            | Default VPC lookup, app and DB security groups                               |
| [`infra/iam.tf`](infra/iam.tf)                                    | Instance role, policies, instance profile                                    |
| [`infra/secrets.tf`](infra/secrets.tf)                            | Generated DB passwords in SSM (kept out of state)                            |
| [`infra/database.tf`](infra/database.tf)                          | DB subnet group, RDS instance, pause/restore logic, DB host parameter        |
| [`infra/ec2.tf`](infra/ec2.tf)                                    | The instance (reuses [`aws/ec2/user-data.sh`](../ec2/user-data.sh)), running/stopped state |
| [`infra/cloudflare.tf`](infra/cloudflare.tf)                      | Tunnel, ingress rules, DNS record, tunnel token in SSM                       |
| [`infra/outputs.tf`](infra/outputs.tf)                            | Values printed after `apply`                                                 |
| `*/.terraform.lock.hcl`                                           | Exact provider versions and checksums (committed)                            |
