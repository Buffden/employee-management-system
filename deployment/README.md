# Deployment

This folder contains all deployment and CI/CD related files for the Employee Management System.

## Quick Start

```bash
# From the root directory
cd deployment
docker-compose up -d --build
```

## Architecture

```
Host → Nginx (Port 80) → Gateway → Backend → Database
```

- **Only Nginx is exposed** on port 80
- Backend, Gateway, and Database are **not directly accessible** from the host
- All API requests go through: Host → Nginx → Gateway → Backend

## Files in This Folder

### Main Deployment
- **`docker-compose.yml`** - Main deployment configuration (postgres, backend, gateway, frontend)
  - Use this for: `docker-compose up -d --build`

### CI/CD Files
- **`jenkins/`** - Jenkins CI/CD folder
  - `docker-compose.yml` - Jenkins container setup
  - `Dockerfile` - Custom Jenkins image
  - `Jenkinsfile.backend` - Backend CI/CD pipeline
  - `Jenkinsfile.frontend` - Frontend CI/CD pipeline
  - See `jenkins/README.md` for details

## Services

The docker-compose.yml orchestrates:
- **PostgreSQL** - Database (internal only)
- **Backend** - Spring Boot API (internal only)
- **Gateway** - API Gateway (internal only)
- **Frontend/Nginx** - Angular App with Nginx (exposed on port 80)

## Prerequisites

1. Docker Desktop installed and running
2. `db/.env` file configured (see `../db/README.md`)

**Note:** A symlink `deployment/.env -> ../db/.env` is automatically created so docker-compose can read environment variables for variable substitution. This symlink is gitignored.

## Improvements Made

- ✅ Removed all AWS references (local-only development)
- ✅ Added proper health checks and service dependencies
- ✅ Fixed Jenkins Docker installation (uses official docker-ce)
- ✅ Updated CI/CD pipelines to use docker-compose consistently
- ✅ Added missing postgres service to docker-compose.backend.yml
- ✅ Improved error handling and container naming

## Commands

```bash
# Start all services
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend

# Restart services
docker-compose restart

# Check service status
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
