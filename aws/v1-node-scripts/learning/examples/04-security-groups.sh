#!/usr/bin/env bash
# Lab 04: security groups, including a rule that points at another security
# group (how tic-tac-toe-db-sg only lets the app instance in). FREE. Deletes
# everything at the end.
#
#   bash aws/learning/examples/04-security-groups.sh
source "$(dirname "$0")/_common.sh"

VPC_ID=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
TAGS="ResourceType=security-group,Tags=[{Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE}]"
APP_SG="" DB_SG=""

cleanup() {
    step "Cleanup (db SG first: its rule references the app SG, so the app SG can't go first)"
    [ -n "$DB_SG" ] && run aws ec2 delete-security-group --group-id "$DB_SG" || true
    [ -n "$APP_SG" ] && run aws ec2 delete-security-group --group-id "$APP_SG" || true
}
trap cleanup EXIT

step "1. App SG: HTTP from anywhere (like tic-tac-toe-app-sg)"
APP_SG=$(run aws ec2 create-security-group --group-name aws-learning-app-sg \
    --description "aws-learning: public HTTP" --vpc-id "$VPC_ID" \
    --tag-specifications "$TAGS" --query GroupId --output text)
run aws ec2 authorize-security-group-ingress --group-id "$APP_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null

step "2. DB SG: Postgres only from members of the app SG (like tic-tac-toe-db-sg)"
DB_SG=$(run aws ec2 create-security-group --group-name aws-learning-db-sg \
    --description "aws-learning: postgres from app only" --vpc-id "$VPC_ID" \
    --tag-specifications "$TAGS" --query GroupId --output text)
run aws ec2 authorize-security-group-ingress --group-id "$DB_SG" --protocol tcp --port 5432 --source-group "$APP_SG" >/dev/null

step "3. Inspect the rules"
run aws ec2 describe-security-group-rules --filters "Name=group-id,Values=$APP_SG,$DB_SG" \
    --query 'SecurityGroupRules[].{Group:GroupId,Outbound:IsEgress,Proto:IpProtocol,Port:FromPort,FromCidr:CidrIpv4,FromGroup:ReferencedGroupInfo.GroupId}' \
    --output table
cat <<'NOTE'
Things to notice:
  - Each group also has an outbound rule allowing all traffic, which AWS adds by default.
  - The DB rule's source is a GROUP, not an IP. Any instance in the app SG can
    connect, whatever its IP. That matters because the app's IP changes on every start.
  - SGs are stateful: replies to allowed inbound traffic are allowed out automatically.
NOTE

step "4. Adding the same rule twice gives InvalidPermission.Duplicate (setup.mjs ignores that error on purpose)"
run aws ec2 authorize-security-group-ingress --group-id "$APP_SG" --protocol tcp --port 80 --cidr 0.0.0.0/0 || true

echo
echo "Open EC2 → Security Groups in the console and filter by tag Project=aws-learning."
pause
