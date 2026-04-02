# RDS to Docker PostgreSQL Migration

**Goal:** Eliminate the RDS instance (~$15.60/month) by running PostgreSQL 18 inside Docker on the same EC2 instance alongside the existing containers.

**Estimated saving:** $15.60/month
**Estimated downtime:** 5–10 minutes during cutover
**Risk level:** Low — full backup taken before any change

---

## Current State

```text
EC2 Instance
├── ems-gateway     (nginx)
├── ems-backend     (Spring Boot)  ──connects to──▶  RDS PostgreSQL 18.1
└── ems-redis       (Redis)                          ems-production-db.clcqqu684nm0.us-east-1.rds.amazonaws.com
```

## Target State

```text
EC2 Instance
├── ems-gateway     (nginx)
├── ems-backend     (Spring Boot)  ──connects to──▶  ems-postgres (Docker)
├── ems-redis       (Redis)                          postgres:18-alpine
└── ems-postgres    (PostgreSQL 18)
      └── volume: postgres_data (persisted on EC2 EBS disk)
```

---

## Work Overview

| # | Work | Type | When |
| --- | ------ | ------ | ------ |
| 1 | Fix `docker-compose.prod.yml` | Code change | Before merge |
| 2 | Update 2 SSM parameters | Operational | Before merge |
| 3 | DB migration (backup → deploy → restore → verify) | Operational | At merge |
| 4 | Automated daily backup (replaces RDS built-in backups) | Code + operational | After 48h stable |
| 5 | RDS cleanup | Operational | After 48h stable |

### Sequencing

```text
[Now]           Work 1 — fix docker-compose.prod.yml (this branch)
                Work 2 — update SSM params (before merging)
                Work 3, Phase 1 — RDS snapshot + dump on EC2 (before merging)
                      ↓
[Merge to main] → pipeline deploys → postgres container starts with empty DB
                Work 3, Phase 3 — restore RDS dump via SSM
                Work 3, Phase 4 — smoke test verification
                      ↓
[+48h stable]   Work 3, Phase 5 — delete RDS instance + security group
                Work 4 — wire up automated daily backup
```

---

## Work 1 — Fix `docker-compose.prod.yml`

**Branch:** `feature/security-configurations`

The postgres service exists in the compose file but has the following gaps that must be fixed before merging:

| Fix | Why |
| --- | --- |
| Add `postgres_data` with explicit `name:` to the `volumes:` section at the bottom | Without this Docker treats the volume as anonymous — data is lost on every `docker compose down`. The explicit `name: ems_postgres_data` also prevents the volume name from changing if the compose project directory is ever renamed. |
| **Add `PGDATA: /var/lib/postgresql/data` to postgres environment** | **postgres:18-alpine defaults `PGDATA` to `/var/lib/postgresql/18/docker` inside the container, which does NOT match the volume mount path `/var/lib/postgresql/data`. Without this, postgres writes all data into the ephemeral container layer — the volume is mounted but never used, and all data is lost on every container restart.** |
| Add `depends_on: postgres: condition: service_healthy` to `backend` | Backend connects on startup; without this it can crash-loop if postgres isn't ready |
| Remove `SPRING_PROFILE`, `DB_HOST`, `DB_PORT` from postgres env | These are app env vars, not postgres container vars — they have no effect on postgres and are misleading |
| Upgrade image from `postgres:15-alpine` to `postgres:18-alpine` | Must match the RDS version (18.1) for `pg_dump`/`pg_restore` compatibility |
| Add `logging` config to postgres service | Consistent log rotation with redis and backend services |

After the fix the postgres service should look like:

```yaml
postgres:
  image: postgres:18-alpine
  container_name: ems-postgres

  logging:
    driver: "json-file"
    options:
      max-size: "20m"
      max-file: "2"

  environment:
    POSTGRES_DB: ${DB_NAME}
    POSTGRES_USER: ${DB_USER}
    POSTGRES_PASSWORD: ${DB_PWD}
    PGDATA: /var/lib/postgresql/data   # ← critical: must match volume mount path

  volumes:
    - postgres_data:/var/lib/postgresql/data

  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER:-postgres} || exit 1"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s

  networks:
    - ems-network

  restart: unless-stopped
```

> **Why `PGDATA` must be set explicitly:**
> `postgres:18-alpine` sets its internal default `PGDATA` to `/var/lib/postgresql/18/docker`, not `/var/lib/postgresql/data`. When the volume is mounted at `/var/lib/postgresql/data` but postgres writes to `/var/lib/postgresql/18/docker`, the two paths never overlap — the volume is present but unused. Every container restart triggers a fresh `initdb`, wiping all data. Setting `PGDATA: /var/lib/postgresql/data` explicitly aligns postgres with the volume mount and makes data persist correctly.

And the `backend` service needs:

```yaml
backend:
  ...
  depends_on:
    postgres:
      condition: service_healthy
```

And `postgres_data` added to the `volumes:` section with an explicit name:

```yaml
volumes:
  certbot-etc:
  certbot-www:
  redis_data:
  postgres_data:
    name: ems_postgres_data   # ← explicit name prevents Docker from treating it as anonymous
```

> **Why `name: ems_postgres_data` matters:**
> Without declaring `postgres_data` in the top-level `volumes:` section, Docker treats it as an anonymous volume scoped to the container. Anonymous volumes are deleted automatically when `docker compose down` removes the container — causing data loss on every deployment. Adding the explicit `name:` also makes the volume name fixed and independent of the compose project directory name, so it survives even if the deployment path on EC2 ever changes.

---

## Work 2 — Update SSM Parameters

These are the only two values that need to change. Everything else (DB_NAME, DB_USER, DB_PWD) stays the same — the Docker postgres is provisioned with the same credentials as RDS.

Run from your local machine (requires AWS CLI with `ssm:PutParameter` permission):

```bash
# DB_HOST: change from RDS endpoint to Docker service name
aws ssm put-parameter \
  --name "/ems/prod/DB_HOST" \
  --value "postgres" \
  --type "String" \
  --overwrite \
  --region us-east-1

# DB_SSL_MODE: RDS requires SSL, Docker postgres inside the same network does not
aws ssm put-parameter \
  --name "/ems/prod/DB_SSL_MODE" \
  --value "disable" \
  --type "String" \
  --overwrite \
  --region us-east-1
```

> **Why `DB_HOST=postgres`?**
> Docker Compose gives each service a DNS hostname equal to its service name. Since `backend` and `postgres` are on the same `ems-network`, the backend can reach postgres at `postgres:5432` — no IP needed.
>
> **Why disable SSL?**
> RDS enforces SSL for all connections. Docker postgres inside the same Docker bridge network has no security benefit from SSL — both containers are on the same host.

**Rollback:** If anything goes wrong, revert both parameters:

```bash
aws ssm put-parameter --name "/ems/prod/DB_HOST" \
  --value "ems-production-db.clcqqu684nm0.us-east-1.rds.amazonaws.com" \
  --type "String" --overwrite --region us-east-1

aws ssm put-parameter --name "/ems/prod/DB_SSL_MODE" \
  --value "require" \
  --type "String" --overwrite --region us-east-1
```

RDS is not deleted until Work 5 (48h later), so rollback is always available.

---

## Work 3 — DB Migration

### Phase 1 — Backup (Do This First, Non-Destructive)

#### Step 1.1 — Take an RDS snapshot via AWS Console

Go to: **RDS → Databases → ems-production-db → Actions → Take snapshot**

Name it: `ems-pre-docker-migration`

This gives you a full point-in-time restore if anything goes wrong. Takes 2–5 minutes.

#### Step 1.2 — Export data from RDS to a SQL dump on EC2

Run from your local machine via SSM:

```bash
REMOTE_SCRIPT=$(cat <<'EOF'
set -euo pipefail

# Read credentials from the running .env file
source /opt/ems/deployment/.env

echo "Dumping RDS database: $DB_NAME from $DB_HOST..."
# Use Docker to run pg_dump — avoids any OS package manager dependency
docker run --rm \
  -v /tmp:/tmp \
  -e PGPASSWORD="$DB_PWD" \
  postgres:18-alpine \
  pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  --format=custom \
  --no-acl \
  --no-owner \
  -f /tmp/ems-rds-backup.dump

echo "Dump complete. Size: $(du -sh /tmp/ems-rds-backup.dump)"
echo "Also exporting plain SQL for readability..."
docker run --rm \
  -v /tmp:/tmp \
  -e PGPASSWORD="$DB_PWD" \
  postgres:18-alpine \
  pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
  --format=plain \
  --no-acl \
  --no-owner \
  -f /tmp/ems-rds-backup.sql

echo "All done. Files:"
ls -lh /tmp/ems-rds-backup.*
EOF
)

ENCODED_SCRIPT="$(printf "%s" "$REMOTE_SCRIPT" | base64 | tr -d '\n')"
COMMAND_ID=$(aws ssm send-command \
  --instance-ids i-03a61b7b515af53b7 \
  --document-name "AWS-RunShellScript" \
  --region us-east-1 \
  --parameters "commands=echo ${ENCODED_SCRIPT} | base64 --decode | bash" \
  --query "Command.CommandId" --output text)

echo "Command ID: $COMMAND_ID"
sleep 60
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id i-03a61b7b515af53b7 \
  --region us-east-1 \
  --query "{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}" \
  --output json
```

#### Step 1.3 — Verify the dump is valid

```bash
# Run via SSM
docker run --rm \
  -v /tmp:/tmp \
  postgres:18-alpine \
  pg_restore --list /tmp/ems-rds-backup.dump | head -30
```

You should see table names (employees, departments, users, etc.) listed. If you see an error here, **stop and investigate before proceeding**.

---

### Phase 2 — Prepare (Covered by Work 1 + Work 2)

Work 1 (compose fix) and Work 2 (SSM parameter update) together constitute Phase 2. No separate steps needed here.

---

### Phase 3 — Cutover (This Causes ~5–10 Min Downtime)

#### Step 3.1 — Merge to main

Commit and push the updated `docker-compose.prod.yml` from Work 1. The GitHub Actions deploy pipeline triggers automatically.

```bash
git add deployment/docker-compose.prod.yml
git commit -m "feat: migrate from RDS to Docker PostgreSQL"
git push origin main
```

#### Step 3.2 — What the deploy pipeline does automatically

The deploy pipeline (`deploy.yml`) will:

1. Pull updated `docker-compose.prod.yml` to EC2
2. Fetch `DB_HOST=postgres` and `DB_SSL_MODE=disable` from SSM as shell env vars (no `.env` file is written to disk — do not reference `/opt/ems/deployment/.env` in restore scripts)
3. Run `docker compose up -d` → starts `ems-postgres` container (empty database)
4. Start `ems-backend` which connects to `ems-postgres`
5. Flyway runs all 3 migrations automatically on the empty database

At this point the backend is running against **an empty Docker postgres**. Users will see the app but with no data. This is expected — data restore happens next.

#### Step 3.3 — Restore the dump into Docker postgres

> **What actually worked (verified):**
> The dump was found at `/opt/ems/db/ems_dump.sql` in plain SQL format (not custom format).
> Use `psql` to restore it — not `pg_restore` (which is for custom-format dumps only).
> Use explicit credential values instead of `source .env` since the deploy pipeline does not write a `.env` file.

Connect to EC2 via SSM session and run these commands one by one:

```bash
# 1. Stop backend to prevent writes during restore
sudo docker stop ems-backend
```

```bash
# 2. Find the dump file (confirm location)
sudo find /tmp /home /opt -name "*.dump" -o -name "*.sql" 2>/dev/null
```

```bash
# 3. Drop the empty Flyway-created schema
sudo docker exec ems-postgres psql -U ems_prod_admin -d ems_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ems_prod_admin;"
```

```bash
# 4. Restore the plain SQL dump (adjust path if dump is in a different location)
sudo docker exec -i ems-postgres psql -U ems_prod_admin -d ems_db < /opt/ems/db/ems_dump.sql
```

```bash
# 5. Verify row counts
sudo docker exec ems-postgres psql -U ems_prod_admin -d ems_db -c "SELECT relname, n_live_tup AS rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

```bash
# 6. Restart backend
sudo docker start ems-backend
```

> **Note:** If the dump is in custom format (`.dump`), use `pg_restore` instead of `psql`:
> ```bash
> sudo docker exec -i ems-postgres pg_restore -U ems_prod_admin -d ems_db --no-acl --no-owner --exit-on-error < /path/to/file.dump
> ```

#### Step 3.4 — Clean up the old orphaned volume

If `postgres_data` was previously deployed **without** the `name: ems_postgres_data` declaration, Docker will have created an old anonymous volume named `deployment_postgres_data`. After confirming the restore succeeded and the app is healthy, delete it:

```bash
sudo docker volume ls | grep postgres
```

```bash
sudo docker volume rm deployment_postgres_data
```

> **Why this happens:** Adding `name: ems_postgres_data` to the top-level volumes section causes Docker to create a brand new volume with that name on the next deploy. Any data restored into the old `deployment_postgres_data` volume will not carry over — you must run the restore again (Step 3.3) after the first deploy that introduces the `name:` field. This is a one-time migration cost.

#### Step 3.5 — Confirm postgres is using the volume on next restart

After the restore, trigger a deployment and check the first line of postgres logs:

```bash
sudo docker logs ems-postgres 2>&1 | head -5
```

**Expected (good):** `database system was shut down at ...` — postgres found existing data in the volume and skipped initialization.

**Bad:** `The files belonging to this database system will be owned by user "postgres"` — postgres ran `initdb` and wiped the data directory.

> **Note — first `initdb` after the `PGDATA` fix is expected:**
> Before adding `PGDATA: /var/lib/postgresql/data`, postgres:18-alpine defaulted to writing data at `/var/lib/postgresql/18/docker` inside the ephemeral container layer. The volume at `/var/lib/postgresql/data` was always bypassed and remained empty. On the first deploy after the PGDATA fix, postgres correctly checks the volume, finds it empty, and runs `initdb` to initialize it. This is normal. Once the dump is restored into the volume (Step 3.3), all subsequent restarts will find existing data and skip `initdb` permanently.

---

### Phase 4 — Verify Everything Works

#### Step 4.1 — Smoke test checklist

```bash
# 1. Backend health
curl -s https://ems.buffden.com/actuator/health | jq .

# 2. Login works (tests DB read + JWT)
curl -s -X POST https://ems.buffden.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"your-admin-user","password":"your-password"}' | jq .status

# 3. Employee list loads (tests DB read)
# Login via browser and check the employee table loads correctly
```

#### Step 4.2 — Check backend logs for DB connection errors

```bash
# Run via SSM
docker logs ems-backend --tail 50 2>&1 | grep -iE "error|exception|hikari|flyway|postgres"
```

Expected: Flyway logs like `Successfully validated 3 migrations` and HikariCP logs like `HikariPool-1 - Start completed`.

#### Step 4.3 — Verify data integrity

```bash
sudo docker exec ems-postgres psql -U ems_prod_admin -d ems_db -c "SELECT relname, n_live_tup AS rows FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"
```

---

## Work 4 — Automated Daily Backup

RDS had automated backups. Docker postgres does not — this gap must be closed before deleting RDS.

**Approach:** GitHub Actions scheduled workflow using SSM RunCommand (consistent with the existing deploy pattern — no cron daemon, no SSH needed).

The workflow runs daily, executes `pg_dump` on EC2 via SSM, copies the dump to a persistent location on the EC2 EBS volume, and prunes dumps older than 7 days.

```bash
# Daily backup script — run on EC2 via SSM scheduled workflow
set -euo pipefail

source /opt/ems/deployment/.env
BACKUP_DIR="/home/ec2-user/backups"
BACKUP_FILE="$BACKUP_DIR/ems-$(date +%Y%m%d).dump"
mkdir -p "$BACKUP_DIR"

docker exec ems-postgres pg_dump \
  -U "$DB_USER" "$DB_NAME" \
  --format=custom \
  -f "/var/lib/postgresql/data/backup-$(date +%Y%m%d).dump"

# Copy from container to host
docker cp "ems-postgres:/var/lib/postgresql/data/backup-$(date +%Y%m%d).dump" "$BACKUP_FILE"

# Clean up inside container
docker exec ems-postgres rm -f "/var/lib/postgresql/data/backup-$(date +%Y%m%d).dump"

# Keep last 7 days only
find "$BACKUP_DIR" -name "ems-*.dump" -mtime +7 -delete

echo "Backup saved: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"
```

Wire this up as a GitHub Actions scheduled workflow (`schedule: cron: '0 3 * * *'`) using the same SSM RunCommand pattern as `deploy.yml`.

---

## Work 5 — Cleanup (After 48 Hours of Stable Operation)

Wait at least **48 hours** before deleting RDS to ensure no issues surface.

### Step 5.1 — Note the RDS security group before deletion

Do this **before** deleting the instance — once deleted, the RDS API can no longer describe it.

```bash
aws rds describe-db-instances \
  --db-instance-identifier ems-production-db \
  --query "DBInstances[0].VpcSecurityGroups" \
  --region us-east-1
# Note the security group ID(s) — delete any that are RDS-only after Step 5.2
```

### Step 5.2 — Delete the RDS instance

```bash
aws rds delete-db-instance \
  --db-instance-identifier ems-production-db \
  --skip-final-snapshot \
  --region us-east-1
```

> **Note:** The RDS snapshot taken in Step 1.1 (`ems-pre-docker-migration`) is kept separately. Delete it from the console after 30 days if everything is stable.

### Step 5.3 — Remove the RDS security group (if separate)

```bash
aws ec2 delete-security-group \
  --group-id <sg-id-from-step-5.1> \
  --region us-east-1
```

---

## Data Persistence — How Postgres Data Survives Redeploys

```text
docker compose up -d    ← recreates containers but NOT volumes
                              │
                              ▼
                    postgres_data volume
                    /var/lib/docker/volumes/ems_postgres_data/
                              │
                    persists across:
                    ✓ docker compose up/down
                    ✓ container restarts
                    ✓ image upgrades
                    ✓ EC2 reboots
                    ✗ docker volume rm (manual deletion — don't do this)
                    ✗ EC2 instance termination (data lives on EBS)
```

**The postgres data volume is stored on the EC2's EBS volume** (the 8GB gp3 disk). As long as the EC2 instance exists, data is safe.

---

## Cost Impact

| Item | Before | After | Monthly saving |
| --- | --- | --- | --- |
| RDS db.t3.micro | $15.60 | $0 | **+$15.60** |
| EBS (postgres data) | included in existing 8GB | included in existing 8GB | $0 |
| EC2 memory | 224MB (backend) | 224MB + ~50MB (postgres) | negligible |
| **Total** | **~$28/month** | **~$12.40/month** | **$15.60/month** |

> PostgreSQL 18 on Alpine uses ~30–50MB RAM at idle, well within the 961MB available on t2.micro.
