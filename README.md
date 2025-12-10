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

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **CI/CD**: Jenkins
- **Version Control**: Git

## 🏗 Architecture

The application follows a **local development architecture**:

```
┌─────────────────────────────────────────────┐
│         Local Development                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │  Angular App │──────▶│ API Gateway │   │
│  │  :4200       │      │  :8000       │   │
│  └──────────────┘      └──────┬───────┘   │
│                                │           │
│                         ┌──────▼──────┐   │
│                         │ Spring Boot │   │
│                         │  :8080      │   │
│                         └──────┬──────┘   │
│                                │           │
│                         ┌──────▼──────┐   │
│                         │ PostgreSQL  │   │
│                         │ (Docker)    │   │
│                         │ :5433       │   │
│                         └─────────────┘   │
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
│   ├── nginx.conf   # Gateway configuration
│   └── Dockerfile
│
├── deployment/      # Deployment files
│   ├── docker-compose.yml  # Main compose file
│   ├── start.sh     # Start all services
│   ├── stop.sh      # Stop all services
│   ├── restart.sh   # Restart services
│   └── status.sh    # Check status
│
└── db/              # Database configuration
    ├── .env.example # Environment template
    ├── connect_db.sh # Database connection script
    └── init/        # Database initialization scripts
```

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer Pattern**: Business logic separation
- **DTO Pattern**: Data transfer objects for API communication
- **Mapper Pattern**: Entity-DTO conversion
- **Module Pattern**: Feature-based Angular modules

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js** (LTS version)
- **npm** or **yarn**
- **PostgreSQL** 12+ (or use Docker)
- **Docker** and **Docker Compose** (optional, for containerized deployment)
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd employee-management-system
```

### 2. Backend Setup

#### Option A: Quick Start with Docker (Recommended)

The easiest way to get started is using the unified deployment:

```bash
# From the root directory
./start.sh

# Or from deployment directory:
cd deployment
./start.sh
```

This will:
- Start a PostgreSQL database in Docker
- Start the Spring Boot application
- Automatically configure connections
- Backend available at `http://localhost:8080`
- Database available at `localhost:5432`

#### Option B: Local Development (PostgreSQL in Docker, App on Host)

If you prefer to run the app locally but use Docker for PostgreSQL:

```bash
cd backend

# Start only PostgreSQL
docker-compose -f docker-compose.local.yml up -d postgres

# Wait for PostgreSQL to be ready (about 10 seconds)
sleep 10

# Run the application locally
./start_backend_local.sh
```

#### Option C: Fully Local (PostgreSQL installed locally)

If you have PostgreSQL installed locally:

```bash
cd backend

# Create .env file for local PostgreSQL
cat > .env << 'EOF'
DB_HOST=localhost
DB_NAME=ems_db
DB_USER=postgres
DB_PWD=postgres
SPRING_PROFILES_ACTIVE=local
EOF

# Create database (if not exists)
createdb ems_db

# Run the application
./start_backend_local.sh
```

The backend API will be available at `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# or
npm run start:local
```

The frontend will be available at `http://localhost:4200`

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

### Start All Services

```bash
cd deployment
docker-compose up -d --build
```

This starts all services:
- PostgreSQL database (internal only)
- Spring Boot backend (internal only)
- API Gateway (internal only)
- Angular frontend with Nginx (exposed on port 80)

### Architecture

```
Host → Nginx (Port 80) → Gateway → Backend → Database
```

**Only Nginx is exposed** on port 80. All other services are internal and not directly accessible from the host.

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
docker-compose logs -f frontend
docker-compose logs -f backend

# Restart services
docker-compose restart

# Check service status
docker-compose ps
```

### Access

- **Application**: http://localhost
- **API requests**: http://localhost/api/* (routed through nginx)

## 🔄 CI/CD

### Jenkins Integration

The project includes Jenkins configuration for continuous integration and deployment.

#### Start Jenkins

```bash
cd backend
docker-compose -f docker-compose.jenkins.yml up
```

Access Jenkins at `http://localhost:8085`

#### Jenkinsfile

The project includes a `Jenkinsfile` for pipeline automation:
- Build and test backend
- Build frontend
- Docker image creation
- Deployment automation

## 💻 Development

### Backend Development

```bash
cd backend

# Run tests
mvn test

# Build without tests
mvn clean package -DskipTests

# Check application health
curl http://localhost:8080/actuator/health
```

### Frontend Development

```bash
cd frontend

# Run linter
npm run lint

# Run tests
npm test

# Build for production
npm run build
```

### Environment Configuration

#### Backend
- Development: `application.properties`
- Test: `application-test.properties`
- Production: Use environment variables

#### Frontend
- Local: `proxy.conf.local.json`
- Production: `proxy.conf.prod.json`

## 🐛 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| CORS errors | Update `spring.web.cors.allowed-origins` in `application.properties` |
| Database connection timeout | Verify DB credentials and ensure PostgreSQL is running |
| Port already in use | Change port in `application.properties` or kill existing process |
| Angular build errors | Clear `node_modules` and reinstall: `rm -rf node_modules && npm install` |
| Maven build failures | Clean and rebuild: `mvn clean install` |

### Logs

- **Backend logs**: Check `backend/app.log` or console output
- **Docker logs**: `docker logs <container-id>`
- **Jenkins logs**: Access via Jenkins UI

## 📝 Additional Notes

- The application uses UUID for entity IDs
- Database schema is auto-generated via Hibernate (`ddl-auto=update`)
- CORS is configured for localhost development
- Health check endpoint available at `/actuator/health`
- Connection pooling configured with HikariCP
- All configuration is local-first - no cloud dependencies

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
