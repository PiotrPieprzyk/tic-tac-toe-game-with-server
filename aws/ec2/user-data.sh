#!/bin/bash
# EC2 bootstrap for the tic-tac-toe instance (Amazon Linux 2023, arm64).
# Runs once, as root, on first boot. Log: /var/log/cloud-init-output.log
# __REPO_URL__ and __APP_DIR__ are filled in by aws/scripts/setup.mjs.
set -euxo pipefail

# --- Docker + git
dnf install -y docker git
systemctl enable --now docker
usermod -aG docker ec2-user

# --- docker compose + buildx CLI plugins (not packaged for AL2023)
PLUGINS=/usr/local/lib/docker/cli-plugins
mkdir -p "$PLUGINS"
curl -fsSL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" \
    -o "$PLUGINS/docker-compose"
BUILDX_VERSION=$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | grep -m1 '"tag_name"' | cut -d'"' -f4)
curl -fsSL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-arm64" \
    -o "$PLUGINS/docker-buildx"
chmod +x "$PLUGINS/docker-compose" "$PLUGINS/docker-buildx"

# --- 2 GB swap: t4g.micro has 1 GB RAM, not enough for the frontend build
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile swap swap defaults 0 0' >> /etc/fstab
fi

# --- RDS CA bundle, mounted into the backend container for TLS verify-full
mkdir -p /opt/rds-ca
curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /opt/rds-ca/rds-global-bundle.pem

# --- Project source (public repo)
if [ ! -d "__APP_DIR__/.git" ]; then
    git clone "__REPO_URL__" "__APP_DIR__"
fi

echo "tic-tac-toe bootstrap finished"
