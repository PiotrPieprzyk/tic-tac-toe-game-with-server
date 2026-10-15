provider "aws" {
  region = var.region
  # Added to every taggable AWS resource. Project=tic-tac-toe identifies everything this stack creates.
  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
    }
  }
}

# Credentials: the CLOUDFLARE_API_TOKEN environment variable (never put it in a .tf/.tfvars file).
provider "cloudflare" {}
