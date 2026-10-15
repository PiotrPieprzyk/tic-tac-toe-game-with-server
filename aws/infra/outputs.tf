output "status" {
  value = var.enabled ? "running" : "paused (RDS deleted with a final snapshot, EC2 stopped)"
}

output "app_url" {
  value = "https://${var.domain}"
}

output "instance_id" {
  value = aws_instance.app.id
}

output "db_endpoint" {
  value = var.enabled ? aws_db_instance.db[0].address : null
}

output "restored_from_snapshot" {
  description = "Pause snapshot a new DB is restored from (null = a fresh, empty database)."
  value       = local.newest_pause_snapshot
}

output "pause_snapshots" {
  description = "Pause snapshots that exist. Terraform doesn't delete them; see README for cleanup."
  value       = local.pause_snapshot_ids
}

output "next_step" {
  value = var.enabled ? "Deploy the app: node aws/ops/deploy.mjs" : "Paused. Resume with: terraform apply -var enabled=true"
}

# ---------------------------------------------------------------- read by aws/ops/*.mjs
# The ops scripts get every name from here (terraform output -json) instead of a config file,
# so they can't drift from what Terraform created.

output "region" {
  value = var.region
}

output "project" {
  value = var.project
}

output "app_dir" {
  description = "Where the repo is cloned on the instance."
  value       = var.app_dir
}

output "db_identifier" {
  value = local.names.db_instance
}

output "db_app_username" {
  description = "Least-privilege Postgres role the backend connects as (created by ops/db/app-role.sql)."
  value       = local.db_app_username
}

output "snapshot_prefix" {
  description = "Pause snapshots are named <prefix>-<YYYYMMDDhhmmss>."
  value       = local.snapshot_prefix
}

output "ssm_params" {
  description = "Parameter Store names the deploy script reads on the instance."
  value       = local.params
}
