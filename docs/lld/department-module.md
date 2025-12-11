# Department Module - Low-Level Design

## 1. Overview

The Department module handles department management including CRUD operations, employee counts, and department metrics.

## 2. Entities

### 2.1 Department Entity

**Location**: `backend/src/main/java/.../models/Department.java`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | `@Id`, `@GeneratedValue` | Primary key |
| `name` | `String` | `@Column(nullable=false, unique=true)` | Department name (unique) |
| `description` | `String` | - | Department description |
| `location` | `Location` | `@ManyToOne` | Associated location |
| `createdAt` | `LocalDate` | `@Column(nullable=false)` | Creation timestamp |
| `budget` | `Double` | Default: `0.0` | Department budget |
| `budgetUtilization` | `Double` | Range: 0.0-1.0 | Budget utilization ratio |
| `performanceMetric` | `Double` | Range: 0-100 | Performance score |
| `departmentHead` | `Employee` | `@ManyToOne` | Department head employee |
| `locationName` | `String` | - | Denormalized location name (for display) |
| `totalEmployees` | `Integer` | - | Cached employee count |
| `employees` | `List<Employee>` | `@OneToMany(mappedBy="department")`, `@JsonIgnore` | Employees in department (bidirectional) |

**Constructors**:
- Default constructor (required by JPA)
- `Department(String name, String description, Integer totalEmployees)` - Parameterized constructor

## 3. DTOs

### 3.1 DepartmentRequestDTO

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `String` | Department name |
| `description` | `String` | Department description |
| `locationId` | `UUID` | Location ID (for relationship) |
| `budget` | `Double` | Department budget |
| `budgetUtilization` | `Double` | Budget utilization (0.0-1.0) |
| `performanceMetric` | `Double` | Performance metric (0-100) |
| `departmentHeadId` | `UUID` | Department head employee ID |

**Note**: No `id` or `createdAt` fields (auto-generated on server side)

### 3.2 DepartmentResponseDTO

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Department ID |
| `name` | `String` | Department name |
| `description` | `String` | Department description |
| `locationName` | `String` | Denormalized location name |
| `createdAt` | `LocalDate` | Creation timestamp |
| `budget` | `Double` | Department budget |
| `budgetUtilization` | `Double` | Budget utilization (0.0-1.0) |
| `performanceMetric` | `Double` | Performance metric (0-100) |
| `departmentHeadName` | `String` | Denormalized department head name (firstName + lastName) |

**Note**: Uses denormalized names (`locationName`, `departmentHeadName`) for better API responses

## 4. Controllers

### 4.1 DepartmentController

**Location**: `backend/src/main/java/.../controllers/DepartmentController.java`

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/departments` | Get all departments | - | `List<DepartmentResponseDTO>` |
| GET | `/api/departments/{id}` | Get department by ID | - | `DepartmentResponseDTO` |
| POST | `/api/departments` | Create department | `DepartmentRequestDTO` | `DepartmentResponseDTO` |
| PUT | `/api/departments/{id}` | Update department | `DepartmentRequestDTO` | `DepartmentResponseDTO` |
| DELETE | `/api/departments/{id}` | Delete department | - | `void` |

**Dependencies**:
- `DepartmentService` - Business logic
- `LocationService` - Location resolution
- `EmployeeService` - Department head resolution
- `DepartmentRepository` - Employee count calculation

**Patterns Applied**:
- **Adapter Pattern**: DepartmentMapper converts Entity ↔ DTO (similar to EmployeeMapper pattern)

## 5. Services

### 5.1 DepartmentService

**Location**: `backend/src/main/java/.../services/DepartmentService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `List<Department>` | Get all departments |
| `getById(UUID id)` | `id` | `Department` | Get department by ID |
| `save(Department department)` | `department` | `Department` | Save department (validates name uniqueness) |
| `delete(UUID id)` | `id` | `void` | Delete department (validates no employees) |

**Dependencies**:
- `DepartmentRepository` - Data access

**Business Logic**:
- Validates department name uniqueness before save
- Validates no employees in department before delete

**Patterns Applied**:
- **Adapter Pattern**: DepartmentMapper for Entity ↔ DTO conversions

## 6. Repositories

### 6.1 DepartmentRepository

**Location**: `backend/src/main/java/.../repositories/DepartmentRepository.java`

```java
@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByName(String name);
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countEmployeesByDepartment(@Param("departmentId") UUID departmentId);
}
```

**Methods**:
- `findAll()`: Get all departments (inherited from JpaRepository)
- `findById(UUID id)`: Get department by ID (inherited)
- `findByName(String name)`: Find department by name
- `countEmployeesByDepartment(UUID departmentId)`: Count employees in department
- `save(Department department)`: Save department (inherited)
- `deleteById(UUID id)`: Delete department (inherited)

## 7. Mappers

### 7.1 DepartmentMapper

**Location**: `backend/src/main/java/.../mappers/DepartmentMapper.java`

**Pattern**: Adapter Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toResponseDTO(Department department)` | `department` | `DepartmentResponseDTO` | Convert Entity to Response DTO (includes denormalized names) |
| `toEntity(DepartmentRequestDTO dto, Location location, Employee head)` | `dto`, `location`, `head` | `Department` | Convert Request DTO to Entity (resolves relationships) |

**Responsibilities**:
- Maps Entity to Response DTO (includes employee count and denormalized names)
- Maps Request DTO to Entity (resolves location and department head relationships)

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Adapter** | DepartmentMapper | Entity ↔ DTO conversion |

## 9. Validation Rules

- `name`: Required, max 100 characters, unique
- `locationId`: Optional, must exist if provided
- `departmentHeadId`: Optional, must exist if provided
- `budget`: Optional, >= 0 if provided
- `budgetUtilization`: Optional, 0.0-1.0 if provided
- `performanceMetric`: Optional, 0-100 if provided

## 10. Business Rules

1. **Name Uniqueness**: Department name must be unique across all departments
2. **Head Assignment**: Department head must be an employee (if assigned)
3. **Budget**: Budget must be non-negative
4. **Deletion Validation**: Cannot delete department if it has employees
5. **Location Sync**: `locationName` must be kept in sync with `location.name`

## 11. Sequence Diagram

See: `docs/diagrams/sequence/department-create-flow.puml`

## 12. ER Diagram

See: `docs/diagrams/architecture/database-er-diagram.puml` - Database entity relationships

## 13. Future Enhancements

- **Department Hierarchy**: Support for parent-child department relationships
- **Budget Tracking**: Real-time budget vs actual spending
- **Performance Analytics**: Advanced performance metrics and reporting
- **Department Templates**: Pre-configured department templates

---

**Status**: Complete  
**Last Updated**: 2024-12-10

