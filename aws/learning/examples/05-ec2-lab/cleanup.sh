#!/usr/bin/env bash
# Lab 05 cleanup: removes everything launch.sh created, in dependency order
# (the same order teardown.mjs uses for the real project).
#
#   bash aws/learning/examples/05-ec2-lab/cleanup.sh
source "$(dirname "$0")/../_common.sh"

NAME=aws-learning-lab
ROLE=aws-learning-ec2-role
PROFILE=aws-learning-ec2-profile
SG_NAME=aws-learning-web-sg

step "1. Terminate the instance (its EBS root volume is deleted with it)"
IDS=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$NAME" Name=instance-state-name,Values=pending,running,stopping,stopped \
    --query 'Reservations[].Instances[].InstanceId' --output text)
if [ -n "$IDS" ]; then
    # shellcheck disable=SC2086
    run aws ec2 terminate-instances --instance-ids $IDS >/dev/null
    # shellcheck disable=SC2086
    run aws ec2 wait instance-terminated --instance-ids $IDS
fi

step "2. Delete the security group (retries while the network interface detaches)"
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" \
    --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG_ID" != "None" ]; then
    for attempt in $(seq 1 30); do
        run aws ec2 delete-security-group --group-id "$SG_ID" && break
        echo "  still in use (DependencyViolation), retrying in 10s..."; sleep 10
    done
fi

step "3. IAM: detach the role from the profile, delete the profile, detach the policy, delete the role"
aws iam remove-role-from-instance-profile --instance-profile-name "$PROFILE" --role-name "$ROLE" 2>/dev/null || true
aws iam delete-instance-profile --instance-profile-name "$PROFILE" 2>/dev/null || true
aws iam detach-role-policy --role-name "$ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore 2>/dev/null || true
aws iam delete-role --role-name "$ROLE" 2>/dev/null || true

step "4. Check: anything still tagged Project=$LAB_TAG_VALUE?"
run aws resourcegroupstaggingapi get-resources --tag-filters "Key=$LAB_TAG_KEY,Values=$LAB_TAG_VALUE" \
    --query 'ResourceTagMappingList[].ResourceARN' --output text
echo "(A terminated instance can stay listed here for up to about an hour. That's normal.)"
