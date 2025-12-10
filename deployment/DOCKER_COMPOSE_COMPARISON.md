# Docker Compose Files Comparison

This document explains the purpose and differences between the three Docker Compose files.

## 📊 Quick Comparison Table

| File | Purpose | Services | When to Use | Used By |
|------|---------|----------|-------------|---------|
| `docker-compose.yml` | **Full Production Stack** | postgres, backend, gateway | Daily development, production | Developers, manual deployment |
| `docker-compose.backend.yml` | **Backend CI/CD Testing** | postgres, app (backend) | Jenkins backend pipeline | `Jenkinsfile.backend` |
| `docker-compose.frontend.yml` | **Frontend CI/CD Testing** | gateway (with Angular) | Jenkins frontend pipeline | `Jenkinsfile.frontend` |

## 📁 Detailed Breakdown

### 1. `docker-compose.yml` - **Main Deployment File**

**Purpose:** Complete application stack for development and production

**Services:**
- ✅ `postgres` - Database
- ✅ `backend` - Spring Boot API
- ✅ `gateway` - Nginx (serves Angular + routes API)

**Characteristics:**
- Full stack with all services
- All services connected via `ems-network`
- Gateway exposed on port 80
- Backend and postgres are internal only
- Persistent volumes for database
- Health checks for all services
- Auto-restart on failure

**When to use:**
```bash
# Daily development
cd deployment
docker-compose up -d --build

# Production deployment
docker-compose up -d --build
```

**Used by:**
- Developers for local development
- Production deployments
- Manual testing

---

### 2. `docker-compose.backend.yml` - **Backend CI/CD Testing**

**Purpose:** Minimal setup for testing backend in CI/CD pipeline

**Services:**
- ✅ `postgres` - Test database
- ✅ `app` (backend) - Spring Boot API

**Characteristics:**
- **Minimal services** - Only backend + database
- **No gateway** - Backend exposed directly on port 8080 for testing
- **No frontend** - Not needed for backend testing
- Separate network (`app-network`) to avoid conflicts
- Separate volumes (`postgres_data_ci`) to avoid data conflicts
- CI-specific container names (`ems-*-ci`)

**When to use:**
```bash
# Automatically used by Jenkins backend pipeline
cd deployment
docker-compose -f docker-compose.backend.yml up -d --build
```

**Used by:**
- `Jenkinsfile.backend` (CI/CD pipeline)
- Backend-only testing scenarios

**Why separate?**
- Faster CI/CD (no need to build frontend/gateway)
- Isolated testing environment
- Backend can be tested independently
- Exposes backend port 8080 for direct API testing

---

### 3. `docker-compose.frontend.yml` - **Frontend CI/CD Testing**

**Purpose:** Minimal setup for testing frontend in CI/CD pipeline

**Services:**
- ✅ `gateway` - Nginx (serves Angular + routes API)

**Characteristics:**
- **Minimal services** - Only gateway (which includes Angular build)
- **No backend** - Frontend can be tested without backend (static files)
- **No postgres** - Not needed for frontend testing
- Separate network (`app-network`) to avoid conflicts
- CI-specific container name (`ems-gateway-ci`)
- Gateway exposed on port 80

**When to use:**
```bash
# Automatically used by Jenkins frontend pipeline
cd deployment
docker-compose -f docker-compose.frontend.yml up -d --build
```

**Used by:**
- `Jenkinsfile.frontend` (CI/CD pipeline)
- Frontend-only testing scenarios

**Why separate?**
- Faster CI/CD (no need to build backend/database)
- Isolated testing environment
- Frontend can be tested independently
- Gateway builds Angular app internally

---

## 🔄 Relationship Between Files

### Does `docker-compose.yml` replace the simple files?

**NO** - They serve different purposes:

| Aspect | `docker-compose.yml` | Simple Files |
|--------|---------------------|--------------|
| **Purpose** | Full stack deployment | CI/CD testing |
| **Services** | All services (3) | Minimal services (1-2) |
| **Speed** | Slower (builds everything) | Faster (builds only needed) |
| **Isolation** | Shared environment | Isolated CI environment |
| **Port Exposure** | Gateway only (80) | Backend (8080) or Gateway (80) |
| **Network** | `ems-network` | `app-network` (separate) |
| **Volumes** | `postgres_data` | `postgres_data_ci` (separate) |

### Can you use `docker-compose.yml` for CI/CD?

**Technically YES, but NOT recommended:**

❌ **Problems:**
- Builds all services (slower)
- More complex (more points of failure)
- Harder to isolate test failures
- Uses production network/volumes (risk of conflicts)

✅ **Simple files are better for CI/CD:**
- Faster builds (only what's needed)
- Isolated testing (separate networks/volumes)
- Clear separation of concerns
- Easier to debug failures

---

## 📋 Usage Scenarios

### Scenario 1: Local Development
```bash
# Use main compose - full stack
cd deployment
docker-compose up -d --build
```
**File:** `docker-compose.yml`

### Scenario 2: Backend CI/CD Pipeline
```bash
# Jenkins automatically uses simple backend compose
docker-compose -f docker-compose.backend.yml up -d --build
```
**File:** `docker-compose.backend.yml`  
**Triggered by:** `Jenkinsfile.backend`

### Scenario 3: Frontend CI/CD Pipeline
```bash
# Jenkins automatically uses simple frontend compose
docker-compose -f docker-compose.frontend.yml up -d --build
```
**File:** `docker-compose.frontend.yml`  
**Triggered by:** `Jenkinsfile.frontend`

### Scenario 4: Testing Backend Only
```bash
# Manual backend testing
docker-compose -f docker-compose.backend.yml up -d --build
curl http://localhost:8080/api/departments
```
**File:** `docker-compose.backend.yml`

### Scenario 5: Testing Frontend Only
```bash
# Manual frontend testing
docker-compose -f docker-compose.frontend.yml up -d --build
curl http://localhost:80
```
**File:** `docker-compose.frontend.yml`

---

## 🎯 Summary

| Question | Answer |
|----------|--------|
| **Does main compose replace simple files?** | ❌ NO - Different purposes |
| **Can main compose be used for CI/CD?** | ⚠️ YES, but NOT recommended |
| **Why have separate simple files?** | ✅ Faster, isolated, cleaner CI/CD |
| **When to use main compose?** | ✅ Development, production, full stack |
| **When to use simple files?** | ✅ CI/CD pipelines, isolated testing |

---

## 💡 Best Practice

**Use the right file for the right purpose:**

- 🏠 **Development/Production:** `docker-compose.yml`
- 🔧 **Backend CI/CD:** `docker-compose.backend.yml`
- 🎨 **Frontend CI/CD:** `docker-compose.frontend.yml`

This separation ensures:
- ✅ Fast CI/CD pipelines
- ✅ Isolated testing environments
- ✅ Clear separation of concerns
- ✅ No conflicts between environments

