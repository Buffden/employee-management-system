# Database Design

## 1. Overview

The Employee Management System uses **PostgreSQL 15** as the primary database. The database follows a normalized relational design with proper indexing, foreign key constraints, and referential integrity.

### 1.1 Database Technology
- **Database**: PostgreSQL 15 (Alpine variant in Docker)
- **ORM**: Hibernate/JPA (Spring Data JPA)
- **Connection Pool**: HikariCP
- **Schema Management**: Hibernate `ddl-auto=update` (code-first approach)

### 1.2 Design Principles
- **Normalization**: 3NF (Third Normal Form) with strategic denormalization for performance
- **Referential Integrity**: Enforced via foreign key constraints
- **Indexing**: Strategic indexes on foreign keys, unique fields, and frequently queried columns
- **UUID Primary Keys**: All entities use UUID for distributed system compatibility
- **Audit Fields**: Created/updated timestamps where applicable

---

## 2. Entity Relationship Diagram

See: `docs/diagrams/architecture/database-er-diagram.puml`

The ER diagram shows all entities and their relationships:
- **7 Core Entities**: Location, Employee, Department, Project, Task, EmployeeProject, User
- **Relationships**: One-to-Many, Many-to-One, Many-to-Many (via EmployeeProject)
- **Authentication**: User entity for RBAC and JWT authentication

---

## 3. Complete Table Schemas

### 3.1 Location Table

**Purpose**: Stores physical office locations where employees work.

```sql
CREATE TABLE location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    address VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    postal_code VARCHAR(20),
    CONSTRAINT location_name_unique UNIQUE (name)
);

CREATE INDEX idx_location_name ON location(name);
CREATE INDEX idx_location_city ON location(city);
CREATE INDEX idx_location_state ON location(state);
```

**Columns**:
- `id` (UUID, PK): Primary key
- `name` (VARCHAR(100), UNIQUE, NOT NULL): Location name (e.g., "New York Office")
- `address` (VARCHAR(255), NULLABLE): Street address
- `city` (VARCHAR(100), NOT NULL): City name
- `state` (VARCHAR(100), NOT NULL): State/Province
- `country` (VARCHAR(100), NOT NULL, DEFAULT 'USA'): Country code
- `postal_code` (VARCHAR(20), NULLABLE): ZIP/Postal code

**Indexes**:
- Primary key index (automatic)
- Unique index on `name`
- Index on `city` (for location-based queries)
- Index on `state` (for location-based queries)

---

### 3.2 Employee Table

**Purpose**: Stores employee information including personal details, employment data, and relationships.

```sql
CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(255),
    designation VARCHAR(100) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
    joining_date DATE NOT NULL,
    performance_rating DECIMAL(3, 2),
    work_location VARCHAR(100) NOT NULL,
    experience_years INTEGER,
    department_id UUID NOT NULL,
    location_id UUID NOT NULL,
    manager_id UUID,
    CONSTRAINT employee_email_unique UNIQUE (email),
    CONSTRAINT fk_employee_department FOREIGN KEY (department_id) 
        REFERENCES department(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employee_location FOREIGN KEY (location_id) 
        REFERENCES location(id) ON DELETE RESTRICT,
    CONSTRAINT fk_employee_manager FOREIGN KEY (manager_id) 
        REFERENCES employee(id) ON DELETE SET NULL,
    CONSTRAINT chk_salary_positive CHECK (salary >= 0),
    CONSTRAINT chk_performance_rating CHECK (
        performance_rating IS NULL OR 
        (performance_rating >= 0 AND performance_rating <= 5.0)
    )
);

CREATE INDEX idx_employee_email ON employee(email);
CREATE INDEX idx_employee_department_id ON employee(department_id);
CREATE INDEX idx_employee_location_id ON employee(location_id);
CREATE INDEX idx_employee_manager_id ON employee(manager_id);
CREATE INDEX idx_employee_designation ON employee(designation);
CREATE INDEX idx_employee_joining_date ON employee(joining_date);
CREATE INDEX idx_employee_name ON employee(last_name, first_name);
```

**Columns**:
- `id` (UUID, PK): Primary key
- `first_name` (VARCHAR(100), NOT NULL): Employee first name
- `last_name` (VARCHAR(100), NOT NULL): Employee last name
- `email` (VARCHAR(255), UNIQUE, NOT NULL): Email address (unique)
- `phone` (VARCHAR(20), NULLABLE): Phone number
- `address` (VARCHAR(255), NULLABLE): Residential address
- `designation` (VARCHAR(100), NOT NULL): Job title/role
- `salary` (DECIMAL(10,2), NOT NULL, DEFAULT 0.0): Annual salary
- `joining_date` (DATE, NOT NULL): Employment start date
- `performance_rating` (DECIMAL(3,2), NULLABLE): Performance rating (0.0-5.0)
- `work_location` (VARCHAR(100), NOT NULL): Work location name (denormalized)
- `experience_years` (INTEGER, NULLABLE): Years of experience
- `department_id` (UUID, FK, NOT NULL): Reference to department
- `location_id` (UUID, FK, NOT NULL): Reference to location
- `manager_id` (UUID, FK, NULLABLE): Self-referential FK to manager

**Constraints**:
- Email must be unique
- Salary must be >= 0
- Performance rating must be between 0.0 and 5.0 (if provided)
- Manager must exist (if provided)
- Department and location are required

**Indexes**:
- Primary key index (automatic)
- Unique index on `email`
- Index on `department_id` (for department queries)
- Index on `location_id` (for location queries)
- Index on `manager_id` (for manager hierarchy queries)
- Index on `designation` (for filtering by role)
- Index on `joining_date` (for date range queries)
- Composite index on `last_name, first_name` (for name searches)

---

### 3.3 Department Table

**Purpose**: Stores department information including budget, performance metrics, and relationships.

```sql
CREATE TABLE department (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    budget DECIMAL(15, 2) DEFAULT 0.0,
    budget_utilization DECIMAL(5, 2),
    performance_metric DECIMAL(5, 2),
    created_at DATE NOT NULL,
    location_name VARCHAR(100),
    location_id UUID,
    department_head_id UUID,
    total_employees INTEGER,
    CONSTRAINT department_name_unique UNIQUE (name),
    CONSTRAINT fk_department_location FOREIGN KEY (location_id) 
        REFERENCES location(id) ON DELETE SET NULL,
    CONSTRAINT fk_department_head FOREIGN KEY (department_head_id) 
        REFERENCES employee(id) ON DELETE SET NULL,
    CONSTRAINT chk_budget_positive CHECK (budget >= 0),
    CONSTRAINT chk_budget_utilization CHECK (
        budget_utilization IS NULL OR 
        (budget_utilization >= 0 AND budget_utilization <= 1.0)
    ),
    CONSTRAINT chk_performance_metric CHECK (
        performance_metric IS NULL OR 
        (performance_metric >= 0 AND performance_metric <= 100)
    )
);

CREATE INDEX idx_department_name ON department(name);
CREATE INDEX idx_department_location_id ON department(location_id);
CREATE INDEX idx_department_head_id ON department(department_head_id);
CREATE INDEX idx_department_created_at ON department(created_at);
```

**Columns**:
- `id` (UUID, PK): Primary key
- `name` (VARCHAR(100), UNIQUE, NOT NULL): Department name
- `description` (TEXT, NULLABLE): Department description
- `budget` (DECIMAL(15,2), DEFAULT 0.0): Annual budget
- `budget_utilization` (DECIMAL(5,2), NULLABLE): Budget utilization (0.0-1.0)
- `performance_metric` (DECIMAL(5,2), NULLABLE): Performance score (0-100)
- `created_at` (DATE, NOT NULL): Department creation date
- `location_name` (VARCHAR(100), NULLABLE): Denormalized location name
- `location_id` (UUID, FK, NULLABLE): Reference to location
- `department_head_id` (UUID, FK, NULLABLE): Reference to department head (employee)
- `total_employees` (INTEGER, NULLABLE): Denormalized employee count

**Constraints**:
- Department name must be unique
- Budget must be >= 0
- Budget utilization must be between 0.0 and 1.0 (if provided)
- Performance metric must be between 0 and 100 (if provided)

**Indexes**:
- Primary key index (automatic)
- Unique index on `name`
- Index on `location_id` (for location-based queries)
- Index on `department_head_id` (for head queries)
- Index on `created_at` (for date range queries)

**Denormalization**:
- `location_name`: Denormalized for faster display (must be kept in sync with location.name)
- `total_employees`: Denormalized for dashboard queries (can be calculated via COUNT)

---

### 3.4 Project Table

**Purpose**: Stores project information including status, budget, and relationships.

```sql
CREATE TABLE project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) NOT NULL,
    budget DECIMAL(15, 2) DEFAULT 0.0,
    department_id UUID NOT NULL,
    project_manager_id UUID NOT NULL,
    CONSTRAINT project_name_unique UNIQUE (name),
    CONSTRAINT fk_project_department FOREIGN KEY (department_id) 
        REFERENCES department(id) ON DELETE RESTRICT,
    CONSTRAINT fk_project_manager FOREIGN KEY (project_manager_id) 
        REFERENCES employee(id) ON DELETE RESTRICT,
    CONSTRAINT chk_project_budget_positive CHECK (budget >= 0),
    CONSTRAINT chk_project_dates CHECK (
        end_date IS NULL OR end_date >= start_date
    ),
    CONSTRAINT chk_project_status CHECK (
        status IN ('Planning', 'Active', 'On Hold', 'Completed', 'Cancelled')
    )
);

CREATE INDEX idx_project_name ON project(name);
CREATE INDEX idx_project_department_id ON project(department_id);
CREATE INDEX idx_project_manager_id ON project(project_manager_id);
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_project_start_date ON project(start_date);
CREATE INDEX idx_project_end_date ON project(end_date);
```

**Columns**:
- `id` (UUID, PK): Primary key
- `name` (VARCHAR(100), UNIQUE, NOT NULL): Project name
- `description` (TEXT, NULLABLE): Project description
- `start_date` (DATE, NOT NULL): Project start date
- `end_date` (DATE, NULLABLE): Project end date
- `status` (VARCHAR(50), NOT NULL): Project status (Planning, Active, On Hold, Completed, Cancelled)
- `budget` (DECIMAL(15,2), DEFAULT 0.0): Project budget
- `department_id` (UUID, FK, NOT NULL): Reference to department
- `project_manager_id` (UUID, FK, NOT NULL): Reference to project manager (employee)

**Constraints**:
- Project name must be unique
- Budget must be >= 0
- End date must be >= start date (if provided)
- Status must be one of the valid values

**Indexes**:
- Primary key index (automatic)
- Unique index on `name`
- Index on `department_id` (for department queries)
- Index on `project_manager_id` (for manager queries)
- Index on `status` (for status filtering)
- Index on `start_date` (for date range queries)
- Index on `end_date` (for date range queries)

---

### 3.5 Task Table

**Purpose**: Stores task information including status, priority, and assignments.

```sql
CREATE TABLE task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE,
    completed_date DATE,
    project_id UUID NOT NULL,
    assigned_to_id UUID,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) 
        REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assigned_to FOREIGN KEY (assigned_to_id) 
        REFERENCES employee(id) ON DELETE SET NULL,
    CONSTRAINT chk_task_dates CHECK (
        (due_date IS NULL OR due_date >= start_date) AND
        (completed_date IS NULL OR completed_date >= start_date)
    ),
    CONSTRAINT chk_task_status CHECK (
        status IN ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled')
    ),
    CONSTRAINT chk_task_priority CHECK (
        priority IN ('Low', 'Medium', 'High', 'Critical')
    )
);

CREATE INDEX idx_task_project_id ON task(project_id);
CREATE INDEX idx_task_assigned_to_id ON task(assigned_to_id);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_priority ON task(priority);
CREATE INDEX idx_task_due_date ON task(due_date);
CREATE INDEX idx_task_start_date ON task(start_date);
```

**Columns**:
- `id` (UUID, PK): Primary key
- `name` (VARCHAR(200), NOT NULL): Task name
- `description` (TEXT, NULLABLE): Task description
- `status` (VARCHAR(50), NOT NULL): Task status (Not Started, In Progress, On Hold, Completed, Cancelled)
- `priority` (VARCHAR(50), NOT NULL): Task priority (Low, Medium, High, Critical)
- `start_date` (DATE, NOT NULL): Task start date
- `due_date` (DATE, NULLABLE): Task due date
- `completed_date` (DATE, NULLABLE): Task completion date
- `project_id` (UUID, FK, NOT NULL): Reference to project
- `assigned_to_id` (UUID, FK, NULLABLE): Reference to assigned employee

**Constraints**:
- Due date must be >= start date (if provided)
- Completed date must be >= start date (if provided)
- Status must be one of the valid values
- Priority must be one of the valid values
- Cascade delete: If project is deleted, all tasks are deleted

**Indexes**:
- Primary key index (automatic)
- Index on `project_id` (for project queries)
- Index on `assigned_to_id` (for employee task queries)
- Index on `status` (for status filtering)
- Index on `priority` (for priority filtering)
- Index on `due_date` (for overdue task queries)
- Index on `start_date` (for date range queries)

---

### 3.6 EmployeeProject Table (Many-to-Many)

**Purpose**: Junction table for the many-to-many relationship between employees and projects.

```sql
CREATE TABLE employee_project (
    employee_id UUID NOT NULL,
    project_id UUID NOT NULL,
    role VARCHAR(100),
    assigned_date DATE,
    CONSTRAINT pk_employee_project PRIMARY KEY (employee_id, project_id),
    CONSTRAINT fk_employee_project_employee FOREIGN KEY (employee_id) 
        REFERENCES employee(id) ON DELETE CASCADE,
    CONSTRAINT fk_employee_project_project FOREIGN KEY (project_id) 
        REFERENCES project(id) ON DELETE CASCADE
);

CREATE INDEX idx_employee_project_employee_id ON employee_project(employee_id);
CREATE INDEX idx_employee_project_project_id ON employee_project(project_id);
CREATE INDEX idx_employee_project_role ON employee_project(role);
```

**Columns**:
- `employee_id` (UUID, PK, FK, NOT NULL): Reference to employee
- `project_id` (UUID, PK, FK, NOT NULL): Reference to project
- `role` (VARCHAR(100), NULLABLE): Employee's role in the project
- `assigned_date` (DATE, NULLABLE): Date when employee was assigned to project

**Constraints**:
- Composite primary key: (`employee_id`, `project_id`)
- Cascade delete: If employee or project is deleted, relationship is deleted

**Indexes**:
- Composite primary key index (automatic)
- Index on `employee_id` (for employee project queries)
- Index on `project_id` (for project employee queries)
- Index on `role` (for role-based queries)

---

### 3.7 User Table (Authentication & Authorization)

**Purpose**: Stores user accounts for authentication and role-based access control.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- BCrypt hashed
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE
    employee_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) 
        REFERENCES employee(id) ON DELETE SET NULL,
    CONSTRAINT chk_user_role CHECK (
        role IN ('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')
    )
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_employee_id ON users(employee_id);
```

**Columns**:
- `id` (UUID, PK): Primary key
- `username` (VARCHAR(100), UNIQUE, NOT NULL): Username for login
- `password` (VARCHAR(255), NOT NULL): BCrypt hashed password
- `email` (VARCHAR(255), NULLABLE): Email address
- `role` (VARCHAR(50), NOT NULL): User role (SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
- `employee_id` (UUID, FK, NULLABLE): Optional link to employee record
- `created_at` (TIMESTAMP, NOT NULL): Account creation timestamp
- `last_login` (TIMESTAMP, NULLABLE): Last login timestamp

**Constraints**:
- Username must be unique
- Role must be one of the valid values (enforced by CHECK constraint)
- Employee link is optional (for SYSTEM_ADMIN and HR_MANAGER who may not be employees)

**Indexes**:
- Primary key index (automatic)
- Unique index on `username` (for login lookups)
- Index on `email` (for email-based lookups)
- Index on `role` (for role-based queries and filtering)
- Index on `employee_id` (for employee-user relationship queries)

**Relationships**:
- `@ManyToOne` → Employee (optional, links user to employee record)
- Used for Department Manager and Employee roles to determine department scope

**RBAC Usage**:
- Role stored in `role` column and included in JWT token claims
- Department Manager scope: Determined by `user.employee.department`
- Employee scope: Determined by `user.employee.id`
- System Admin and HR Manager: May not have linked employee records

**Note**: See `docs/security/roles-and-permissions.md` for detailed role definitions and permissions.

---

## 4. Foreign Key Relationships

### 4.1 Relationship Summary

| Parent Table | Child Table | Relationship | On Delete |
|--------------|-------------|--------------|-----------|
| `location` | `employee` | One-to-Many | RESTRICT |
| `location` | `department` | One-to-Many | SET NULL |
| `department` | `employee` | One-to-Many | RESTRICT |
| `department` | `project` | One-to-Many | RESTRICT |
| `employee` | `employee` | Self-Referential (Manager) | SET NULL |
| `employee` | `department` | One-to-One (Head) | SET NULL |
| `employee` | `project` | One-to-Many (Manager) | RESTRICT |
| `employee` | `task` | One-to-Many (Assigned) | SET NULL |
| `project` | `task` | One-to-Many | CASCADE |
| `project` | `employee_project` | One-to-Many | CASCADE |
| `employee` | `employee_project` | One-to-Many | CASCADE |
| `employee` | `users` | One-to-Many (optional) | SET NULL |

### 4.2 Delete Strategies

- **RESTRICT**: Prevents deletion if child records exist (e.g., cannot delete department with employees)
- **SET NULL**: Sets foreign key to NULL if parent is deleted (e.g., manager deletion sets manager_id to NULL)
- **CASCADE**: Deletes child records when parent is deleted (e.g., deleting project deletes all tasks)

---

## 5. Indexing Strategy

### 5.1 Primary Indexes
All tables have automatic primary key indexes on `id` (UUID).

### 5.2 Unique Indexes
- `location.name` - Ensures unique location names
- `employee.email` - Ensures unique email addresses
- `department.name` - Ensures unique department names
- `project.name` - Ensures unique project names
- `users.username` - Ensures unique usernames for authentication

### 5.3 Foreign Key Indexes
All foreign key columns are indexed for:
- **Join Performance**: Faster joins between related tables
- **Cascade Operations**: Efficient cascade delete/update operations
- **Referential Integrity Checks**: Faster constraint validation

### 5.4 Query Optimization Indexes
- **Filtering**: Indexes on frequently filtered columns (status, priority, designation, role)
- **Sorting**: Indexes on frequently sorted columns (joining_date, start_date, due_date, created_at)
- **Search**: Composite indexes for name searches (last_name, first_name)
- **Authentication**: Indexes on `users.username` and `users.role` for login and authorization queries

### 5.5 Index Maintenance
- **Automatic Updates**: PostgreSQL automatically maintains indexes on INSERT/UPDATE/DELETE
- **Query Planner**: PostgreSQL query planner automatically uses indexes when beneficial
- **Monitoring**: Use `EXPLAIN ANALYZE` to verify index usage

---

## 6. Data Normalization

### 6.1 Normalization Level
The database follows **Third Normal Form (3NF)** with strategic denormalization:

**Normalized**:
- All entities in separate tables
- No transitive dependencies
- Foreign keys for relationships
- No redundant data storage

**Denormalized (Strategic)**:
- `department.location_name` - Denormalized for faster display (must sync with location.name)
- `department.total_employees` - Denormalized for dashboard queries (can be calculated)
- `employee.work_location` - Denormalized location name for quick access

### 6.2 Denormalization Rationale
- **Performance**: Reduces JOIN operations for common queries
- **Dashboard Queries**: Faster aggregation queries for metrics
- **Display Optimization**: Reduces data fetching for UI display

### 6.3 Data Consistency
- **Application-Level**: Service layer must maintain denormalized fields
- **Triggers (Future)**: Consider database triggers for automatic synchronization
- **Validation**: Business logic ensures consistency

---

## 7. Migration Strategy

### 7.1 Current Approach: Code-First (Hibernate)

**Configuration**: `spring.jpa.hibernate.ddl-auto=update`

**How It Works**:
1. Hibernate analyzes JPA entity classes
2. Compares with existing database schema
3. Automatically creates/updates tables, columns, indexes
4. Preserves existing data

**Advantages**:
- **Rapid Development**: No manual SQL scripts
- **Automatic Sync**: Schema always matches code
- **Type Safety**: Java types map to SQL types automatically

**Disadvantages**:
- **Limited Control**: Less control over migration process
- **Production Risk**: Not recommended for production
- **No Versioning**: No migration history/rollback

### 7.2 Recommended Future Approach: Flyway/Liquibase

For production environments, migrate to **Flyway** or **Liquibase**:

**Benefits**:
- **Version Control**: Migration scripts in version control
- **Rollback Support**: Can rollback to previous versions
- **Production Safe**: Controlled, tested migrations
- **Team Collaboration**: Shared migration scripts

**Migration Scripts Location**:
```
backend/src/main/resources/db/migration/
├── V1__Initial_schema.sql
├── V2__Add_indexes.sql
├── V3__Add_constraints.sql
└── ...
```

### 7.3 Migration Best Practices

1. **Always Backup**: Backup database before migrations
2. **Test First**: Test migrations on staging environment
3. **Version Control**: All migration scripts in Git
4. **Documentation**: Document breaking changes
5. **Rollback Plan**: Have rollback scripts ready

---

## 8. Query Optimization

### 8.1 Query Performance Targets
- **Simple Queries**: < 50ms (p95)
- **Complex Joins**: < 200ms (p95)
- **Aggregations**: < 500ms (p95)
- **Dashboard Queries**: < 1s (p95)

### 8.2 Optimization Techniques

#### 8.2.1 Index Usage
- **Verify Index Usage**: Use `EXPLAIN ANALYZE` to verify indexes are used
- **Avoid Full Table Scans**: Ensure WHERE clauses use indexed columns
- **Composite Indexes**: Use for multi-column WHERE clauses

#### 8.2.2 Query Patterns

**Employee Queries**:
```sql
-- Optimized: Uses indexes on department_id, designation
SELECT * FROM employee 
WHERE department_id = ? AND designation = ? 
ORDER BY joining_date DESC;

-- Optimized: Uses index on email
SELECT * FROM employee WHERE email = ?;
```

**Department Metrics**:
```sql
-- Optimized: Uses index on department_id
SELECT d.*, COUNT(e.id) as total_employees
FROM department d
LEFT JOIN employee e ON e.department_id = d.id
GROUP BY d.id;
```

**Project Tasks**:
```sql
-- Optimized: Uses indexes on project_id, status
SELECT * FROM task 
WHERE project_id = ? AND status = 'In Progress'
ORDER BY priority DESC, due_date ASC;
```

#### 8.2.3 Pagination
- **Use LIMIT/OFFSET**: For paginated queries
- **Cursor-Based Pagination**: For large datasets (future enhancement)
- **Index on Sort Columns**: Ensure ORDER BY columns are indexed

#### 8.2.4 Connection Pooling
- **HikariCP Configuration**:
  - Maximum pool size: 10
  - Minimum idle: 2
  - Connection timeout: 30s
  - Max lifetime: 30 minutes

---

## 9. Data Types and Constraints

### 9.1 UUID Primary Keys
- **Type**: UUID (PostgreSQL `uuid` type)
- **Generation**: `gen_random_uuid()` (PostgreSQL function)
- **Advantages**: 
  - Globally unique
  - No sequential gaps
  - Distributed system friendly
  - Security (non-guessable)

### 9.2 Decimal Precision
- **Salary**: `DECIMAL(10,2)` - Up to 99,999,999.99
- **Budget**: `DECIMAL(15,2)` - Up to 999,999,999,999,999.99
- **Ratings**: `DECIMAL(3,2)` - 0.00 to 5.00
- **Percentages**: `DECIMAL(5,2)` - 0.00 to 999.99

### 9.3 Date Handling
- **Type**: DATE (PostgreSQL date type)
- **Time Zone**: Application handles timezone (UTC recommended)
- **Validation**: Application-level validation for date ranges

### 9.4 Text Fields
- **Short Text**: VARCHAR with appropriate length limits
- **Long Text**: TEXT type for descriptions
- **Constraints**: Max length enforced at application level

---

## 10. Security Considerations

### 10.1 Credential Management
- **Environment Variables**: All database credentials in `.env` files
- **No Hardcoding**: No credentials in code or configuration files
- **Git Ignore**: `.env` files excluded from version control

### 10.2 SQL Injection Prevention
- **Parameterized Queries**: JPA/Hibernate uses parameterized queries
- **No Raw SQL**: Avoid raw SQL queries where possible
- **Input Validation**: Validate all user inputs

### 10.3 Access Control
- **Database User**: Dedicated user with minimal privileges
- **Connection Pooling**: Limited connection pool size
- **Network Security**: Database only accessible from backend container

---

## 11. Backup and Recovery

### 11.1 Backup Strategy
- **Automated Backups**: Daily automated backups (production)
- **Backup Location**: Secure, off-site storage
- **Retention**: 30 days of backups

### 11.2 Recovery Procedures
- **Point-in-Time Recovery**: PostgreSQL WAL (Write-Ahead Logging)
- **Test Restores**: Regularly test backup restoration
- **Documentation**: Document recovery procedures

---

## 12. Future Enhancements

### 12.1 Audit Tables
**Future**: Add audit tables for tracking changes:
- `employee_audit` - Track employee changes
- `department_audit` - Track department changes
- `project_audit` - Track project changes

### 12.2 Soft Deletes
**Future**: Add `deleted_at` timestamp for soft deletes instead of hard deletes.

### 12.3 Full-Text Search
**Future**: Add PostgreSQL full-text search indexes for:
- Employee name search
- Project description search
- Task description search

---

## 13. Database Maintenance

### 13.1 Regular Maintenance
- **VACUUM**: Regular VACUUM for reclaiming space
- **ANALYZE**: Regular ANALYZE for query planner statistics
- **REINDEX**: Periodic reindexing for index optimization

### 13.2 Monitoring
- **Query Performance**: Monitor slow queries
- **Index Usage**: Monitor index effectiveness
- **Connection Pool**: Monitor connection pool usage
- **Disk Space**: Monitor database size

---

## 14. References

- **ER Diagram**: `docs/diagrams/architecture/database-er-diagram.puml`
- **Entity Classes**: `backend/src/main/java/com/ems/employee_management_system/models/`
- **Application Properties**: `backend/src/main/resources/application.properties`
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

**Status**: Complete  
**Last Updated**: 2024-12-10  
**Version**: 1.0
