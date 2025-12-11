# Employee-Project Module - Low-Level Design

## 1. Overview

The Employee-Project module manages the many-to-many relationship between employees and projects, allowing employees to be assigned to multiple projects with specific roles and assignment dates.

## 2. Entities

### 2.1 EmployeeProject Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/EmployeeProject.java`

```java
@Entity
@IdClass(EmployeeProject.EmployeeProjectId.class)
public class EmployeeProject {
    @Id
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;
    
    @Id
    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;
    
    private String role;
    private LocalDate assignedDate;
    
    // Composite key class
    public static class EmployeeProjectId implements Serializable {
        private UUID employee;
        private UUID project;
        // equals and hashCode
    }
    
    // Getters and setters
}
```

**Relationships**:
- `@ManyToOne` → Employee (employee, part of composite key)
- `@ManyToOne` → Project (project, part of composite key)
- **Composite Primary Key**: (`employee_id`, `project_id`)

**Key Characteristics**:
- **Composite Key**: Uses composite primary key instead of separate UUID
- **Junction Table**: Represents many-to-many relationship
- **Additional Fields**: Role and assigned date

## 3. DTOs

### 3.1 EmployeeProjectDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/EmployeeProjectDTO.java`

```java
public class EmployeeProjectDTO {
    private UUID employeeId;
    private UUID projectId;
    private String role;
    private LocalDate assignedDate;
    
    // Getters and setters
}
```

**Fields**:
- `employeeId` (UUID, required): Reference to employee
- `projectId` (UUID, required): Reference to project
- `role` (String, optional): Employee's role in project
- `assignedDate` (Date, optional): Date when employee was assigned

## 4. Controllers

### 4.1 EmployeeProjectController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/EmployeeProjectController.java`

**Endpoints**:

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/employee-projects` | Get all employee-project assignments | 200 |
| GET | `/api/employee-projects/{employeeId}/{projectId}` | Get assignment by composite key | 200, 404 |
| POST | `/api/employee-projects` | Create new assignment | 201, 400 |
| PUT | `/api/employee-projects/{employeeId}/{projectId}` | Update assignment | 200, 404, 400 |
| DELETE | `/api/employee-projects/{employeeId}/{projectId}` | Delete assignment | 204, 404 |

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/employee-projects` | Get all assignments | - | `List<EmployeeProjectDTO>` |
| GET | `/api/employee-projects/{employeeId}/{projectId}` | Get assignment by composite key | - | `EmployeeProjectDTO` |
| POST | `/api/employee-projects` | Create assignment | `EmployeeProjectDTO` | `EmployeeProjectDTO` |
| PUT | `/api/employee-projects/{employeeId}/{projectId}` | Update assignment | `EmployeeProjectDTO` | `EmployeeProjectDTO` |
| DELETE | `/api/employee-projects/{employeeId}/{projectId}` | Delete assignment | - | `void` |

**Dependencies**:
- `EmployeeProjectService` - Business logic
- `EmployeeService` - Employee resolution
- `ProjectService` - Project resolution
- `EmployeeProjectMapper` - Entity ↔ DTO conversion

**Note**: Uses composite key (`employeeId`, `projectId`) for identification

**Patterns Applied**:
- **Adapter Pattern**: EmployeeProjectMapper converts Entity ↔ DTO

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

```java
public class EmployeeProjectMapper {
    public static EmployeeProjectDTO toDTO(EmployeeProject ep) {
        EmployeeProjectDTO dto = new EmployeeProjectDTO();
        dto.setEmployeeId(ep.getEmployee().getId());
        dto.setProjectId(ep.getProject().getId());
        dto.setRole(ep.getRole());
        dto.setAssignedDate(ep.getAssignedDate());
        return dto;
    }
    
    public static EmployeeProject toEntity(
            EmployeeProjectDTO dto, 
            Employee employee, 
            Project project) {
        EmployeeProject ep = new EmployeeProject();
        ep.setEmployee(employee);
        ep.setProject(project);
        ep.setRole(dto.getRole());
        ep.setAssignedDate(dto.getAssignedDate());
        return ep;
    }
}
```

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

## 12. API Endpoint Patterns

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

## 13. Future Enhancements

- **Assignment History**: Track assignment start and end dates
- **Allocation Percentage**: Track percentage of time allocated to project
- **Skills Matching**: Match employees to projects based on skills
- **Workload Balancing**: Ensure employees aren't over-allocated
- **Assignment Analytics**: Reports on employee-project assignments
- **Bulk Assignments**: Assign multiple employees to a project at once

---

**Status**: Complete  
**Last Updated**: 2024-12-10

