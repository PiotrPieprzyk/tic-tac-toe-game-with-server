## 10. Roadmap

### 

###  Build images locally, push to ECR, pull from EC2

Today the `t4g.micro` builds both images on every deploy. That takes minutes, needs 2 GB of swap, and a build can run
out of memory. (Building in GitHub Actions was considered and dropped: images are built on the developer machine
instead.)

- Create two **ECR** repositories, `tic-tac-toe-backend` and `tic-tac-toe-frontend`, with a lifecycle policy that keeps
  only the last ~5 images.
- A new script `aws/scripts/push-images.mjs` runs on the developer machine: `docker buildx build --platform linux/arm64`
  for both images (the instance is Graviton), tags them `<git-sha>` and pushes them after
  `aws ecr get-login-password | docker login`. Building arm64 on an x86 Windows machine needs Docker Desktop's QEMU
  emulation (slower, but works).
- `docker-compose.aws.yml` switches from `build:` to
  `image: <account>.dkr.ecr.<region>.amazonaws.com/tic-tac-toe-*:${IMAGE_TAG}`. `deploy.mjs` logs in to ECR on the
  instance and runs `docker compose pull && up -d` instead of `up --build`.
- The instance role gets ECR pull permissions only (`ecr:GetAuthorizationToken`, `ecr:BatchGetImage`,
  `ecr:GetDownloadUrlForLayer`, scoped to the two repositories). Push permissions stay with the developer's own
  credentials.
- The instance then no longer needs buildx, the swap file, or the build cache cleanup.

###  HTTPS with ALB + ACM

Replaces the Cloudflare Tunnel with an Application Load Balancer.

- Request a public certificate in **ACM** (DNS-validated). This needs a domain name; the DNS record can stay in
  Cloudflare (DNS only, not proxied) or move to Route 53.
- Create an **ALB** in at least two availability zones with an HTTPS :443 listener using the ACM certificate, and an
  HTTP :80 listener that redirects to HTTPS.
- A target group (port 80, health check on the frontend) points at the instances. WebSocket (`/api/ws`) works through an
  ALB without extra configuration; raise the idle timeout above the default 60 s if games stay quiet for longer, or keep
  the connection alive with pings.
- Security groups change: the ALB SG allows 80/443 from the internet, and the app SG allows port 80 **only from the ALB
  SG**. The `cloudflared` container and the tunnel token in Parameter Store are removed.
- Cost note: an ALB costs roughly $16-20/month even when idle, which matters for the ~1 h demo setup. Create it only for
  the demo and delete it afterwards, and extend `stop.mjs`/`start.mjs` and the revert section accordingly.

### Auto Scaling

Builds on steps 1 and 2: instances must pull a ready image and sit behind the ALB.

- Turn the EC2 setup into a **launch template** (AMI, instance profile, user-data that logs in to ECR and starts
  compose) and an **Auto Scaling group** (min 1, max 2-3 for a demo) registered with the ALB target group, with ELB
  health checks.
- Scaling policy: target tracking on average CPU (for example 60%), or on `ALBRequestCountPerTarget`.
- **The `migrate` and `db-grants` containers must not run on every new instance.** Move them to a separate step in
  `deploy.mjs` (a one-off run before rolling out new images), so scaling out doesn't re-run migrations concurrently.
- **Check whether the backend keeps game or WebSocket state in memory.** If it does, two instances can't see each other'
  s games. Fix this before scaling beyond one instance: share state through Postgres (or Redis/ElastiCache), or enable
  ALB sticky sessions as a stop-gap (it doesn't help when the two players of one game land on different instances).
- RDS `db.t4g.micro` has a small connection limit; keep the backend's pool size × max instances below it.
- Updates: use an **instance refresh** with the new launch template version after each push to ECR.

### Monitoring: one dashboard

One **CloudWatch dashboard** (`tic-tac-toe`) shows everything below. CloudWatch is recommended because it needs no extra
server and the instances already have an IAM role.

| What           | How                                                                                                                                                                                                                                                 |
|----------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| CPU, RAM, disk | **CloudWatch agent** on each instance (installed in user-data / the launch template). CPU is available by default; RAM and disk need the agent (`mem_used_percent`, `disk_used_percent`). Role gets `CloudWatchAgentServerPolicy`.                  |
| GPU            | Only meaningful on GPU instance types (`g4dn`, `g5g`, …). The CloudWatch agent reads NVIDIA metrics (`nvidia_gpu` section) via `nvidia-smi`. The `t4g.micro` has no GPU, so these widgets stay empty (or are skipped) until a GPU instance is used. |
| Active users   | The backend publishes a custom metric (`TicTacToe/ActiveUsers`, from the open WebSocket connections) using the CloudWatch **Embedded Metric Format**: it's a structured JSON log line, so no SDK call or extra permission is needed beyond logging. |
| Games played   | Custom metric `TicTacToe/GamesPlayed`, emitted the same way when a game finishes. Shown as a sum per hour and per day.                                                                                                                              |
| Tracked errors | Container logs go to **CloudWatch Logs** (Docker `awslogs` driver or the agent). A **metric filter** counts `ERROR` lines for a graph and an alarm, and a **Logs Insights** widget on the dashboard lists the latest errors with their messages.    |
| Alerts         | Optional **SNS** email topic with alarms on CPU, disk, and the error count.                                                                                                                                                                         |

Work needed:

- Backend: structured logging, plus emitting the two EMF metrics. Add a small `metrics` module so game and connection
  code stays clean.
- Infra: a log group with a short retention (for example 7 days, to keep the demo cheap), the dashboard JSON stored in
  the repo (`aws/monitoring/dashboard.json`), and a script that applies it (`put-dashboard`).
- Instance role: add `CloudWatchAgentServerPolicy`; this widens the role, so the IMDS hop-limit protection described in
  section 2 still matters.
- Cost note: custom metrics cost about $0.30 per metric per month and logs are billed per GB ingested, so keep the
  number of metric dimensions small.
