# Employee-Project Module - Low-Level Design

## 1. Overview

The Employee-Project module manages the many-to-many relationship between employees and projects, allowing employees to be assigned to multiple projects with specific roles and assignment dates.

## 2. Entities

### 2.1 EmployeeProject Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/EmployeeProject.java`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `employee` | `Employee` | `@Id`, `@ManyToOne`, `@JoinColumn(name="employee_id")` | Employee (part of composite key) |
| `project` | `Project` | `@Id`, `@ManyToOne`, `@JoinColumn(name="project_id")` | Project (part of composite key) |
| `role` | `String` | - | Employee's role in project |
| `assignedDate` | `LocalDate` | - | Date when employee was assigned |

**Composite Key Class**: `EmployeeProjectId`
- Implements `Serializable`
- Contains `employee` (UUID) and `project` (UUID)
- Implements `equals()` and `hashCode()`

**Relationships**:
- `@ManyToOne` → Employee (employee, part of composite key)
- `@ManyToOne` → Project (project, part of composite key)
- **Composite Primary Key**: (`employee_id`, `project_id`)

**Key Characteristics**:
- **Composite Key**: Uses composite primary key instead of separate UUID
- **Junction Table**: Represents many-to-many relationship
- **Additional Fields**: Role and assigned date

## 3. DTOs

### 3.1 EmployeeProjectRequestDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/EmployeeProjectRequestDTO.java`

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | `UUID` | Employee ID (part of composite key) |
| `projectId` | `UUID` | Project ID (part of composite key) |
| `role` | `String` | Employee's role in project |
| `assignedDate` | `LocalDate` | Date when employee was assigned |

**Note**: Both `employeeId` and `projectId` together form the composite key

### 3.2 EmployeeProjectResponseDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/EmployeeProjectResponseDTO.java`

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `employeeId` | `UUID` | Employee ID (part of composite key) |
| `projectId` | `UUID` | Project ID (part of composite key) |
| `employeeName` | `String` | Denormalized employee name (firstName + lastName) |
| `projectName` | `String` | Denormalized project name |
| `role` | `String` | Employee's role in project |
| `assignedDate` | `LocalDate` | Date when employee was assigned |

**Note**: Uses denormalized names (`employeeName`, `projectName`) for better API responses

## 4. Controllers

### 4.1 EmployeeProjectController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/EmployeeProjectController.java`

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/employee-projects` | Get all assignments | - | `List<EmployeeProjectResponseDTO>` |
| GET | `/api/employee-projects/{employeeId}/{projectId}` | Get assignment by composite key | - | `EmployeeProjectResponseDTO` |
| POST | `/api/employee-projects` | Create assignment | `EmployeeProjectRequestDTO` | `EmployeeProjectResponseDTO` |
| PUT | `/api/employee-projects/{employeeId}/{projectId}` | Update assignment | `EmployeeProjectRequestDTO` | `EmployeeProjectResponseDTO` |
| DELETE | `/api/employee-projects/{employeeId}/{projectId}` | Delete assignment | - | `void` |

**Dependencies**:
- `EmployeeProjectService` - Business logic
- `EmployeeService` - Employee resolution
- `ProjectService` - Project resolution
- `EmployeeProjectMapper` - Entity ↔ DTO conversion

**Note**: Uses composite key (`employeeId`, `projectId`) for identification

**Patterns Applied**:
- **Adapter Pattern**: EmployeeProjectMapper converts Entity ↔ DTO (similar to EmployeeMapper, DepartmentMapper, LocationMapper, ProjectMapper, TaskMapper pattern)

## 5. Services

### 5.1 EmployeeProjectService

**Location**: `backend/src/main/java/com/ems/employee_management_system/services/EmployeeProjectService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `List<EmployeeProject>` | Get all assignments |
| `getById(EmployeeProjectId id)` | `id` (composite key) | `EmployeeProject` | Get assignment by composite key |
| `save(EmployeeProject ep)` | `ep` | `EmployeeProject` | Save assignment |
| `delete(EmployeeProjectId id)` | `id` (composite key) | `void` | Delete assignment |

**Dependencies**:
- `EmployeeProjectRepository` - Data access (uses composite key)

**Note**: All operations use `EmployeeProjectId` composite key instead of single UUID

**Patterns Applied**:
- **Adapter Pattern**: EmployeeProjectMapper for Entity ↔ DTO conversions

## 6. Repositories

### 6.1 EmployeeProjectRepository

**Location**: `backend/src/main/java/com/ems/employee_management_system/repositories/EmployeeProjectRepository.java`

```java
@Repository
public interface EmployeeProjectRepository extends JpaRepository<EmployeeProject, EmployeeProjectId> {
    List<EmployeeProject> findByEmployeeId(UUID employeeId);
    
    List<EmployeeProject> findByProjectId(UUID projectId);
    
    List<EmployeeProject> findByRole(String role);
}
```

**Methods**:
- `findAll()`: Get all assignments (inherited)
- `findById(EmployeeProjectId id)`: Get assignment by composite key (inherited)
- `findByEmployeeId(UUID employeeId)`: Get all projects for an employee
- `findByProjectId(UUID projectId)`: Get all employees for a project
- `findByRole(String role)`: Get assignments by role

## 7. Mappers

### 7.1 EmployeeProjectMapper

**Location**: `backend/src/main/java/com/ems/employee_management_system/mappers/EmployeeProjectMapper.java`

**Pattern**: Adapter Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toResponseDTO(EmployeeProject ep)` | `ep` | `EmployeeProjectResponseDTO` | Convert Entity to Response DTO (includes denormalized names) |
| `toEntity(EmployeeProjectRequestDTO dto, Employee employee, Project project)` | `dto`, `employee`, `project` | `EmployeeProject` | Convert Request DTO to Entity (resolves relationships) |

**Responsibilities**:
- Maps Entity to Response DTO (includes denormalized employeeName and projectName)
- Maps Request DTO to Entity (relationships resolved by IDs in controller)

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Adapter** | EmployeeProjectMapper | Entity ↔ DTO conversion |

## 9. Validation Rules

- `employeeId`: Required, must exist
- `projectId`: Required, must exist
- `role`: Optional, max 100 characters
- `assignedDate`: Optional, valid date
- **Composite Key**: (`employeeId`, `projectId`) must be unique

## 10. Business Rules

1. **Unique Assignment**: An employee can only be assigned to a project once (enforced by composite key)
2. **Employee Existence**: Employee must exist
3. **Project Existence**: Project must exist
4. **Cascade Delete**: Deleting employee or project deletes all associated assignments
5. **Role Assignment**: Role is optional but recommended for clarity

## 11. Composite Key Handling

**Composite Key Structure**:

| Property | Type | Description |
|----------|------|-------------|
| `employee` | `UUID` | Employee ID (part of composite key) |
| `project` | `UUID` | Project ID (part of composite key) |

**Requirements**:
- Must implement `Serializable`
- Must implement `equals()` and `hashCode()` methods
- Both fields together form the primary key

**Usage in Repository**:
- Repository extends `JpaRepository<EmployeeProject, EmployeeProjectId>`
- All find operations use `EmployeeProjectId` composite key object
- Path variables in controller are converted to `EmployeeProjectId`

## 12. Role-Based Access Control

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Assignments** | ✅ | ✅ | ✅ | ❌ |
| **View Own Department Assignments** | ✅ | ✅ | ✅ | ❌ |
| **View Own Assignments** | ✅ | ✅ | ✅ | ✅ |
| **Create Assignment** | ✅ | ❌ | ✅ (own dept projects) | ❌ |
| **Update Assignment** | ✅ | ❌ | ✅ (own dept projects) | ❌ |
| **Delete Assignment** | ✅ | ❌ | ✅ (own dept projects) | ❌ |

### 12.1 Implementation Details

**Service Layer Authorization**:

**Example - EmployeeProjectService**:
```java
@PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isProjectInOwnDepartment(#dto.projectId))")
public EmployeeProjectResponseDTO create(EmployeeProjectRequestDTO dto) {
    // Validate project is in Department Manager's department
    if (securityService.hasRole("DEPARTMENT_MANAGER")) {
        UUID userDepartmentId = securityService.getCurrentUserDepartmentId();
        Project project = projectRepository.findById(dto.getProjectId()).orElseThrow();
        if (!project.getDepartment().getId().equals(userDepartmentId)) {
            throw new AccessDeniedException("Can only assign employees to projects in own department");
        }
    }
    // ... create logic
}

@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public Page<EmployeeProjectResponseDTO> getAll(Pageable pageable) {
    String role = securityService.getCurrentUserRole();
    UUID departmentId = securityService.getCurrentUserDepartmentId();
    UUID userId = securityService.getCurrentUserId();
    
    return employeeProjectRepository.findAllFilteredByRole(role, departmentId, userId, pageable)
        .map(mapper::toResponseDTO);
}
```

**Repository-Level Filtering**:
```java
@Query("SELECT ep FROM EmployeeProject ep WHERE " +
       "(:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER') OR " +
       "(:role = 'DEPARTMENT_MANAGER' AND ep.project.department.id = :departmentId) OR " +
       "(:role = 'EMPLOYEE' AND ep.employee.id = :userId)")
Page<EmployeeProject> findAllFilteredByRole(@Param("role") String role,
                                            @Param("departmentId") UUID departmentId,
                                            @Param("userId") UUID userId,
                                            Pageable pageable);
```

**Controller Layer**:
```java
@PostMapping
@PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER')")
public ResponseEntity<EmployeeProjectResponseDTO> create(@Valid @RequestBody EmployeeProjectRequestDTO dto) { ... }

@GetMapping
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public ResponseEntity<PaginatedResponseDTO<EmployeeProjectResponseDTO>> getAll(...) { ... }
```

**Department Manager Scope**:
- Can only manage assignments for projects in their department
- Department determined by `user.employee.department`
- Validation: `@securityService.isProjectInOwnDepartment(projectId)`

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

## 13. API Endpoint Patterns

**Composite Key in URLs**:
- **GET/PUT/DELETE**: `/api/employee-projects/{employeeId}/{projectId}`
- **POST**: `/api/employee-projects` (composite key in request body)

**Example Request**:
```json
POST /api/employee-projects
{
  "employeeId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440004",
  "role": "Developer",
  "assignedDate": "2024-01-01"
}
```

## 14. Future Enhancements

- **Assignment History**: Track assignment start and end dates
- **Allocation Percentage**: Track percentage of time allocated to project
- **Skills Matching**: Match employees to projects based on skills
- **Workload Balancing**: Ensure employees aren't over-allocated
- **Assignment Analytics**: Reports on employee-project assignments
- **Bulk Assignments**: Assign multiple employees to a project at once

---

**Status**: Complete  
**Last Updated**: 2024-12-10

