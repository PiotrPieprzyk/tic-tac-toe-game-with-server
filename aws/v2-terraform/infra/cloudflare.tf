# HTTPS on a fixed domain through a Cloudflare Tunnel. A second provider in the same stack: this
# replaces v1's manual dashboard steps and set-tunnel-token.mjs.
#
# Browser → Cloudflare (TLS) → tunnel → cloudflared container on EC2 → http://frontend:80

resource "cloudflare_zero_trust_tunnel_cloudflared" "app" {
  account_id = var.cloudflare_account_id
  name       = local.names.tunnel
  config_src = "cloudflare" # ingress rules are managed here (below), not in a local config file
}

resource "cloudflare_zero_trust_tunnel_cloudflared_config" "app" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.app.id

  config = {
    ingress = [
      {
        hostname = var.domain
        # Resolved by Docker's DNS inside the compose network on the instance.
        service = "http://frontend:80"
      },
      {
        # Required catch-all: anything else gets a 404.
        service = "http_status:404"
      },
    ]
  }
}

resource "cloudflare_dns_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.app.id}.cfargotunnel.com"
  proxied = true
  ttl     = 1 # 1 = "automatic"; required for proxied records
  comment = "tic-tac-toe tunnel (managed by Terraform)"
}

# The token the cloudflared container uses to connect. It goes to SSM, where the deploy step
# reads it (via the instance role) into .env.aws.
#
# Trade-off: a data source result IS stored in the Terraform state. That's why the state bucket
# is encrypted and private. Anyone who can read the state can read this token.
data "cloudflare_zero_trust_tunnel_cloudflared_token" "app" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_zero_trust_tunnel_cloudflared.app.id
}

resource "aws_ssm_parameter" "cloudflare_tunnel_token" {
  name        = local.params.cloudflare_tunnel_token
  description = "Cloudflare Tunnel token for the cloudflared container"
  type        = "SecureString"
  value       = data.cloudflare_zero_trust_tunnel_cloudflared_token.app.token
}
