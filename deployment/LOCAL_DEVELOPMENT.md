# Local Development with Docker

Quick guide to run the Employee Management System locally using Docker.

## Prerequisites

1. **Docker Desktop** installed and running
2. **`db/.env`** file configured (see below)

## Quick Start

```bash
# Navigate to deployment directory
cd deployment

# Start all services (postgres, backend, gateway)
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

## Access the Application

- **Frontend**: http://localhost
- **API**: http://localhost/api/*
- **Health Check**: http://localhost/health

## Environment Configuration

Ensure `db/.env` has the following variables:

```bash
# Database Configuration
DB_NAME=ems_db
DB_USER=ems_user
DB_PWD=your_password_here
DB_HOST=postgres  # Use 'postgres' for Docker (service name)
DB_PORT=5432
DB_SSL_MODE=disable  # Disable SSL for local development

# Spring Profile
SPRING_PROFILE=dev  # Use 'dev' for local development

# Application Configuration
JWT_SECRET_KEY=your_jwt_secret_key_here
CORS_ALLOWED_ORIGINS=http://localhost
FRONTEND_BASE_URL=http://localhost

# Nginx Configuration
NGINX_PORT=80
NGINX_SERVER_NAME=localhost
BACKEND_PORT=8080

# Email Configuration (optional)
EMAIL_SERVICE_PROVIDER=demo  # Use 'demo' for local (no real emails sent)
```

## Common Commands

### Start Services
```bash
docker-compose up -d --build
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f gateway
docker-compose logs -f postgres
```

### Restart Services
```bash
# All services
docker-compose restart

# Specific service
docker-compose restart backend
```

### Rebuild After Code Changes
```bash
# Rebuild and restart
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d
```

### Check Service Status
```bash
docker-compose ps
```

### Access Database (if needed)
```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U ems_user -d ems_db
```

## Services

- **PostgreSQL**: Database (internal, not exposed)
- **Backend**: Spring Boot API (internal, accessible via gateway)
- **Gateway**: Nginx reverse proxy (exposed on port 80)

## Troubleshooting

### Port Already in Use

If port 80 is already in use:
```bash
# Change NGINX_PORT in db/.env to a different port (e.g., 8080)
NGINX_PORT=8080

# Then restart
docker-compose up -d
```

### Database Connection Issues

1. Check if postgres container is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check postgres logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify DB credentials in `db/.env` match what's expected

### Backend Not Starting

1. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

2. Verify environment variables in `db/.env`

3. Check if database is ready:
   ```bash
   docker-compose ps postgres
   ```

### Gateway Not Starting

1. Check gateway logs:
   ```bash
   docker-compose logs gateway
   ```

2. Verify `NGINX_PORT` and `NGINX_SERVER_NAME` are set in `db/.env`

3. Check if backend is healthy:
   ```bash
   docker-compose ps backend
   ```

### Clean Start (Remove All Data)

```bash
# Stop and remove containers, volumes, and networks
docker-compose down -v

# Rebuild and start fresh
docker-compose up -d --build
```

## Development Tips

1. **Hot Reload**: For backend changes, rebuild the backend container:
   ```bash
   docker-compose up -d --build backend
   ```

2. **Frontend Changes**: Frontend is built into the gateway image. Rebuild gateway:
   ```bash
   docker-compose up -d --build gateway
   ```

3. **Database Migrations**: Flyway runs automatically on backend startup

4. **View Real-time Logs**: Use `docker-compose logs -f` to see logs as they happen

## Differences from Production

- **SSL**: Disabled (`SSL_ENABLED=false`)
- **Database**: Local PostgreSQL container (not RDS)
- **Profile**: Uses `dev` Spring profile (default admin: `admin/admin123`)
- **Port**: Default port 80 (can be changed in `.env`)

## Next Steps

- Access the application at http://localhost
- Default admin credentials (dev profile): `admin` / `admin123`
- API documentation available at http://localhost/api (if configured)

