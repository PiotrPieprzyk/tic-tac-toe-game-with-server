# Network: the account's default VPC (read, never modified) and two security groups.

# Data sources READ existing things; Terraform never creates, changes or deletes them.
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

# ---------------------------------------------------------------- app

resource "aws_security_group" "app" {
  name        = local.names.app_sg
  description = "tic-tac-toe app: no inbound (Cloudflare Tunnel)"
  vpc_id      = data.aws_vpc.default.id
  tags        = { Name = local.names.app_sg }
}

# No ingress rules: cloudflared and the SSM agent connect OUTWARDS.
#
# Unlike the console/CLI, Terraform deletes the default "allow all outbound" rule of a new
# security group, so outbound access must be declared. The instance needs it for SSM,
# Cloudflare, GitHub, Docker Hub, and the database.
resource "aws_vpc_security_group_egress_rule" "app_all_ipv4" {
  security_group_id = aws_security_group.app.id
  description       = "All outbound"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# ---------------------------------------------------------------- db

resource "aws_security_group" "db" {
  name        = local.names.db_sg
  description = "tic-tac-toe db: postgres from app only"
  vpc_id      = data.aws_vpc.default.id
  tags        = { Name = local.names.db_sg }
}

# The source is the app's security group, not an IP: any instance in that group may connect.
resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "Postgres from the app instance"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.app.id
}

# The database needs no outbound rule: security groups are stateful, so replies to
# allowed inbound connections are always let out.
