# IAM: the role the EC2 instance runs as. Gives it SSM management (Session Manager,
# Run Command) and read access to the /tic-tac-toe/* parameters, and nothing else.

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Trust policy: WHO may assume the role (the EC2 service, on behalf of the instance).
data "aws_iam_policy_document" "ec2_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = local.names.role
  assume_role_policy = data.aws_iam_policy_document.ec2_trust.json
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Permissions policy: WHAT the role may do. Read-only, and only the project's parameters.
data "aws_iam_policy_document" "read_params" {
  statement {
    actions = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter/${var.project}/*",
    ]
  }
}

resource "aws_iam_role_policy" "read_params" {
  name   = local.names.inline_policy
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.read_params.json
}

# An instance profile is the container that hands a role to an EC2 instance.
# (v1 retries run-instances until a new profile is usable; the AWS provider does that for us.)
resource "aws_iam_instance_profile" "ec2" {
  name = local.names.instance_profile
  role = aws_iam_role.ec2.name
}
