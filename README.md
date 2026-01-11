# Employee Management System

A full-stack monorepo application for managing employees, departments, projects, and tasks. Built with Spring Boot (backend) and Angular (frontend), featuring a modern UI and RESTful API architecture.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Security Features](#-security-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [Rate Limiting & DDoS Protection](#-rate-limiting--ddos-protection)
- [CI/CD](#-cicd)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- **Employee Management**: Create, read, update, and delete employee records with comprehensive details
- **Department Management**: Organize employees into departments with budget tracking and performance metrics
- **Project Management**: Manage projects with task assignments and employee allocation
- **Task Management**: Track tasks associated with projects and employees
- **Location Management**: Manage office locations and associate employees/departments
- **Authentication & Authorization**: Secure JWT-based authentication with role-based access control
- **Rate Limiting**: Multi-layer DDoS protection (Nginx + Redis)
- **Search Functionality**: Search across employees, departments, and projects
- **User Profile**: View and manage user profiles
- **Dashboard**: Overview of key metrics and statistics
- **Responsive UI**: Modern Angular Material design with responsive layouts

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **HTTP-Only Cookies**: Protection against XSS attacks
- **Role-Based Access**: SYSTEM_ADMIN, HR_MANAGER, EMPLOYEE roles
- **Password Security**: BCrypt hashing with salt
- **CORS Protection**: Configurable cross-origin policies

### Rate Limiting & DDoS Protection
- **Multi-Layer Defense**: 3-tier protection architecture
   - **Layer 1 (Nginx)**: 10 req/min for auth endpoints, 100 req/sec for API
   - **Layer 2 (Redis)**: Global token bucket algorithm across all instances
   - **Layer 3 (CloudFlare)**: Optional free DDoS protection (10+ Gbps)
- **Attack Protection**: Guards against credential stuffing, brute force, and volumetric attacks
- **Zero Cost**: Complete implementation at $0/month

📚 **Documentation**: See [Rate Limiting Quick Start](docs/RATE_LIMITING_QUICK_START.md)

## 🛠 Tech Stack

### Backend
- **Framework**: Spring Boot 3.4.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Hibernate JPA
- **Cache/Rate Limiting**: Redis 7
- **Build Tool**: Maven
- **API**: RESTful Web Services
- **Security**: Spring Security, JWT
- **Validation**: Jakarta Bean Validation

### Frontend
- **Framework**: Angular 19.0.5
- **Language**: TypeScript
- **UI Library**: Angular Material 19.0.4
- **Build Tool**: Angular CLI
- **State Management**: RxJS
- **SSR**: Angular Server-Side Rendering
- **HTTP Client**: HttpClient with Interceptors

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (Gateway)
- **Caching**: Redis (Rate Limiting)
- **DDoS Protection**: Nginx + Redis + CloudFlare (optional)
- **CI/CD**: GitHub Actions (CI + CD)
- **Version Control**: Git
- **Monitoring**: Docker health checks, application logs

## 🏗 Architecture

The application follows a **microservices-inspired architecture** with a unified gateway and multi-layer security:

```
┌─────────────────────────────────────────────┐
│         Application Stack                    │
├─────────────────────────────────────────────┤
│                                             │
│  Client (Browser)                          │
│         ↓                                  │
│  ┌─────────────────────────────────────┐  │
│  │  Gateway (Nginx) :80                │  │
│  │  ├─ Rate Limiting (Layer 1)         │  │
│  │  ├─ Angular App (Frontend)          │  │
│  │  └─ API Proxy (/api/*)              │  │
│  └──────────────┬──────────────────────┘  │
│                 ↓                          │
│  ┌─────────────────────────────────────┐  │
│  │  Spring Boot :8080                  │  │
│  │  ├─ JWT Authentication              │  │
│  │  ├─ Rate Limiting (Layer 2)         │  │
│  │  ├─ Business Logic                  │  │
│  │  └─ REST API                        │  │
│  └──────┬──────────────────┬───────────┘  │
│         ↓                  ↓               │
│  ┌──────────────┐   ┌──────────────┐     │
│  │ PostgreSQL   │   │ Redis Cache  │     │
│  │ :5432        │   │ :6379        │     │
│  │ (Persistent) │   │ (Rate Limit) │     │
│  └──────────────┘   └──────────────┘     │
└─────────────────────────────────────────────┘
```

### Security Architecture

```
Internet → [CloudFlare Free - Layer 3 DDoS]
           ↓
        [Nginx - Layer 1 Rate Limiting]
           ↓
        [Spring Boot - Layer 2 Redis Rate Limiting]
           ↓
        [JWT Authentication & Authorization]
           ↓
        [Business Logic & Database]
```

## 🚀 Quick Start

### Local Development (Fastest)

```bash
# 1. Clone the repository
git clone https://github.com/Buffden/employee-management-system.git
cd employee-management-system

# 2. Set up environment variables
cp db/.env.example db/.env
# Edit db/.env with your credentials

# 3. Start all services
cd deployment
docker compose up -d --build

# 4. Access the application
# Frontend: http://localhost
# Backend API: http://localhost/api
```

**Default admin credentials:**
- Username: `admin`
- Password: `admin123`
- Role: SYSTEM_ADMIN

### Verify Services

```bash
# Check all containers are healthy
docker compose ps

# Should see 4 services running:
# ✅ ems-postgres (healthy)
# ✅ ems-redis (healthy)
# ✅ ems-backend (healthy)
# ✅ ems-gateway (healthy)
```

## 🔐 Rate Limiting & DDoS Protection

The system implements a **zero-cost, multi-layer defense** against attacks:

### Implementation Overview

| Layer | Technology | Protection | Cost |
|-------|-----------|------------|------|
| **Layer 1** | Nginx | Simple floods, slowloris, connection exhaustion | $0 |
| **Layer 2** | Redis | Distributed attacks, credential stuffing, global limits | $0 |
| **Layer 3** | CloudFlare Free | Volumetric DDoS (10+ Gbps), bot protection | $0 |
| **Total** | - | **99%+ attack coverage** | **$0/month** |

### Rate Limits (Default Configuration)

**Authentication Endpoints:**
- `/api/auth/login`: 10 attempts per minute per IP
- `/api/auth/forgot-password`: 2 attempts per minute per email
- Connection limit: 5 concurrent connections per IP

**General API Endpoints:**
- `/api/*`: 100 requests per second per IP
- Connection limit: 10 concurrent connections per IP
- Request body: Max 10MB

### Testing Rate Limits

```bash
cd deployment

# Test Redis rate limiting (Layer 2)
./test-redis-rate-limit.sh

# Test Nginx rate limiting (Layer 1)
./test-nginx-rate-limit.sh

# Test forgot password limits
./test-forgot-password-rate-limit.sh

# Run all tests
./run-all-tests.sh

# Monitor live logs
./monitor-logs.sh backend  # Backend rate limiter
./monitor-logs.sh nginx    # Nginx gateway
./monitor-logs.sh all      # All containers
```

### Documentation

- **Quick Start**: [RATE_LIMITING_QUICK_START.md](docs/RATE_LIMITING_QUICK_START.md) - 5-minute setup guide
- **Deep Dive**: [RATE_LIMITING_AND_DDOS_PROTECTION.md](docs/RATE_LIMITING_AND_DDOS_PROTECTION.md) - Complete technical analysis
- **CloudFlare Setup**: [CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md) - Optional Layer 3 DDoS protection

### Adjusting Rate Limits

**Nginx (Layer 1):**  
Edit [gateway/nginx/nginx.local.conf](gateway/nginx/nginx.local.conf):
```nginx
# Change from 10 req/min to 20 req/min
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=20r/m;
```

**Redis (Layer 2):**  
Edit [RateLimitPolicy.java](backend/src/main/java/com/ems/employee_management_system/ratelimit/RateLimitPolicy.java):
```java
public static final RateLimitPolicy AUTH_LOGIN = new RateLimitPolicy(
   "AUTH_LOGIN", 
   20,      // 20 attempts burst (was 10)
   0.33,    // ~20 per minute refill (was 0.16)
   3600
);
```

### Project Structure

```
employee-management-system/
├── backend/          # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/     # Controllers, Services, Repositories, Models
│   │   │   └── resources/ # Configuration files
│   │   └── test/         # Unit tests
│   └── Dockerfile.app
│
├── frontend/         # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── features/    # Feature modules
│   │   │   ├── core/        # Core services
│   │   │   └── shared/      # Shared components
│   │   └── assets/
│   └── Dockerfile
│
├── gateway/          # API Gateway (Nginx)
│   ├── nginx.conf   # Unified gateway configuration
│   └── Dockerfile   # Multi-stage build (Angular + Nginx)
│
├── deployment/       # Deployment & CI/CD files
│   ├── docker-compose.yml           # Main deployment
│   ├── docker-compose.backend.yml  # Backend CI/CD testing
│   ├── docker-compose.frontend.yml # Frontend CI/CD testing
│   └── jenkins/                     # Jenkins CI/CD
│       ├── docker-compose.yml
│       ├── Dockerfile
│       ├── Jenkinsfile.backend
│       └── Jenkinsfile.frontend
│
└── db/              # Database configuration
    ├── .env.example # Environment template
    └── init/        # Database initialization scripts
```

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **DTO Pattern**: Data transfer objects for API communication
- **Mapper Pattern**: Entity-DTO conversion
- **Module Pattern**: Feature-based Angular modules
- **Gateway Pattern**: Unified entry point for frontend and API

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js** (LTS version)
- **npm** or **yarn**
- **Docker** and **Docker Compose** (required for deployment)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd employee-management-system
```

### 2. Configure Database

Create the database environment file:

```bash
cd db
cp .env.example .env
# Edit .env with your database credentials
```

Required environment variables:
- `DB_HOST` - Database host (default: postgres)
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PWD` - Database password

### 3. Start the Application

The easiest way to get started is using Docker Compose:

```bash
cd deployment
docker-compose up -d --build
```

This will:
- Start PostgreSQL database (internal only)
- Build and start Spring Boot backend (internal only)
- Build and start Gateway with Angular frontend (exposed on port 80)
- Automatically configure all connections
- Set up health checks and dependencies

### 4. Access the Application

- **Frontend Application**: http://localhost
- **API Endpoints**: http://localhost/api/*
  - Departments: `http://localhost/api/departments`
  - Employees: `http://localhost/api/employees`
  - Projects: `http://localhost/api/projects`
  - Tasks: `http://localhost/api/tasks`
- **Health Check**: http://localhost/health

### 5. Stop the Application

```bash
cd deployment
docker-compose down
```

## 📁 Project Structure

### Backend Structure

```
backend/
├── src/main/java/com/ems/employee_management_system/
│   ├── controllers/      # REST API endpoints
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── models/           # Entity models
│   ├── dtos/             # Data Transfer Objects
│   ├── mappers/          # Entity-DTO mappers
│   └── config/           # Configuration classes
├── src/main/resources/
│   └── application.properties
└── pom.xml
```

### Frontend Structure

```
frontend/src/app/
├── features/             # Feature modules
│   ├── employees/        # Employee management
│   ├── departments/      # Department management
│   ├── projects/         # Project management
│   ├── profile/          # User profile
│   └── search/           # Search functionality
├── core/                 # Core services
│   └── services/
│       ├── api.service.ts
│       └── auth.service.ts
├── shared/               # Shared components
│   ├── components/       # Reusable components
│   ├── models/           # TypeScript interfaces
│   └── consts/           # Constants
└── app.module.ts         # Root module
```

## 🔌 API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/{id}` - Get employee by ID
- `POST /api/employees` - Create new employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Delete employee

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/{id}` - Get department by ID
- `POST /api/departments` - Create new department
- `PUT /api/departments/{id}` - Update department
- `DELETE /api/departments/{id}` - Delete department

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/{id}` - Get project by ID
- `POST /api/projects` - Create new project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/{id}` - Get task by ID
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Employee Projects
- `GET /api/employee-projects` - Get all employee-project assignments
- `POST /api/employee-projects` - Assign employee to project
- `DELETE /api/employee-projects/{employeeId}/{projectId}` - Remove assignment

## 🐳 Docker Deployment

### Local Development

**Architecture**:
```
Host → Gateway (Port 80) → Backend → PostgreSQL
```

**Only the Gateway is exposed** on port 80. All other services (PostgreSQL, Backend) are internal and not directly accessible from the host.

**Commands**:

```bash
cd deployment

# Start all services in background
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f gateway
docker-compose logs -f backend
```

### Production Deployment

**Automatic Deployment** (Recommended):
- Code merged to `main` → Automatically deploys via GitHub Actions
- No manual steps required
- See [CI/CD](#-cicd) section above

**Architecture**:
```
Users → Gateway (HTTPS) → Backend → AWS RDS
```

**Manual Deployment** (If needed):

```bash
cd deployment
docker-compose -f docker-compose.prod.yml up -d
```

**Note**: 
- Production uses `docker-compose.prod.yml` which pulls images from Docker Hub
- Requires AWS RDS database (configured via `.env.production`)
- Images must be built and pushed to Docker Hub first
docker-compose logs -f postgres

# Restart services
docker-compose restart

# Check service status
docker-compose ps

# Rebuild specific service
docker-compose up -d --build gateway
```

### Service Details

- **PostgreSQL**: Internal only, accessible only from backend container
- **Backend**: Internal only, accessible only from gateway container
- **Gateway**: Exposed on port 80, serves Angular app and routes API requests

### Access

- **Application**: http://localhost
- **API requests**: http://localhost/api/* (routed through gateway → backend)

## 🔄 CI/CD

The project uses **GitHub Actions** for both Continuous Integration (CI) and Continuous Deployment (CD).

### CI Pipeline (Testing & Validation)

**Workflow**: `.github/workflows/ci.yml`

**Runs automatically on**:
- Every pull request
- Every push to `main`, `develop`, or `master` branches

**What it does**:
- ✅ Runs backend tests (Maven + PostgreSQL)
- ✅ Runs frontend tests (Angular + Node.js)
- ✅ Validates Docker builds
- ✅ Provides immediate feedback in PR

**Benefits**:
- 🆓 **Free** for public repositories
- ⚡ **Fast** feedback (5-10 minutes)
- 🔄 **Automatic** - no manual triggers needed
- ✅ **Blocks bad code** from merging

**Status Badge**: ![CI](https://github.com/Buffden/employee-management-system/workflows/CI%20Pipeline/badge.svg)

### CD Pipeline (Production Deployment)

**Workflow**: `.github/workflows/deploy.yml`

**Runs automatically when**:
- Code is merged to `main` branch

**What it does**:
1. **Build & Push**: Builds Docker images and pushes to Docker Hub
   - Backend: `{DOCKER_USERNAME}/ems-backend:latest`
   - Gateway: `{DOCKER_USERNAME}/ems-gateway:latest`
2. **Deploy to EC2**:
   - SSHs to EC2 server
   - Pulls latest code from repository
   - Pulls Docker images from Docker Hub
   - Generates `.env.production` from GitHub Secrets
   - Deploys using `docker-compose.prod.yml`
   - Verifies deployment success

**Key Features**:
- ✅ **Secure**: Secrets stored in GitHub Secrets, never in code
- ✅ **Automated**: Zero manual steps required
- ✅ **Versioned**: Images stored in Docker Hub
- ✅ **Idempotent**: Safe to rerun deployments

**Required GitHub Secrets**:
- `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` - EC2 server access
- `DOCKER_USERNAME`, `DOCKER_PASSWORD` - Docker Hub credentials
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PWD` - Database credentials
- `JWT_SECRET_KEY` - Application security
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL` - Admin user
- Optional: `CORS_ALLOWED_ORIGINS`, `FRONTEND_BASE_URL`, `NGINX_SERVER_NAME`, etc.

**Documentation**:
- See `.github/workflows/README.md` for complete workflow documentation
- See `docs/architecture/github-actions-setup.md` for setup guide

### Legacy Jenkins (Optional)

Jenkins configuration is available for alternative CI/CD setups:
- See `deployment/jenkins/README.md` for Jenkins setup
- Jenkins pipelines: `deployment/jenkins/Jenkinsfile.*`

## 💻 Development

### Backend Development

```bash
cd backend

# Run tests
mvn test

# Build without tests
mvn clean package -DskipTests

# Check application health (when running)
curl http://localhost:8080/api/departments
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# or
npm run start:local

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

The frontend development server will be available at `http://localhost:4200`

### Environment Configuration

#### Backend
- Configuration: `backend/src/main/resources/application.properties`
- Environment variables loaded from `db/.env`
- Database connection configured via environment variables

#### Frontend
- Local development: `proxy.conf.local.json`
- Production: Uses gateway for API routing

## 🐛 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| CORS errors | CORS is configured in gateway/nginx.conf |
| Database connection timeout | Verify DB credentials in `db/.env` and ensure PostgreSQL is running |
| Port already in use | Stop existing containers: `docker-compose down` |
| Angular build errors | Clear `node_modules` and reinstall: `rm -rf node_modules && npm install` |
| Maven build failures | Clean and rebuild: `mvn clean install` |
| Gateway shows default nginx page | Rebuild gateway: `docker-compose up -d --build gateway` |
| API returns 404 | Check gateway nginx.conf routing configuration |

### Logs

- **Docker logs**: `docker-compose logs -f <service-name>`
- **Backend logs**: `docker-compose logs -f backend`
- **Gateway logs**: `docker-compose logs -f gateway`
- **Database logs**: `docker-compose logs -f postgres`
- **Jenkins logs**: Access via Jenkins UI at `http://localhost:8085`

### Health Checks

All services include health checks:

```bash
# Check all services
docker-compose ps

# Check gateway health
curl http://localhost/health

# Check backend health (from within container)
docker exec ems-backend wget -qO- http://localhost:8080/api/departments
```

## 📝 Additional Notes

- The application uses UUID for entity IDs
- Database schema is auto-generated via Hibernate (`ddl-auto=update`)
- CORS is configured in the gateway nginx configuration
- Health check endpoint available at `/health`
- Connection pooling configured with HikariCP
- All configuration is local-first - no cloud dependencies
- Angular SSR (Server-Side Rendering) is configured and used in production builds
- Gateway serves both Angular app and routes API requests through a single Nginx instance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

- Buffden :)

## 🙏 Acknowledgments

- Spring Boot team for the excellent framework
- Angular team for the robust frontend framework
- All contributors and open-source libraries used in this project

---

For more detailed information, refer to:
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
- [Deployment README](deployment/README.md)
- [Gateway README](gateway/README.md)
- [Database README](db/README.md)
