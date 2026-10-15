# Names of everything, in one place. Kept identical to aws/v1-node-scripts/config.mjs so the
# v1 ops scripts (deploy/connect/run/logs/status) find the resources this stack creates.
locals {
  names = {
    ec2_instance     = "${var.project}-app"
    db_instance      = "${var.project}-db"
    db_subnet_group  = "${var.project}-db-subnets"
    app_sg           = "${var.project}-app-sg"
    db_sg            = "${var.project}-db-sg"
    role             = "${var.project}-ec2-role"
    instance_profile = "${var.project}-ec2-profile"
    inline_policy    = "${var.project}-read-params"
    tunnel           = var.project
  }

  params = {
    db_host                 = "/${var.project}/db-host"
    db_password             = "/${var.project}/db-password"
    db_app_password         = "/${var.project}/db-app-password"
    cloudflare_tunnel_token = "/${var.project}/cloudflare-tunnel-token"
  }

  # Final snapshots taken when pausing are named <prefix>-<YYYYMMDDhhmmss>, like v1's stop.mjs.
  snapshot_prefix = "${var.project}-db-paused"
}
