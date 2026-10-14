#!/usr/bin/env bash
# Lab 05: launch one small EC2 instance the way setup.mjs does: IAM role and
# instance profile, security group, Amazon Linux 2023 arm64, user-data, IMDSv2
# with hop limit 1, and SSM instead of SSH.
#
#   bash aws/learning/examples/05-ec2-lab/launch.sh
#
# COSTS MONEY while it runs, about $0.015/hour (t4g.micro + public IPv4 + 8 GB gp3).
# Run cleanup.sh in the same folder when you're done.
source "$(dirname "$0")/../_common.sh"
cd "$(dirname "$0")"

NAME=aws-learning-lab
ROLE=aws-learning-ec2-role
PROFILE=aws-learning-ec2-profile
SG_NAME=aws-learning-web-sg

step "1. IAM role that EC2 may assume, plus the AWS-managed policy SSM needs"
if ! aws iam get-role --role-name "$ROLE" >/dev/null 2>&1; then
    run aws iam create-role --role-name "$ROLE" \
        --assume-role-policy-document file://../02-iam/trust-policy.json \
        --tags "Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE" >/dev/null
fi
run aws iam attach-role-policy --role-name "$ROLE" \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

step "2. Instance profile: the 'container' that hands the role to an instance"
if ! aws iam get-instance-profile --instance-profile-name "$PROFILE" >/dev/null 2>&1; then
    run aws iam create-instance-profile --instance-profile-name "$PROFILE" >/dev/null
    run aws iam add-role-to-instance-profile --instance-profile-name "$PROFILE" --role-name "$ROLE"
fi

step "3. Security group: port 80 open to the world, no port 22 (no SSH)"
VPC_ID=$(aws ec2 describe-vpcs --filters Name=is-default,Values=true --query 'Vpcs[0].VpcId' --output text)
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$SG_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG_ID" = "None" ]; then
    SG_ID=$(run aws ec2 create-security-group --group-name "$SG_NAME" --description "aws-learning: public HTTP" \
        --vpc-id "$VPC_ID" --tag-specifications "ResourceType=security-group,Tags=[{Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE}]" \
        --query GroupId --output text)
    run aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null
fi
echo "Security group: $SG_ID"

step "4. Launch the instance"
INSTANCE_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$NAME" Name=instance-state-name,Values=pending,running,stopping,stopped \
    --query 'Reservations[0].Instances[0].InstanceId' --output text)
if [ "$INSTANCE_ID" = "None" ]; then
    AMI_ID=$(aws ssm get-parameter --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64 \
        --query Parameter.Value --output text)
    # A new instance profile needs a few seconds before EC2 accepts it (setup.mjs retries for the same reason).
    for attempt in 1 2 3 4 5 6 7 8 9 10; do
        if INSTANCE_ID=$(run aws ec2 run-instances \
            --image-id "$AMI_ID" \
            --instance-type t4g.micro \
            --security-group-ids "$SG_ID" \
            --associate-public-ip-address \
            --iam-instance-profile "Name=$PROFILE" \
            --metadata-options HttpTokens=required,HttpEndpoint=enabled,HttpPutResponseHopLimit=1 \
            --user-data file://user-data.sh \
            --tag-specifications \
                "ResourceType=instance,Tags=[{Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE},{Key=Name,Value=$NAME}]" \
                "ResourceType=volume,Tags=[{Key=$LAB_TAG_KEY,Value=$LAB_TAG_VALUE}]" \
            --query 'Instances[0].InstanceId' --output text); then
            break
        fi
        [ "$attempt" = 10 ] && exit 1
        echo "Instance profile probably not ready yet, retrying in 10s..."
        sleep 10
    done
else
    echo "Reusing $INSTANCE_ID"
    run aws ec2 start-instances --instance-ids "$INSTANCE_ID" >/dev/null
fi

step "5. Wait for 'running' (a waiter polls describe-instances for you)"
run aws ec2 wait instance-running --instance-ids "$INSTANCE_ID"
IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

step "6. Wait for the SSM agent to register (the same loop as waitForSsmOnline in aws/lib/aws.mjs)"
until [ "$(aws ssm describe-instance-information --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
        --query 'InstanceInformationList[0].PingStatus' --output text)" = "Online" ]; do
    echo "  not online yet..."; sleep 10
done

cat <<DONE

Instance $INSTANCE_ID is up.
  Web page (give user-data a minute or two): http://$IP
  Shell (needs the Session Manager plugin):  aws ssm start-session --target $INSTANCE_ID
  Run commands without a shell:             node aws/learning/examples/06-run-command.mjs

Next: follow on-the-instance.md in this folder.
When you're done: bash aws/learning/examples/05-ec2-lab/cleanup.sh
DONE
