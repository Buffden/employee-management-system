# System Design

## 1. Architecture Overview

### 1.1 System Architecture

The Employee Management System follows a **layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│                  (Angular Frontend)                     │
│  - Components, Services, State Management                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Gateway Layer                         │
│                    (Nginx Gateway)                      │
│  - Request Routing, Static File Serving, API Proxy       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Application Layer                     │
│                  (Spring Boot Backend)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Controller  │→ │   Service    │→ │ Repository   │ │
│  │    Layer     │  │    Layer     │  │   Layer      │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ JDBC/Hibernate
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Data Layer                            │
│              (PostgreSQL Database)                      │
│  - Entities, Relationships, Constraints                 │
└──────────────────────────────────────────────────────────┘
```

### 1.2 Component Interactions

**Request Flow**:
1. **Client** → Frontend (Angular)
2. **Frontend** → Gateway (Nginx) via HTTP
3. **Gateway** → Backend (Spring Boot) for `/api/*` routes
4. **Backend** → Database (PostgreSQL) via JPA/Hibernate
5. **Response** flows back through the same layers

**Static File Serving**:
- **Gateway** serves Angular static files directly
- No backend involvement for static assets

---

## 2. Design Decisions

### 2.1 Monorepo Structure

**Decision**: Single repository for frontend and backend

**Rationale**:
- **Unified Versioning**: Single version control for all components
- **Easier Development**: Developers can work across layers
- **Atomic Commits**: Changes to API and UI can be committed together
- **Simplified CI/CD**: Single pipeline for entire system

**Trade-offs**:
- ✅ Easier coordination between frontend and backend
- ✅ Single deployment pipeline
- ⚠️ Larger repository size
- ⚠️ Requires discipline to maintain separation

---

### 2.2 Docker Containerization

**Decision**: All services containerized with Docker Compose

**Rationale**:
- **Consistency**: Same environment across dev/staging/prod
- **Isolation**: Services don't interfere with each other
- **Portability**: Easy to deploy anywhere Docker runs
- **Scalability**: Easy to scale individual services

**Architecture**:
- **PostgreSQL**: Separate container with persistent volume
- **Backend**: Spring Boot in container, internal network only
- **Gateway**: Nginx container, exposed on port 80
- **Frontend**: Served by Gateway (built into Gateway image)

---

### 2.3 Unified Gateway Pattern

**Decision**: Single Nginx gateway for both frontend and API routing

**Rationale**:
- **Single Entry Point**: One port (80) for all traffic
- **Simplified Networking**: No need to expose backend port
- **Security**: Backend not directly accessible
- **CORS Handling**: Centralized CORS configuration
- **Load Balancing Ready**: Easy to add multiple backend instances

**Implementation**:
- **Frontend Routes**: Served as static files
- **API Routes**: `/api/*` proxied to backend
- **Health Check**: `/health` endpoint for monitoring

---

### 2.4 Code-First Database Schema

**Decision**: Hibernate `ddl-auto=update` for schema management

**Rationale**:
- **Rapid Development**: No manual SQL scripts
- **Type Safety**: Java types map to SQL types
- **Automatic Sync**: Schema always matches code

**Future Migration**:
- **Production**: Migrate to Flyway/Liquibase
- **Version Control**: Migration scripts in Git
- **Rollback Support**: Ability to rollback migrations

---

### 2.5 UUID Primary Keys

**Decision**: All entities use UUID instead of auto-increment integers

**Rationale**:
- **Distributed Systems**: No conflicts in distributed environments
- **Security**: Non-guessable IDs
- **No Sequential Gaps**: No information leakage
- **Global Uniqueness**: Works across databases

**Trade-offs**:
- ✅ Better for distributed systems
- ✅ More secure
- ⚠️ Slightly larger storage (16 bytes vs 8 bytes)
- ⚠️ Slightly slower indexing (minimal impact)

---

### 2.6 RESTful API Design

**Decision**: RESTful API with standard HTTP methods

**Rationale**:
- **Standard Conventions**: Follows REST principles
- **Stateless**: Each request contains all necessary information
- **Cacheable**: GET requests can be cached
- **Scalable**: Stateless design enables horizontal scaling

**Conventions**:
- **Resources**: Plural nouns (`/employees`, `/departments`)
- **Methods**: GET (read), POST (create), PUT (update), DELETE (delete)
- **Status Codes**: Standard HTTP status codes
- **JSON**: All requests/responses in JSON format

---

### 2.7 Layered Backend Architecture

**Decision**: Three-layer architecture (Controller → Service → Repository)

**Rationale**:
- **Separation of Concerns**: Each layer has distinct responsibility
- **Testability**: Easy to mock dependencies
- **Maintainability**: Changes isolated to specific layers
- **Reusability**: Services can be reused across controllers

**Layers**:
1. **Controller**: HTTP request/response handling
2. **Service**: Business logic and orchestration
3. **Repository**: Data access (JPA)

---

### 2.8 Design Patterns Application

**Decision**: Systematic application of Gang of Four (GoF) design patterns

**Rationale**:
- **Code Quality**: Patterns solve common design problems
- **Maintainability**: Well-known patterns are easier to understand
- **Extensibility**: Patterns enable easy extension
- **Best Practices**: Industry-standard approaches

**Patterns Used**:
- **Creational**: Builder, Factory Method, Singleton
- **Structural**: Adapter, Facade, Composite
- **Behavioral**: Strategy, Observer, Template Method

---

## 3. Technology Choices

### 3.1 Backend Technology Stack

#### Spring Boot 3.4.0
**Why**: 
- **Mature Framework**: Battle-tested, enterprise-grade
- **Rapid Development**: Auto-configuration, embedded server
- **Ecosystem**: Rich ecosystem of Spring projects
- **Community**: Large community and extensive documentation

**Alternatives Considered**:
- Node.js/Express: Less type safety, smaller ecosystem for enterprise apps
- Django: Python ecosystem, but Java better for enterprise integration

#### Java 17
**Why**:
- **LTS Version**: Long-term support until 2029
- **Modern Features**: Records, pattern matching, sealed classes
- **Performance**: Excellent performance for enterprise applications
- **Enterprise Standard**: Widely used in enterprise environments

#### Hibernate JPA
**Why**:
- **ORM Benefits**: Reduces boilerplate SQL code
- **Database Agnostic**: Easy to switch databases
- **Type Safety**: Compile-time type checking
- **Lazy Loading**: Efficient data loading

**Alternatives Considered**:
- MyBatis: More control but more boilerplate
- JOOQ: Type-safe but requires code generation

#### PostgreSQL 15
**Why**:
- **Open Source**: No licensing costs
- **Feature Rich**: Advanced features (JSON, arrays, full-text search)
- **ACID Compliant**: Strong consistency guarantees
- **Performance**: Excellent performance for relational data

**Alternatives Considered**:
- MySQL: Less advanced features
- MongoDB: NoSQL, but relational model fits better

---

### 3.2 Frontend Technology Stack

#### Angular 19.0.5
**Why**:
- **Enterprise Grade**: Built for large-scale applications
- **Type Safety**: TypeScript provides compile-time checks
- **Component-Based**: Reusable, maintainable components
- **SSR Support**: Server-side rendering for better SEO
- **Dependency Injection**: Built-in DI for testability

**Alternatives Considered**:
- React: More flexible but less opinionated (can lead to inconsistency)
- Vue: Simpler but smaller ecosystem

#### TypeScript
**Why**:
- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete, refactoring
- **Maintainability**: Easier to maintain large codebases
- **Industry Standard**: Widely adopted

#### Angular Material 19.0.4
**Why**:
- **Consistent UI**: Pre-built, accessible components
- **Material Design**: Modern, professional look
- **Accessibility**: WCAG compliant components
- **Theming**: Easy customization

---

### 3.3 Infrastructure Technology Stack

#### Docker & Docker Compose
**Why**:
- **Consistency**: Same environment everywhere
- **Isolation**: Services don't interfere
- **Portability**: Run anywhere Docker runs
- **Easy Deployment**: Simple deployment process

#### Nginx
**Why**:
- **High Performance**: Efficient, low memory footprint
- **Reverse Proxy**: Excellent for API routing
- **Static File Serving**: Fast static file delivery
- **Load Balancing**: Built-in load balancing (future)

**Alternatives Considered**:
- Apache: More features but heavier
- Traefik: Good for microservices, overkill for this use case

#### Jenkins
**Why**:
- **Mature**: Battle-tested CI/CD tool
- **Flexible**: Highly configurable pipelines
- **Plugin Ecosystem**: Rich plugin ecosystem
- **Self-Hosted**: Full control over CI/CD infrastructure

**Alternatives Considered**:
- GitHub Actions: Simpler but less control
- GitLab CI: Good but requires GitLab

---

## 4. Scalability Design

### 4.1 Horizontal Scaling Strategy

**Backend Scaling**:
- **Stateless Design**: No session state in backend
- **Load Balancing**: Multiple backend instances behind load balancer
- **Database Connection Pooling**: HikariCP for efficient connections
- **Read Replicas**: PostgreSQL read replicas for read scaling (future)

**Frontend Scaling**:
- **CDN**: Static files served via CDN (CloudFront)
- **Caching**: Browser caching and CDN caching
- **Lazy Loading**: Code splitting for faster initial load

### 4.2 Performance Optimization

**Database**:
- **Indexing**: Strategic indexes on foreign keys and frequently queried columns
- **Query Optimization**: Efficient queries, avoid N+1 problems
- **Connection Pooling**: HikariCP with optimal pool size

**Application**:
- **Caching**: Redis for session and data caching (future)
- **Async Processing**: Background jobs for heavy operations (future)
- **Pagination**: Limit data transfer with pagination

**Frontend**:
- **Bundle Optimization**: Tree shaking, minification
- **Lazy Loading**: Route-based code splitting
- **CDN**: Static assets via CDN

---

## 5. Security Architecture

### 5.1 Authentication

**JWT-Based Authentication**:
- **Stateless**: No server-side session storage
- **Scalable**: Works with multiple backend instances
- **Secure**: Signed tokens prevent tampering

**Implementation**:
- User entity with username/password (`users` table)
- BCrypt password hashing (10 rounds)
- JWT token generation and validation (HS512 algorithm)
- Token refresh mechanism (24-hour access token, 7-day refresh token)
- Role included in JWT claims for authorization

**See**: `docs/lld/auth-module.md` for detailed authentication design

### 5.2 Authorization

**Role-Based Access Control (RBAC)**:
- **Roles**: 
  - `SYSTEM_ADMIN`: Full system access
  - `HR_MANAGER`: HR and employee management
  - `DEPARTMENT_MANAGER`: Department-specific management
  - `EMPLOYEE`: Limited access to own data
- **Permissions**: Feature-level and field-level permissions
- **Implementation**: Spring Security with method-level security (`@PreAuthorize`)
- **Scope Control**: Department Managers limited to their department, Employees limited to own records

**Detailed Permissions**: See `docs/security/roles-and-permissions.md` for complete permission matrix

**Access Control Points**:
1. **API Endpoints**: Role-based endpoint access
2. **Service Methods**: Method-level authorization
3. **Repository Queries**: Role-based data filtering
4. **Frontend Routes**: Route guards for UI access
5. **UI Components**: Conditional rendering based on role

#### 5.2.1 Security Architecture Components

**Backend Security Stack**:

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Spring Security** | Framework | Authentication and authorization framework |
| **JWT (JJWT)** | Library | Token generation and validation |
| **BCrypt** | Algorithm | Password hashing |
| **SecurityFilterChain** | Configuration | Request filtering and security rules |
| **JwtAuthenticationFilter** | Custom Filter | JWT token extraction and validation |
| **Method Security** | `@PreAuthorize` | Method-level role-based authorization |

**Security Flow**:
1. **Request Interception**: `JwtAuthenticationFilter` intercepts all requests
2. **Token Extraction**: Extracts JWT from `Authorization: Bearer <token>` header
3. **Token Validation**: Validates signature, expiration, and claims
4. **Authentication Context**: Sets `Authentication` object in `SecurityContextHolder`
5. **Authorization Check**: `@PreAuthorize` annotations check role permissions
6. **Data Filtering**: Repository queries filter by role scope (department/own records)

#### 5.2.2 Authorization Implementation Layers

**Layer 1: Filter Chain (Request Level)**
- **JwtAuthenticationFilter**: Validates JWT and sets authentication context
- **SecurityFilterChain**: Configures public/private endpoints
- **CORS Filter**: Handles cross-origin requests

**Layer 2: Controller Level**
- **@PreAuthorize on Class**: Default authorization for all endpoints
- **@PreAuthorize on Method**: Endpoint-specific authorization
- **SecurityService**: Helper methods for role checks

**Layer 3: Service Level**
- **@PreAuthorize on Methods**: Business logic authorization
- **Role-based filtering**: Automatic data filtering by role
- **Department scope validation**: Department Manager scope checks

**Layer 4: Repository Level**
- **Custom queries**: Role-based filtering in SQL/JPQL
- **Query parameters**: Role and scope parameters
- **Data isolation**: Automatic filtering by department/employee

#### 5.2.3 Role-Based Data Filtering

**Department Manager Scope**:
- **Department Identification**: `user.employee.department.id`
- **Query Filtering**: All queries automatically filtered by department
- **Validation**: Additional checks ensure department ownership

**Employee Scope**:
- **Own Record**: `user.employee.id`
- **Query Filtering**: All queries filtered to own records only
- **Field Restrictions**: Limited to phone and address updates

**Implementation Pattern**:
```java
// Service method automatically filters by role
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public Page<EmployeeResponseDTO> getAll(Pageable pageable) {
    String role = securityService.getCurrentUserRole();
    UUID departmentId = securityService.getCurrentUserDepartmentId();
    UUID userId = securityService.getCurrentUserId();
    
    Page<Employee> employees = employeeRepository.findAllFilteredByRole(
        role, departmentId, userId, pageable
    );
    return employees.map(mapper::toResponseDTO);
}
```

**SecurityService Helper Methods**:
- `getCurrentUserRole()`: Extract role from JWT token claims
- `getCurrentUserDepartmentId()`: Get department ID for Department Manager scope
- `getCurrentUserEmployeeId()`: Get employee ID for Employee scope
- `isInOwnDepartment(employeeId)`: Check if employee belongs to user's department
- `isOwnDepartment(departmentId)`: Check if department is user's department
- `isOwnRecord(employeeId)`: Check if employee record belongs to current user
- `isProjectInOwnDepartment(departmentId)`: Check project department ownership
- `isTaskProjectInOwnDepartment(projectId)`: Check task's project department
- `isTaskAssignedToUser(taskId)`: Check if task is assigned to current user

**See**: `docs/lld/auth-module.md` Section 14.4.2 for complete SecurityService API

#### 5.2.4 Frontend Authorization

**Route Guards**:
- **AuthGuard**: Requires authentication (all protected routes)
- **RoleGuard**: Requires specific role(s)
- **DepartmentGuard**: Requires department ownership

**Component-Level Security**:
- **Role-based visibility**: `*ngIf` directives based on user role
- **Permission service**: `PermissionService.hasPermission(permission)`
- **Conditional rendering**: Hide/show UI elements based on role

**API Integration**:
- **Token injection**: Automatically adds `Authorization: Bearer <token>` header
- **401 handling**: Redirects to login on token expiration
- **403 handling**: Shows access denied message for unauthorized actions

**Frontend Security Service**:
- **AuthService**: Manages authentication state and JWT token
- **PermissionService**: Provides role and permission checks
- **Role extraction**: Parses role from JWT token claims
- **Department scope**: Extracts department ID for Department Manager role

**Implementation Pattern**:
```typescript
// Route guard
canActivate(route: ActivatedRouteSnapshot): boolean {
  const requiredRoles = route.data['roles'];
  return this.permissionService.hasAnyRole(requiredRoles);
}

// Component template
<button *ngIf="permissionService.canCreate('employee') | async">
  Add Employee
</button>

// Service method
getEmployees(): Observable<Employee[]> {
  const role = this.authService.getCurrentUserRole();
  const departmentId = this.authService.getCurrentUserDepartmentId();
  // Filter API calls based on role
  return this.http.get(`/api/employees?role=${role}&departmentId=${departmentId}`);
}
```

**See**: `docs/lld/frontend-components.md` Section 8.1.4 for detailed implementation examples

### 5.3 Network Security

**CORS Configuration**:
- **Allowed Origins**: Configured per environment
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Credentials**: Support for credentials in requests

**HTTPS**:
- **Production**: All traffic over HTTPS
- **SSL/TLS**: Valid SSL certificates
- **Certificate Management**: Automated certificate renewal

### 5.4 Data Security

**Encryption**:
- **In Transit**: HTTPS/TLS
- **At Rest**: Database encryption (PostgreSQL)

**Credential Management**:
- **Environment Variables**: All credentials in `.env` files
- **Git Ignore**: `.env` files excluded from version control
- **Secrets Management**: AWS Secrets Manager (production)

**Input Validation**:
- **Server-Side**: Jakarta Validation annotations
- **SQL Injection Prevention**: Parameterized queries (JPA)
- **XSS Prevention**: Angular's built-in sanitization

---

## 6. Performance Optimization Strategies

### 6.1 Database Optimization

**Indexing Strategy**:
- Primary key indexes (automatic)
- Foreign key indexes (all FKs indexed)
- Unique indexes (email, names)
- Query optimization indexes (status, priority, dates)

**Query Optimization**:
- Avoid N+1 queries (use JOIN FETCH)
- Use pagination for large datasets
- Optimize aggregation queries
- Use database views for complex queries (future)

### 6.2 Application Optimization

**Connection Pooling**:
- **HikariCP**: Maximum pool size: 10
- **Minimum Idle**: 2 connections
- **Connection Timeout**: 30 seconds
- **Max Lifetime**: 30 minutes

**Caching Strategy** (Future):
- **Redis**: Session storage, frequently accessed data
- **Application Cache**: Caffeine cache for in-memory caching
- **CDN**: Static assets and API responses (where applicable)

### 6.3 Frontend Optimization

**Bundle Optimization**:
- **Tree Shaking**: Remove unused code
- **Minification**: Compress JavaScript/CSS
- **Code Splitting**: Route-based lazy loading
- **Bundle Budgets**: Monitor bundle sizes

**Performance Targets**:
- **Initial Load**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **API Response**: < 200ms (p95)

---

## 7. Error Handling Strategy

### 7.1 Backend Error Handling

**Global Exception Handler**:
- `@ControllerAdvice` for centralized error handling
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages (development) vs generic (production)

**Error Response Format**:
```json
{
  "timestamp": "2024-12-10T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/employees"
}
```

### 7.2 Frontend Error Handling

**HTTP Interceptor**:
- Centralized error handling
- User-friendly error messages
- Retry logic for transient errors
- Logging for debugging

**User Feedback**:
- Toast notifications for errors
- Form validation errors
- Loading states during API calls

---

## 8. Monitoring and Observability (Future)

### 8.1 Logging

**Structured Logging**:
- JSON-formatted logs
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for request tracking
- Centralized log aggregation

### 8.2 Metrics

**Application Metrics**:
- Request count, latency, error rate
- Database query performance
- JVM metrics (memory, GC)

**Infrastructure Metrics**:
- CPU, memory, disk usage
- Network I/O
- Container metrics

### 8.3 Tracing

**Distributed Tracing** (Future):
- Request tracing across services
- Performance analysis
- Dependency mapping

---

## 9. Deployment Architecture

### 9.1 Development Environment

**Local Docker Compose**:
- All services in containers
- PostgreSQL with persistent volume
- Hot reload for development
- Single command startup: `docker-compose up`

### 9.2 Production Environment (Future)

**AWS Infrastructure**:
- **EC2**: Backend instances (auto-scaling group)
- **RDS**: PostgreSQL database (multi-AZ for HA)
- **S3 + CloudFront**: Frontend static files
- **ALB**: Application Load Balancer
- **Route 53**: DNS management

**Deployment Strategy**:
- **Blue-Green Deployment**: Zero-downtime deployments
- **Rolling Updates**: Gradual rollout
- **Health Checks**: Automated health monitoring
- **Rollback**: Quick rollback capability

---

## 10. Future Enhancements

### 10.1 Authentication & Authorization
- User entity and authentication
- JWT token management
- Role-based access control
- OAuth2 integration (future)

### 10.2 Advanced Features
- Full-text search (PostgreSQL)
- Real-time notifications (WebSocket)
- File upload/download
- Email notifications
- Reporting and analytics

### 10.3 Infrastructure
- Kubernetes deployment
- Service mesh (Istio)
- API Gateway (Kong/Apigee)
- Message queue (Kafka/RabbitMQ)

---

## 11. References

- **Database Design**: `docs/hld/database-design.md`
- **API Design**: `docs/hld/api-design.md`
- **Architecture Diagrams**: `docs/diagrams/architecture/`
- **Deployment Diagrams**: `docs/diagrams/deployment/`
- **System Overview**: `docs/architecture/system-overview.md`

---

**Status**: Complete  
**Last Updated**: 2024-12-10  
**Version**: 1.0
