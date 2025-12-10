# 🧩 Employee Management System API (Backend - Spring Boot)

### ⚙️ Tech Stack
- **Spring Boot 3.4.0**
- **Java 17**
- **PostgreSQL** (Local Docker)
- **Hibernate JPA**
- **Maven**

---

### 📁 Project Setup

#### 1️⃣ Prerequisites
- Java 17
- Maven
- Docker & Docker Compose (for PostgreSQL)
- PostgreSQL (optional, if running locally without Docker)

#### 2️⃣ Quick Start with Docker (Recommended)

The easiest way to get started is using the unified deployment:

```bash
# From the root directory
./start.sh
```

This will:
- Start PostgreSQL in Docker
- Start the Spring Boot backend
- Start the API Gateway
- Start the Angular frontend
- All services will be ready automatically

#### 3️⃣ Configure Application Properties

The application uses environment variables from `.env` file. Create a `.env` file:

```bash
cd backend
cat > .env << 'EOF'
DB_HOST=localhost
DB_NAME=ems_db
DB_USER=postgres
DB_PWD=postgres
EOF
```

Or set environment variables directly:
```bash
export DB_HOST=localhost
export DB_NAME=ems_db
export DB_USER=postgres
export DB_PWD=postgres
```

---

### 🚀 Starting the Application

#### Option 1: Unified Docker Compose (Easiest)

Start all services together:

```bash
# From the root directory
./start.sh

# Or from deployment directory:
cd deployment
./start.sh
```

#### Option 2: PostgreSQL in Docker, App Locally

```bash
# Terminal 1: Start PostgreSQL
cd backend
docker-compose -f docker-compose.local.yml up -d postgres

# Terminal 2: Start backend locally
cd backend
./start_backend_local.sh
```

#### Option 3: Everything Local

If you have PostgreSQL installed locally:

```bash
# Create database
createdb ems_db

# Start backend
cd backend
./start_backend_local.sh
```

#### Using Docker (Manual)

1. **Build the Docker image**:
   ```bash
   docker build -t employee-management-system -f Dockerfile.app .
   ```

2. **Run the Docker container** (with local PostgreSQL):
   ```bash
   docker run -p 8080:8080 \
     -e DB_HOST=host.docker.internal \
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
