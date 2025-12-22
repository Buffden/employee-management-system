# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration (CI) and continuous deployment (CD).

## Workflows

### CI Pipeline (`ci.yml`)

**Purpose**: Automated testing and build verification on every PR and push.

**Triggers**:
- Pull requests to `main`, `develop`, or `master`
- Pushes to `main`, `develop`, or `master`

**Jobs**:

1. **Backend Tests**
   - Sets up PostgreSQL service
   - Runs Maven tests
   - Builds Spring Boot application
   - Validates backend code

2. **Frontend Tests**
   - Sets up Node.js 18
   - Installs dependencies
   - Runs linter
   - Runs Angular tests
   - Builds Angular application

3. **Docker Build Verification**
   - Builds backend Docker image
   - Builds frontend Docker image
   - Builds gateway Docker image
   - Validates Docker configurations

**Benefits**:
- ✅ Automatic validation on every PR
- ✅ Catches issues before merge
- ✅ No infrastructure cost (free for public repos)
- ✅ Fast feedback (typically 5-10 minutes)

### Deploy to Production (`deploy.yml`)

**Purpose**: Automatic deployment to EC2 production server when code is merged to `main` branch.

**Triggers**:
- Push to `main` branch (automatic)
- Manual trigger via GitHub Actions UI (workflow_dispatch)

**Jobs**:

1. **Build and Push**
   - Builds backend Docker image from `backend/Dockerfile.app`
   - Builds gateway Docker image from `gateway/Dockerfile` (includes frontend)
   - Pushes images to Docker Hub as `{DOCKER_USERNAME}/ems-backend:latest` and `{DOCKER_USERNAME}/ems-gateway:latest`

2. **Deploy to EC2**
   - SSHs into EC2 server using `EC2_SSH_KEY`
   - Pulls latest code from repository
   - Pulls Docker images from Docker Hub
   - Generates `.env.production` file from GitHub Secrets
   - Deploys using `docker-compose.prod.yml`
   - Verifies containers are running

**Key Features**:
- ✅ **Secure**: Secrets stored in GitHub Secrets, never in code
- ✅ **Automated**: No manual deployment steps
- ✅ **Versioned**: Images stored in Docker Hub
- ✅ **Idempotent**: Safe to rerun deployments

**Required GitHub Secrets**:
- `EC2_HOST` - EC2 instance IP or domain
- `EC2_USER` - SSH username (ubuntu/ec2-user)
- `EC2_SSH_KEY` - Private SSH key for EC2 access
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PWD` - Database credentials
- `JWT_SECRET_KEY` - JWT token secret
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` - Admin user
- Optional: `CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL`, `NGINX_SERVER_NAME`, etc.

**How It Works**:
1. Code merged to `main` → Workflow triggers
2. Builds Docker images → Pushes to Docker Hub
3. SSHs to EC2 → Pulls code and images
4. Generates `.env.production` from secrets
5. Deploys with `docker-compose.prod.yml`
6. Verifies deployment success

**Setup Required**:
- EC2 instance with Docker and Docker Compose installed
- Repository cloned on EC2 at `~/employee-management-system/`
- GitHub Secrets configured (see above)
- Docker Hub repositories created (`ems-backend`, `ems-gateway`)

## Usage

### Automatic
Workflows run automatically on:
- Every pull request
- Every push to main branches

### Manual Trigger
You can also trigger workflows manually from the GitHub Actions tab.

## Status Badge

Add this to your README.md to show CI status:

```markdown
![CI](https://github.com/Buffden/employee-management-system/workflows/CI%20Pipeline/badge.svg)
```

## Requirements

- Java 17 for backend
- Node.js 18 for frontend
- Docker for build verification
- PostgreSQL 15 for backend tests

All are automatically set up by the workflow.

## Troubleshooting

### Backend Tests Failing
- Check database connection settings
- Verify Maven dependencies
- Check test configuration

### Frontend Tests Failing
- Check Node.js version compatibility
- Verify npm dependencies
- Check Angular test configuration

### Docker Build Failing
- Verify Dockerfile syntax
- Check build context paths
- Verify required files exist

---

**Last Updated**: 2024-12-10

