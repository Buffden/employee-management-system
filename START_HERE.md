# 🚀 Start Here - Quick Setup Guide

## One Command to Start Everything!

```bash
./start.sh
```

That's it! This will start:
- ✅ PostgreSQL Database
- ✅ Spring Boot Backend
- ✅ Angular Frontend

## Prerequisites

1. **Docker Desktop** installed and running
2. **Environment file** configured

## Setup Steps

### 1. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your database password
```

### 2. Start All Services

```bash
# From root directory
./start.sh
```

### 3. Access the Application

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8080
- **Database:** localhost:5433

## Available Commands

| Command | Description |
|---------|-------------|
| `./start.sh` | Start all services (FE, BE, DB) |
| `./stop.sh` | Stop all services |
| `./restart.sh` | Restart all services |
| `./status.sh` | Check service status |

## Troubleshooting

**Docker not running:**
- Start Docker Desktop
- Wait for it to fully start

**Port conflicts:**
- Stop existing services: `./stop.sh`
- Or change ports in `docker-compose.yml`

**Environment file missing:**
- Copy `backend/.env.example` to `backend/.env`
- Update with your credentials

## Need Help?

See [README.md](README.md) for detailed documentation.

