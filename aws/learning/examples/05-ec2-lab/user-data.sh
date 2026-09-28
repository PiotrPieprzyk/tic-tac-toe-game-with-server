#!/bin/bash
# Lab 05 user-data: runs ONCE, as root, on the first boot. It's a tiny version
# of aws/ec2/user-data.sh.
# Log on the instance: /var/log/cloud-init-output.log
set -euxo pipefail

dnf install -y nginx docker
systemctl enable --now docker

# IMDSv2: first PUT for a session token, then send the token with every GET.
TOKEN=$(curl -sS -X PUT http://169.254.169.254/latest/api/token \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 300")
md() { curl -sS -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/$1"; }

cat > /usr/share/nginx/html/index.html <<HTML
<!doctype html>
<h1>Hello from $(md instance-id)</h1>
<p>Instance type $(md instance-type) in $(md placement/availability-zone).</p>
<p>This page was written by user-data at $(date -u) and is not rewritten on later boots.</p>
HTML

systemctl enable --now nginx
echo "aws-learning lab bootstrap finished"
