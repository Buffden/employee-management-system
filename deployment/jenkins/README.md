# Jenkins CI/CD

This folder contains all Jenkins-related files for CI/CD pipelines.

## Files

- **`docker-compose.yml`** - Jenkins container setup with Docker support
- **`Dockerfile`** - Custom Jenkins image with Docker CLI and Docker Compose
- **`Jenkinsfile.backend`** - Backend CI/CD pipeline (Spring Boot)
- **`Jenkinsfile.frontend`** - Frontend CI/CD pipeline (Angular)

## Quick Start

### Setup Jenkins

```bash
cd deployment/jenkins
docker-compose up -d --build
```

Access Jenkins at: **http://localhost:8085**

### Configure Pipelines

1. Open Jenkins UI: http://localhost:8085
2. Install suggested plugins
3. Create admin user
4. Create new pipeline jobs:
   - **Backend Pipeline**: Point to `Jenkinsfile.backend`
   - **Frontend Pipeline**: Point to `Jenkinsfile.frontend`

## Jenkinsfile.backend

**Purpose:** Automated CI/CD for Spring Boot backend

**Stages:**
1. Cleanup - Remove old containers
2. Clone Repository - Clone backend repo
3. Build Application - Maven build
4. Debug Docker Compose - Validate Docker setup
5. Run Application - Start postgres + backend
6. Run Tests - Execute Maven tests
7. Stop Services - Cleanup

**Requirements:**
- Maven 3.8.8 tool configured in Jenkins
- Docker tool configured in Jenkins
- `db-credentials` credential in Jenkins

## Jenkinsfile.frontend

**Purpose:** Automated CI/CD for Angular frontend

**Stages:**
1. Clone Repository - Clone frontend repo
2. Install Dependencies - Install Node.js, Angular CLI, npm packages
3. Build Frontend - Production build
4. Dockerize Frontend - Build Docker image
5. Deploy Application - Deploy using docker-compose
6. Verify Deployment - Check accessibility

**Requirements:**
- NodeJS-18 tool configured in Jenkins
- Docker access

## Docker Compose

The `docker-compose.yml` in this folder sets up:
- Jenkins LTS container
- Custom Jenkins image with Docker support
- Docker socket mounted for Docker-in-Docker
- Persistent Jenkins data

**Ports:**
- Jenkins UI: `8085` (host) → `8080` (container)

**Volumes:**
- `/var/jenkins_home` - Persistent Jenkins data
- `/var/run/docker.sock` - Docker socket for Docker-in-Docker

## Environment Variables

Jenkins container needs access to database credentials from `../../db/.env`:
- `DB_HOST`
- `DB_NAME`
- `DB_USER`
- `DB_PWD`

These are passed via environment variables in `docker-compose.yml`.

## Notes

- Jenkins runs as `root` to access Docker socket
- Docker Compose v2.24.0 is pinned in Dockerfile
- All pipelines use `../docker-compose.yml`, `../docker-compose.backend.yml`, or `../docker-compose.frontend.yml` from parent directory

