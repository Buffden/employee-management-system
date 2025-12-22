# CI/CD Deployment Guide

## Overview

The Employee Management System uses **GitHub Actions** for fully automated CI/CD. When code is merged to the `main` branch, it automatically builds Docker images, pushes them to Docker Hub, and deploys to the EC2 production server.

## Architecture

```
Developer merges PR to main
         ↓
GitHub Actions triggers
         ↓
┌─────────────────────────┐
│  Build & Push Job       │
│  ✅ Build backend image │
│  ✅ Build gateway image │
│  ✅ Push to Docker Hub  │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Deploy Job             │
│  ✅ SSH to EC2          │
│  ✅ Pull latest code    │
│  ✅ Pull Docker images  │
│  ✅ Generate .env file  │
│  ✅ Deploy containers   │
└─────────────────────────┘
         ↓
    ✅ Live on EC2!
```

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Purpose**: Test and validate code before merging

**Triggers**:
- Pull requests to `main`, `develop`, `master`
- Pushes to `main`, `develop`, `master`

**Jobs**:
- Backend tests (Maven + PostgreSQL)
- Frontend tests (Angular)
- Docker build verification

**See**: `.github/workflows/ci.yml` and `.github/workflows/README.md`

### 2. Deploy Pipeline (`deploy.yml`)

**Purpose**: Automatically deploy to production

**Triggers**:
- Push to `main` branch (automatic)
- Manual trigger via GitHub Actions UI

**Jobs**:

#### Job 1: Build and Push
- Builds backend Docker image from `backend/Dockerfile.app`
- Builds gateway Docker image from `gateway/Dockerfile`
- Pushes to Docker Hub as:
  - `{DOCKER_USERNAME}/ems-backend:latest`
  - `{DOCKER_USERNAME}/ems-gateway:latest`

#### Job 2: Deploy to EC2
1. **SSH to EC2**: Connects using `EC2_SSH_KEY`
2. **Pull Code**: `git pull origin main` in `~/employee-management-system/`
3. **Pull Images**: Downloads images from Docker Hub
4. **Generate .env**: Creates `../db/.env.production` from GitHub Secrets
5. **Deploy**: Runs `docker compose -f docker-compose.prod.yml up -d`
6. **Verify**: Checks containers are running

## Setup Instructions

### Prerequisites

1. **EC2 Instance**:
   - Docker installed
   - Docker Compose installed
   - Repository cloned at `~/employee-management-system/`
   - SSH access configured

2. **Docker Hub**:
   - Account created
   - Repositories created:
     - `{username}/ems-backend`
     - `{username}/ems-gateway`

3. **GitHub Repository**:
   - Secrets configured (see below)

### Step 1: Configure GitHub Secrets

Go to: **Repository → Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `EC2_HOST` | EC2 public IP or domain | `100.25.10.178` |
| `EC2_USER` | SSH username | `ubuntu` or `ec2-user` |
| `EC2_SSH_KEY` | Private SSH key | Contents of `~/.ssh/id_rsa` |
| `DOCKER_USERNAME` | Docker Hub username | `your-username` |
| `DOCKER_PASSWORD` | Docker Hub password/token | `your-password` |
| `DB_HOST` | RDS endpoint | `xxx.rds.amazonaws.com` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `ems_db` |
| `DB_USER` | Database username | `postgres` |
| `DB_PWD` | Database password | `secure-password` |
| `JWT_SECRET_KEY` | JWT token secret | `random-secret-key` |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `admin-password` |
| `ADMIN_EMAIL` | Admin email | `admin@example.com` |

#### Optional Secrets

| Secret Name | Description | Default |
|------------|-------------|---------|
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | (empty) |
| `FRONTEND_BASE_URL` | Frontend URL | (empty) |
| `NGINX_SERVER_NAME` | Domain name | (empty) |
| `EMAIL_SENDGRID_API_KEY` | SendGrid API key | (empty) |

### Step 2: Prepare EC2

**On your EC2 instance**:

```bash
# Install Docker
sudo yum install docker -y  # Amazon Linux
# OR
sudo apt-get install docker.io -y  # Ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in

# Clone repository
cd ~
git clone <your-repo-url> employee-management-system
cd employee-management-system
```

### Step 3: Generate SSH Key for GitHub Actions

**On your local machine**:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy
```

**Copy public key to EC2**:

```bash
cat ~/.ssh/github_actions_deploy.pub
# Copy the output
```

**On EC2**:

```bash
echo "your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Add private key to GitHub Secrets**:

```bash
cat ~/.ssh/github_actions_deploy
# Copy entire output (including -----BEGIN and -----END)
# Add as EC2_SSH_KEY secret in GitHub
```

### Step 4: Test Deployment

1. **Merge a small change to `main`**
2. **Go to GitHub → Actions tab**
3. **Watch the workflow run**
4. **Check your domain** - should see the new version!

## How It Works

### Secret Management

**Problem**: Application needs sensitive configuration (database passwords, API keys, etc.)

**Solution**: GitHub Secrets → Generated `.env.production` on EC2

1. Secrets stored in GitHub (encrypted, never visible)
2. Workflow reads secrets during deployment
3. Generates `.env.production` file on EC2
4. Docker Compose uses the file automatically
5. Secrets never committed to repository

**Benefits**:
- ✅ Change secret in GitHub → Next deployment uses new value
- ✅ No manual SSH needed to edit files
- ✅ Secrets never in code or logs

### Docker Hub Integration

**Why Docker Hub?**
- Standard registry for Docker images
- Versioned images (can rollback)
- No direct file transfer needed
- Industry standard approach

**How it works**:
1. GitHub Actions builds images
2. Pushes to Docker Hub
3. EC2 pulls from Docker Hub
4. Uses pre-built images (faster than building on EC2)

### Deployment Process

1. **Code merged to `main`**
2. **GitHub Actions triggers** `deploy.yml`
3. **Build job**:
   - Builds Docker images
   - Pushes to Docker Hub
4. **Deploy job**:
   - SSHs to EC2
   - Pulls latest code (for config changes)
   - Pulls Docker images from Docker Hub
   - Generates `.env.production` from secrets
   - Runs `docker compose -f docker-compose.prod.yml up -d`
   - Verifies containers are running

## Verification

### Check GitHub Actions

1. Go to repository → **Actions** tab
2. Click on latest workflow run
3. See detailed logs for each step

### Check EC2

```bash
# SSH into EC2
ssh ec2-user@your-ec2-ip

# Check containers
cd ~/employee-management-system/deployment
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs

# Check .env file
cat ../db/.env.production
```

### Check Docker Hub

1. Go to Docker Hub
2. Check your repositories
3. Verify images are pushed with `latest` tag

## Troubleshooting

### Deployment Fails: "Permission denied (publickey)"

**Problem**: SSH key not configured correctly

**Solution**:
1. Verify public key in EC2 `~/.ssh/authorized_keys`
2. Verify private key in GitHub Secrets as `EC2_SSH_KEY`
3. Check `EC2_USER` is correct (`ubuntu` vs `ec2-user`)

### Deployment Fails: "Cannot connect to Docker daemon"

**Problem**: Docker not running or permissions issue

**Solution**:
```bash
# On EC2
sudo systemctl start docker
sudo usermod -aG docker $USER
# Log out and back in
```

### Images Not Found on Docker Hub

**Problem**: Images not pushed or wrong repository name

**Solution**:
1. Check Docker Hub repositories exist
2. Verify `DOCKER_USERNAME` secret is correct
3. Check build job logs for push errors

### Containers Not Starting

**Problem**: Configuration or environment issues

**Solution**:
```bash
# On EC2, check logs
cd ~/employee-management-system/deployment
docker compose -f docker-compose.prod.yml logs

# Check .env file
cat ../db/.env.production

# Verify images
docker images | grep ems
```

## Best Practices

1. **Test Before Deploy**: Always test changes locally first
2. **Use Feature Branches**: Create PRs, don't push directly to main
3. **Monitor Deployments**: Check GitHub Actions logs after each deployment
4. **Rotate Secrets**: Change secrets periodically for security
5. **Keep EC2 Updated**: Regularly update Docker and system packages

## Security

- ✅ Secrets encrypted in GitHub
- ✅ Secrets never in code or logs
- ✅ SSH key-based authentication
- ✅ Docker Hub authenticated access
- ✅ Production uses SSL/HTTPS

**See**: `docs/deployment/SECURITY_ANALYSIS.md` for detailed security analysis

---

**Last Updated**: 2024-12-10  
**Status**: Active Production Deployment

