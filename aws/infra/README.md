## Files

| File                                                                                     | What it declares                                                                           |
|------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| [`bootstrap/`](bootstrap)                                                                | The S3 bucket for the state (run once)                                                     |
| [`infra/versions.tf`](infra/versions.tf)                                                 | Required Terraform and provider versions                                                   |
| [`infra/backend.tf`](infra/backend.tf)                                                   | Where state is stored (S3, with locking)                                                   |
| [`infra/providers.tf`](infra/providers.tf)                                               | AWS (region, default tags) and Cloudflare providers                                        |
| [`infra/variables.tf`](infra/variables.tf), [`terraform.tfvars`](infra/terraform.tfvars) | Inputs and their values                                                                    |
| [`infra/locals.tf`](infra/locals.tf)                                                     | All resource names (read back by `ops/` via outputs)                                       |
| [`infra/network.tf`](infra/network.tf)                                                   | Default VPC lookup, app and DB security groups                                             |
| [`infra/iam.tf`](infra/iam.tf)                                                           | Instance role, policies, instance profile                                                  |
| [`infra/secrets.tf`](infra/secrets.tf)                                                   | Generated DB passwords in SSM (kept out of state)                                          |
| [`infra/database.tf`](infra/database.tf)                                                 | DB subnet group, RDS instance, pause/restore logic, DB host parameter                      |
| [`infra/ec2.tf`](infra/ec2.tf)                                                           | The instance (reuses [`aws/ec2/user-data.sh`](../ec2/user-data.sh)), running/stopped state |
| [`infra/cloudflare.tf`](infra/cloudflare.tf)                                             | Tunnel, ingress rules, DNS record, tunnel token in SSM                                     |
| [`infra/outputs.tf`](infra/outputs.tf)                                                   | Values printed after `apply`                                                               |
| `*/.terraform.lock.hcl`                                                                  | Exact provider versions and checksums (committed)                                          |

