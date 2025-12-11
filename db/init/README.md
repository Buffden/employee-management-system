# Database Initialization Scripts

This folder is reserved for SQL scripts that run automatically when the PostgreSQL container is created for the **first time only**.

## Current Setup

Since we use **Hibernate `ddl-auto=update`** (code-first approach):
- ✅ Schema is created automatically by Hibernate from Java entities
- ✅ No schema creation scripts needed here
- ✅ This folder is currently empty (no initialization scripts)

## How It Works (If Needed in Future)

1. PostgreSQL container starts
2. If database is empty (first time), scripts in this folder run
3. Scripts run in **alphabetical order** (use prefixes like `01-`, `02-`)
4. Scripts do NOT run if database already exists

## When to Use (Future)

**Use this folder for**:
- ✅ Seed data (initial locations, departments, test users) - if needed
- ✅ Reference data (lookup tables, constants) - if needed
- ✅ Development test data - if needed

**Do NOT use for**:
- ❌ Schema creation (handled by Hibernate)
- ❌ Schema migrations (use Flyway/Liquibase in future)
- ❌ Production data

## Important Notes

⚠️ **Scripts only run on FIRST database creation**
- If you delete the database volume and recreate, scripts run again
- If database already exists, scripts are ignored
- Use `docker-compose down -v` to remove volumes and trigger re-initialization

⚠️ **Hibernate Schema First**
- Hibernate creates schema BEFORE any scripts here run
- Scripts can INSERT data into Hibernate-created tables
- Do NOT create tables here (Hibernate handles that)

