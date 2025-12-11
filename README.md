# Employee Management System

A full-stack monorepo application for managing employees, departments, projects, and tasks. Built with Spring Boot (backend) and Angular (frontend), featuring a modern UI and RESTful API architecture.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Deployment](#-deployment)
- [CI/CD](#-cicd)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)

## ✨ Features

- **Employee Management**: Create, read, update, and delete employee records with comprehensive details
- **Department Management**: Organize employees into departments with budget tracking and performance metrics
- **Project Management**: Manage projects with task assignments and employee allocation
- **Task Management**: Track tasks associated with projects and employees
- **Location Management**: Manage office locations and associate employees/departments
- **Search Functionality**: Search across employees, departments, and projects
- **User Profile**: View and manage user profiles
- **Dashboard**: Overview of key metrics and statistics
- **Responsive UI**: Modern Angular Material design with responsive layouts

## 🛠 Tech Stack

### Backend
- **Framework**: Spring Boot 3.4.0
- **Language**: Java 17
- **Database**: PostgreSQL
- **ORM**: Hibernate JPA
- **Build Tool**: Maven
- **API**: RESTful Web Services

### Frontend
- **Framework**: Angular 19.0.5
- **Language**: TypeScript
- **UI Library**: Angular Material 19.0.4
- **Build Tool**: Angular CLI
- **State Management**: RxJS
- **SSR**: Angular Server-Side Rendering

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Nginx (Gateway)
- **CI/CD**: Jenkins
- **Version Control**: Git

## 🏗 Architecture

The application follows a **local development architecture** with a unified gateway:

```
┌─────────────────────────────────────────────┐
│         Local Development                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │     Gateway (Nginx) :80              │  │
│  │  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │  Angular App │  │  API Routes  │ │  │
│  │  │  (Frontend)  │  │  /api/*      │ │  │
│  │  └──────────────┘  └──────┬───────┘ │  │
│  └───────────────────────────┼──────────┘  │
│                              │             │
│                       ┌──────▼──────┐     │
│                       │ Spring Boot │     │
│                       │  :8080      │     │
│                       └──────┬──────┘     │
│                              │             │
│                       ┌──────▼──────┐     │
│                       │ PostgreSQL  │     │
│                       │ (Docker)    │     │
│                       │ :5432       │     │
│                       └─────────────┘     │
└─────────────────────────────────────────────┘
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

### Architecture

```
Host → Gateway (Port 80) → Backend → Database
```

**Only the Gateway is exposed** on port 80. All other services (PostgreSQL, Backend) are internal and not directly accessible from the host.

### Docker Compose Commands

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

### GitHub Actions (CI)

The project uses **GitHub Actions** for continuous integration (CI) - automatic testing and validation on every pull request.

#### Automatic CI Pipeline

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

See `.github/workflows/README.md` for detailed documentation.

### Jenkins Integration (CD)

The project includes Jenkins configuration for continuous deployment (CD) - production deployments when the application is hosted.

#### Start Jenkins

```bash
cd deployment/jenkins
docker-compose up -d --build
```

Access Jenkins at `http://localhost:8085`

#### Jenkins Pipelines

The project includes Jenkinsfiles for automated pipelines:

- **Backend Pipeline** (`deployment/jenkins/Jenkinsfile.backend`):
  - Build and test backend
  - Docker image creation
  - Deployment automation

- **Frontend Pipeline** (`deployment/jenkins/Jenkinsfile.frontend`):
  - Build Angular application
  - Docker image creation
  - Gateway deployment

#### CI/CD Testing

For testing individual services:

```bash
# Test backend only
cd deployment
docker-compose -f docker-compose.backend.yml up -d --build

# Test frontend/gateway only
cd deployment
docker-compose -f docker-compose.frontend.yml up -d --build
```

See `deployment/jenkins/README.md` for detailed CI/CD setup instructions.

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
