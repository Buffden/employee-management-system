# Architecture Asymmetries Analysis

This document lists all asymmetries and inconsistencies in the current architecture.

## 📊 Comparison Table: Backend vs Frontend

| Aspect | Backend | Frontend | Asymmetry? |
|--------|---------|----------|------------|
| **Dockerfile Name** | `Dockerfile.app` | `Dockerfile` | ❌ YES - Different naming |
| **Dockerfile Location** | `backend/Dockerfile.app` | `frontend/Dockerfile` | ✅ NO - Both in their folders |
| **Used in Main Compose** | ✅ `docker-compose.yml` | ✅ `docker-compose.yml` | ✅ NO - Both included |
| **Used in Simple Compose** | ✅ `docker-compose.backend.yml` | ❌ NOT included | ❌ YES - Backend only |
| **Service Name in Compose** | `backend` | `frontend` | ✅ NO - Both have services |
| **Container Name** | `ems-backend` | `ems-frontend` | ✅ NO - Consistent naming |
| **Port Exposure** | ❌ Internal only | ✅ Port 80 exposed | ❌ YES - Different exposure |
| **Health Check Endpoint** | `/api/departments` | `/` (root) | ❌ YES - Different endpoints |
| **Nginx Config** | ❌ None (Spring Boot) | ✅ `nginx.conf` | ❌ YES - Frontend uses nginx |
| **Build Tool** | Maven | npm/Angular CLI | ✅ NO - Different by nature |
| **Base Image** | `maven:3.9-eclipse-temurin-17` | `node:18` | ✅ NO - Different by nature |
| **Runtime Image** | `eclipse-temurin:17-jre` | `nginx:alpine` | ✅ NO - Different by nature |

## 📊 Comparison Table: Docker Compose Files

| Aspect | `docker-compose.yml` | `docker-compose.backend.yml` | Asymmetry? |
|--------|---------------------|----------------------------|------------|
| **Purpose** | Full production stack | CI/CD testing | ✅ NO - Different purposes |
| **Services** | postgres, backend, gateway, frontend | postgres, app (backend) | ❌ YES - Different services |
| **Backend Service** | `backend` | `app` | ❌ YES - Different names |
| **Frontend Service** | ✅ Included | ❌ NOT included | ❌ YES - Frontend missing |
| **Gateway Service** | ✅ Included | ❌ NOT included | ❌ YES - Gateway missing |
| **Network Name** | `ems-network` | `app-network` | ❌ YES - Different networks |
| **Volume Names** | `postgres_data` | `postgres_data_ci` | ✅ NO - Different for isolation |
| **Container Names** | `ems-*` | `ems-*-ci` | ✅ NO - CI suffix for isolation |

## 📊 Comparison Table: CI/CD Pipelines

| Aspect | `Jenkinsfile.backend` | `Jenkinsfile.frontend` | Asymmetry? |
|--------|----------------------|------------------------|------------|
| **Uses Simple Compose** | ✅ Yes (`docker-compose.backend.yml`) | ❌ No (uses main compose) | ❌ YES - Different files |
| **Build Stage** | ✅ Maven build | ✅ Angular build | ✅ NO - Both build |
| **Docker Build** | ❌ Uses compose | ✅ Standalone `docker build` | ❌ YES - Different methods |
| **Deploy Method** | ✅ `docker-compose up` | ✅ `docker-compose up` | ✅ NO - Both use compose |
| **Test Stage** | ✅ `mvn test` | ❌ No test stage | ❌ YES - Backend has tests |
| **Cleanup Stage** | ✅ Yes | ❌ No | ❌ YES - Backend has cleanup |
| **Debug Stage** | ✅ Yes | ❌ No | ❌ YES - Backend has debug |

## 📊 Comparison Table: Gateway Configuration

| Aspect | Gateway | Frontend | Asymmetry? |
|--------|---------|----------|------------|
| **Purpose** | API routing only | Serves Angular + proxies API | ❌ YES - Different roles |
| **Port Exposure** | ❌ Internal only | ✅ Port 80 exposed | ❌ YES - Different exposure |
| **Nginx Config** | Routes `/api` to backend | Serves `/` + proxies `/api` to gateway | ❌ YES - Different configs |
| **Dockerfile** | Simple (just nginx) | Multi-stage (build + nginx) | ❌ YES - Different complexity |
| **Health Check** | `/health` endpoint | Root `/` | ❌ YES - Different endpoints |
| **CORS Headers** | ✅ Yes | ❌ No | ❌ YES - Gateway has CORS |

## 📊 Comparison Table: Service Dependencies

| Service | Depends On | Exposed Ports | Internal Ports |
|---------|-----------|---------------|----------------|
| **postgres** | None | ❌ None | 5432 |
| **backend** | postgres | ❌ None | 8080 |
| **gateway** | backend | ❌ None | 80 |
| **frontend** | gateway, backend | ✅ 80:80 | 80 |

**Asymmetry:** Frontend is the only service exposed to host, but depends on gateway which is internal.

## 🔴 Major Asymmetries Identified

### 1. **Dockerfile Naming**
- Backend: `Dockerfile.app`
- Frontend: `Dockerfile`
- **Issue:** Inconsistent naming convention

### 2. **Simple Compose Missing Frontend**
- `docker-compose.backend.yml` only has backend
- Frontend not included in CI/CD testing
- **Issue:** Backend can be tested standalone, frontend cannot

### 3. **Service Name Inconsistency**
- Main compose: `backend`
- Simple compose: `app`
- **Issue:** Same service, different names

### 4. **Network Name Inconsistency**
- Main compose: `ems-network`
- Simple compose: `app-network`
- **Issue:** Different network names

### 5. **CI/CD Pipeline Differences**
- Backend: Uses simple compose, has test stage, has debug stage
- Frontend: Uses main compose, no test stage, no debug stage
- **Issue:** Unequal CI/CD coverage

### 6. **Gateway Role Confusion**
- Gateway: Pure API router (no frontend)
- Frontend: Serves Angular + proxies to gateway
- **Issue:** Gateway seems redundant if frontend already proxies

### 7. **Port Exposure Inconsistency**
- Only frontend exposed (port 80)
- Gateway, backend, postgres all internal
- **Issue:** Gateway could be exposed instead of frontend

### 8. **Health Check Endpoints**
- Backend: `/api/departments` (specific endpoint)
- Frontend: `/` (root)
- Gateway: `/health` (dedicated endpoint)
- **Issue:** Inconsistent health check strategies

## 💡 Recommendations

1. **Standardize Dockerfile naming**: Both should be `Dockerfile` or both `Dockerfile.app`
2. **Add frontend to simple compose**: Create `docker-compose.backend.yml` with frontend support
3. **Unify service names**: Use `backend` in both compose files
4. **Unify network names**: Use `ems-network` in both compose files
5. **Equalize CI/CD pipelines**: Add test/debug stages to frontend pipeline
6. **Clarify gateway role**: Either remove gateway or make it the single entry point
7. **Standardize health checks**: Use consistent health check endpoints
8. **Consider architecture**: Frontend → Gateway → Backend seems redundant if frontend already proxies

