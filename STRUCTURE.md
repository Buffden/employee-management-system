# Project Structure

This document describes the reorganized folder structure of the Employee Management System.

## Root Level Folders

### 📁 `backend/`
Spring Boot REST API application
- Contains Java source code, Maven configuration
- Application properties and configuration
- Backend-specific Dockerfiles

### 📁 `frontend/`
Angular SPA application
- Contains TypeScript source code, Angular configuration
- Frontend Dockerfile and nginx configuration
- Frontend-specific build scripts

### 📁 `gateway/`
API Gateway service (Nginx)
- Routes API requests to backend services
- Handles CORS and request routing
- Gateway Dockerfile and nginx configuration

### 📁 `deployment/`
All deployment-related files
- `docker-compose.yml` - Main orchestration file
- `start.sh` - Start all services
- `stop.sh` - Stop all services
- `restart.sh` - Restart all services
- `status.sh` - Check service status

### 📁 `db/`
Database configuration and scripts
- `.env.example` - Environment variable template
- `.env` - Actual environment variables (gitignored)
- `connect_db.sh` - Script to connect to database
- `init/` - Database initialization SQL scripts

## Scripts Folder

All shell scripts are located in the `scripts/` folder:
- `start.sh` - Start all services
- `stop.sh` - Stop all services
- `restart.sh` - Restart all services
- `status.sh` - Check service status
- `connect_db.sh` - Connect to database

## Root Level Scripts

Convenience scripts that delegate to `scripts/`:
- `start.sh` → `scripts/start.sh`
- `stop.sh` → `scripts/stop.sh`
- `restart.sh` → `scripts/restart.sh`
- `status.sh` → `scripts/status.sh`

## Architecture Flow

```
Frontend (4200) → Gateway (8000) → Backend (8080) → Database (5433)
```

All services communicate through Docker network `ems-network`.

## Benefits of This Structure

1. **Separation of Concerns**: Each folder has a clear purpose
2. **Easy Deployment**: All deployment files in one place
3. **Centralized DB Config**: Database credentials in one location
4. **Gateway Isolation**: API gateway as a separate service
5. **Scalability**: Easy to add more services or gateways

