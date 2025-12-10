# Deployment Folder - Files Guide

This document explains the purpose and usage of each file in the `deployment/` folder.

---

## 📋 File Overview

| File/Folder | Type | Purpose | When to Use |
|-------------|------|---------|-------------|
| `docker-compose.yml` | Main Config | Full production deployment | Daily development, production |
| `jenkins/` | CI/CD Folder | All Jenkins-related files | CI/CD setup and pipelines |
| `README.md` | Documentation | Deployment documentation | Reference guide |
| `FILES_GUIDE.md` | Documentation | Detailed files guide | Reference guide |

---

## 📁 Detailed File Descriptions

### 1. `docker-compose.yml` - **Main Deployment Configuration**

**Purpose:**  
Orchestrates the complete application stack for local development and production deployment.

**What it does:**
- Defines 4 services: `postgres`, `backend`, `gateway`, `frontend`
- Sets up networking, health checks, and dependencies
- Only exposes port 80 (frontend) to the host
- All other services are internal-only

**Services:**
- **postgres** - PostgreSQL database (internal, no port exposure)
- **backend** - Spring Boot API (internal, accessible via gateway)
- **gateway** - Nginx API Gateway (internal, routes `/api` to backend)
- **frontend** - Angular app with Nginx (exposed on port 80)

**When to use:**
```bash
# Daily development
cd deployment
docker-compose up -d --build

# Production deployment
docker-compose up -d --build
```

**Key Features:**
- ✅ Health checks for all services
- ✅ Proper service dependencies (waits for healthy services)
- ✅ Persistent database volumes
- ✅ Environment variables from `../db/.env`
- ✅ Automatic restarts on failure

---

### 2. `docker-compose.backend.yml` - **CI/CD Testing Configuration**

**Purpose:**  
Simplified Docker Compose file used by Jenkins CI/CD pipeline for testing backend builds.

**What it does:**
- Defines only `postgres` and `app` (backend) services
- Used during automated testing in Jenkins
- Exposes backend on port 8080 for testing
- Uses separate volumes (`postgres_data_ci`) to avoid conflicts

**Services:**
- **postgres** - Test database (container: `ems-postgres-ci`)
- **app** - Backend service (container: `ems-backend-ci`)

**When to use:**
- ✅ Automatically used by `Jenkinsfile.backend`
- ❌ NOT for manual development (use `docker-compose.yml` instead)

**Key Features:**
- ✅ Minimal services for CI/CD testing
- ✅ Separate container names to avoid conflicts
- ✅ Separate volumes to avoid data conflicts
- ✅ Exposes backend port 8080 for test access

**Usage in Jenkins:**
```groovy
docker-compose -f docker-compose.backend.yml up -d --build postgres app
```

---

### 3. `jenkins/` - **Jenkins CI/CD Folder**

**Purpose:**  
Contains all Jenkins-related files for CI/CD setup and pipelines.

**Location:** `deployment/jenkins/`

**Files:**
- `docker-compose.yml` - Jenkins container setup
- `Dockerfile` - Custom Jenkins image
- `Jenkinsfile.backend` - Backend CI/CD pipeline
- `Jenkinsfile.frontend` - Frontend CI/CD pipeline
- `README.md` - Jenkins documentation

**When to use:**
```bash
# Setup Jenkins
cd deployment/jenkins
docker-compose up -d --build

# Access Jenkins
# Open browser: http://localhost:8085
```

**Key Features:**
- ✅ All Jenkins files organized in one folder
- ✅ Custom Jenkins image with Docker support
- ✅ Backend and Frontend CI/CD pipelines
- ✅ See `jenkins/README.md` for detailed documentation

---

#### 3.1. `jenkins/docker-compose.yml` - **Jenkins Container Setup**

**Purpose:**  
Defines the Jenkins CI/CD server container with Docker support.

**What it does:**
- Sets up Jenkins LTS container
- Installs Docker CLI and Docker Compose (via `Dockerfile`)
- Mounts Docker socket for Docker-in-Docker capability
- Exposes Jenkins on port 8085 (host) → 8080 (container)

**Services:**
- **jenkins** - Jenkins CI/CD server

**Key Features:**
- ✅ Custom Jenkins image with Docker tools
- ✅ Docker socket mounted for Docker-in-Docker
- ✅ Persistent Jenkins data (`/var/jenkins_home`)
- ✅ Environment variables for database access

---

#### 3.2. `jenkins/Dockerfile` - **Custom Jenkins Image**

**Purpose:**  
Builds a custom Jenkins image with Docker CLI and Docker Compose pre-installed.

**What it does:**
- Extends `jenkins/jenkins:lts` base image
- Installs official Docker CE CLI
- Installs Docker Compose v2.24.0 (pinned version)
- Runs as root for Docker access

**Key Features:**
- ✅ Official Docker CE (not outdated docker.io)
- ✅ Pinned Docker Compose version for reproducibility
- ✅ Proper GPG key handling for security

---

#### 3.3. `jenkins/Jenkinsfile.backend` - **Backend CI/CD Pipeline**

**Purpose:**  
Defines the complete CI/CD pipeline for the Spring Boot backend application.

**Pipeline Stages:**
```
Cleanup → Clone → Build → Debug → Run App → Test → Stop
```

**Key Features:**
- ✅ Uses `../docker-compose.backend.yml` for testing
- ✅ Validates Docker environment
- ✅ Runs full test suite
- ✅ Proper cleanup after tests

**Jenkins Configuration:**
- Requires Maven 3.8.8 tool configured
- Requires Docker tool configured
- Requires `db-credentials` credential in Jenkins

---

#### 3.4. `jenkins/Jenkinsfile.frontend` - **Frontend CI/CD Pipeline**

**Purpose:**  
Defines the complete CI/CD pipeline for the Angular frontend application.

**Pipeline Stages:**
```
Clone → Install → Build → Dockerize → Deploy → Verify
```

**Key Features:**
- ✅ Uses main `../docker-compose.yml` for deployment
- ✅ Production build configuration
- ✅ Health verification after deployment

**Jenkins Configuration:**
- Requires NodeJS-18 tool configured
- Requires Docker access

---

### 7. `README.md` - **Documentation**

**Purpose:**  
Comprehensive documentation for the deployment folder.

**What it contains:**
- Quick start guide
- Architecture overview
- File descriptions
- Prerequisites
- Common commands
- Access information
- Environment variables

**When to use:**
- Reference for deployment procedures
- Onboarding new developers
- Troubleshooting guide

---

## 🔄 How Files Work Together

### Development Workflow
```
1. Developer runs: docker-compose up -d --build
   ↓
2. Uses: docker-compose.yml
   ↓
3. Starts: postgres → backend → gateway → frontend
   ↓
4. Access: http://localhost (port 80)
```

### CI/CD Workflow (Backend)
```
1. Git push triggers Jenkins
   ↓
2. Jenkins runs: Jenkinsfile.backend
   ↓
3. Uses: docker-compose.backend.yml
   ↓
4. Tests: postgres + backend
   ↓
5. Reports: Success/Failure
```

### CI/CD Workflow (Frontend)
```
1. Git push triggers Jenkins
   ↓
2. Jenkins runs: Jenkinsfile.frontend
   ↓
3. Builds: Angular production build
   ↓
4. Deploys: Using docker-compose.yml
   ↓
5. Verifies: Frontend accessibility
```

### Jenkins Setup Workflow
```
1. Admin runs: cd jenkins && docker-compose up --build
   ↓
2. Builds: Dockerfile (custom Jenkins image)
   ↓
3. Starts: Jenkins container with Docker support
   ↓
4. Configures: Jenkins pipelines (Jenkinsfile.backend, Jenkinsfile.frontend)
   ↓
5. Runs: Automated CI/CD pipelines
```

---

## 🎯 Quick Reference

### Daily Development
```bash
cd deployment
docker-compose up -d --build    # Start everything
docker-compose down             # Stop everything
docker-compose logs -f          # View logs
```

### CI/CD Testing (Backend)
```bash
# Automatically handled by Jenkinsfile.backend
cd deployment
docker-compose -f docker-compose.backend.yml up -d --build
```

### Jenkins Setup
```bash
cd deployment/jenkins
docker-compose up -d --build
# Access: http://localhost:8085
```

---

## 📝 Summary

| File/Folder | Used By | Purpose |
|-------------|---------|---------|
| `docker-compose.yml` | Developers, Frontend CI/CD | Full stack deployment |
| `jenkins/` | Admin, CI/CD | All Jenkins-related files |
| `jenkins/docker-compose.yml` | Admin | Setup Jenkins server |
| `jenkins/Dockerfile` | jenkins/docker-compose.yml | Build Jenkins image |
| `jenkins/Jenkinsfile.backend` | Jenkins | Backend CI/CD pipeline |
| `jenkins/Jenkinsfile.frontend` | Jenkins | Frontend CI/CD pipeline |
| `README.md` | Everyone | Documentation |
| `FILES_GUIDE.md` | Everyone | Detailed files guide |

---

## ⚠️ Important Notes

1. **Never commit `.env` files** - All credentials are in `../db/.env` (gitignored)
2. **Use `docker-compose.yml` for development** - Not `docker-compose.backend.yml`
3. **Jenkins files are for CI/CD only** - Not for manual deployment
4. **All services use health checks** - Ensures proper startup order
5. **Only port 80 is exposed** - All other services are internal

---

## 🔧 Troubleshooting

**Issue:** Services not starting
- Check: `docker-compose ps`
- Check: `docker-compose logs -f <service>`
- Verify: `db/.env` file exists and has correct values

**Issue:** Jenkins can't access Docker
- Check: Docker socket permissions
- Verify: `docker-compose.jenkins.yml` mounts `/var/run/docker.sock`

**Issue:** CI/CD pipeline fails
- Check: Jenkins logs
- Verify: Docker and Docker Compose are installed in Jenkins container
- Check: Environment variables are set correctly

