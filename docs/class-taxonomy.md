# Class Taxonomy & Object Classification

This document provides a comprehensive classification of all classes and objects in the Employee Management System, organized by architectural layers and functional domains.

## Table of Contents

1. [Backend Domain Entities](#1-backend-domain-entities)
2. [Backend Data Transfer Objects (DTOs)](#2-backend-data-transfer-objects-dtos)
3. [Backend Service Layer](#3-backend-service-layer)
4. [Backend Controller Layer](#4-backend-controller-layer)
5. [Backend Repository Layer](#5-backend-repository-layer)
6. [Backend Mapper Layer](#6-backend-mapper-layer)
7. [Backend Configuration](#7-backend-configuration)
8. [Frontend Component Layer](#8-frontend-component-layer)
9. [Frontend Service Layer](#9-frontend-service-layer)
10. [Frontend Model Layer](#10-frontend-model-layer)
11. [Frontend Constants & Configuration](#11-frontend-constants--configuration)
12. [Classification Summary](#12-classification-summary)

---

## 1. Backend Domain Entities

**Classification**: Domain Model / Entity Classes  
**Layer**: Persistence Layer  
**Pattern**: JPA Entity  
**Location**: `backend/src/main/java/com/ems/employee_management_system/models/`

### 1.1 Core Business Entities

#### Employee
- **Class Name**: `Employee`
- **Type**: JPA Entity
- **Purpose**: Represents an employee in the organization
- **Key Attributes**:
  - `id` (UUID, Primary Key)
  - `firstName`, `lastName` (String, Required)
  - `email` (String, Unique, Required)
  - `phone`, `address` (String, Optional)
  - `designation` (String, Required)
  - `salary` (Double, Required)
  - `joiningDate` (LocalDate, Required)
  - `performanceRating` (Double, Optional)
  - `experienceYears` (Integer, Optional)
- **Relationships**:
  - `@ManyToOne` → `Department` (department)
  - `@ManyToOne` → `Location` (location)
  - `@ManyToOne` → `Employee` (manager - self-referential)
- **Classification**: Core Domain Entity

#### Department
- **Class Name**: `Department`
- **Type**: JPA Entity
- **Purpose**: Represents an organizational department
- **Key Attributes**:
  - `id` (UUID, Primary Key)
  - `name` (String, Unique, Required)
  - `description` (String, Optional)
  - `budget` (Double, Optional)
  - `budgetUtilization` (Double, Optional)
  - `performanceMetric` (Double, Optional)
  - `createdAt` (LocalDate, Required)
  - `locationName` (String, Denormalized)
- **Relationships**:
  - `@ManyToOne` → `Location` (location)
  - `@ManyToOne` → `Employee` (departmentHead)
- **Classification**: Core Domain Entity

#### Location
- **Class Name**: `Location`
- **Type**: JPA Entity
- **Purpose**: Represents a physical office location
- **Key Attributes**:
  - `id` (UUID, Primary Key)
  - `name` (String, Unique, Required)
  - `address` (String, Optional)
  - `city` (String, Required)
  - `state` (String, Required)
  - `country` (String, Required, Default: "USA")
  - `postalCode` (String, Optional)
- **Relationships**: Referenced by Employee and Department
- **Classification**: Reference Data Entity

#### Project
- **Class Name**: `Project`
- **Type**: JPA Entity
- **Purpose**: Represents a project within the organization
- **Key Attributes**:
  - `id` (UUID, Primary Key)
  - `name` (String, Unique, Required)
  - `description` (String, Optional, TEXT)
  - `startDate` (LocalDate, Required)
  - `endDate` (LocalDate, Optional)
  - `status` (String, Required)
  - `budget` (Double, Optional)
- **Relationships**:
  - `@ManyToOne` → `Department` (department)
  - `@ManyToOne` → `Employee` (projectManager)
- **Classification**: Core Domain Entity

#### Task
- **Class Name**: `Task`
- **Type**: JPA Entity
- **Purpose**: Represents a task within a project
- **Key Attributes**:
  - `id` (UUID, Primary Key)
  - `name` (String, Required)
  - `description` (String, Optional, TEXT)
  - `status` (String, Required)
  - `priority` (String, Required)
  - `startDate` (LocalDate, Required)
  - `dueDate` (LocalDate, Optional)
  - `completedDate` (LocalDate, Optional)
- **Relationships**:
  - `@ManyToOne` → `Project` (project)
  - `@ManyToOne` → `Employee` (assignedTo)
- **Classification**: Core Domain Entity

#### EmployeeProject
- **Class Name**: `EmployeeProject`
- **Type**: JPA Entity (Join Table)
- **Purpose**: Represents many-to-many relationship between Employee and Project
- **Key Attributes**:
  - `employee` (Employee, Composite Key)
  - `project` (Project, Composite Key)
  - `role` (String, Optional)
  - `assignedDate` (LocalDate, Optional)
- **Relationships**:
  - `@ManyToOne` → `Employee` (employee)
  - `@ManyToOne` → `Project` (project)
- **Classification**: Association Entity

#### User
- **Class Name**: `User`
- **Type**: JPA Entity
- **Purpose**: Represents system user account for authentication and authorization
- **Key Attributes**:
  - `id` (UUID, Primary Key)
  - `username` (String, Unique, Required)
  - `password` (String, Required, BCrypt hashed)
  - `email` (String, Optional)
  - `role` (String, Required) - Values: `SYSTEM_ADMIN`, `HR_MANAGER`, `DEPARTMENT_MANAGER`, `EMPLOYEE`
  - `createdAt` (LocalDateTime, Required)
  - `lastLogin` (LocalDateTime, Optional)
- **Relationships**:
  - `@ManyToOne` → `Employee` (employee, optional link to employee record)
- **Classification**: Security/Authentication Entity
- **See**: `docs/security/roles-and-permissions.md` for role definitions

---

## 2. Backend Data Transfer Objects (DTOs)

**Classification**: Data Transfer Objects  
**Layer**: Presentation Layer  
**Pattern**: DTO Pattern  
**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/`

### 2.1 Request DTOs

#### EmployeeDTO
- **Type**: Request/Response DTO
- **Purpose**: Transfers employee data between client and server
- **Classification**: Data Transfer Object

#### DepartmentDTO
- **Type**: Request/Response DTO
- **Purpose**: Transfers department data between client and server
- **Classification**: Data Transfer Object

#### LocationDTO
- **Type**: Request/Response DTO
- **Purpose**: Transfers location data between client and server
- **Classification**: Data Transfer Object

#### ProjectDTO
- **Type**: Request/Response DTO
- **Purpose**: Transfers project data between client and server
- **Classification**: Data Transfer Object

#### TaskDTO
- **Type**: Request/Response DTO
- **Purpose**: Transfers task data between client and server
- **Classification**: Data Transfer Object

#### EmployeeProjectDTO
- **Type**: Request/Response DTO
- **Purpose**: Transfers employee-project assignment data
- **Classification**: Data Transfer Object

### 2.2 Authentication DTOs

#### AuthRequestDTO
- **Type**: Request DTO
- **Purpose**: Transfers login credentials (username, password)
- **Classification**: Authentication DTO

#### AuthResponseDTO
- **Type**: Response DTO
- **Purpose**: Transfers authentication response (token, refreshToken, user info)
- **Classification**: Authentication DTO

#### UserDTO
- **Type**: Response DTO
- **Purpose**: Transfers user information (id, username, email, role, employeeId)
- **Classification**: Authentication DTO

#### RefreshTokenRequestDTO
- **Type**: Request DTO
- **Purpose**: Transfers refresh token for token renewal
- **Classification**: Authentication DTO

---

## 3. Backend Service Layer

**Classification**: Business Logic Services  
**Layer**: Service Layer  
**Pattern**: Service Pattern  
**Location**: `backend/src/main/java/com/ems/employee_management_system/services/`

### 3.1 Domain Services

#### EmployeeService
- **Type**: Domain Service
- **Purpose**: Business logic for employee operations
- **Methods**: `getAll()`, `getById()`, `save()`, `delete()`
- **Classification**: Business Service

#### DepartmentService
- **Type**: Domain Service
- **Purpose**: Business logic for department operations
- **Methods**: `getAll()`, `getById()`, `save()`, `delete()`
- **Classification**: Business Service

#### LocationService
- **Type**: Domain Service
- **Purpose**: Business logic for location operations
- **Methods**: `getAll()`, `getById()`, `save()`, `delete()`
- **Classification**: Business Service

#### ProjectService
- **Type**: Domain Service
- **Purpose**: Business logic for project operations
- **Methods**: `getAll()`, `getById()`, `save()`, `delete()`
- **Classification**: Business Service

#### TaskService
- **Type**: Domain Service
- **Purpose**: Business logic for task operations
- **Methods**: `getAll()`, `getById()`, `save()`, `delete()`
- **Classification**: Business Service

#### EmployeeProjectService
- **Type**: Domain Service
- **Purpose**: Business logic for employee-project assignments
- **Methods**: Assignment management operations
- **Classification**: Business Service

#### AuthService
- **Type**: Authentication Service
- **Purpose**: Handles user authentication and token management
- **Methods**: `authenticate()`, `refreshToken()`, `logout()`
- **Dependencies**: `UserRepository`, `JWTManager`, `PasswordEncoder`
- **Classification**: Security Service

#### JWTManager
- **Type**: Utility/Manager (Singleton Pattern)
- **Purpose**: JWT token generation and validation
- **Methods**: `generateToken()`, `generateRefreshToken()`, `validateToken()`
- **Classification**: Security Utility

#### SecurityService
- **Type**: Security Helper Service
- **Purpose**: Provides RBAC helper methods for role-based access checks
- **Methods**: 
  - `getCurrentUser()`, `getCurrentUserId()`, `getCurrentUserRole()`
  - `getCurrentUserDepartmentId()`, `getCurrentUserEmployeeId()`
  - `isInOwnDepartment()`, `isOwnDepartment()`, `isOwnRecord()`
  - `isProjectInOwnDepartment()`, `isTaskProjectInOwnDepartment()`, `isTaskAssignedToUser()`
- **Dependencies**: `SecurityContextHolder`, `UserRepository`
- **Classification**: Security Service
- **See**: `docs/lld/auth-module.md` Section 14.4.2 for complete API

---

## 4. Backend Controller Layer

**Classification**: REST Controllers  
**Layer**: Presentation Layer  
**Pattern**: MVC Controller  
**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/`

### 4.1 REST Controllers

#### EmployeeController
- **Type**: REST Controller
- **Base Path**: `/api/employees`
- **Endpoints**: GET, POST, PUT, DELETE
- **Classification**: API Endpoint Controller

#### DepartmentController
- **Type**: REST Controller
- **Base Path**: `/api/departments`
- **Endpoints**: GET, POST, PUT, DELETE
- **Classification**: API Endpoint Controller

#### LocationController
- **Type**: REST Controller
- **Base Path**: `/api/locations`
- **Endpoints**: GET, POST, PUT, DELETE
- **Classification**: API Endpoint Controller

#### ProjectController
- **Type**: REST Controller
- **Base Path**: `/api/projects`
- **Endpoints**: GET, POST, PUT, DELETE
- **Classification**: API Endpoint Controller

#### TaskController
- **Type**: REST Controller
- **Base Path**: `/api/tasks`
- **Endpoints**: GET, POST, PUT, DELETE
- **Classification**: API Endpoint Controller

#### EmployeeProjectController
- **Type**: REST Controller
- **Base Path**: `/api/employee-projects`
- **Endpoints**: Assignment management endpoints
- **Classification**: API Endpoint Controller

#### AuthController
- **Type**: REST Controller
- **Base Path**: `/api/auth`
- **Endpoints**: POST `/login`, POST `/logout`, POST `/refresh`
- **Classification**: Authentication Controller

---

## 5. Backend Repository Layer

**Classification**: Data Access Objects (DAOs)  
**Layer**: Persistence Layer  
**Pattern**: Repository Pattern  
**Location**: `backend/src/main/java/com/ems/employee_management_system/repositories/`

### 5.1 JPA Repositories

#### EmployeeRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<Employee, UUID>`
- **Purpose**: Data access for Employee entity
- **Classification**: Data Access Object

#### DepartmentRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<Department, UUID>`
- **Purpose**: Data access for Department entity
- **Classification**: Data Access Object

#### LocationRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<Location, UUID>`
- **Purpose**: Data access for Location entity
- **Classification**: Data Access Object

#### ProjectRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<Project, UUID>`
- **Purpose**: Data access for Project entity
- **Classification**: Data Access Object

#### TaskRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<Task, UUID>`
- **Purpose**: Data access for Task entity
- **Classification**: Data Access Object

#### EmployeeProjectRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<EmployeeProject, EmployeeProjectId>`
- **Purpose**: Data access for EmployeeProject entity
- **Classification**: Data Access Object

#### UserRepository
- **Type**: JPA Repository Interface
- **Extends**: `JpaRepository<User, UUID>`
- **Purpose**: Data access for User entity (authentication)
- **Methods**: `findByUsername()`, `findByEmail()`, `findByEmployeeId()`
- **Classification**: Data Access Object

---

## 6. Backend Mapper Layer

**Classification**: Object Mappers  
**Layer**: Service Layer  
**Pattern**: Mapper Pattern / Adapter Pattern  
**Location**: `backend/src/main/java/com/ems/employee_management_system/mappers/`

### 6.1 Entity-DTO Mappers

#### EmployeeMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between Employee entity and EmployeeDTO
- **Methods**: `toDTO()`, `toEntity()`
- **Classification**: Transformation Utility

#### DepartmentMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between Department entity and DepartmentDTO
- **Methods**: `toDTO()`, `toEntity()`
- **Classification**: Transformation Utility

#### LocationMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between Location entity and LocationDTO
- **Methods**: `toDTO()`, `toEntity()`
- **Classification**: Transformation Utility

#### ProjectMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between Project entity and ProjectDTO
- **Methods**: `toDTO()`, `toEntity()`
- **Classification**: Transformation Utility

#### TaskMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between Task entity and TaskDTO
- **Methods**: `toDTO()`, `toEntity()`
- **Classification**: Transformation Utility

#### EmployeeProjectMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between EmployeeProject entity and EmployeeProjectDTO
- **Methods**: `toDTO()`, `toEntity()`
- **Classification**: Transformation Utility

#### UserMapper
- **Type**: Static Mapper Utility
- **Purpose**: Converts between User entity and UserDTO
- **Methods**: `toDTO()`
- **Classification**: Transformation Utility

---

## 7. Backend Configuration

**Classification**: Configuration Classes  
**Layer**: Infrastructure Layer  
**Pattern**: Configuration Pattern  
**Location**: `backend/src/main/java/com/ems/employee_management_system/config/`

### 7.1 Security Configuration

#### SecurityConfig
- **Type**: Spring Security Configuration
- **Purpose**: Configures Spring Security filter chain, JWT authentication, and method-level security
- **Key Components**:
  - `SecurityFilterChain` - Main security filter chain configuration
  - `PasswordEncoder` - BCrypt password encoder (strength 10)
  - `UserDetailsService` - User loading for authentication
- **Annotations**: `@Configuration`, `@EnableWebSecurity`, `@EnableMethodSecurity`
- **Configuration**:
  - Public endpoints: `/api/auth/**`
  - Protected endpoints: All `/api/**` (require authentication)
  - JWT filter: Applied before authentication filter
  - Method security: `@PreAuthorize` annotations enabled
- **Classification**: Security Configuration
- **See**: `docs/lld/auth-module.md` Section 5.3 for detailed configuration

#### JwtAuthenticationFilter
- **Type**: Spring Security Filter
- **Purpose**: Intercepts requests, validates JWT tokens, and sets authentication context
- **Flow**:
  1. Extract JWT from `Authorization: Bearer <token>` header
  2. Validate token signature and expiration
  3. Extract user details (username, role) from token claims
  4. Create `Authentication` object with authorities
  5. Set authentication in `SecurityContextHolder`
- **Dependencies**: `JWTManager`, `UserDetailsService`
- **Classification**: Security Filter
- **See**: `docs/lld/auth-module.md` Section 5.4 for implementation details

#### UserDetailsServiceImpl
- **Type**: Spring Security UserDetailsService Implementation
- **Purpose**: Loads user details from database for authentication
- **Key Method**: `loadUserByUsername(String username)`
- **Responsibilities**:
  - Load user from database by username
  - Convert `User` entity to Spring Security `UserDetails`
  - Map role to Spring Security authorities
- **Dependencies**: `UserRepository`
- **Classification**: Security Service
- **See**: `docs/lld/auth-module.md` Section 5.5 for implementation details

#### CustomAuthenticationEntryPoint
- **Type**: Spring Security AuthenticationEntryPoint Implementation
- **Purpose**: Handles unauthenticated requests (401 Unauthorized)
- **Key Method**: `commence(...)` - Returns 401 JSON error response
- **Responsibilities**:
  - Intercepts requests without valid authentication
  - Returns JSON error response with 401 status
  - Logs unauthorized access attempts
- **Classification**: Security Component
- **See**: `docs/lld/auth-module.md` Section 5.6 for implementation details

#### CustomAccessDeniedHandler
- **Type**: Spring Security AccessDeniedHandler Implementation
- **Purpose**: Handles unauthorized requests (403 Forbidden)
- **Key Method**: `handle(...)` - Returns 403 JSON error response
- **Responsibilities**:
  - Intercepts requests with valid authentication but insufficient permissions
  - Returns JSON error response with 403 status
  - Logs access denied attempts with user and resource information
- **Classification**: Security Component
- **See**: `docs/lld/auth-module.md` Section 5.7 for implementation details

#### DataInitializer
- **Type**: Spring Boot CommandLineRunner Configuration
- **Purpose**: Creates initial admin user on application startup
- **Key Method**: `initDatabase(...)` - CommandLineRunner bean
- **Responsibilities**:
  - Checks if admin user exists
  - Creates admin user if not found
  - Uses `PasswordEncoder` for password hashing
  - Logs creation status
- **Dependencies**: `UserRepository`, `PasswordEncoder`
- **Classification**: Initialization Component
- **See**: `docs/lld/auth-module.md` Section 5.9 for implementation details

#### GlobalExceptionHandler
- **Type**: Spring `@ControllerAdvice` Exception Handler
- **Purpose**: Centralized exception handling for security-related exceptions
- **Key Methods**:
  - `handleAccessDeniedException(...)` - Returns 403 Forbidden
  - `handleAuthenticationException(...)` - Returns 401 Unauthorized
- **Security Exception Handlers**:
  - `AccessDeniedException` → 403 Forbidden
  - `AuthenticationException` → 401 Unauthorized
  - `BadCredentialsException` → 401 Unauthorized
- **Classification**: Exception Handler
- **See**: `docs/lld/auth-module.md` Section 5.8 for implementation details

### 7.2 Configuration Classes

#### WebConfig
- **Type**: Spring Configuration Class
- **Purpose**: Web-related configuration (CORS, etc.)
- **Classification**: Infrastructure Configuration

#### EmployeeManagementSystemApplication
- **Type**: Spring Boot Application Main Class
- **Purpose**: Application entry point
- **Classification**: Application Bootstrap

---

## 8. Frontend Component Layer

**Classification**: Angular Components  
**Layer**: Presentation Layer  
**Pattern**: Component Pattern  
**Location**: `frontend/src/app/features/` and `frontend/src/app/shared/components/`

### 8.1 Feature Components

#### Employee Components
- **EmployeeListComponent**: Displays list of employees
- **EmployeeDetailComponent**: Displays employee details
- **EmployeeFormComponent**: Form for creating/editing employees
- **Classification**: Feature Component

#### Department Components
- **DepartmentListComponent**: Displays list of departments
- **DepartmentDetailComponent**: Displays department details
- **DepartmentFormComponent**: Form for creating/editing departments
- **Classification**: Feature Component

#### Project Components
- **ProjectListComponent**: Displays list of projects
- **ProjectDetailsComponent**: Displays project details
- **Classification**: Feature Component

#### Dashboard Component
- **DashboardComponent**: Displays dashboard metrics and charts
- **Classification**: Feature Component

#### User Profile Component
- **UserProfileComponent**: Displays user profile information
- **Classification**: Feature Component

### 8.2 Shared Components

#### TableComponent
- **Type**: Generic Reusable Component
- **Purpose**: Generic table with sorting, filtering, pagination
- **Classification**: Shared UI Component

#### OverlayDialogComponent
- **Type**: Reusable Dialog Component
- **Purpose**: Modal/overlay dialog for displaying details
- **Classification**: Shared UI Component

#### NoDataComponent
- **Type**: Reusable Component
- **Purpose**: Displays "no data" message
- **Classification**: Shared UI Component

#### HeaderComponent
- **Type**: Layout Component
- **Purpose**: Application header/navigation
- **Classification**: Layout Component

#### FooterComponent
- **Type**: Layout Component
- **Purpose**: Application footer
- **Classification**: Layout Component

---

## 9. Frontend Service Layer

**Classification**: Angular Services  
**Layer**: Service Layer  
**Pattern**: Service Pattern / Facade Pattern  
**Location**: `frontend/src/app/core/services/` and `frontend/src/app/features/*/services/`

### 9.1 Core Services

#### ApiService
- **Type**: HTTP Service
- **Purpose**: Base API communication service
- **Classification**: Infrastructure Service

#### AuthService
- **Type**: Authentication Service
- **Purpose**: Handles authentication and authorization
- **Classification**: Security Service

### 9.2 Feature Services

#### EmployeeService
- **Type**: Domain Service
- **Purpose**: Employee-related API calls
- **Classification**: Business Service

#### DepartmentService
- **Type**: Domain Service
- **Purpose**: Department-related API calls
- **Classification**: Business Service

#### ProjectService
- **Type**: Domain Service
- **Purpose**: Project-related API calls
- **Classification**: Business Service

#### TaskService
- **Type**: Domain Service
- **Purpose**: Task-related API calls
- **Classification**: Business Service

#### ProjectSelectionService
- **Type**: State Management Service
- **Purpose**: Manages selected project state
- **Classification**: State Service

---

## 10. Frontend Model Layer

**Classification**: TypeScript Models/Interfaces  
**Layer**: Domain Layer  
**Pattern**: Model Pattern  
**Location**: `frontend/src/app/shared/models/`

### 10.1 Domain Models

#### EmployeeModel
- **Type**: TypeScript Interface/Class
- **Purpose**: Represents employee data structure
- **Classification**: Domain Model

#### DepartmentModel
- **Type**: TypeScript Interface/Class
- **Purpose**: Represents department data structure
- **Classification**: Domain Model

#### ProjectModel
- **Type**: TypeScript Interface/Class
- **Purpose**: Represents project data structure
- **Classification**: Domain Model

#### TaskModel
- **Type**: TypeScript Interface/Class
- **Purpose**: Represents task data structure
- **Classification**: Domain Model

### 10.2 UI Models

#### TableModel
- **Type**: TypeScript Interface
- **Purpose**: Table configuration and state
- **Classification**: UI Model

#### DialogModel
- **Type**: TypeScript Interface
- **Purpose**: Dialog configuration
- **Classification**: UI Model

---

## 11. Frontend Constants & Configuration

**Classification**: Constants & Configuration  
**Layer**: Configuration Layer  
**Pattern**: Constants Pattern  
**Location**: `frontend/src/app/shared/consts/`

### 11.1 Constants

#### EmployeeConstants
- **Type**: TypeScript Constants
- **Purpose**: Employee-related constants
- **Classification**: Application Constants

#### TableConstants
- **Type**: TypeScript Constants
- **Purpose**: Table-related constants
- **Classification**: Application Constants

### 11.2 Configuration Files

#### TableConfig
- **Type**: Configuration Object
- **Purpose**: Table column configurations
- **Classification**: Configuration Object

#### EmployeeListConfig
- **Type**: Configuration Object
- **Purpose**: Employee list table configuration
- **Classification**: Configuration Object

#### DepartmentListConfig
- **Type**: Configuration Object
- **Purpose**: Department list table configuration
- **Classification**: Configuration Object

---

## 12. Classification Summary

### 12.1 Backend Classifications

| Category | Count | Classification Type |
|----------|-------|-------------------|
| Domain Entities | 6 | JPA Entity |
| DTOs | 6 | Data Transfer Object |
| Services | 6 | Business Service |
| Controllers | 6 | REST Controller |
| Repositories | 6 | Data Access Object |
| Mappers | 6 | Transformation Utility |
| Configuration | 2 | Infrastructure Configuration |

### 12.2 Frontend Classifications

| Category | Count | Classification Type |
|----------|-------|-------------------|
| Feature Components | ~15 | Angular Component |
| Shared Components | 4 | Reusable Component |
| Services | 7 | Angular Service |
| Models | 5 | TypeScript Model |
| Constants | 2 | Application Constants |

### 12.3 Design Pattern Classifications

| Pattern | Applied To | Count |
|---------|-----------|-------|
| **Repository Pattern** | Repositories | 6 |
| **Service Pattern** | Services | 13 |
| **DTO Pattern** | DTOs | 6 |
| **Mapper Pattern** | Mappers | 6 |
| **Component Pattern** | Components | ~19 |
| **Facade Pattern** | Services (future) | TBD |
| **Strategy Pattern** | Sorting/Filtering (future) | TBD |
| **Observer Pattern** | RxJS Services (future) | TBD |

### 12.4 Layer Classifications

| Layer | Backend Classes | Frontend Classes |
|-------|----------------|------------------|
| **Presentation** | Controllers (6) | Components (~19) |
| **Business Logic** | Services (6) | Services (7) |
| **Data Access** | Repositories (6) | Services (API calls) |
| **Domain** | Entities (6) | Models (5) |
| **Infrastructure** | Configuration (2) | Constants (2) |
| **Transformation** | Mappers (6) | Adapters (future) |

---

## 13. Object Lifecycle Classifications

### 13.1 Entity Lifecycle
1. **Creation**: DTO → Mapper → Entity → Repository → Database
2. **Retrieval**: Database → Repository → Entity → Mapper → DTO → Controller → Client
3. **Update**: DTO → Mapper → Entity → Repository → Database
4. **Deletion**: Controller → Service → Repository → Database

### 13.2 Component Lifecycle (Angular)
1. **Initialization**: Constructor → ngOnInit → View Rendering
2. **Data Loading**: Component → Service → API → Backend
3. **User Interaction**: Event → Component Method → Service → API
4. **Destruction**: ngOnDestroy → Cleanup

---

**Status**: Active  
**Last Updated**: 2024-12-10  
**Total Classes Documented**: ~70+ classes and objects  
**Classification System**: Enterprise-Grade Taxonomy

