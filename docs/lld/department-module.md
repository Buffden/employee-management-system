# Department Module - Low-Level Design

## 1. Overview

The Department module handles department management including CRUD operations, employee counts, and department metrics.

## 2. Entities

### 2.1 Department Entity

**Location**: `backend/src/main/java/.../models/Department.java`

```java
@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    private String description;
    
    @ManyToOne
    private Location location;
    
    @Column(nullable = false)
    private LocalDate createdAt;
    
    private Double budget = 0.0;
    private Double budgetUtilization; // 0-1.0
    private Double performanceMetric; // 0-100
    
    @ManyToOne
    private Employee departmentHead;
    
    private String locationName; // Denormalized for display
    
    // Getters and setters
}
```

## 3. DTOs

### 3.1 DepartmentRequestDTO

**Pattern**: Builder Pattern

```java
@Builder
@Data
public class DepartmentRequestDTO {
    private String name;
    private String description;
    private UUID locationId;
    private Double budget;
    private UUID departmentHeadId;
}
```

### 3.2 DepartmentResponseDTO

```java
@Builder
@Data
public class DepartmentResponseDTO {
    private UUID id;
    private String name;
    private String description;
    private String locationName;
    private Double budget;
    private String departmentHeadName;
    private Integer totalEmployees;
    private LocalDate createdAt;
}
```

## 4. Controllers

### 4.1 DepartmentController

**Endpoints**:
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/{id}` - Update department
- `GET /api/departments/{id}` - Get department by ID
- `DELETE /api/departments/{id}` - Delete department

## 4. Controllers

### 4.1 DepartmentController

**Location**: `backend/src/main/java/.../controllers/DepartmentController.java`

**Endpoints**:

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
- **Adapter Pattern**: DepartmentMapper converts Entity ↔ DTO

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
| `toResponseDTO(Department dept, Long employeeCount)` | `dept`, `employeeCount` | `DepartmentResponseDTO` | Convert Entity to Response DTO with employee count |
| `toEntity(DepartmentRequestDTO dto, Location loc, Employee head)` | `dto`, `loc`, `head` | `Department` | Convert Request DTO to Entity with relationships |

**Responsibilities**:
- Maps Entity to Response DTO (includes employee count and denormalized names)
- Maps Request DTO to Entity (resolves location and department head relationships)

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Builder** | DepartmentRequestDTO, DepartmentResponseDTO | DTO construction |
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

