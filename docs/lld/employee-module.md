# Employee Module - Low-Level Design

## 1. Overview

The Employee module handles all employee-related operations including CRUD operations, manager assignment, and employee queries with sorting, filtering, and pagination.

## 2. Entities

### 2.1 Employee Entity

**Location**: `backend/src/main/java/.../models/Employee.java`

```java
@Entity
public class Employee {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;
    
    @Column(nullable = false, unique = true)
    private String email;
    
    private String phone;
    private String address;
    
    @Column(nullable = false)
    private String designation;
    
    @Column(nullable = false)
    private Double salary = 0.0;
    
    @Column(nullable = false)
    private LocalDate joiningDate;
    
    @ManyToOne
    @JoinColumn(nullable = false)
    private Location location;
    
    private Double performanceRating;
    
    @ManyToOne
    private Employee manager; // Self-referential
    
    @ManyToOne
    @JoinColumn(nullable = false)
    private Department department;
    
    @Column(nullable = false)
    private String workLocation;
    
    @Column
    private Integer experienceYears;
    
    // Getters and setters
}
```

**Relationships**:
- `@ManyToOne` → Department
- `@ManyToOne` → Location
- `@ManyToOne` → Employee (manager - self-referential)

## 3. DTOs

### 3.1 EmployeeRequestDTO

**Location**: `backend/src/main/java/.../dtos/EmployeeRequestDTO.java`

**Pattern**: Builder Pattern

```java
@Builder
@Data
public class EmployeeRequestDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String designation;
    private Double salary;
    private LocalDate joiningDate;
    private UUID locationId;
    private UUID managerId;
    private UUID departmentId;
    private String workLocation;
    private Integer experienceYears;
}
```

### 3.2 EmployeeResponseDTO

**Location**: `backend/src/main/java/.../dtos/EmployeeResponseDTO.java`

```java
@Builder
@Data
public class EmployeeResponseDTO {
    private UUID id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String designation;
    private Double salary;
    private LocalDate joiningDate;
    private String locationName;
    private String managerName;
    private String departmentName;
    private String workLocation;
    private Integer experienceYears;
}
```

### 3.3 EmployeeTableRowDTO

**Location**: `backend/src/main/java/.../dtos/EmployeeTableRowDTO.java`

**Purpose**: Optimized DTO for table display (only necessary fields)

```java
@Builder
@Data
public class EmployeeTableRowDTO {
    private UUID id;
    private String name; // firstName + lastName
    private String email;
    private String designation;
    private Double salary;
    private String departmentName;
    private String locationName;
}
```

## 4. Controllers

### 4.1 EmployeeController

**Location**: `backend/src/main/java/.../controllers/EmployeeController.java`

**Endpoints**:

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/employees` | Get all employees | - | `List<EmployeeResponseDTO>` |
| GET | `/api/employees/{id}` | Get employee by ID | - | `EmployeeResponseDTO` |
| POST | `/api/employees` | Create employee | `EmployeeRequestDTO` | `EmployeeResponseDTO` |
| PUT | `/api/employees/{id}` | Update employee | `EmployeeRequestDTO` | `EmployeeResponseDTO` |
| DELETE | `/api/employees/{id}` | Delete employee | - | `void` |
| POST | `/api/employees/query` | Query with filters, sorting, pagination | `TableQueryRequest` | `Page<EmployeeTableRowDTO>` |

**Dependencies**:
- `EmployeeService` - Business logic
- `EmployeeQueryService` - Query operations
- `EmployeeAdapter` - Entity ↔ DTO conversion

**Patterns Applied**:
- **Adapter Pattern**: EmployeeAdapter converts Entity ↔ DTO
- **Template Method**: EmployeeQueryService extends BaseTableQueryService

## 5. Services

### 5.1 EmployeeService

**Location**: `backend/src/main/java/.../services/EmployeeService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `List<Employee>` | Get all employees |
| `getById(UUID id)` | `id` | `EmployeeResponseDTO` | Get employee by ID |
| `create(EmployeeRequestDTO request)` | `request` | `EmployeeResponseDTO` | Create new employee |
| `update(UUID id, EmployeeRequestDTO request)` | `id`, `request` | `EmployeeResponseDTO` | Update employee |
| `delete(UUID id)` | `id` | `void` | Delete employee |

**Dependencies**:
- `EmployeeRepository` - Data access
- `EmployeeAdapter` - Entity ↔ DTO conversion
- `ValidationService` - Business rule validation

**Business Logic**:
- Validates manager is in same department (if manager assigned)
- Converts DTO to Entity and vice versa
- Handles entity persistence

**Patterns Applied**:
- **Adapter Pattern**: EmployeeAdapter for conversions

### 5.2 EmployeeQueryService

**Location**: `backend/src/main/java/.../services/EmployeeQueryService.java`

**Pattern**: Template Method Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `query(TableQueryRequest request)` | `request` | `Page<EmployeeTableRowDTO>` | Execute query with filters, sorting, pagination |
| `fetchData()` | - | `List<EmployeeTableRowDTO>` | Fetch all employee data (abstract method) |
| `applyFilters(List<EmployeeTableRowDTO> data, Map<String, String> filters)` | `data`, `filters` | `List<EmployeeTableRowDTO>` | Apply filter strategies (abstract method) |
| `applySorting(List<EmployeeTableRowDTO> data, String sortBy, String direction)` | `data`, `sortBy`, `direction` | `List<EmployeeTableRowDTO>` | Apply sort strategy (abstract method) |
| `toTableRowDTO(Employee employee)` | `employee` | `EmployeeTableRowDTO` | Convert Entity to TableRow DTO |

**Dependencies**:
- `EmployeeRepository` - Data access
- `SortStrategyFactory` - Sort strategy creation
- `FilterStrategyFactory` - Filter strategy creation

**Pattern**: Template Method Pattern
- Extends `BaseTableQueryService<EmployeeTableRowDTO>`
- Implements template methods for query flow
- Uses Strategy pattern for sorting and filtering

**Patterns Applied**:
- **Template Method**: Extends BaseTableQueryService
- **Strategy Pattern**: Sorting and filtering strategies
- **Factory Method**: StrategyFactory for creating strategies

## 6. Repositories

### 6.1 EmployeeRepository

**Location**: `backend/src/main/java/.../repositories/EmployeeRepository.java`

```java
@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    
    List<Employee> findByDepartmentId(UUID departmentId);
    
    List<Employee> findByManagerId(UUID managerId);
    
    Optional<Employee> findByEmail(String email);
    
    @Query("SELECT AVG(e.salary) FROM Employee e")
    Double findAverageSalary();
    
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.department.id = :departmentId")
    Long countByDepartment(@Param("departmentId") UUID departmentId);
}
```

## 7. Mappers/Adapters

### 7.1 EmployeeAdapter

**Location**: `backend/src/main/java/.../adapters/EmployeeAdapter.java`

**Pattern**: Adapter Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toResponseDTO(Employee employee)` | `employee` | `EmployeeResponseDTO` | Convert Entity to Response DTO |
| `toEntity(EmployeeRequestDTO request)` | `request` | `Employee` | Convert Request DTO to Entity |

**Responsibilities**:
- Maps Entity fields to Response DTO (includes denormalized names)
- Maps Request DTO to Entity (basic fields only)
- Note: Relationships (location, manager, department) are resolved by IDs in service layer

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Builder** | EmployeeRequestDTO, EmployeeResponseDTO | Immutable DTO construction |
| **Adapter** | EmployeeAdapter | Entity ↔ DTO conversion |
| **Template Method** | BaseTableQueryService | Common query logic |
| **Strategy** | SortStrategy, FilterStrategy | Sorting/filtering algorithms |
| **Factory Method** | SortStrategyFactory, FilterStrategyFactory | Strategy creation |

## 9. Sequence Diagrams

See:
- `docs/diagrams/sequence/employee-create-flow.puml` - Employee creation flow
- `docs/diagrams/sequence/employee-query-flow.puml` - Employee query with filters, sorting, pagination
- `docs/diagrams/sequence/table-pagination-flow.puml` - Frontend table pagination flow

## 10. State Diagrams

See:
- `docs/diagrams/state/employee-lifecycle-state.puml` - Employee lifecycle state machine

## 11. ER Diagram

See:
- `docs/diagrams/architecture/database-er-diagram.puml` - Database entity relationships

## 12. Future Enhancements

- **Caching**: Add Redis caching for frequently accessed employees
- **Search**: Full-text search capability
- **Bulk Operations**: Bulk create/update/delete
- **Export**: CSV/PDF export functionality

---

**Status**: Active  
**Last Updated**: 2024-12-10

