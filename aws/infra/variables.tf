# Inputs of the stack. Non-secret values are set in terraform.tfvars.

# ---------------------------------------------------------------- lifecycle

variable "enabled" {
  description = "false = paused: RDS deleted with a final snapshot, EC2 stopped. true = running (restored from the newest pause snapshot if there is one)."
  type        = bool
  default     = true
}

# ---------------------------------------------------------------- general

variable "region" {
  description = "AWS region."
  type        = string
  default     = "eu-central-1"
}

variable "project" {
  description = "Prefix for names, and the value of the Project tag."
  type        = string
  default     = "tic-tac-toe"
}

variable "repo_url" {
  description = "Public git repo that user-data clones on the instance."
  type        = string
  default     = "https://github.com/PiotrPieprzyk/tic-tac-toe-game-with-server.git"
}

variable "app_dir" {
  description = "Where the repo is cloned on the instance."
  type        = string
  default     = "/opt/tic-tac-toe"
}

# ---------------------------------------------------------------- EC2

variable "ec2_instance_type" {
  description = "Smallest size that can build + run both containers (1 GB RAM + 2 GB swap). Must be arm64 (Graviton)."
  type        = string
  default     = "t4g.micro"
}

variable "ec2_volume_size_gb" {
  type    = number
  default = 10
}

# ---------------------------------------------------------------- RDS

variable "db_instance_class" {
  type    = string
  default = "db.t4g.micro"
}

variable "db_engine_version" {
  type    = string
  default = "16"
}

variable "db_storage_gb" {
  description = "20 GB is the gp3 minimum for RDS Postgres."
  type        = number
  default     = 20

  validation {
    condition     = var.db_storage_gb >= 20
    error_message = "RDS gp3 storage must be at least 20 GB."
  }
}

variable "db_name" {
  type    = string
  default = "tic_tac_toe"
}

variable "db_username" {
  description = "RDS master user. Only the one-shot migrate/db-grants containers use it."
  type        = string
  default     = "postgres"
}

variable "db_password_version" {
  description = "Bump to rotate the RDS master password (new random value in SSM + RDS)."
  type        = number
  default     = 1
}

variable "db_app_password_version" {
  description = "Bump to rotate the app role's password (new value in SSM; the next deploy applies it)."
  type        = number
  default     = 1
}

# ---------------------------------------------------------------- Cloudflare

variable "domain" {
  description = "Public hostname served through the Cloudflare Tunnel."
  type        = string
  default     = "ttt.piotrpieprzyk.com"
}

variable "cloudflare_account_id" {
  description = "Cloudflare dashboard → Account home → (⋯ next to the account) Copy account ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
    error_message = "cloudflare_account_id must be the 32-character hex ID from the Cloudflare dashboard (set it in terraform.tfvars)."
  }
}

variable "cloudflare_zone_id" {
  description = "Cloudflare dashboard → your domain → Overview → API → Zone ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-f]{32}$", var.cloudflare_zone_id))
    error_message = "cloudflare_zone_id must be the 32-character hex ID from the Cloudflare dashboard (set it in terraform.tfvars)."
  }
}
