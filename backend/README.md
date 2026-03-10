# 🧩 Employee Management System API (Backend - Spring Boot)

### ⚙️ Tech Stack
- **Spring Boot 3.4.0**
- **Java 17**
- **PostgreSQL** (Local Docker)
- **Hibernate JPA**
- **Maven**

---

A RESTful API backend for the Employee Management System, built with Spring Boot 3.4.0, featuring JWT authentication, multi-layer rate limiting, and comprehensive security.

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Security & Rate Limiting](#-security--rate-limiting)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

## ⚙️ Tech Stack


#### 1️⃣ Prerequisites
- **PostgreSQL 15**
- **Redis 7** (Rate Limiting)
- Maven
- **Spring Security** (JWT Authentication)
- **Spring Data Redis** (Rate Limiting)
- **Flyway** (Database Migrations)
- Docker & Docker Compose (for PostgreSQL)
- **Docker** (Containerization)

## ✨ Features

### Core Functionality
- **Employee Management**: CRUD operations with role-based access
- **Department Management**: Budget tracking, performance metrics
- **Project Management**: Task assignments, employee allocation
- **Location Management**: Office locations, employee associations
- **Task Management**: Project task tracking

### Security Features
- **JWT Authentication**: Secure token-based auth with HTTP-only cookies
- **Role-Based Access Control**: SYSTEM_ADMIN, HR_MANAGER, EMPLOYEE
- **Password Hashing**: BCrypt with configurable strength
- **CORS Protection**: Configurable allowed origins
- **Rate Limiting**: Multi-layer DDoS protection (Nginx + Redis)
- **Input Validation**: Jakarta Bean Validation

### Rate Limiting (Layer 2)
- **Global Enforcement**: Shared Redis store across all instances
- **Token Bucket Algorithm**: Smooth rate limiting with burst capacity
- **Endpoint-Specific Policies**:
   - Login: 10 attempts, ~10/min refill
   - Forgot Password: 5 attempts, ~2/min refill
   - General API: 100 requests burst, 10/sec refill
- **Fail-Open Strategy**: Allows requests if Redis is unavailable
- **Atomic Operations**: Lua scripts for thread-safe rate checks
- PostgreSQL (optional, if running locally without Docker)

#### 2️⃣ Quick Start with Docker (Recommended)
## 🚀 Quick Start
The easiest way to get started is using the unified deployment:
### Option 1: Docker Compose (Recommended)

**Fastest way to run everything:**
- Start the API Gateway
- Start the Angular frontend
cd deployment
docker compose up -d --build
#### 3️⃣ Configure Application Properties

**Access:**
- API: http://localhost/api
- Health: http://localhost/api/actuator/health
- Swagger (if enabled): http://localhost/api/swagger-ui.html
DB_NAME=ems_db
### Option 2: Local Development
DB_PWD=postgres
**Prerequisites:**
- Java 17 JDK
- Maven 3.8+
- PostgreSQL 15 (running)
- Redis 7 (running)

**Setup:**
```

Or set environment variables directly:
```bash
# Create environment file
cp ../db/.env.example ../db/.env
# Edit ../db/.env with your credentials

# Install dependencies
./mvnw clean install -DskipTests

# Run application
./mvnw spring-boot:run

# Or use the startup script
chmod +x start_backend_local.sh
./start_backend_local.sh
```

## ⚙️ Configuration

### Environment Variables

The application uses environment variables from `../db/.env`:

```bash
# Database Configuration
export DB_NAME=ems_db
DB_PORT=5432
DB_NAME=employee_db
export DB_PWD=postgres
DB_PWD=your_password
DB_SSL_MODE=disable  # Use 'require' for production

# Redis Configuration (Rate Limiting)
REDIS_HOST=localhost
REDIS_PORT=6379
# From the root directory
# JWT Configuration
JWT_SECRET_KEY=your_base64_secret_min_256_bits
# Generate with: openssl rand -base64 64

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost,http://localhost:4200
cd deployment
# Frontend Base URL (for email links)
FRONTEND_BASE_URL=http://localhost
```
# Email Configuration (optional)
EMAIL_SERVICE_PROVIDER=demo  # or 'sendgrid'
EMAIL_SENDGRID_API_KEY=your_api_key
EMAIL_SENDGRID_FROM_EMAIL=noreply@example.com
#### Option 2: PostgreSQL in Docker, App Locally
# Spring Profile
SPRING_PROFILE=dev  # or 'prod'
cd backend
# Admin User Initialization (optional)
ADMIN_CREATE=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@example.com
cd backend
./start_backend_local.sh
### Application Properties

**Base Config**: `src/main/resources/application.properties`  
**Dev Profile**: `src/main/resources/application-dev.properties` (default)  
**Prod Profile**: `src/main/resources/application-prod.properties`

### Profile-Specific Behavior

**Development (`dev` profile):**
- SQL logging enabled
- Detailed error messages
- Health check details exposed
- Demo mode for email (no actual sending)
- HTTP-only cookies: disabled for easier testing

**Production (`prod` profile):**
- SQL logging disabled
- Generic error messages
- Health check details hidden
- Real email sending (SendGrid)
- HTTP-only cookies: enabled
- SSL required for database
- Admin user creation controlled by env var

## 🔒 Security & Rate Limiting

### Authentication Flow

#### Option 3: Everything Local
1. User sends credentials to POST /api/auth/login
2. Backend validates credentials
3. JWT access token generated (expires in 15 min)
4. JWT refresh token generated (expires in 7 days)
5. Tokens set as HTTP-only cookies (production)
6. Client includes cookies in subsequent requests
7. JwtAuthenticationFilter validates token on each request
8. User identity extracted from valid token
# Start backend
cd backend
### Rate Limiting Architecture
```
**Layer 1 (Nginx)**: Simple floods, connection limits  
**Layer 2 (Redis - THIS LAYER)**: Distributed attacks, global limits  
**Layer 3 (CloudFlare)**: Optional, large-scale DDoS
#### Using Docker (Manual)
### Rate Limiting Implementation
   docker build -t employee-management-system -f Dockerfile.app .
**Service**: `com.ems.employee_management_system.ratelimit.RateLimiterService`

**Key Components:**

1. **RateLimitPolicy**: Defines rate limit policies
    ```java
    AUTH_LOGIN: 10 attempts, 0.16/sec refill (10/min)
    AUTH_FORGOT_PASSWORD: 5 attempts, 0.033/sec refill (2/min)
    API_GENERAL: 100 attempts, 10/sec refill
    ```

2. **Token Bucket Algorithm**:
    - Each user/IP gets a bucket of tokens
    - Each request consumes 1 token
    - Tokens refill at configured rate
    - Request allowed if tokens available
    - Request rejected (429) if bucket empty

3. **Redis Storage**:
    - Keys: `rate_limit:{identifier}` (e.g., `rate_limit:login:192.168.1.1`)
    - Hash fields: `tokens`, `last_refill`
    - TTL: Auto-expire after 1 hour

4. **Atomic Operations**:
    - Lua scripts ensure thread-safe refill + consume
    - Prevents race conditions in multi-instance deployments

### Testing Rate Limits

```bash
# From deployment directory
cd ../deployment

# Test login rate limiting
./test-redis-rate-limit.sh

# Test forgot password limits
./test-forgot-password-rate-limit.sh

# Check Redis keys
./check-redis-keys.sh
   ```bash
   docker run -p 8080:8080 \
### Adjusting Rate Limits

Edit `src/main/java/com/ems/employee_management_system/ratelimit/RateLimitPolicy.java`:

```java
public static final RateLimitPolicy AUTH_LOGIN = new RateLimitPolicy(
      "AUTH_LOGIN", 
      20,      // 20 attempts burst (was 10)
      0.33,    // ~20 per minute (was 0.16)
      3600     // 1 hour TTL
);
```

Then rebuild: `./mvnw clean package && docker compose up -d --build`

## 📖 API Documentation

### Base URL

- **Local**: `http://localhost/api`
- **Production**: `https://your-domain.com/api`

### Authentication Endpoints

**POST `/api/auth/register`** - Register new user (SYSTEM_ADMIN only)
```json
Request:
{
   "email": "user@example.com",
   "password": "SecurePass123!",
   "role": "HR_MANAGER"
}

Response: 200 OK
{
   "user": { "id": 1, "email": "user@example.com", "role": "HR_MANAGER" },
   "token": "eyJhbGciOiJIUzI1NiIs...",
   "expiresIn": 900
}
```

**POST `/api/auth/login`** - User login
```json
Request:
{
   "username": "user@example.com",
   "password": "SecurePass123!"
}

Response: 200 OK (sets cookies: access_token, refresh_token)
{
   "user": { "id": 1, "email": "user@example.com", "role": "HR_MANAGER" }
}

Rate Limited (429):
{
   "message": "Too many login attempts. Please try again later."
}
```

**POST `/api/auth/forgot-password`** - Request password reset
```json
Request:
{
   "email": "user@example.com"
}

Response: 200 OK
{
   "resetToken": "abc123...",
   "message": "If the email exists, a reset link will be sent."
}
```

**POST `/api/auth/reset-password/:token`** - Reset password with token
```json
Request:
{
   "newPassword": "NewSecurePass456!"
}

Response: 200 OK
{
   "message": "Password reset successful"
}
```

### Employee Endpoints

**GET `/api/employees`** - List all employees (paginated)
```
Query Params:
   - page: 0 (default)
   - size: 20 (default)
   - sort: id,asc (default)
   - search: optional search term

Response: 200 OK
{
   "content": [...],
   "totalElements": 100,
   "totalPages": 5,
   "number": 0
}
```

**POST `/api/employees`** - Create employee (HR_MANAGER, SYSTEM_ADMIN)
**GET `/api/employees/:id`** - Get employee by ID
**PUT `/api/employees/:id`** - Update employee
**DELETE `/api/employees/:id`** - Delete employee (SYSTEM_ADMIN only)

### Department Endpoints

**GET `/api/departments`** - List all departments
**POST `/api/departments`** - Create department (HR_MANAGER, SYSTEM_ADMIN)
**GET `/api/departments/:id`** - Get department by ID
**PUT `/api/departments/:id`** - Update department
**DELETE `/api/departments/:id`** - Delete department (SYSTEM_ADMIN only)

### Project Endpoints

**GET `/api/projects`** - List all projects
**POST `/api/projects`** - Create project
**GET `/api/projects/:id`** - Get project by ID
**PUT `/api/projects/:id`** - Update project
**DELETE `/api/projects/:id`** - Delete project

### Task Endpoints

**GET `/api/tasks`** - List all tasks
**POST `/api/tasks`** - Create task
**GET `/api/tasks/:id`** - Get task by ID
**PUT `/api/tasks/:id`** - Update task
**DELETE `/api/tasks/:id`** - Delete task

### Health Check

**GET `/api/actuator/health`** - Application health status
```json
Response: 200 OK
{
   "status": "UP",
   "components": {
      "db": { "status": "UP" },
      "redis": { "status": "UP" },
      "diskSpace": { "status": "UP" }
   }
}
```

## 🗄️ Database Schema

### Main Tables

- **users**: User authentication and roles
- **employees**: Employee records (extends users)
- **departments**: Department information
- **projects**: Project details
- **tasks**: Task management
- **locations**: Office locations
- **employee_projects**: Many-to-many relationship
- **refresh_tokens**: JWT refresh token storage
- **flyway_schema_history**: Database migration tracking

### Database Migrations

**Flyway** manages schema migrations automatically.

Migration files: `src/main/resources/db/migration/`

```bash
# Check migration status
./mvnw flyway:info

# Repair failed migrations
./mvnw flyway:repair

# Run migrations manually
./mvnw flyway:migrate
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=EmployeeServiceTest

# Run with coverage
./mvnw test jacoco:report
# View: target/site/jacoco/index.html

# Integration tests (requires Docker)
./mvnw verify
```

### Test Structure

```
src/test/java/
├── controllers/     # Controller tests (MockMvc)
├── services/        # Service tests (Mockito)
├── repositories/    # Repository tests (DataJpaTest)
├── integration/     # Integration tests
└── security/        # Security tests
```

### Manual Testing with cURL

```bash
# Login
curl -X POST http://localhost/api/auth/login \
   -H "Content-Type: application/json" \
   -d '{"username":"admin","password":"admin123"}' \
   -c cookies.txt

# Get employees (using cookies)
curl -X GET http://localhost/api/employees \
   -b cookies.txt

# Create employee
curl -X POST http://localhost/api/employees \
   -H "Content-Type: application/json" \
   -b cookies.txt \
   -d '{
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "departmentId": 1
   }'
```

## 🐛 Troubleshooting

### Issue: Application won't start

**Check logs:**
```bash
docker compose logs backend
```

**Common causes:**
1. Database not ready (wait for postgres health check)
2. Missing environment variables (check `../db/.env`)
3. Port 8080 already in use
4. Redis not running

### Issue: Redis connection failed

```bash
# Check Redis is running
docker compose ps redis

# Test connection
docker exec ems-redis redis-cli ping
# Should return: PONG

# Check backend can reach Redis
docker exec ems-backend env | grep REDIS
# Should show: REDIS_HOST=redis
```

### Issue: Database migration errors

```bash
# Check Flyway history
docker exec ems-postgres psql -U postgres -d employee_db \
   -c "SELECT * FROM flyway_schema_history;"

# Repair failed migration
docker exec ems-backend ./mvnw flyway:repair

# Clean start (WARNING: deletes all data)
docker compose down -v
docker compose up -d --build
```

### Issue: Rate limiting not working

```bash
# Check Redis keys
docker exec ems-redis redis-cli KEYS "rate_limit:*"

# Check backend logs
docker compose logs backend | grep -i rate

# Test manually
cd ../deployment
./test-redis-rate-limit.sh
```

## 📚 Additional Resources

- **Rate Limiting**: [../docs/RATE_LIMITING_QUICK_START.md](../docs/RATE_LIMITING_QUICK_START.md)
- **DDoS Protection**: [../docs/RATE_LIMITING_AND_DDOS_PROTECTION.md](../docs/RATE_LIMITING_AND_DDOS_PROTECTION.md)
- **Deployment**: [../deployment/README.md](../deployment/README.md)
- **Main README**: [../README.md](../README.md)

---

**Need help?** Open an issue on [GitHub](https://github.com/Buffden/employee-management-system/issues)
     -e DB_NAME=ems_db \
     -e DB_USER=postgres \
     -e DB_PWD=postgres \
     employee-management-system
   ```

---

### 🛠️ Jenkins Integration

Jenkins is integrated into the project for continuous integration and deployment. To start Jenkins, follow these steps:

1. **Start Jenkins using Docker Compose**:
   ```bash
   cd backend
   docker-compose -f docker-compose.jenkins.yml up
   ```

2. **Access Jenkins**:
   Open your browser and navigate to [http://localhost:8085](http://localhost:8085).

3. **Configure Jenkins**:
   Follow the on-screen instructions to set up Jenkins, including installing necessary plugins and configuring your project.

4. **Stop Jenkins**:
   ```bash
   docker-compose -f docker-compose.jenkins.yml down
   ```

---

### 🧪 Test API

```bash
# Health check
curl http://localhost:8080/actuator/health

# Get departments
curl http://localhost:8080/api/departments

# Get employees
curl http://localhost:8080/api/employees
```

---

### 🧩 Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 8080 already in use | Kill process: `lsof -ti:8080 \| xargs kill -9` |
| Port 5432 already in use | Kill process: `lsof -ti:5432 \| xargs kill -9` |
| CORS error | Ensure frontend is running on `http://localhost:4200` |
| Database connection failed | Check PostgreSQL is running: `docker ps \| grep postgres` |
| Java process not stopping | Use `pkill -f 'java -jar'` or `kill -9` with `ps aux \| grep java` |

---

### ✅ Confirm Running

- Backend API: [http://localhost:8080](http://localhost:8080)
- Health Check: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- Frontend: [http://localhost:4200](http://localhost:4200)

---

### 📝 Additional Notes

- The application uses UUID for entity IDs
- Database schema is auto-generated via Hibernate (`ddl-auto=update`)
- CORS is configured for `http://localhost:4200`
- Health check endpoint available at `/actuator/health`
- Connection pooling configured with HikariCP
- All configuration is local-first - no cloud dependencies
