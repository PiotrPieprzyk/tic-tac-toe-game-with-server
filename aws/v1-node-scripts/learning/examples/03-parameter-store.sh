#!/usr/bin/env bash
# Lab 03: SSM Parameter Store, the way the project stores DB passwords. FREE
# (standard parameters cost nothing). Creates /aws-learning/* and deletes it at the end.
#
#   bash aws/learning/examples/03-parameter-store.sh
source "$(dirname "$0")/_common.sh"

cleanup() {
    step "Cleanup: deleting /aws-learning/* parameters"
    run aws ssm delete-parameters --names /aws-learning/db-host /aws-learning/db-password >/dev/null || true
}
trap cleanup EXIT

step "1. A plain String (like /tic-tac-toe/db-host)"
run aws ssm put-parameter --name /aws-learning/db-host --type String \
    --value example.abc123.eu-central-1.rds.amazonaws.com \
    --tags "Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE"

step "2. A SecureString (like /tic-tac-toe/db-password), encrypted with the AWS-managed KMS key alias/aws/ssm"
PASSWORD=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
# setup.mjs passes the value via file:// so it doesn't show up in the process list;
# here it's a throwaway lab value, so passing it inline is fine.
run aws ssm put-parameter --name /aws-learning/db-password --type SecureString \
    --value "$PASSWORD" --tags "Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE" >/dev/null
pause

step "3. Reading it back: without and with decryption"
run aws ssm get-parameter --name /aws-learning/db-password --query Parameter.Value --output text
run aws ssm get-parameter --name /aws-learning/db-password --with-decryption --query Parameter.Value --output text

step "4. Hierarchy: everything under /aws-learning (why the project uses the /tic-tac-toe/ prefix)"
run aws ssm get-parameters-by-path --path /aws-learning --with-decryption \
    --query 'Parameters[].{Name:Name,Type:Type,Version:Version}' --output table

step "5. Overwrite creates a new version; history keeps the old ones"
run aws ssm put-parameter --name /aws-learning/db-host --type String --value new-host.example --overwrite
run aws ssm get-parameter-history --name /aws-learning/db-host \
    --query 'Parameters[].{Version:Version,Value:Value,Modified:LastModifiedDate}' --output table

step "6. The exact line deploy.mjs runs on the instance (with a lab parameter)"
echo "DB_HOST=\$(aws ssm get-parameter --region $AWS_REGION --name /aws-learning/db-host --query Parameter.Value --output text)"
DB_HOST=$(aws ssm get-parameter --name /aws-learning/db-host --query Parameter.Value --output text)
echo "→ DB_HOST=$DB_HOST"

echo
echo "Now open Systems Manager → Parameter Store in the console before the cleanup runs."
pause
