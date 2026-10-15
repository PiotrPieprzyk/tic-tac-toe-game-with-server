# RDS Postgres. While paused (var.enabled = false) the instance doesn't exist: Terraform deletes
# it with a final snapshot, and recreates it from the newest such snapshot on resume.

resource "aws_db_subnet_group" "db" {
  name        = local.names.db_subnet_group
  description = "tic-tac-toe default VPC subnets"
  subnet_ids  = data.aws_subnets.default.ids
}

# ---------------------------------------------------------------- pause snapshots
#
# Snapshots are made by RDS when the instance is deleted, so Terraform doesn't manage them. It
# only looks them up. The Resource Groups Tagging API returns an empty list (not an error) when
# there are none, unlike the aws_db_snapshot data source, which fails on a first run.
data "aws_resourcegroupstaggingapi_resources" "pause_snapshots" {
  resource_type_filters = ["rds:snapshot"]

  tag_filter {
    key    = "Project"
    values = [var.project]
  }
}

locals {
  # Snapshot ARNs look like arn:aws:rds:<region>:<account>:snapshot:<identifier>.
  # The identifiers end with a sortable timestamp, so the last one after sort() is the newest.
  pause_snapshot_ids = sort([
    for r in data.aws_resourcegroupstaggingapi_resources.pause_snapshots.resource_tag_mapping_list :
    split(":snapshot:", r.resource_arn)[1]
    if startswith(split(":snapshot:", r.resource_arn)[1], "${local.snapshot_prefix}-")
  ])
  newest_pause_snapshot = length(local.pause_snapshot_ids) > 0 ? local.pause_snapshot_ids[length(local.pause_snapshot_ids) - 1] : null
}

# Records when the current DB incarnation was created. It gives the final snapshot a unique name
# that stays the same for the DB's whole life. Using timestamp() directly would change the name
# on every plan and show a diff forever.
resource "time_static" "db_created" {
  count = var.enabled ? 1 : 0
}

# ---------------------------------------------------------------- instance

resource "aws_db_instance" "db" {
  # count = 0 → Terraform deletes the instance (pause); count = 1 → creates/restores it.
  count = var.enabled ? 1 : 0

  identifier     = local.names.db_instance
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  # Restore from the newest pause snapshot if there is one, otherwise start empty.
  snapshot_identifier = local.newest_pause_snapshot

  allocated_storage = var.db_storage_gb
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  # Write-only: sent to RDS, never stored in state. The value is read from SSM (secrets.tf).
  # On a restore the snapshot already has this same password, so setting it again is harmless.
  password_wo         = ephemeral.aws_ssm_parameter.db_password.value
  password_wo_version = var.db_password_version

  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false

  # Demo sizing: no automated backups, no Performance Insights (same as v1).
  backup_retention_period      = 0
  delete_automated_backups     = true
  performance_insights_enabled = false

  # Deleting (= pausing) always leaves a final snapshot, so the data is kept.
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.snapshot_prefix}-${formatdate("YYYYMMDDhhmmss", time_static.db_created[0].rfc3339)}"
  copy_tags_to_snapshot     = true # the snapshot gets Project=tic-tac-toe, which the lookup above relies on

  apply_immediately   = true
  deletion_protection = false # pausing deletes the instance

  lifecycle {
    # snapshot_identifier only matters when the instance is created. Later, a newer snapshot
    # must NOT trigger a replacement (a change to it forces one).
    ignore_changes = [snapshot_identifier]
  }
}

resource "aws_ssm_parameter" "db_host" {
  count = var.enabled ? 1 : 0

  name        = local.params.db_host
  description = "RDS endpoint hostname, read by the instance on deploy"
  type        = "String"
  value       = aws_db_instance.db[0].address
}
