# SSM Direct Secrets Migration Plan

Remove the `.env` file pattern from the EC2 deploy flow and have Spring Boot fetch secrets
directly from AWS SSM Parameter Store at startup — matching the tinyurl application pattern.

---

## Current vs Target Architecture

### Current (`.env` file pattern)

```
GitHub Actions (OIDC)
  └─▶ SSM RunCommand on EC2
        ├─▶ aws ssm get-parameter × 22 params
        ├─▶ cat > .env (secrets written to disk)
        └─▶ docker compose up  ──▶  backend reads .env
```

Problems:
- Secrets written to disk as plaintext (root-owned 600, but still on disk)
- 22 individual SSM API calls at deploy time
- `.env` persists between deploys — stale secrets risk
- Any new secret requires editing `deploy.yml` in two places

### Target (Spring Cloud AWS pattern)

```
GitHub Actions (OIDC)
  └─▶ SSM RunCommand on EC2
        └─▶ docker compose up  ──▶  backend container
                                      └─▶ Spring Cloud AWS
                                            └─▶ SSM GetParametersByPath /ems/prod/*
                                                  └─▶ injects all params as Spring properties
```

Benefits:
- No secrets on disk at any point
- Single batch SSM API call at startup
- Adding a new SSM param requires zero deploy changes
- Matches the tinyurl application pattern

---

## GitHub Secrets Required After Migration

Only **2 GitHub secrets** needed (down from effectively the same 2, but clarified):

| Secret | Purpose |
|--------|---------|
| `DOCKER_PASSWORD` | Docker Hub login during image build/push |
| *(IAM role ARN)* | Already hardcoded in `deploy.yml` — can optionally move to `AWS_ROLE_ARN` secret |

Everything else lives in SSM Parameter Store under `/ems/prod/*`.

---

## Work Items

### Work 1 — Add Spring Cloud AWS to `pom.xml`

Add the Spring Cloud AWS Parameter Store starter. Spring Cloud AWS 3.x is compatible with
Spring Boot 3.x.

**File:** `backend/pom.xml`

Add inside `<dependencies>`:

```xml
<!-- Spring Cloud AWS - SSM Parameter Store -->
<dependency>
    <groupId>io.awspring.cloud</groupId>
    <artifactId>spring-cloud-aws-starter-parameter-store</artifactId>
    <version>3.2.1</version>
</dependency>
```

Add `<dependencyManagement>` (if not present) to pin the BOM:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>io.awspring.cloud</groupId>
            <artifactId>spring-cloud-aws-dependencies</artifactId>
            <version>3.2.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Work 2 — Configure Spring Boot to import from SSM

**File:** `backend/src/main/resources/application-prod.properties`

Add at the top:

```properties
# Fetch all secrets from SSM Parameter Store at startup
# Maps /ems/prod/DB_HOST -> Spring property DB_HOST, etc.
spring.config.import=aws-parameterstore:/ems/prod/
spring.cloud.aws.region.static=us-east-1

# Disable SSM import in non-prod profiles (dev uses local env / application.properties)
spring.cloud.aws.parameterstore.enabled=true
```

**File:** `backend/src/main/resources/application.properties`

Add to prevent SSM import from being attempted in dev/test:

```properties
# SSM import is prod-only; disabled by default
spring.cloud.aws.parameterstore.enabled=false
```

No changes needed to `${DB_HOST}`, `${JWT_SECRET_KEY}` etc. — Spring Cloud AWS makes
`/ems/prod/DB_HOST` available as the Spring property `DB_HOST`, which resolves `${DB_HOST}`
automatically.

**Test profile (`application-test.properties`)** — verify SSM is disabled so CI tests are
unaffected:

```properties
spring.cloud.aws.parameterstore.enabled=false
```

### Work 3 — Slim down `docker-compose.prod.yml` backend environment

Spring Boot reads secrets from SSM directly — Docker Compose no longer needs to pass them.

**File:** `deployment/docker-compose.prod.yml`

Replace the 22-variable `environment:` block on the backend service with:

```yaml
environment:
  SPRING_PROFILES_ACTIVE: ${SPRING_PROFILE}
  AWS_REGION: us-east-1
  # IMAGE_TAG is only used by compose to select the image tag, not passed to container
```

The gateway service and other services are unchanged (they don't read secrets).

### Work 4 — Simplify `deploy.yml` on EC2

Remove the entire `.env` generation block from the SSM RunCommand script.

**File:** `.github/workflows/deploy.yml`

Delete steps 3 (`cat > .env <<ENV ... ENV`) and the per-param `aws ssm get-parameter` calls.

The REMOTE_SCRIPT becomes:

```bash
set -euo pipefail

: "${IMAGE_TAG:?IMAGE_TAG is required}"
DEPLOY_DIR="/opt/ems/deployment"
mkdir -p "$DEPLOY_DIR"
chmod 755 /opt/ems "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

# 1) Pull latest compose file
COMPOSE_URL="https://raw.githubusercontent.com/Buffden/employee-management-system/main/deployment/docker-compose.prod.yml"
curl -fsSL "$COMPOSE_URL" -o docker-compose.prod.yml

# 2) Write minimal .env — only IMAGE_TAG and SPRING_PROFILE (not secrets)
cat > .env <<ENV
IMAGE_TAG=${IMAGE_TAG}
SPRING_PROFILE=prod
ENV
chmod 600 .env

# 3) Docker Hub login via SSM (no local credential storage)
aws ssm get-parameter --name /ems/prod/DOCKER_PASSWORD --with-decryption \
  --query Parameter.Value --output text | docker login -u buffden --password-stdin

# 4) Pull exact images
docker pull buffden/ems-backend:${IMAGE_TAG}
docker pull buffden/ems-gateway:${IMAGE_TAG}

# 5) Save previous state for rollback visibility
docker compose -f docker-compose.prod.yml ps --format '{{.Service}}\t{{.Image}}' \
  > .deploy-meta.prev 2>/dev/null || true

# 6) Deploy
docker compose -f docker-compose.prod.yml down || true
docker compose -f docker-compose.prod.yml up -d --pull always --force-recreate

# 7) Status
echo "Running containers:"
docker compose -f docker-compose.prod.yml ps --format 'table {{.Name}}\t{{.Image}}\t{{.Status}}'

# 8) Cleanup old images
docker image prune -af --filter "until=72h"
```

The `.env` file on EC2 now contains **only** `IMAGE_TAG` and `SPRING_PROFILE` — no secrets.

### Work 5 — Verify EC2 instance IAM role has SSM permissions

The EC2 instance role (`GitHubActionsSSMDeployRole` or the EC2 instance profile role) must
allow the Spring Boot container to call SSM. Docker containers on EC2 inherit instance
credentials via the IMDS endpoint (`169.254.169.254`).

Required IAM permissions on the EC2 instance profile role:

```json
{
  "Effect": "Allow",
  "Action": [
    "ssm:GetParameter",
    "ssm:GetParameters",
    "ssm:GetParametersByPath"
  ],
  "Resource": "arn:aws:ssm:us-east-1:<account-id>:parameter/ems/prod/*"
}
```

If any SSM params are `SecureString` encrypted with a custom KMS key (not the default
`aws/ssm` key), also add:

```json
{
  "Effect": "Allow",
  "Action": ["kms:Decrypt"],
  "Resource": "arn:aws:kms:us-east-1:<account-id>:key/<your-kms-key-id>"
}
```

**Check current permissions:**

```bash
aws iam list-attached-role-policies \
  --role-name <EC2-instance-role-name> \
  --region us-east-1
```

---

## SSM Parameter Store — Current Parameters

All 22 parameters already exist at `/ems/prod/*`. No SSM changes needed.

| SSM Path | Maps to Spring Property |
|----------|------------------------|
| `/ems/prod/DB_HOST` | `DB_HOST` |
| `/ems/prod/DB_PORT` | `DB_PORT` |
| `/ems/prod/DB_NAME` | `DB_NAME` |
| `/ems/prod/DB_USER` | `DB_USER` |
| `/ems/prod/DB_PWD` | `DB_PWD` |
| `/ems/prod/JWT_SECRET_KEY` | `JWT_SECRET_KEY` |
| `/ems/prod/CORS_ALLOWED_ORIGINS` | `CORS_ALLOWED_ORIGINS` |
| `/ems/prod/FRONTEND_BASE_URL` | `FRONTEND_BASE_URL` |
| `/ems/prod/ADMIN_CREATE` | `ADMIN_CREATE` |
| `/ems/prod/ADMIN_USERNAME` | `ADMIN_USERNAME` |
| `/ems/prod/ADMIN_PASSWORD` | `ADMIN_PASSWORD` |
| `/ems/prod/ADMIN_EMAIL` | `ADMIN_EMAIL` |
| `/ems/prod/EMAIL_SERVICE_PROVIDER` | `EMAIL_SERVICE_PROVIDER` |
| `/ems/prod/EMAIL_SENDGRID_API_KEY` | `EMAIL_SENDGRID_API_KEY` |
| `/ems/prod/EMAIL_SENDGRID_FROM_EMAIL` | `EMAIL_SENDGRID_FROM_EMAIL` |
| `/ems/prod/REDIS_HOST` | `REDIS_HOST` |
| `/ems/prod/REDIS_PORT` | `REDIS_PORT` |
| `/ems/prod/EC2_HOST` | `EC2_HOST` |
| `/ems/prod/NGINX_PORT` | `NGINX_PORT` |
| `/ems/prod/NGINX_SERVER_NAME` | `NGINX_SERVER_NAME` |
| `/ems/prod/SSL_ENABLED` | `SSL_ENABLED` |
| `/ems/prod/DB_SSL_MODE` | `DB_SSL_MODE` |
| `/ems/prod/DOCKER_PASSWORD` | *(used by deploy.yml only — not a Spring property)* |

Spring Cloud AWS fetches all of these in a single `GetParametersByPath` call at Spring
Boot startup.

---

## Local Development Impact

`application-dev.properties` and `application.properties` are unaffected — they continue
using environment variables or `.env` for local dev. The SSM import only activates in the
`prod` profile because `spring.cloud.aws.parameterstore.enabled=false` is set as the default.

CI tests (`test` profile) also unaffected — SSM is disabled, H2 in-memory database is used.

---

## Rollback

If the Spring Cloud AWS integration fails (e.g. IAM permission denied, SSM unreachable):

1. Revert `application-prod.properties` (remove `spring.config.import` line)
2. Revert `docker-compose.prod.yml` (restore full env block)
3. Revert `deploy.yml` (restore `.env` generation block)
4. Push to main — deploy restores the `.env` pattern

All SSM parameters remain unchanged — no data loss.

---

## Implementation Order

```
Work 5 (IAM check)  ──▶  Work 1 (pom.xml)  ──▶  Work 2 (app properties)
  └─▶  Work 3 (docker-compose)  ──▶  Work 4 (deploy.yml)  ──▶  deploy + verify
```

Verify IAM permissions first — if the EC2 role is missing SSM read access, Spring Boot
will fail to start before any code changes are deployed.
