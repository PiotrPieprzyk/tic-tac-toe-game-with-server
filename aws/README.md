# tic-tac-toe on AWS: Terraform + ops scripts

One EC2 `t4g.micro` with Docker, RDS Postgres `db.t4g.micro`, HTTPS through a Cloudflare Tunnel. The infrastructure is
**declared as code with Terraform**, including the Cloudflare Tunnel and DNS record, so there are no manual dashboard
steps. Running the app on it is done by small Node scripts.

## Content

- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Commands](#commands)
- [Prerequisites](#prerequisites)
- [First-time setup](#first-time-setup)
    - [Create the state bucket (once)](#create-the-state-bucket-once)
    - [Create the stack](#create-the-stack)
- [Rotating the database passwords](#rotating-the-database-passwords)
- [Teardown](#teardown)

---

## Architecture

![img.png](img.png)

Cost and sizing are the the same as before: about **$0.035/hour** running, **$1–1.5/month** paused, and **$0** after
teardown
(the state bucket costs a fraction of a cent).

---

## Project structure

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

---

## Commands

| Infra tasks                        | Command (run in `aws/infra/`)                                                 |
|------------------------------------|-------------------------------------------------------------------------------|
| Preview changes                    | `terraform plan -out tfplan`                                                  |
| Apply the previewed changes        | `terraform apply tfplan`                                                      |
| **Disable** (pause)                | `terraform apply -var enabled=false`                                          |
| **Enable** (resume)                | `terraform apply -var enabled=true`, then deploy with `--no-pull` (see below) |
| Show outputs (URL, IDs, snapshots) | `terraform output`                                                            |
| What Terraform manages             | `terraform state list`                                                        |
| **Revert everything**              | `terraform destroy` (see [Teardown](#teardown))                               |

New to Terraform? Read the **[learning guide](learning/README.md)**.

| Ops task               | Command                                              |
|------------------------|------------------------------------------------------|
| Deploy the latest code | `node aws/ops/deploy.mjs [--branch <name>]`          |
| Restart after a resume | `node aws/ops/deploy.mjs --no-pull`                  |
| Status                 | `node aws/ops/status.mjs`                            |
| Shell on the instance  | `node aws/ops/connect.mjs`                           |
| Run one command        | `node aws/ops/run.mjs "docker ps"`                   |
| Container logs         | `node aws/ops/logs.mjs [backend\|frontend] --tail N` |

---

## Prerequisites

1. **Terraform 1.11 or later**: `winget install Hashicorp.Terraform`, then open a new terminal and run
   `terraform version`.
2. **AWS CLI v2, signed in**: `aws login` (or `aws configure`), then check with `aws sts get-caller-identity`.
   Terraform uses the same credentials as the CLI.
3. **Session Manager plugin** (for
   `ops/connect.mjs`, [install guide](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html))
   and **Node.js 20+** (for the `ops/` scripts).
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

---

## First-time setup

### Create the state bucket (once)

```sh
cd aws/bootstrap
terraform init
terraform apply          # review the plan, type "yes"
```

This creates the private, encrypted, versioned S3 bucket `tic-tac-toe-tfstate-<account-id>`. The bootstrap stack's
own state stays in a local `terraform.tfstate` file (git-ignored). If you lose that file, nothing breaks: the bucket
stays, and only this tiny stack forgets it owns it.

### Create the stack

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

## Rotating the database passwords

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