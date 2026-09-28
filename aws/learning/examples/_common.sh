# Shared helpers for the lab scripts. Sourced, not run.
# Same idea as aws/lib/aws.mjs: print every aws command before running it.
set -euo pipefail

export AWS_REGION="${AWS_REGION:-eu-central-1}"   # same region as aws/config.mjs
export AWS_PAGER=""                               # never open `less` for output

# Everything the labs create carries this tag, so it's easy to find and clean
# up (and it can never be confused with the real Project=tic-tac-toe resources).
LAB_TAG_KEY=Project
LAB_TAG_VALUE=aws-learning

# run aws ec2 describe-vpcs ...  → prints "$ aws ec2 describe-vpcs ..." then runs it
run() {
    printf '\n\033[1m$ %s\033[0m\n' "$*" >&2
    "$@"
}

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*" >&2; }

pause() {
    # Lets you look at the console before the next step. Skip with NO_PAUSE=1.
    if [ -z "${NO_PAUSE:-}" ]; then read -r -p "Press Enter to continue... " _; fi
}
