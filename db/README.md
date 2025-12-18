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
   # Copy from example
   cp .env.example .env
   
   # Or manually create with minimum required:
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

### Optional Variables (for email service and frontend links)
- `FRONTEND_BASE_URL` - Frontend base URL for email links (default: http://localhost)
- `EMAIL_SERVICE_PROVIDER` - Email service provider: 'sendgrid' or 'demo' (default: demo)
- `EMAIL_SENDGRID_API_KEY` - SendGrid API key (required if using SendGrid)
- `EMAIL_SENDGRID_FROM_EMAIL` - Verified sender email address (required if using SendGrid)
- `EMAIL_SENDGRID_FROM_NAME` - Sender display name (default: Employee Management System)

See `.env.example` for a complete template with all available variables.

## Database Initialization

The `init/` folder is reserved for SQL initialization scripts (currently empty). Scripts placed here will be executed automatically when the database container starts for the first time.

**Note**: Since we use Hibernate `ddl-auto=update` (code-first approach), schema is created automatically. This folder is available for seed data or reference data if needed in the future.

