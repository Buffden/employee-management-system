# Deployment

This directory contains all deployment configurations, CI/CD pipelines, and testing scripts for the Employee Management System.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Services](#-services)
- [Environment Variables](#-environment-variables)
- [Rate Limiting & Security](#-rate-limiting--security)
- [Testing Scripts](#-testing-scripts)
- [Commands](#-commands)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment](#-production-deployment)

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- Environment file configured: `db/.env` (see [../db/README.md](../db/README.md))
- Minimum 4GB RAM available for Docker
- Ports 80, 5432, 6379, 8080 available

### Start All Services

```bash
cd deployment
docker compose up -d --build
```

### Verify Deployment

```bash
# Check all containers are healthy
docker compose ps

# Expected output:
# NAME          STATUS
# ems-postgres  Up (healthy)
# ems-redis     Up (healthy)
# ems-backend   Up (healthy)
# ems-gateway   Up (healthy)
```

### Access Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Health Check**: http://localhost/health
- **Admin Login**: username: `admin`, password: `admin123`

## 🏗 Architecture

```
Internet/User
     ↓
Nginx Gateway (:80)
  ├─ Rate Limiting (10 req/min auth, 100 req/sec API)
  ├─ Serve Angular Frontend
  └─ Proxy /api/* to Backend
     ↓
Spring Boot Backend (:8080)
  ├─ JWT Authentication
  ├─ Redis Rate Limiting (global)
  ├─ Business Logic
  └─ REST API
     ↓
  PostgreSQL (:5432)    Redis (:6379)
  [Persistent Data]     [Rate Limiting]
```

### Network Security

- ✅ **Only Nginx exposed** on port 80 (HTTP)
- ✅ **Backend, Redis, Postgres are internal-only** (not accessible from host)
- ✅ **All services on isolated Docker network** (ems-network)
- ✅ **Health checks configured** for automatic container restarts

## 📁 Services

### 1. PostgreSQL Database

- **Image**: `postgres:15-alpine`
- **Container**: `ems-postgres`
- **Port**: 5432 (internal only)
- **Volume**: `postgres_data` (persistent)
- **Health Check**: `pg_isready` every 10s
- **Purpose**: Primary database for all application data

### 2. Redis Cache

- **Image**: `redis:7-alpine`
- **Container**: `ems-redis`
- **Port**: 6379 (internal only)
- **Volume**: `redis_data` (AOF persistence)
- **Memory**: 256MB max (allkeys-lru eviction)
- **Health Check**: `redis-cli ping` every 10s
- **Purpose**: Global rate limiting across all backend instances

### 3. Spring Boot Backend

- **Image**: Custom (built from [../backend/Dockerfile.app](../backend/Dockerfile.app))
- **Container**: `ems-backend`
- **Port**: 8080 (internal only)
- **Health Check**: `/actuator/health` every 30s
- **Dependencies**: postgres (healthy), redis (healthy)
- **Environment**: See [Environment Variables](#environment-variables)

### 4. Nginx Gateway

- **Image**: Custom (built from [../gateway/Dockerfile](../gateway/Dockerfile))
- **Container**: `ems-gateway`
- **Port**: 80 (exposed to host)
- **Health Check**: `/health` every 30s
- **Purpose**: 
  - Serve Angular frontend
  - Reverse proxy for backend API
  - Layer 1 rate limiting (Nginx)
  - Static file serving with caching

## ⚙️ Environment Variables

The deployment requires environment variables from `db/.env`. A symlink is automatically created: `deployment/.env -> ../db/.env`

### Required Variables

```bash
# Database
DB_HOST=postgres              # Service name in docker-compose
DB_PORT=5432
DB_NAME=ems_db
DB_USER=postgres
DB_PWD=your_secure_password
DB_SSL_MODE=disable           # Use 'require' for production

# Application
JWT_SECRET_KEY=your_64_char_secret   # Generate with: openssl rand -base64 64
CORS_ALLOWED_ORIGINS=http://localhost
FRONTEND_BASE_URL=http://localhost

# Email (optional)
EMAIL_SERVICE_PROVIDER=demo          # or 'sendgrid'
EMAIL_SENDGRID_API_KEY=
EMAIL_SENDGRID_FROM_EMAIL=

# Redis
REDIS_HOST=redis              # Service name in docker-compose
REDIS_PORT=6379

# Spring Profile
SPRING_PROFILE=dev            # or 'prod' for production
```

### Variable Expansion

Docker Compose uses `deployment/.env` for variable substitution in `docker-compose.yml`. The backend container receives variables via `env_file: ../db/.env`.

## 🔒 Rate Limiting & Security

### Multi-Layer Defense

**Layer 1: Nginx (Gateway)**
- Auth endpoints: 10 req/min per IP, burst of 5
- General API: 100 req/sec per IP, burst of 50
- Max 20 concurrent connections per IP
- Max 10MB request body size
- Configuration: [../gateway/nginx/nginx.local.conf](../gateway/nginx/nginx.local.conf)

**Layer 2: Redis (Application)**
- Global rate limiting across all backend instances
- Login: 10 attempts, refills at 10/min
- Forgot password: 5 attempts, refills at 2/min
- Token bucket algorithm with atomic Lua scripts
- Configuration: [../backend/.../ratelimit/](../backend/src/main/java/com/ems/employee_management_system/ratelimit/)

**Layer 3: CloudFlare Free (Optional)**
- Unlimited DDoS protection (10+ Gbps)
- Bot protection with CAPTCHA
- Setup guide: [../docs/CLOUDFLARE_SETUP.md](../docs/CLOUDFLARE_SETUP.md)

### Testing Rate Limits

```bash
# Test Redis rate limiting
./test-redis-rate-limit.sh

# Test Nginx rate limiting
./test-nginx-rate-limit.sh

# Test forgot password limits
./test-forgot-password-rate-limit.sh

# Run all tests
./run-all-tests.sh
```

### Monitoring

```bash
# Monitor backend rate limiter
./monitor-logs.sh backend

# Monitor nginx rate limits
./monitor-logs.sh nginx

# Monitor all containers
./monitor-logs.sh all

# Check Redis rate limit keys
./check-redis-keys.sh
```

## 🧪 Testing Scripts

All scripts are located in `deployment/` directory:

| Script | Purpose | Expected Result |
|--------|---------|-----------------|
| `test-redis-rate-limit.sh` | Test Redis login rate limiting | 10 attempts allowed, 11th returns 429 |
| `test-nginx-rate-limit.sh` | Test Nginx gateway rate limiting | 10-12 successful, rest return 429 |
| `test-forgot-password-rate-limit.sh` | Test forgot password limits | 5 attempts allowed, 6th returns 429 |
| `check-redis-keys.sh` | Inspect Redis rate limit keys | Shows all keys, tokens, memory usage |
| `monitor-logs.sh [service]` | Real-time log monitoring | Filtered logs for rate limit events |
| `run-all-tests.sh` | Run comprehensive test suite | All tests executed sequentially |

### Example: Running Tests

```bash
cd deployment

# Run single test
./test-redis-rate-limit.sh

# Output:
# ============================================
# Testing Redis Rate Limiting (Layer 2)
# Login endpoint: 10 attempts allowed
# ============================================
# 
# Request 1: Status 400 (validation error - expected)
# Request 2: Status 400
# ...
# Request 10: Status 400
# Request 11: Status 429 ✅ Rate limit triggered!
# Request 12: Status 429 ✅ Rate limit triggered!
```

## 📦 Files in This Directory

### Docker Compose Files

**`docker-compose.yml`** (Main - Local Development)
- Includes: postgres, redis, backend, gateway
- Uses local builds
- Health checks enabled
- Internal networking only
- Usage: `docker compose up -d --build`

**`docker-compose.prod.yml`** (Production)
  - Uses pre-built Docker images from Docker Hub
  - Connects to AWS RDS (no local PostgreSQL)
  - Includes SSL/HTTPS support via Certbot
  - Usage: `docker compose -f docker-compose.prod.yml up -d`
  - **Note**: Automatically deployed via GitHub Actions when code is merged to `main`

**`docker-compose.backend.yml`** (Backend only)
- For testing backend in isolation
- Includes postgres, backend only

**`docker-compose.frontend.yml`** (Frontend only)
- For testing frontend in isolation
- Requires backend running separately

### Test Scripts

- `test-redis-rate-limit.sh` - Test Redis rate limiting
- `test-nginx-rate-limit.sh` - Test Nginx rate limiting
- `test-forgot-password-rate-limit.sh` - Test forgot password limits
- `check-redis-keys.sh` - Inspect Redis keys
- `monitor-logs.sh` - Real-time log monitoring
- `run-all-tests.sh` - Comprehensive test suite

### CI/CD Files

- `jenkins/` - Jenkins CI/CD setup (optional/legacy)
- GitHub Actions workflows are in `.github/workflows/` (root directory)

## 🔧 Commands

### Basic Operations

```bash
# Start all services (build if needed)
docker compose up -d --build

# Start without rebuilding
docker compose up -d

# Stop all services (keeps volumes)
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Restart specific service
docker compose restart backend

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f backend
docker compose logs -f gateway
docker compose logs -f postgres
docker compose logs -f redis

# Check service status
docker compose ps

# Execute command in container
docker exec -it ems-backend bash
docker exec -it ems-postgres psql -U postgres -d ems_db
docker exec -it ems-redis redis-cli
```

### Health Checks

```bash
# Check all container health
docker compose ps

# Check backend health endpoint
curl http://localhost/api/actuator/health

# Check gateway health
curl http://localhost/health

# Check Redis
docker exec ems-redis redis-cli ping

# Check Postgres
docker exec ems-postgres pg_isready -U postgres
```

### Troubleshooting Commands

```bash
# View container resource usage
docker stats

# Inspect container configuration
docker inspect ems-backend

# Check Docker networks
docker network ls
docker network inspect deployment_ems-network

# Check volumes
docker volume ls
docker volume inspect deployment_postgres_data
docker volume inspect deployment_redis_data

# Clean up unused resources
docker system prune -a --volumes
```

## 🐛 Troubleshooting

### Issue: Containers not starting

**Symptoms:** `docker compose up` fails or containers exit immediately

**Solution:**
```bash
# Check logs for errors
docker compose logs backend
docker compose logs postgres

# Verify environment variables
cat ../db/.env
ls -la .env  # Should be symlink to ../db/.env

# Rebuild from scratch
docker compose down -v
docker compose up -d --build
```

### Issue: Backend can't connect to Redis

**Symptoms:** Backend logs show "Could not connect to Redis"

**Solution:**
```bash
# Check Redis is running
docker compose ps redis

# Test Redis connectivity
docker exec ems-redis redis-cli ping
# Should return: PONG

# Check backend environment variables
docker exec ems-backend env | grep REDIS
# Should show: REDIS_HOST=redis, REDIS_PORT=6379

# Restart backend
docker compose restart backend
```

### Issue: Rate limiting not working

**Symptoms:** Can send unlimited requests without 429 errors

**Solution:**
```bash
# Test Nginx config
docker exec ems-gateway nginx -t

# Check Redis keys are being created
docker exec ems-redis redis-cli KEYS "rate_limit:*"

# Check backend logs for rate limiter
docker compose logs backend | grep -i rate

# Restart gateway to reload Nginx config
docker compose restart gateway
```

### Issue: Port 80 already in use

**Symptoms:** "Bind for 0.0.0.0:80 failed: port is already allocated"

**Solution:**
```bash
# Find process using port 80
lsof -i :80  # macOS/Linux
netstat -ano | findstr :80  # Windows

# Stop the conflicting service or change port in docker-compose.yml:
# ports:
#   - "8080:80"  # Map to 8080 instead
```

### Issue: "Unhealthy" container status

**Symptoms:** `docker compose ps` shows container as "unhealthy"

**Solution:**
```bash
# Check health check logs
docker inspect ems-backend | grep -A 10 Health

# Test health endpoint manually
curl http://localhost/api/actuator/health

# Common causes:
# 1. Backend not fully started yet (wait 30-60 seconds)
# 2. Database connection failed (check DB credentials)
# 3. Redis connection failed (check Redis is running)

# Wait for startup
docker compose logs -f backend
# Look for: "Started EmployeeManagementSystemApplication"
```

### Issue: Database migration errors

**Symptoms:** Backend logs show Flyway migration errors

**Solution:**
```bash
# Check Flyway baseline
docker exec ems-postgres psql -U postgres -d ems_db -c "SELECT * FROM flyway_schema_history;"

# Clean database and restart (WARNING: deletes all data)
docker compose down -v
docker compose up -d --build

# Or manually repair Flyway
docker exec -it ems-backend bash
./mvnw flyway:repair
```

## 🚀 Production Deployment

### Prerequisites

1. AWS EC2 instance with Docker installed
2. Domain name configured (e.g., ems.buffden.com)
3. Environment variables in GitHub Secrets
4. Docker Hub account for image hosting

### GitHub Actions Deployment

1. **Push to main branch** triggers automatic deployment
2. **GitHub Actions workflow** (`../.github/workflows/deploy.yml`):
   - Builds Docker images
   - Pushes to Docker Hub
   - SSHs to EC2
   - Pulls latest images
   - Runs `docker-compose.prod.yml`

### Manual Production Deployment

```bash
# SSH to EC2 instance
ssh ubuntu@your-ec2-ip

# Clone repository
git clone https://github.com/Buffden/employee-management-system.git
cd employee-management-system/deployment

# Create production environment file
nano .env.production
# Add all required variables

# Deploy with production config
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Production Checklist

- [ ] Environment variables configured (JWT secret, DB credentials, etc.)
- [ ] SSL/TLS certificates obtained (Certbot configured)
- [ ] Firewall rules configured (allow ports 80, 443)
- [ ] Database backups configured
- [ ] Monitoring setup (logs, metrics, alerts)
- [ ] CloudFlare configured (optional DDoS protection)
- [ ] Rate limiting tested and tuned
- [ ] Health checks passing
- [ ] DNS records pointing to server

## 📊 Monitoring & Logs

### Application Logs

```bash
# Backend application logs
docker compose logs -f backend

# Nginx access/error logs
docker compose logs -f gateway

# Database logs
docker compose logs -f postgres

# Redis logs
docker compose logs -f redis
```

### Rate Limiting Metrics

```bash
# Monitor rate limit events
./monitor-logs.sh backend

# Check Redis memory usage
docker exec ems-redis redis-cli INFO memory | grep used_memory_human

# Count rate limit rejections
docker compose logs backend | grep "Rate limit exceeded" | wc -l

# View top blocked IPs
docker compose logs backend | grep "Rate limit exceeded" | grep -oP 'IP: \K[0-9.]+' | sort | uniq -c | sort -rn
```

## 📚 Additional Resources

- **Rate Limiting**: [../docs/RATE_LIMITING_QUICK_START.md](../docs/RATE_LIMITING_QUICK_START.md)
- **DDoS Protection**: [../docs/RATE_LIMITING_AND_DDOS_PROTECTION.md](../docs/RATE_LIMITING_AND_DDOS_PROTECTION.md)
- **CloudFlare Setup**: [../docs/CLOUDFLARE_SETUP.md](../docs/CLOUDFLARE_SETUP.md)
- **Database Setup**: [../db/README.md](../db/README.md)
- **Backend API**: [../backend/README.md](../backend/README.md)
- **Frontend App**: [../frontend/README.md](../frontend/README.md)
- **CI/CD**: [../.github/workflows/README.md](../.github/workflows/README.md)

---

**Need help?** Check the [main README](../README.md) or open an issue on GitHub.
docker-compose ps
```

## Access

- **Application**: http://localhost
- **API requests**: http://localhost/api/* (routed through nginx → gateway → backend)

## Environment Variables

All credentials and configuration must be set in `../db/.env`:

### Required (Database)
- `DB_HOST` - Database host (default: postgres for Docker)
- `DB_PORT` - Database port (default: 5432 for Docker)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PWD` - Database password

### Optional (Application)
- `FRONTEND_BASE_URL` - Frontend base URL for email links (default: http://localhost)
- `EMAIL_SERVICE_PROVIDER` - Email service: 'sendgrid' or 'demo' (default: demo)
- `EMAIL_SENDGRID_API_KEY` - SendGrid API key (required if using SendGrid)
- `EMAIL_SENDGRID_FROM_EMAIL` - Verified sender email (required if using SendGrid)
- `EMAIL_SENDGRID_FROM_NAME` - Sender display name (default: Employee Management System)

See `../db/.env.example` for a complete template. All values use environment variables with sensible defaults - no hardcoded credentials are used.
