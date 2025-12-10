# Quick Start Guide

Get the Employee Management System running locally in minutes!

## Prerequisites

- Docker Desktop installed and running
- That's it! Everything runs in Docker

## Step 1: Configure Environment

```bash
cd db
cp .env.example .env
# Edit .env with your database credentials (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PWD)
```

## Step 2: Start Everything ⭐

```bash
cd deployment
docker-compose up -d --build
```

That's it! The application will:
1. ✅ Start PostgreSQL database (internal)
2. ✅ Start Spring Boot backend (internal)
3. ✅ Start API Gateway (internal)
4. ✅ Start Angular frontend with Nginx (port 80)

**Access the application:**
- 🌐 **Application**: http://localhost
- 🔌 **API**: http://localhost/api/* (routed through nginx)

## Architecture

```
Host → Nginx (Port 80) → Gateway → Backend → Database
```

Only Nginx is exposed on port 80. All other services are internal.

## Verify It's Working

```bash
# Check if services are running
cd deployment
docker-compose ps

# Check logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Test the application
curl http://localhost/api/departments
```

## Stop Everything

```bash
cd deployment
docker-compose down
```

## Troubleshooting

**Port 80 already in use:**
```bash
# Find and kill the process
sudo lsof -ti:80 | xargs kill -9
```

**Docker not running:**
- Start Docker Desktop
- Wait for it to fully start
- Try again

**Services not starting:**
- Check that `db/.env` file exists and has all required variables
- Check logs: `docker-compose logs -f`

## Environment Variables

All credentials must be set in `db/.env`:
- `DB_HOST` - Database host
- `DB_PORT` - Database port  
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PWD` - Database password

No hardcoded credentials are used.
