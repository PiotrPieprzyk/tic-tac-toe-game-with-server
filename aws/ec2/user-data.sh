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
# Pinned versions, verified by sha256 (arm64 builds only: t4g is Graviton).
# To upgrade: take the new hash from the release's docker-compose-linux-aarch64.sha256
# and checksums.txt files on GitHub.
COMPOSE_VERSION=v5.5.1
COMPOSE_SHA256=732e3a84c1a0f67256ce80bc2598a24546b10ca05f9faa97efceb1171ece2ef7
BUILDX_VERSION=v0.37.1
BUILDX_SHA256=e5cc9fe3bbff5cbc91230981f7860e06076110730a2db997082652199042a1f2
PLUGINS=/usr/local/lib/docker/cli-plugins
mkdir -p "$PLUGINS"
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-aarch64" \
    -o "$PLUGINS/docker-compose"
curl -fsSL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-arm64" \
    -o "$PLUGINS/docker-buildx"
# sha256sum -c exits non-zero on a mismatch, which aborts this script (set -e).
sha256sum -c - <<EOF
${COMPOSE_SHA256}  $PLUGINS/docker-compose
${BUILDX_SHA256}  $PLUGINS/docker-buildx
EOF
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
