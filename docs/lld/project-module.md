# Project Module - Low-Level Design

## 1. Overview

The Project module handles project management including CRUD operations, status tracking, and employee-project assignments.

## 2. Entities

### 2.1 Project Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/Project.java`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | `@Id`, `@GeneratedValue` | Primary key |
| `name` | `String` | `@Column(nullable=false, unique=true)` | Project name (unique) |
| `description` | `String` | `@Column(columnDefinition="TEXT")` | Project description |
| `startDate` | `LocalDate` | `@Column(nullable=false)` | Project start date |
| `endDate` | `LocalDate` | - | Project end date (optional) |
| `status` | `String` | `@Column(nullable=false)` | Project status |
| `budget` | `Double` | Default: `0.0` | Project budget |
| `department` | `Department` | `@ManyToOne`, `@JoinColumn(nullable=false)` | Associated department |
| `projectManager` | `Employee` | `@ManyToOne`, `@JoinColumn(nullable=false)` | Project manager employee |

**Relationships**:
- `@ManyToOne` → Department (department)
- `@ManyToOne` → Employee (projectManager)
- `@OneToMany` → Task (tasks)
- `@ManyToMany` → Employee (via EmployeeProject)

## 3. DTOs

### 3.1 ProjectRequestDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/ProjectRequestDTO.java`

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `String` | Project name |
| `description` | `String` | Project description |
| `startDate` | `LocalDate` | Project start date |
| `endDate` | `LocalDate` | Project end date (optional) |
| `status` | `String` | Project status |
| `budget` | `Double` | Project budget |
| `departmentId` | `UUID` | Department ID (for relationship) |
| `projectManagerId` | `UUID` | Project manager employee ID |

**Note**: No `id` field (auto-generated on server side)

### 3.2 ProjectResponseDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/ProjectResponseDTO.java`

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Project unique identifier |
| `name` | `String` | Project name |
| `description` | `String` | Project description |
| `startDate` | `LocalDate` | Project start date |
| `endDate` | `LocalDate` | Project end date |
| `status` | `String` | Project status |
| `budget` | `Double` | Project budget |
| `departmentName` | `String` | Denormalized department name |
| `projectManagerName` | `String` | Denormalized project manager name (firstName + lastName) |

**Note**: Uses denormalized names (`departmentName`, `projectManagerName`) for better API responses

## 4. Controllers

### 4.1 ProjectController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/ProjectController.java`

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/projects` | Get all projects | - | `List<ProjectResponseDTO>` |
| GET | `/api/projects/{id}` | Get project by ID | - | `ProjectResponseDTO` |
| POST | `/api/projects` | Create project | `ProjectRequestDTO` | `ProjectResponseDTO` |
| PUT | `/api/projects/{id}` | Update project | `ProjectRequestDTO` | `ProjectResponseDTO` |
| DELETE | `/api/projects/{id}` | Delete project | - | `void` |

**Dependencies**:
- `ProjectService` - Business logic
- `DepartmentService` - Department resolution
- `EmployeeService` - Project manager resolution
- `ProjectMapper` - Entity ↔ DTO conversion

**Patterns Applied**:
- **Adapter Pattern**: ProjectMapper converts Entity ↔ DTO (similar to EmployeeMapper, DepartmentMapper, LocationMapper pattern)

## 5. Services

### 5.1 ProjectService

**Location**: `backend/src/main/java/com/ems/employee_management_system/services/ProjectService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `List<Project>` | Get all projects |
| `getById(UUID id)` | `id` | `Project` | Get project by ID |
| `save(Project project)` | `project` | `Project` | Save project |
| `delete(UUID id)` | `id` | `void` | Delete project |

**Dependencies**:
- `ProjectRepository` - Data access

**Patterns Applied**:
- **Adapter Pattern**: ProjectMapper for Entity ↔ DTO conversions

## 6. Repositories

### 6.1 ProjectRepository

**Location**: `backend/src/main/java/com/ems/employee_management_system/repositories/ProjectRepository.java`

```java
@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByName(String name);
    
    List<Project> findByDepartmentId(UUID departmentId);
    
    List<Project> findByProjectManagerId(UUID managerId);
    
    List<Project> findByStatus(String status);
}
```

**Methods**:
- `findAll()`: Get all projects (inherited)
- `findById(UUID id)`: Get project by ID (inherited)
- `findByName(String name)`: Find project by name
- `findByDepartmentId(UUID departmentId)`: Get projects by department
- `findByProjectManagerId(UUID managerId)`: Get projects by manager
- `findByStatus(String status)`: Get projects by status

## 7. Mappers

### 7.1 ProjectMapper

**Location**: `backend/src/main/java/com/ems/employee_management_system/mappers/ProjectMapper.java`

**Pattern**: Adapter Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toResponseDTO(Project project)` | `project` | `ProjectResponseDTO` | Convert Entity to Response DTO (includes denormalized names) |
| `toEntity(ProjectRequestDTO dto, Department department, Employee projectManager)` | `dto`, `department`, `projectManager` | `Project` | Convert Request DTO to Entity (resolves relationships) |

**Responsibilities**:
- Maps Entity to Response DTO (includes denormalized departmentName and projectManagerName)
- Maps Request DTO to Entity (excludes id, relationships resolved by IDs in controller)

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Adapter** | ProjectMapper | Entity ↔ DTO conversion |

## 9. Validation Rules

- `name`: Required, max 100 characters, unique
- `startDate`: Required, valid date
- `endDate`: Optional, must be >= startDate if provided
- `status`: Required, must be one of: Planning, Active, On Hold, Completed, Cancelled
- `budget`: Optional, >= 0 if provided
- `departmentId`: Required, must exist
- `projectManagerId`: Required, must exist

## 10. Business Rules

1. **Name Uniqueness**: Project name must be unique
2. **Date Validation**: End date must be >= start date
3. **Status Transitions**: Status must follow valid state machine (see state diagrams)
4. **Manager Assignment**: Project manager must be an employee
5. **Department Assignment**: Project must belong to exactly one department
6. **Cascade Delete**: Deleting project deletes all associated tasks

## 11. State Machine

See: `docs/diagrams/state/project-status-state.puml`

**Valid States**:
- Planning (initial)
- Active
- On Hold
- Completed (final)
- Cancelled (final)

**Valid Transitions**:
- Planning → Active
- Active → On Hold
- On Hold → Active
- Active → Completed
- Active → Cancelled
- On Hold → Cancelled
- Planning → Cancelled

## 12. Sequence Diagram

See: `docs/diagrams/sequence/department-create-flow.puml` (similar flow for project creation)

## 13. Activity Diagram

See: `docs/diagrams/activity/project-creation-activity.puml`

## 14. Future Enhancements

- **Project Templates**: Pre-configured project templates
- **Milestones**: Track project milestones
- **Budget Tracking**: Real-time budget vs actual spending
- **Resource Allocation**: Advanced resource planning
- **Gantt Charts**: Visual project timeline
- **Project Reports**: Detailed project reports

---

**Status**: Complete  
**Last Updated**: 2024-12-10

