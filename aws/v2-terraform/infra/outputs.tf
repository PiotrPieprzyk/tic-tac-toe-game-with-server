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
  value = var.enabled ? "Deploy the app: node aws/v1-node-scripts/scripts/deploy.mjs" : "Paused. Resume with: terraform apply -var enabled=true"
}
