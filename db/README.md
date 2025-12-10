# Database Configuration

This folder contains database-related configuration files and scripts.

## Files

- `.env.example` - Template for database environment variables
- `init/` - Database initialization scripts (optional)

**Note:** The database connection script has been moved to `scripts/connect_db.sh`

## Setup

1. **Copy the example file:**
   ```bash
   cd db
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials:**
   ```bash
   DB_HOST=localhost
   DB_PORT=5433
   DB_NAME=ems_db
   DB_USER=postgres
   DB_PWD=your_secure_password_here
   ```

## Connect to Database

```bash
# From root directory
./scripts/connect_db.sh

# Or
cd scripts
./connect_db.sh
```

## Environment Variables

Required variables in `.env`:
- `DB_HOST` - Database host (localhost for local, postgres for Docker)
- `DB_PORT` - Database port (5433 for local, 5432 for Docker internal)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PWD` - Database password

## Database Initialization

Place any SQL initialization scripts in the `init/` folder. They will be executed automatically when the database container starts for the first time.

Example: `init/01-init-schema.sql`

