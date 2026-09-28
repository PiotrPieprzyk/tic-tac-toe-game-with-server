# Lab 05: experiments on the instance

Run `launch.sh` first. The instance ID is in its output, or get it with
`aws ec2 describe-instances --filters Name=tag:Name,Values=aws-learning-lab --query 'Reservations[].Instances[].InstanceId'`.

## 1. Get in without SSH

```sh
aws ssm start-session --target i-0123456789abcdef0
sudo -i
```

Nothing listens on port 22 and there's no key pair. Why does this still work? The SSM agent on the
instance made an **outgoing** connection to AWS. It's allowed to because of the
`AmazonSSMManagedInstanceCore` policy on the instance role, and your own IAM permissions decide who can start a session.

## 2. What did user-data do?

```sh
cat /var/log/cloud-init-output.log | tail -30     # the script's output (set -x shows every line)
cat /var/lib/cloud/instance/user-data.txt         # the script itself, as the instance received it
systemctl status nginx
curl -s localhost
```

Reboot (`reboot`, then reconnect) and check that `index.html` did **not** change. User-data runs
only on the first boot. That's why the project's `deploy.mjs` handles updates, not user-data.

## 3. Instance metadata (IMDS)

```sh
# IMDSv1 (no token) is switched off (HttpTokens=required), so this returns 401:
curl -s -o /dev/null -w '%{http_code}\n' http://169.254.169.254/latest/meta-data/

# IMDSv2: get a token, then use it
TOKEN=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 300')
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/aws-learning-ec2-role
```

The last command prints **real, temporary AWS credentials** for the instance role (`AccessKeyId`,
`SecretAccessKey`, `Token`, `Expiration`). This is how the AWS CLI on the instance gets its
permissions without anyone storing a key. It's also why the project protects this endpoint.

```sh
aws sts get-caller-identity      # on the instance: you are now the assumed role
```

## 4. Why the project uses hop limit 1

Still on the instance:

```sh
docker run --rm amazonlinux:2023 \
  curl -s -m 5 -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' \
  || echo "NO TOKEN: the container can't reach IMDS"
```

With `HttpPutResponseHopLimit=1`, the token reply can't cross the extra network hop into the
Docker bridge network, so the container gets nothing. Now, **from your own computer**, allow 2 hops:

```sh
aws ec2 modify-instance-metadata-options --instance-id i-0123456789abcdef0 --http-put-response-hop-limit 2
```

Run the `docker run` command again and you get a token. **With hop limit 2, any code running in a container,
including a hacked backend, could fetch the instance role's credentials.** Set it back:

```sh
aws ec2 modify-instance-metadata-options --instance-id i-0123456789abcdef0 --http-put-response-hop-limit 1
```

(AWS's docs suggest 2 for container hosts because some containers *need* IMDS. In this project the
containers don't, so 1 is the safer choice. See the IMDS section of `aws/README.md`.)

## 5. Stop vs. terminate, and the changing IP

From your computer:

```sh
aws ec2 stop-instances --instance-ids i-0123456789abcdef0
aws ec2 wait instance-stopped --instance-ids i-0123456789abcdef0
aws ec2 start-instances --instance-ids i-0123456789abcdef0
aws ec2 wait instance-running --instance-ids i-0123456789abcdef0
aws ec2 describe-instances --instance-ids i-0123456789abcdef0 --query 'Reservations[0].Instances[0].PublicIpAddress'
```

The public IP is different, but your files are still there because the EBS volume survived. That's
what `stop.mjs`/`start.mjs` do to the real app instance. Terminating (in `cleanup.sh`) deletes the volume.

## 6. Clean up

```sh
bash aws/learning/examples/05-ec2-lab/cleanup.sh
```
