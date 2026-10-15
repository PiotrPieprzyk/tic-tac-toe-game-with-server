# Lab 02: lifecycle rules and the pause pattern from infra/database.tf, with no cloud account.
# terraform_data is a built-in "do nothing" resource: perfect for watching what Terraform plans.
#
#   cd aws/v2-terraform/learning/examples/02-lifecycle
#   terraform init && terraform apply
#
#   1. Pause pattern (count toggled by a bool, like var.enabled):
#        terraform apply -var enabled=false    # "db" is destroyed, look at the plan
#        terraform apply -var enabled=true     # and created again, with a NEW created_at
#
#   2. Replacement: terraform apply -var engine=postgres17
#      `triggers_replace` behaves like an RDS/EC2 argument that can't be changed in place: -/+ replace.
#
#   3. ignore_changes: terraform apply -var ami=ami-222
#      No resource changes (only the bad_snapshot_name output moves, see step 5): the server
#      ignores AMI updates, like aws_instance.app in infra/ec2.tf.
#      Then: terraform apply -replace=terraform_data.server   # the deliberate way to rebuild it.
#
#   4. prevent_destroy: uncomment it below, then run terraform destroy. Terraform refuses.
#
#   5. Stable vs. moving names: compare `terraform plan` output twice in a row.
#      `final_snapshot_name` stays the same (time_static), `bad_snapshot_name` changes every time
#      (timestamp()). A changing value in a real resource means a diff that never goes away.
#
#   terraform destroy

terraform {
  required_version = ">= 1.11, < 2.0"
  required_providers {
    time = {
      source  = "hashicorp/time"
      version = "~> 0.14"
    }
  }
}

variable "enabled" {
  type    = bool
  default = true
}

variable "engine" {
  type    = string
  default = "postgres16"
}

variable "ami" {
  type    = string
  default = "ami-111"
}

resource "time_static" "db_created" {
  count = var.enabled ? 1 : 0
}

resource "terraform_data" "db" {
  count = var.enabled ? 1 : 0

  input            = { final_snapshot_name = "db-paused-${formatdate("YYYYMMDDhhmmss", time_static.db_created[0].rfc3339)}" }
  triggers_replace = [var.engine]

  lifecycle {
    prevent_destroy = true
  }
}

resource "terraform_data" "server" {
  input = { ami = var.ami }

  lifecycle {
    ignore_changes = [input]
  }
}

output "final_snapshot_name" {
  value = var.enabled ? terraform_data.db[0].output.final_snapshot_name : null
}

output "bad_snapshot_name" {
  value = "db-paused-${formatdate("YYYYMMDDhhmmss", timestamp())}"
}
