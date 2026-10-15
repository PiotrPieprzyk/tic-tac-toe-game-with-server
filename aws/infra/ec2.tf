# The app server: one t4g.micro running the Docker containers.

# Latest Amazon Linux 2023 arm64 AMI, from an AWS-owned public SSM parameter.
data "aws_ssm_parameter" "al2023_arm64" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64"
}

resource "aws_instance" "app" {
  # An AMI ID is not a secret; insecure_value skips the "sensitive" masking of `value`.
  ami           = data.aws_ssm_parameter.al2023_arm64.insecure_value
  instance_type = var.ec2_instance_type

  subnet_id                   = sort(data.aws_subnets.default.ids)[0]
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = true # needed for outbound internet in the default VPC (no NAT)
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size           = var.ec2_volume_size_gb
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
    tags                  = { Name = local.names.ec2_instance }
  }

  # IMDSv2 only, hop limit 1: only the host can reach the metadata service (and the role's
  # credentials); Docker containers are one hop further and can't.
  metadata_options {
    http_tokens                 = "required"
    http_endpoint               = "enabled"
    http_put_response_hop_limit = 1
  }

  # The bootstrap script. It uses bash ${...} syntax, which templatefile() would try
  # to interpolate, so the two placeholders are filled with replace() instead.
  user_data = replace(
    replace(
      replace(file("${path.module}/../ops/ec2/user-data.sh"), "\r\n", "\n"),
      "__REPO_URL__", var.repo_url,
    ),
    "__APP_DIR__", var.app_dir,
  )

  tags = { Name = local.names.ec2_instance }

  lifecycle {
    # Both would force a NEW instance (losing the disk and the checked-out app):
    #  - ami: AWS publishes a new AL2023 image every few weeks, so the data source above changes.
    #  - user_data: only runs on first boot anyway.
    # To deliberately rebuild the server: terraform apply -replace=aws_instance.app
    ignore_changes = [ami, user_data]
  }
}

# Running or stopped, from var.enabled. A stopped instance only costs its disk.
resource "aws_ec2_instance_state" "app" {
  instance_id = aws_instance.app.id
  state       = var.enabled ? "running" : "stopped"
}
