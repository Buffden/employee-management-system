# GitHub Actions Setup Guide

## Overview

GitHub Actions provides **free, automatic CI/CD** for the Employee Management System. It runs tests and validates builds on every pull request, and automatically deploys to production when code is merged to the main branch.

## Workflow Configuration

### Location
- **CI Workflow File**: `.github/workflows/ci.yml` - Testing and validation
- **Deploy Workflow File**: `.github/workflows/deploy.yml` - Production deployment
- **Documentation**: `.github/workflows/README.md`

### Workflow Structure

```yaml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop, master]
  push:
    branches: [main, develop, master]

jobs:
  backend-test:    # Backend testing
  frontend-test:   # Frontend testing
  docker-build:    # Docker build verification
```

## Jobs Explained

### 1. Backend Tests Job

**Purpose**: Validate Spring Boot backend

**Steps**:
1. Checkout code
2. Set up JDK 17
3. Start PostgreSQL service (test database)
4. Run Maven tests
5. Build application

**Database Configuration**:
- Uses GitHub Actions PostgreSQL service
- Automatically configured for tests
- No external database needed

### 2. Frontend Tests Job

**Purpose**: Validate Angular frontend

**Steps**:
1. Checkout code
2. Set up Node.js 18
3. Install dependencies (`npm ci`)
4. Run linter
5. Run tests
6. Build application

**Note**: Tests run with `--watch=false` for CI environment.

### 3. Docker Build Verification

**Purpose**: Validate Docker configurations

**Steps**:
1. Checkout code
2. Set up Docker Buildx
3. Build backend Docker image
4. Build frontend Docker image
5. Build gateway Docker image

**Note**: Only builds images, doesn't run containers (for speed).

## How It Works

### Automatic Triggers

**On Pull Request**:
```
Developer creates PR
    ↓
GitHub Actions automatically runs
    ↓
✅ All tests pass → PR can be merged
❌ Any test fails → PR shows failure status
```

**On Push to Main**:
```
Code pushed to main branch
    ↓
GitHub Actions automatically runs
    ↓
Validates code quality
```

### Status in Pull Requests

When you create a PR, you'll see:
- ✅ Green checkmark if all tests pass
- ❌ Red X if any test fails
- ⏳ Yellow circle while running

Click on the status to see detailed logs.

## Benefits

### 1. Free for Public Repos
- Unlimited minutes for public repositories
- 2000 minutes/month free for private repos
- No infrastructure cost

### 2. Fast Feedback
- Typically completes in 5-10 minutes
- Parallel job execution
- Immediate notification in PR

### 3. Automatic
- No manual triggers needed
- Runs on every PR automatically
- No configuration after initial setup

### 4. Integrated
- Status shows directly in PR
- Can block merges if tests fail
- Detailed logs available

## Setup Instructions

### Initial Setup (One Time)

1. **Create Workflow File**
   - Already created: `.github/workflows/ci.yml`
   - No additional setup needed

2. **Push to GitHub**
   ```bash
   git add .github/workflows/ci.yml
   git commit -m "Add GitHub Actions CI workflow"
   git push
   ```

3. **Verify It Works**
   - Create a test PR
   - Check Actions tab in GitHub
   - Verify workflow runs

### No Additional Configuration Needed

The workflow is self-contained:
- ✅ Automatically sets up Java, Node.js, Docker
- ✅ Configures PostgreSQL service
- ✅ Uses correct versions (Java 17, Node 18)
- ✅ Caches dependencies for speed

## Customization

### Add More Tests

Edit `.github/workflows/ci.yml`:

```yaml
- name: Run custom tests
  run: |
    # Your test commands here
```

### Add Code Quality Checks

```yaml
- name: Run SonarQube
  uses: sonarsource/sonarqube-scan-action@master
```

### Add Deployment (Optional)

```yaml
- name: Deploy to staging
  if: github.ref == 'refs/heads/develop'
  run: |
    # Deployment commands
```

## Troubleshooting

### Tests Failing Locally But Passing in CI

**Check**:
- Environment variables
- Database configuration
- Test data setup

### Tests Passing Locally But Failing in CI

**Common Issues**:
- Missing environment variables
- Database connection issues
- Timeout issues (increase timeout)

### Workflow Not Running

**Check**:
- File is in `.github/workflows/` directory
- File has `.yml` or `.yaml` extension
- YAML syntax is correct
- Branch name matches trigger

## Deployment Workflow

### Automatic Production Deployment

When code is merged to `main`, GitHub Actions automatically:

```
Code merged to main
    ↓
Build Docker Images (backend, gateway)
    ↓
Push to Docker Hub
    ↓
SSH to EC2 Server
    ↓
Pull latest code
    ↓
Pull Docker images from Docker Hub
    ↓
Generate .env.production from GitHub Secrets
    ↓
Deploy with docker-compose
    ↓
✅ Live on production!
```

**Key Features**:
- ✅ **Secure**: Secrets stored in GitHub Secrets, never in code
- ✅ **Automated**: No manual steps required
- ✅ **Versioned**: Images tagged and stored in Docker Hub
- ✅ **Idempotent**: Safe to rerun deployments

### Deployment Workflow (`deploy.yml`)

**Triggers**:
- Push to `main` branch (automatic)
- Manual trigger via GitHub Actions UI

**Jobs**:

1. **Build and Push**
   - Builds backend Docker image
   - Builds gateway Docker image (includes frontend)
   - Pushes images to Docker Hub

2. **Deploy to EC2**
   - Pulls latest code on EC2
   - Pulls Docker images from Docker Hub
   - Generates `.env.production` from GitHub Secrets
   - Deploys using `docker-compose.prod.yml`
   - Verifies deployment success

**Required GitHub Secrets**:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` - EC2 access
- `DOCKER_USERNAME`, `DOCKER_PASSWORD` - Docker Hub access
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PWD` - Database credentials
- `JWT_SECRET_KEY` - Application security
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` - Admin user
- And other application-specific secrets

See `.github/workflows/README.md` for complete documentation.

## Best Practices

1. **Keep Workflows Fast**
   - Use caching (already configured)
   - Run tests in parallel
   - Skip unnecessary steps

2. **Fail Fast**
   - Run quick checks first
   - Fail early if basic checks fail

3. **Clear Error Messages**
   - Use descriptive step names
   - Add helpful error messages

4. **Security**
   - Never commit secrets
   - Use GitHub Secrets for sensitive data
   - Review workflow changes in PRs

## Monitoring

### View Workflow Runs

1. Go to GitHub repository
2. Click "Actions" tab
3. See all workflow runs
4. Click on a run to see details

### View Logs

1. Open a workflow run
2. Click on a job
3. Click on a step
4. See detailed logs

## Status Badge

Add to README.md:

```markdown
![CI](https://github.com/Buffden/employee-management-system/workflows/CI%20Pipeline/badge.svg)
```

This shows the CI status on your README.

---

**Last Updated**: 2024-12-10  
**Status**: Active

