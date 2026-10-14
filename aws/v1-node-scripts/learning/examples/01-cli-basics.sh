#!/usr/bin/env bash
# Lab 01: AWS CLI basics. READ-ONLY: creates nothing and costs nothing.
#
#   bash aws/learning/examples/01-cli-basics.sh
#
# What you practise: who am I (STS), regions and AZs, output formats,
# --query (JMESPath), public SSM parameters, --dry-run, and `help`.
# Every command here is one the project's scripts also use.
source "$(dirname "$0")/_common.sh"

step "1. Who am I? (the first thing setup.mjs runs)"
run aws sts get-caller-identity
# Which credentials and region did the CLI pick up, and from where?
run aws configure list

step "2. Output formats: the same call as json, table and text"
run aws ec2 describe-availability-zones --output json --query 'AvailabilityZones[0]'
run aws ec2 describe-availability-zones --output table \
    --query 'AvailabilityZones[].{Zone:ZoneName,Id:ZoneId,State:State}'
run aws ec2 describe-availability-zones --output text --query 'AvailabilityZones[].ZoneName'

step "3. --query (JMESPath): the default VPC, exactly like setup.mjs finds it"
VPC_ID=$(run aws ec2 describe-vpcs --filters Name=is-default,Values=true \
    --query 'Vpcs[0].VpcId' --output text)
echo "Default VPC: $VPC_ID"
# --filters runs on the AWS side; --query runs locally on the JSON that comes back.
run aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].{Subnet:SubnetId,AZ:AvailabilityZone,CIDR:CidrBlock,PublicIpOnLaunch:MapPublicIpOnLaunch}' \
    --output table

step "4. Public SSM parameter: the latest Amazon Linux 2023 arm64 AMI (see aws/config.mjs)"
AMI_ID=$(run aws ssm get-parameter \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64 \
    --query Parameter.Value --output text)
run aws ec2 describe-images --image-ids "$AMI_ID" \
    --query 'Images[0].{Name:Name,Arch:Architecture,Created:CreationDate}' --output table

step "5. What is in this account right now? (EC2 and RDS, all states)"
run aws ec2 describe-instances \
    --query 'Reservations[].Instances[].{Id:InstanceId,Type:InstanceType,State:State.Name,Name:Tags[?Key==`Name`]|[0].Value}' \
    --output table
run aws rds describe-db-instances \
    --query 'DBInstances[].{Id:DBInstanceIdentifier,Class:DBInstanceClass,Status:DBInstanceStatus}' --output table

step "6. Anything tagged Project=tic-tac-toe (what teardown.mjs checks at the end)"
run aws resourcegroupstaggingapi get-resources --tag-filters Key=Project,Values=tic-tac-toe \
    --query 'ResourceTagMappingList[].ResourceARN' --output table

step "7. --dry-run: 'would I be allowed to launch this?' without launching anything"
# Success looks like an ERROR: "Request would have succeeded, but DryRun flag is set."
# A permissions problem shows "UnauthorizedOperation" instead.
run aws ec2 run-instances --dry-run --image-id "$AMI_ID" --instance-type t4g.micro || true

step "8. Postgres versions RDS offers (the project pins major version 16)"
run aws rds describe-db-engine-versions --engine postgres --engine-version 16 \
    --query 'DBEngineVersions[].EngineVersion' --output text

cat <<'TIP'

Next steps on your own:
  aws ec2 describe-instances help        # full manual for any command (q to quit)
  aws ec2 wait help                      # the waiters the scripts use (instance-running, ...)
  aws sts get-caller-identity --debug    # see the raw HTTPS request and where credentials came from
Then open CloudTrail → Event history in the console: the calls you just made are listed there.
TIP
