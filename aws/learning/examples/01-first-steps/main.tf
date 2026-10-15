# Lab 01: the Terraform workflow, with no cloud account and no cost.
# Uses two "local" providers: random (generates values) and local (writes files on your disk).
#
#   cd aws/learning/examples/01-first-steps
#   terraform init
#   terraform plan                       # what WOULD happen
#   terraform apply                      # do it (type "yes")
#   terraform apply                      # again: "No changes". Desired state = actual state.
#   terraform apply -var greeting=Hi     # change an input: watch "~ update" vs "-/+ replace"
#   terraform state list                 # what Terraform remembers
#   terraform state show random_pet.name
#   (delete out/hello.txt by hand, then) terraform plan    # drift: Terraform recreates it
#   terraform destroy

terraform {
  required_version = ">= 1.11, < 2.0"
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5"
    }
  }
}

variable "greeting" {
  description = "Try changing it with -var greeting=..."
  type        = string
  default     = "Hello"
}

variable "file_count" {
  description = "How many extra files to create (count meta-argument). Try 0 and 3."
  type        = number
  default     = 1
}

# A random name, generated once and then remembered in the state.
# `keepers`: a change in these values forces a new name (replacement).
resource "random_pet" "name" {
  length = 2
  keepers = {
    greeting = var.greeting
  }
}

locals {
  message = "${var.greeting}, ${random_pet.name.id}!"
}

# Depends on random_pet implicitly, because it references it. No depends_on needed.
resource "local_file" "hello" {
  filename = "${path.module}/out/hello.txt"
  content  = "${local.message}\n"
}

# count: 0 → none, N → N copies, addressed as local_file.extra[0], [1], ...
resource "local_file" "extra" {
  count    = var.file_count
  filename = "${path.module}/out/extra-${count.index}.txt"
  content  = "extra file ${count.index}\n"
}

output "message" {
  value = local.message
}
