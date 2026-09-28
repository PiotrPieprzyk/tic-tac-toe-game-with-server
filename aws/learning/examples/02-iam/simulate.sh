#!/usr/bin/env bash
# Lab 02: IAM policies, without creating anything. FREE.
#
#   bash aws/learning/examples/02-iam/simulate.sh
#
# Asks IAM's policy simulator what the project's inline policy
# (tic-tac-toe-read-params, created in setup.mjs) allows. Nothing is created.
# Before you run it, read trust-policy.json and read-params-policy.json in this
# folder and predict each answer. Then run it and check your guesses.
source "$(dirname "$0")/../_common.sh"
cd "$(dirname "$0")"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
# Fill in the account id and pass the policy through file://, like setup.mjs does (fileArg).
# (A relative path, so file:// also works for the Windows aws.exe run from Git Bash.)
POLICY_FILE=.read-params-policy.generated.json
trap 'rm -f "$POLICY_FILE"' EXIT
sed "s/ACCOUNT_ID/$ACCOUNT_ID/" read-params-policy.json > "$POLICY_FILE"
PARAM_ARN="arn:aws:ssm:eu-central-1:$ACCOUNT_ID:parameter"

simulate() {  # simulate <action> <resource-arn>
    run aws iam simulate-custom-policy \
        --policy-input-list "file://$POLICY_FILE" \
        --action-names "$1" \
        --resource-arns "$2" \
        --query 'EvaluationResults[].{Action:EvalActionName,Resource:EvalResourceName,Decision:EvalDecision}' \
        --output table
}

step "Q1: can the instance read the master DB password? (expect: allowed)"
simulate ssm:GetParameter "$PARAM_ARN/tic-tac-toe/db-password"

step "Q2: can it read a parameter from another project? (expect: implicitDeny)"
simulate ssm:GetParameter "$PARAM_ARN/other-project/secret"

step "Q3: can it CHANGE the password? (expect: implicitDeny, only Get* is allowed)"
simulate ssm:PutParameter "$PARAM_ARN/tic-tac-toe/db-password"

step "Q4: same parameter name, other region? (expect: implicitDeny, the region is part of the ARN)"
simulate ssm:GetParameter "arn:aws:ssm:us-east-1:$ACCOUNT_ID:parameter/tic-tac-toe/db-password"

step "Q5: can it list every parameter by path? (expect: implicitDeny, GetParametersByPath isn't listed)"
simulate ssm:GetParametersByPath "$PARAM_ARN/tic-tac-toe"

cat <<'TIP'

"implicitDeny" means no statement allowed it; IAM denies by default.
"explicitDeny" would mean a "Deny" statement matched, and a Deny always wins.

Try next:
  - Edit read-params-policy.json (e.g. Resource "*" or add "ssm:PutParameter") and re-run.
  - Look at the real role, if the project is set up:
      aws iam get-role --role-name tic-tac-toe-ec2-role --query Role.AssumeRolePolicyDocument
      aws iam list-attached-role-policies --role-name tic-tac-toe-ec2-role
      aws iam get-role-policy --role-name tic-tac-toe-ec2-role --policy-name tic-tac-toe-read-params
  - The same simulator with a UI: https://policysim.aws.amazon.com/
TIP
