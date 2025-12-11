# Database Lifecycle & Update Process

## 📋 Table of Contents
1. [Overview](#overview)
2. [Database Lifecycle](#database-lifecycle)
3. [Schema Management Strategy](#schema-management-strategy)
4. [How Schema Updates Work](#how-schema-updates-work)
5. [Making Database Changes](#making-database-changes)
6. [Database Initialization](#database-initialization)
7. [Best Practices](#best-practices)
8. [Future Migration Strategy](#future-migration-strategy)

---

## 1. Overview

### Current Setup
- **Database**: PostgreSQL 15 (Alpine)
- **ORM**: Hibernate/JPA (Spring Data JPA)
- **Schema Management**: **Code-First** approach using `ddl-auto=update`
- **Connection Pool**: HikariCP
- **Primary Keys**: UUID (not auto-increment)

### Key Concept: Code-First vs Database-First

**Code-First (Current Approach)**:
- ✅ Define entities in Java code
- ✅ Hibernate automatically creates/updates database schema
- ✅ Schema is generated from code

**Database-First (Alternative)**:
- Define schema in SQL scripts
- Generate Java entities from database
- More control, but more manual work

---

## 2. Database Lifecycle

### 2.1 Database Creation Flow

```
1. Docker Compose Starts
   ↓
2. PostgreSQL Container Created
   ↓
3. Database Created (from DB_NAME env var)
   ↓
4. Initialization Scripts Run (if any in db/init/)
   ↓
5. Backend Starts
   ↓
6. Hibernate Analyzes Entity Classes
   ↓
7. Hibernate Compares with Existing Schema
   ↓
8. Schema Created/Updated Automatically
   ↓
9. Application Ready
```

### 2.2 Lifecycle Stages

#### Stage 1: First Time Setup
```bash
# 1. Create .env file with credentials
cd db
cp .env.example .env
# Edit .env with your credentials

# 2. Start database
docker-compose -f deployment/docker-compose.yml up -d postgres

# 3. Database is empty at this point
```

#### Stage 2: First Application Start
```bash
# 1. Start backend
docker-compose -f deployment/docker-compose.yml up -d backend

# 2. Hibernate detects NO schema exists
# 3. Hibernate creates ALL tables based on @Entity classes
# 4. Tables created: location, employee, department, project, task, employee_project, users
```

#### Stage 3: Subsequent Starts
```bash
# 1. Backend starts
# 2. Hibernate detects schema EXISTS
# 3. Hibernate compares code entities with database schema
# 4. If differences found:
#    - Adds new columns (if new fields in entity)
#    - Adds new tables (if new entities)
#    - Does NOT drop columns/tables (preserves data)
# 5. Application ready
```

#### Stage 4: Schema Updates
```bash
# When you modify an @Entity class:
# 1. Add new field → Hibernate adds new column
# 2. Remove field → Hibernate keeps column (data preserved)
# 3. Change field type → Hibernate may fail (manual migration needed)
# 4. Add new entity → Hibernate creates new table
```

---

## 3. Schema Management Strategy

### 3.1 Current Strategy: `ddl-auto=update`

**Configuration** (`application.properties`):
```properties
spring.jpa.hibernate.ddl-auto=update
```

**What It Does**:
- ✅ Creates tables if they don't exist
- ✅ Adds new columns if new fields added to entities
- ✅ Creates new tables for new entities
- ✅ Preserves existing data
- ❌ Does NOT drop columns (even if removed from entity)
- ❌ Does NOT drop tables (even if entity deleted)
- ❌ Does NOT rename columns
- ❌ Does NOT change column types (may fail)

### 3.2 Other `ddl-auto` Options

| Option | Description | Use Case |
|--------|-------------|----------|
| `none` | No schema changes | Production (use migrations) |
| `validate` | Only validates schema matches code | Production (strict) |
| `update` | Updates schema (current) | Development |
| `create` | Drops and recreates schema | Testing (data loss!) |
| `create-drop` | Creates on start, drops on stop | Testing only |

---

## 4. How Schema Updates Work

### 4.1 Automatic Updates (What Hibernate Does)

#### ✅ Scenario 1: Add New Field
```java
// Before
@Entity
public class Employee {
    private String firstName;
    private String lastName;
}

// After - Add new field
@Entity
public class Employee {
    private String firstName;
    private String lastName;
    private String middleName;  // NEW FIELD
}
```

**What Happens**:
1. Hibernate detects new field `middleName`
2. Automatically adds column `middle_name` to `employee` table
3. Existing rows get `NULL` for new column
4. ✅ **Works automatically!**

#### ✅ Scenario 2: Add New Entity
```java
// New entity class
@Entity
public class Notification {
    @Id
    private UUID id;
    private String message;
}
```

**What Happens**:
1. Hibernate detects new `@Entity` class
2. Automatically creates `notification` table
3. ✅ **Works automatically!**

#### ❌ Scenario 3: Remove Field
```java
// Before
@Entity
public class Employee {
    private String firstName;
    private String phone;  // OLD FIELD
}

// After - Remove field
@Entity
public class Employee {
    private String firstName;
    // phone removed
}
```

**What Happens**:
1. Hibernate detects field removed
2. **Does NOT drop column** (data preserved)
3. Column `phone` remains in database
4. ⚠️ **Manual cleanup needed if you want to remove column**

#### ❌ Scenario 4: Change Field Type
```java
// Before
private Integer experienceYears;

// After
private String experienceYears;  // Changed from Integer to String
```

**What Happens**:
1. Hibernate tries to change column type
2. **May fail** if data exists and incompatible
3. ⚠️ **Manual migration needed**

#### ❌ Scenario 5: Rename Field
```java
// Before
private String firstName;

// After
private String givenName;  // Renamed
```

**What Happens**:
1. Hibernate sees `firstName` removed, `givenName` added
2. Creates new column `given_name`
3. Old column `first_name` remains
4. ⚠️ **Manual migration needed to copy data and drop old column**

---

## 5. Making Database Changes

### 5.1 Safe Changes (Automatic)

These changes work automatically with `ddl-auto=update`:

✅ **Adding new fields**
```java
@Entity
public class Employee {
    // Existing fields...
    private String emergencyContact;  // NEW - Safe to add
}
```

✅ **Adding new entities**
```java
@Entity
public class AuditLog {  // NEW - Safe to add
    @Id
    private UUID id;
    // ...
}
```

✅ **Adding new relationships**
```java
@Entity
public class Employee {
    @ManyToOne
    private Department department;  // NEW relationship - Safe
}
```

### 5.2 Risky Changes (Manual Migration Needed)

These changes require manual SQL or migration tools:

⚠️ **Removing fields**
```java
// Remove field from entity
// Then manually drop column:
// ALTER TABLE employee DROP COLUMN phone;
```

⚠️ **Changing field types**
```java
// Change type in entity
// Then manually migrate data:
// ALTER TABLE employee ALTER COLUMN experience_years TYPE VARCHAR(50);
// UPDATE employee SET experience_years = experience_years::text;
```

⚠️ **Renaming fields**
```java
// Rename in entity
// Then manually:
// ALTER TABLE employee RENAME COLUMN first_name TO given_name;
```

⚠️ **Removing entities**
```java
// Delete entity class
// Then manually drop table:
// DROP TABLE notification;
```

### 5.3 Step-by-Step: Making a Schema Change

#### Example: Add a new field to Employee

**Step 1: Update Entity Class**
```java
@Entity
public class Employee {
    // ... existing fields ...
    
    @Column
    private String emergencyContact;  // NEW FIELD
    private String emergencyPhone;    // NEW FIELD
}
```

**Step 2: Restart Backend**
```bash
docker-compose -f deployment/docker-compose.yml restart backend
```

**Step 3: Verify**
```bash
# Connect to database
docker exec -it ems-postgres psql -U postgres -d ems_db

# Check if columns were added
\d employee

# You should see:
# emergency_contact | character varying(255)
# emergency_phone    | character varying(255)
```

**Step 4: Update Service Layer (if needed)**
```java
// Update DTOs, services, controllers to handle new fields
```

---

## 6. Database Initialization

### 6.1 Initialization Scripts

**Location**: `db/init/`

**How It Works**:
- PostgreSQL container runs scripts in `db/init/` on first startup
- Scripts run in alphabetical order
- Only runs if database is empty (first time)

**Example Script**: `db/init/01-seed-data.sql`
```sql
-- This runs only on first database creation
INSERT INTO location (id, name, city, state, country) VALUES
    (gen_random_uuid(), 'New York Office', 'New York', 'NY', 'USA'),
    (gen_random_uuid(), 'San Francisco Office', 'San Francisco', 'CA', 'USA');
```

### 6.2 Current Setup

```yaml
# docker-compose.yml
volumes:
  - ../db/init:/docker-entrypoint-initdb.d
```

**Note**: Scripts in `db/init/` only run on **first database creation**. If database already exists, they won't run again.

---

## 7. Best Practices

### 7.1 Development

✅ **DO**:
- Use `ddl-auto=update` for rapid development
- Add new fields frequently (safe)
- Test schema changes locally first
- Keep entity classes in sync with database

❌ **DON'T**:
- Don't remove fields without planning migration
- Don't change field types without data migration
- Don't rename fields without migration script
- Don't use `create` or `create-drop` in production

### 7.2 Production Considerations

⚠️ **Current Limitation**:
- `ddl-auto=update` is **NOT recommended for production**
- No rollback capability
- No version control of schema changes
- No audit trail

✅ **Future Solution**:
- Migrate to **Flyway** or **Liquibase**
- Version-controlled migration scripts
- Rollback support
- Production-safe

### 7.3 Data Safety

**What Hibernate Preserves**:
- ✅ Existing data when adding columns
- ✅ Existing data when adding tables
- ✅ Existing data when removing fields (column stays)

**What You Must Handle**:
- ⚠️ Data migration for type changes
- ⚠️ Data migration for renames
- ⚠️ Data cleanup for removed fields

---

## 8. Future Migration Strategy

### 8.1 Recommended: Flyway Migration

**Why Flyway**:
- ✅ Version-controlled migrations
- ✅ Rollback support
- ✅ Production-safe
- ✅ Team collaboration
- ✅ Migration history tracking

**How It Works**:
```
db/migration/
  ├── V1__Initial_schema.sql
  ├── V2__Add_emergency_contact.sql
  ├── V3__Add_notification_table.sql
  └── V4__Rename_first_name_to_given_name.sql
```

**Migration Process**:
1. Create migration script
2. Flyway checks version
3. Applies only new migrations
4. Tracks applied migrations in `flyway_schema_history` table

### 8.2 Migration Path

**Phase 1 (Current)**: Code-First
- `ddl-auto=update`
- Rapid development
- Good for early stages

**Phase 2 (Future)**: Hybrid
- Keep `ddl-auto=update` for development
- Add Flyway for production
- Generate migrations from entity changes

**Phase 3 (Mature)**: Migration-First
- `ddl-auto=validate` (strict)
- All changes via Flyway migrations
- Production-ready

---

## 9. Quick Reference

### 9.1 Common Tasks

**Add New Field**:
```java
// 1. Add to entity
private String newField;

// 2. Restart backend
docker-compose restart backend

// 3. Done! Column added automatically
```

**Add New Table**:
```java
// 1. Create new @Entity class
@Entity
public class NewEntity { ... }

// 2. Restart backend
docker-compose restart backend

// 3. Done! Table created automatically
```

**Remove Field** (Manual):
```java
// 1. Remove from entity
// 2. Connect to database
docker exec -it ems-postgres psql -U postgres -d ems_db

// 3. Drop column
ALTER TABLE employee DROP COLUMN old_field;
```

**View Current Schema**:
```bash
# Connect to database
docker exec -it ems-postgres psql -U postgres -d ems_db

# List all tables
\dt

# Describe table
\d employee

# View all columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employee';
```

### 9.2 Troubleshooting

**Problem**: Schema not updating
- **Solution**: Check Hibernate logs, ensure `ddl-auto=update` is set

**Problem**: Column type change failed
- **Solution**: Manual migration needed, backup data first

**Problem**: Data lost after restart
- **Solution**: Check if using `create` or `create-drop` (should be `update`)

**Problem**: Can't connect to database
- **Solution**: Check `.env` file, ensure PostgreSQL container is running

---

## 10. Summary

### Current State
- ✅ **Code-First**: Entities define schema
- ✅ **Automatic Updates**: Hibernate handles most changes
- ✅ **Data Preservation**: Existing data is safe
- ⚠️ **Limited Control**: Some changes need manual migration

### Key Takeaways
1. **Schema = Code**: Your Java entities ARE your database schema
2. **Safe Changes**: Adding fields/tables is automatic
3. **Risky Changes**: Removing/renaming needs manual work
4. **Future**: Migrate to Flyway for production

### Next Steps
1. Continue using `ddl-auto=update` for development
2. Plan migration to Flyway for production
3. Document all manual schema changes
4. Consider migration scripts for complex changes

---

**Last Updated**: 2024-12-10  
**Status**: Active Development (Code-First)

