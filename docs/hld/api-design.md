# API Design

## 1. REST API Conventions

### 1.1 Base URL
- **Development**: `http://localhost:8080/api`
- **Production**: `https://api.employee-management-system.com/api`

### 1.2 API Versioning
- **Current Version**: v1 (implicit)
- **Versioning Strategy**: URL-based versioning (future: `/api/v1/...`)
- **Backward Compatibility**: Maintained for at least 2 major versions

### 1.3 HTTP Methods
- **GET**: Retrieve resources
- **POST**: Create new resources
- **PUT**: Update existing resources (full update)
- **DELETE**: Delete resources
- **PATCH**: Partial update (future)

### 1.4 Response Format
- **Content-Type**: `application/json`
- **Character Encoding**: UTF-8
- **Date Format**: ISO 8601 (`YYYY-MM-DD`)

### 1.5 Status Codes
- **200 OK**: Successful GET, PUT, DELETE
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE (no body)
- **400 Bad Request**: Invalid request data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## 2. Endpoint Catalog

### 2.1 Employee Endpoints

**Base Path**: `/api/employees`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/employees` | Get all employees | 200 |
| GET | `/api/employees/{id}` | Get employee by ID | 200, 404 |
| POST | `/api/employees` | Create new employee | 201, 400 |
| PUT | `/api/employees/{id}` | Update employee | 200, 404, 400 |
| DELETE | `/api/employees/{id}` | Delete employee | 204, 404 |
| POST | `/api/employees/query` | Advanced query with filters, sorting, pagination | 200, 400 |

---

### 2.2 Department Endpoints

**Base Path**: `/api/departments`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/departments` | Get all departments | 200 |
| GET | `/api/departments/{id}` | Get department by ID | 200, 404 |
| POST | `/api/departments` | Create new department | 201, 400 |
| PUT | `/api/departments/{id}` | Update department | 200, 404, 400 |
| DELETE | `/api/departments/{id}` | Delete department | 204, 404 |

---

### 2.3 Location Endpoints

**Base Path**: `/api/locations`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/locations` | Get all locations | 200 |
| GET | `/api/locations/{id}` | Get location by ID | 200, 404 |
| POST | `/api/locations` | Create new location | 201, 400 |
| PUT | `/api/locations/{id}` | Update location | 200, 404, 400 |
| DELETE | `/api/locations/{id}` | Delete location | 204, 404 |

---

### 2.4 Project Endpoints

**Base Path**: `/api/projects`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/projects` | Get all projects | 200 |
| GET | `/api/projects/{id}` | Get project by ID | 200, 404 |
| POST | `/api/projects` | Create new project | 201, 400 |
| PUT | `/api/projects/{id}` | Update project | 200, 404, 400 |
| DELETE | `/api/projects/{id}` | Delete project | 204, 404 |

---

### 2.5 Task Endpoints

**Base Path**: `/api/tasks`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/tasks` | Get all tasks | 200 |
| GET | `/api/tasks/{id}` | Get task by ID | 200, 404 |
| POST | `/api/tasks` | Create new task | 201, 400 |
| PUT | `/api/tasks/{id}` | Update task | 200, 404, 400 |
| DELETE | `/api/tasks/{id}` | Delete task | 204, 404 |

---

### 2.6 Employee-Project Endpoints

**Base Path**: `/api/employee-projects`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/employee-projects` | Get all employee-project assignments | 200 |
| GET | `/api/employee-projects/{employeeId}/{projectId}` | Get assignment by composite key | 200, 404 |
| POST | `/api/employee-projects` | Create new assignment | 201, 400 |
| PUT | `/api/employee-projects/{employeeId}/{projectId}` | Update assignment | 200, 404, 400 |
| DELETE | `/api/employee-projects/{employeeId}/{projectId}` | Delete assignment | 204, 404 |

---

### 2.7 Dashboard Endpoints

**Base Path**: `/api/dashboard`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/dashboard/metrics` | Get all dashboard metrics | 200 |
| GET | `/api/dashboard/graphs` | Get graph data | 200 |

---

### 2.8 Authentication Endpoints

**Base Path**: `/api/auth`

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| POST | `/api/auth/login` | User login | 200, 401 |
| POST | `/api/auth/logout` | User logout | 200 |
| POST | `/api/auth/refresh` | Refresh token | 200, 401 |

---

## 3. Request/Response Formats

### 3.1 Employee DTOs

#### EmployeeRequestDTO (Request)

**Used for**: `POST /api/employees`, `PUT /api/employees/{id}`

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "address": "123 Main St, City, State 12345",
  "designation": "Software Engineer",
  "salary": 75000.00,
  "joiningDate": "2023-01-15",
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "performanceRating": 4.5,
  "managerId": "550e8400-e29b-41d4-a716-446655440002",
  "departmentId": "550e8400-e29b-41d4-a716-446655440003",
  "workLocation": "New York Office",
  "experienceYears": 5
}
```

**Fields**:
- `firstName` (String, required): Employee first name
- `lastName` (String, required): Employee last name
- `email` (String, required, unique): Email address
- `phone` (String, optional): Phone number
- `address` (String, optional): Residential address
- `designation` (String, required): Job title/role
- `salary` (Double, required): Annual salary
- `joiningDate` (Date, required): Employment start date (ISO 8601)
- `locationId` (UUID, required): Reference to location
- `performanceRating` (Double, optional): Performance rating (0.0-5.0)
- `managerId` (UUID, optional): Reference to manager employee
- `departmentId` (UUID, required): Reference to department
- `workLocation` (String, required): Work location name
- `experienceYears` (Integer, optional): Years of experience

**Note**: No `id` field - generated by database on creation.

#### EmployeeResponseDTO (Response)

**Used for**: All GET endpoints, POST/PUT responses

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "address": "123 Main St, City, State 12345",
  "designation": "Software Engineer",
  "salary": 75000.00,
  "joiningDate": "2023-01-15",
  "locationName": "New York Office",
  "performanceRating": 4.5,
  "managerName": "Jane Smith",
  "departmentName": "Engineering",
  "workLocation": "New York Office",
  "experienceYears": 5
}
```

**Fields**:
- `id` (UUID): Employee unique identifier
- `firstName` (String): Employee first name
- `lastName` (String): Employee last name
- `email` (String): Email address
- `phone` (String, optional): Phone number
- `address` (String, optional): Residential address
- `designation` (String): Job title/role
- `salary` (Double): Annual salary
- `joiningDate` (Date): Employment start date (ISO 8601)
- `locationName` (String): Location name (denormalized for better API)
- `performanceRating` (Double, optional): Performance rating (0.0-5.0)
- `managerName` (String, optional): Manager full name (firstName + lastName, null if no manager)
- `departmentName` (String): Department name (denormalized for better API)
- `workLocation` (String): Work location name
- `experienceYears` (Integer, optional): Years of experience

**Note**: Relationships are denormalized as names (locationName, departmentName, managerName) for better frontend experience - no additional API calls needed.

---

### 3.2 Department DTO

#### DepartmentDTO (Request/Response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Engineering",
  "description": "Software development and engineering",
  "locationName": "New York Office",
  "locationId": "550e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2022-01-01",
  "budget": 5000000.00,
  "budgetUtilization": 0.75,
  "performanceMetric": 85.5,
  "departmentHeadId": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Fields**:
- `id` (UUID, optional in request): Department unique identifier
- `name` (String, required, unique): Department name
- `description` (String, optional): Department description
- `locationName` (String, optional): Denormalized location name
- `locationId` (UUID, optional): Reference to location
- `createdAt` (Date, optional in request): Department creation date
- `budget` (Double, optional): Annual budget
- `budgetUtilization` (Double, optional): Budget utilization (0.0-1.0)
- `performanceMetric` (Double, optional): Performance score (0-100)
- `departmentHeadId` (UUID, optional): Reference to department head

---

### 3.3 Location DTO

#### LocationDTO (Request/Response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "New York Office",
  "address": "123 Business Ave",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "postalCode": "10001"
}
```

**Fields**:
- `id` (UUID, optional in request): Location unique identifier
- `name` (String, required, unique): Location name
- `address` (String, optional): Street address
- `city` (String, required): City name
- `state` (String, required): State/Province
- `country` (String, required, default: "USA"): Country
- `postalCode` (String, optional): ZIP/Postal code

---

### 3.4 Project DTO

#### ProjectDTO (Request/Response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "name": "Website Redesign",
  "description": "Complete redesign of company website",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "status": "Active",
  "budget": 250000.00,
  "departmentId": "550e8400-e29b-41d4-a716-446655440003",
  "projectManagerId": "550e8400-e29b-41d4-a716-446655440002"
}
```

**Fields**:
- `id` (UUID, optional in request): Project unique identifier
- `name` (String, required, unique): Project name
- `description` (String, optional): Project description
- `startDate` (Date, required): Project start date
- `endDate` (Date, optional): Project end date
- `status` (String, required): Project status (Planning, Active, On Hold, Completed, Cancelled)
- `budget` (Double, optional): Project budget
- `departmentId` (UUID, required): Reference to department
- `projectManagerId` (UUID, required): Reference to project manager

---

### 3.5 Task DTO

#### TaskDTO (Request/Response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "name": "Design Homepage",
  "description": "Create new homepage design mockups",
  "status": "In Progress",
  "priority": "High",
  "startDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "completedDate": null,
  "projectId": "550e8400-e29b-41d4-a716-446655440004",
  "assignedToId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Fields**:
- `id` (UUID, optional in request): Task unique identifier
- `name` (String, required): Task name
- `description` (String, optional): Task description
- `status` (String, required): Task status (Not Started, In Progress, On Hold, Completed, Cancelled)
- `priority` (String, required): Task priority (Low, Medium, High, Critical)
- `startDate` (Date, required): Task start date
- `dueDate` (Date, optional): Task due date
- `completedDate` (Date, optional): Task completion date
- `projectId` (UUID, required): Reference to project
- `assignedToId` (UUID, optional): Reference to assigned employee

---

### 3.6 Employee-Project DTO

#### EmployeeProjectDTO (Request/Response)

```json
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440004",
  "role": "Developer",
  "assignedDate": "2024-01-01"
}
```

**Fields**:
- `employeeId` (UUID, required): Reference to employee
- `projectId` (UUID, required): Reference to project
- `role` (String, optional): Employee's role in project
- `assignedDate` (Date, optional): Assignment date

---

### 3.7 Employee Query DTOs

#### TableQueryRequest (Request)

**Endpoint**: `POST /api/employees/query`

```json
{
  "filters": {
    "department": "Engineering",
    "designation": "Software Engineer"
  },
  "sortBy": "name",
  "sortDirection": "ASC",
  "page": 0,
  "size": 10
}
```

**Fields**:
- `filters` (Map<String, String>, optional): Key-value pairs for filtering
- `sortBy` (String, optional): Column name to sort by
- `sortDirection` (String, optional): "ASC" or "DESC"
- `page` (Integer, optional, default: 0): Page number (0-indexed)
- `size` (Integer, optional, default: 10): Page size

#### EmployeeTableRowDTO (Response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "designation": "Software Engineer",
  "salary": 75000.00,
  "departmentName": "Engineering",
  "locationName": "New York Office"
}
```

**Fields**:
- `id` (UUID): Employee unique identifier
- `name` (String): Full name (firstName + lastName)
- `email` (String): Email address
- `designation` (String): Job title
- `salary` (Double): Annual salary
- `departmentName` (String): Department name
- `locationName` (String): Location name

#### Page<EmployeeTableRowDTO> (Response)

```json
{
  "content": [
    { /* EmployeeTableRowDTO */ }
  ],
  "totalElements": 150,
  "totalPages": 15,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false
}
```

---

### 3.8 Dashboard DTOs

#### DashboardMetricsDTO (Response)

**Endpoint**: `GET /api/dashboard/metrics`

```json
{
  "totalEmployees": 150,
  "totalDepartments": 8,
  "averageSalary": 75000.00,
  "employeeGrowth": {
    "currentMonth": 5,
    "previousMonth": 3,
    "growthRate": 0.67
  },
  "departmentDistribution": [
    {
      "departmentName": "Engineering",
      "employeeCount": 45,
      "percentage": 30.0
    },
    {
      "departmentName": "Sales",
      "employeeCount": 30,
      "percentage": 20.0
    }
  ]
}
```

**Fields**:
- `totalEmployees` (Integer): Total number of employees
- `totalDepartments` (Integer): Total number of departments
- `averageSalary` (Double): Average salary across organization
- `employeeGrowth` (Object): Growth metrics
- `departmentDistribution` (Array): Employee distribution by department

#### GraphDataDTO (Response)

**Endpoint**: `GET /api/dashboard/graphs`

```json
{
  "employeeGrowthChart": {
    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    "data": [120, 125, 130, 135, 140, 150]
  },
  "departmentDistributionChart": {
    "labels": ["Engineering", "Sales", "HR", "Finance"],
    "data": [45, 30, 25, 20]
  },
  "salaryDistributionChart": {
    "ranges": ["0-50k", "50k-100k", "100k-150k", "150k+"],
    "counts": [20, 80, 40, 10]
  }
}
```

**Fields**:
- `employeeGrowthChart` (Object): Line/bar chart data for employee growth
- `departmentDistributionChart` (Object): Pie/bar chart data for department distribution
- `salaryDistributionChart` (Object): Histogram data for salary distribution

---

### 3.9 Authentication DTOs

#### AuthRequestDTO (Request)

**Endpoint**: `POST /api/auth/login`

```json
{
  "username": "john.doe",
  "password": "securePassword123"
}
```

**Fields**:
- `username` (String, required): Username
- `password` (String, required): Password

#### AuthResponseDTO (Response)

**Endpoint**: `POST /api/auth/login`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "role": "HR Manager"
  },
  "expiresIn": 86400
}
```

**Fields**:
- `token` (String): JWT access token
- `refreshToken` (String): JWT refresh token
- `user` (Object): User information
- `expiresIn` (Integer): Token expiration time in seconds

#### RefreshTokenRequestDTO (Request)

**Endpoint**: `POST /api/auth/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Fields**:
- `refreshToken` (String, required): Refresh token

#### UserDTO (Response)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john.doe",
  "email": "john.doe@example.com",
  "role": "HR Manager",
  "employeeId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Fields**:
- `id` (UUID): User unique identifier
- `username` (String, required, unique): Username
- `email` (String, optional): Email address
- `role` (String, required): User role (System Admin, HR Manager, Department Manager, Employee)
- `employeeId` (UUID, optional): Reference to employee record

---

## 4. Error Handling

### 4.1 Error Response Format

```json
{
  "timestamp": "2024-12-10T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/employees",
  "details": [
    {
      "field": "email",
      "message": "Email must be unique"
    },
    {
      "field": "salary",
      "message": "Salary must be greater than 0"
    }
  ]
}
```

### 4.2 Common Error Scenarios

#### 400 Bad Request
- Invalid request body format
- Missing required fields
- Validation errors
- Invalid data types

**Example**:
```json
{
  "timestamp": "2024-12-10T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: email is required",
  "path": "/api/employees"
}
```

#### 404 Not Found
- Resource ID doesn't exist
- Invalid UUID format

**Example**:
```json
{
  "timestamp": "2024-12-10T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Employee with id 550e8400-e29b-41d4-a716-446655440000 not found",
  "path": "/api/employees/550e8400-e29b-41d4-a716-446655440000"
}
```

#### 500 Internal Server Error
- Unexpected server errors
- Database connection issues

**Example**:
```json
{
  "timestamp": "2024-12-10T10:30:00Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "path": "/api/employees"
}
```

---

## 5. Validation Rules

### 5.1 Employee Validation
- `firstName`: Required, max 100 characters
- `lastName`: Required, max 100 characters
- `email`: Required, valid email format, unique
- `salary`: Required, >= 0
- `joiningDate`: Required, valid date, not in future
- `departmentId`: Required, must exist
- `locationId`: Required, must exist
- `managerId`: Optional, if provided must exist and be in same department
- `performanceRating`: Optional, 0.0-5.0 if provided

### 5.2 Department Validation
- `name`: Required, max 100 characters, unique
- `locationId`: Optional, must exist if provided
- `departmentHeadId`: Optional, must exist if provided
- `budget`: Optional, >= 0 if provided
- `budgetUtilization`: Optional, 0.0-1.0 if provided
- `performanceMetric`: Optional, 0-100 if provided

### 5.3 Location Validation
- `name`: Required, max 100 characters, unique
- `city`: Required, max 100 characters
- `state`: Required, max 100 characters
- `country`: Required, max 100 characters

### 5.4 Project Validation
- `name`: Required, max 100 characters, unique
- `startDate`: Required, valid date
- `endDate`: Optional, must be >= startDate if provided
- `status`: Required, must be one of: Planning, Active, On Hold, Completed, Cancelled
- `budget`: Optional, >= 0 if provided
- `departmentId`: Required, must exist
- `projectManagerId`: Required, must exist

### 5.5 Task Validation
- `name`: Required, max 200 characters
- `status`: Required, must be one of: Not Started, In Progress, On Hold, Completed, Cancelled
- `priority`: Required, must be one of: Low, Medium, High, Critical
- `startDate`: Required, valid date
- `dueDate`: Optional, must be >= startDate if provided
- `completedDate`: Optional, must be >= startDate if provided
- `projectId`: Required, must exist
- `assignedToId`: Optional, must exist if provided

### 5.6 Employee-Project Validation
- `employeeId`: Required, must exist
- `projectId`: Required, must exist
- Composite key (`employeeId`, `projectId`): Must be unique

### 5.7 Query Request Validation
- `filters`: Optional, map of string key-value pairs
- `sortBy`: Optional, must be a valid column name
- `sortDirection`: Optional, must be "ASC" or "DESC"
- `page`: Optional, >= 0, default: 0
- `size`: Optional, > 0, default: 10, max: 100

### 5.8 Authentication Validation
- `username`: Required, max 100 characters
- `password`: Required, min 8 characters
- `refreshToken`: Required, valid JWT token format

---

## 6. Business Rules

### 6.1 Employee Rules
1. **Manager Validation**: If manager is assigned, manager must be in the same department
2. **Email Uniqueness**: Email address must be unique across all employees
3. **Department Assignment**: Employee must belong to exactly one department
4. **Location Assignment**: Employee must be assigned to exactly one location

### 6.2 Department Rules
1. **Name Uniqueness**: Department name must be unique
2. **Head Assignment**: Department head must be an employee (if assigned)
3. **Budget**: Budget must be non-negative

### 6.3 Project Rules
1. **Name Uniqueness**: Project name must be unique
2. **Date Validation**: End date must be >= start date
3. **Status Transitions**: Status must follow valid state machine (see state diagrams)
4. **Manager Assignment**: Project manager must be an employee

### 6.4 Task Rules
1. **Date Validation**: Due date and completed date must be >= start date
2. **Status Transitions**: Status must follow valid state machine (see state diagrams)
3. **Project Assignment**: Task must belong to exactly one project
4. **Employee Assignment**: Task can be assigned to at most one employee

### 6.5 Employee-Project Rules
1. **Unique Assignment**: An employee can only be assigned to a project once (composite key)
2. **Employee Existence**: Employee must exist
3. **Project Existence**: Project must exist

---

## 7. API Versioning Strategy

### 7.1 Current Approach
- **Version**: v1 (implicit, no version in URL)
- **Base Path**: `/api`

### 7.2 Future Versioning
- **URL-based**: `/api/v1/...`, `/api/v2/...`
- **Header-based**: `Accept: application/vnd.ems.v1+json`
- **Deprecation**: Announce 6 months before removal

---

## 8. Rate Limiting (Future)

### 8.1 Limits
- **Per IP**: 1000 requests/hour
- **Per User**: 5000 requests/hour (when authentication implemented)
- **Burst**: 100 requests/minute

### 8.2 Headers
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## 9. Authentication/Authorization Flow (Future)

### 9.1 Authentication
- **Method**: JWT (JSON Web Tokens)
- **Endpoint**: `POST /api/auth/login`
- **Token Expiration**: 24 hours
- **Refresh Token**: 7 days

### 9.2 Authorization
- **Header**: `Authorization: Bearer <token>`
- **Roles**: System Admin, HR Manager, Department Manager, Employee
- **Permissions**: Role-based access control (RBAC)

---

## 10. CORS Configuration

### 10.1 Allowed Origins
- **Development**: `http://localhost:4200`
- **Production**: Configured per environment

### 10.2 Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### 10.3 Allowed Headers
- `Content-Type`, `Authorization`, `X-Requested-With`

---

## 11. OpenAPI/Swagger Specification (Future)

### 11.1 Documentation
- **Swagger UI**: `/swagger-ui.html`
- **OpenAPI JSON**: `/v3/api-docs`
- **Auto-generation**: From Spring annotations

---

## 12. API Best Practices

### 12.1 Naming Conventions
- **Resources**: Plural nouns (`/employees`, `/departments`)
- **IDs**: UUID format
- **Fields**: camelCase

### 12.2 Pagination (Future)
- **Query Parameters**: `?page=1&size=20&sort=name,asc`
- **Response**: Include pagination metadata

### 12.3 Filtering (Future)
- **Query Parameters**: `?departmentId=xxx&status=Active`
- **Operators**: `eq`, `ne`, `gt`, `lt`, `like`

### 12.4 Sorting (Future)
- **Query Parameters**: `?sort=name,asc&sort=salary,desc`
- **Multiple Fields**: Comma-separated

---

## 13. References

- **Database Design**: `docs/hld/database-design.md`
- **Sequence Diagrams**: `docs/diagrams/sequence/`
- **State Diagrams**: `docs/diagrams/state/`
- **LLD Documents**: `docs/lld/`

---

**Status**: Complete  
**Last Updated**: 2024-12-10  
**Version**: 1.0
