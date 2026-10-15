provider "aws" {
  region = var.region

  # Added to every taggable AWS resource. Project=tic-tac-toe is what the v1 ops scripts
  # (deploy/connect/logs/status) search for, so they work on this stack too.
  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}

# Credentials: the CLOUDFLARE_API_TOKEN environment variable (never put it in a .tf/.tfvars file).
provider "cloudflare" {}
