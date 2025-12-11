# Project Module - Low-Level Design

## 1. Overview

The Project module handles project management including CRUD operations, status tracking, and employee-project assignments.

## 2. Entities

### 2.1 Project Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/Project.java`

```java
@Entity
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    @Column(nullable = false)
    private String status;
    
    private Double budget = 0.0;
    
    @ManyToOne
    @JoinColumn(nullable = false)
    private Department department;
    
    @ManyToOne
    @JoinColumn(nullable = false)
    private Employee projectManager;
    
    // Getters and setters
}
```

**Relationships**:
- `@ManyToOne` → Department (department)
- `@ManyToOne` → Employee (projectManager)
- `@OneToMany` → Task (tasks)
- `@ManyToMany` → Employee (via EmployeeProject)

## 3. DTOs

### 3.1 ProjectDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/ProjectDTO.java`

```java
public class ProjectDTO {
    private UUID id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private Double budget;
    private UUID departmentId;
    private UUID projectManagerId;
    
    // Getters and setters
}
```

**Fields**:
- `id` (UUID): Project unique identifier
- `name` (String, required, unique): Project name
- `description` (String, optional): Project description
- `startDate` (Date, required): Project start date
- `endDate` (Date, optional): Project end date
- `status` (String, required): Project status (Planning, Active, On Hold, Completed, Cancelled)
- `budget` (Double, optional): Project budget
- `departmentId` (UUID, required): Reference to department
- `projectManagerId` (UUID, required): Reference to project manager

## 4. Controllers

### 4.1 ProjectController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/ProjectController.java`

**Endpoints**:

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/projects` | Get all projects | 200 |
| GET | `/api/projects/{id}` | Get project by ID | 200, 404 |
| POST | `/api/projects` | Create new project | 201, 400 |
| PUT | `/api/projects/{id}` | Update project | 200, 404, 400 |
| DELETE | `/api/projects/{id}` | Delete project | 204, 404 |

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/projects` | Get all projects | - | `List<ProjectDTO>` |
| GET | `/api/projects/{id}` | Get project by ID | - | `ProjectDTO` |
| POST | `/api/projects` | Create project | `ProjectDTO` | `ProjectDTO` |
| PUT | `/api/projects/{id}` | Update project | `ProjectDTO` | `ProjectDTO` |
| DELETE | `/api/projects/{id}` | Delete project | - | `void` |

**Dependencies**:
- `ProjectService` - Business logic
- `DepartmentService` - Department resolution
- `EmployeeService` - Project manager resolution
- `ProjectMapper` - Entity ↔ DTO conversion

**Patterns Applied**:
- **Adapter Pattern**: ProjectMapper converts Entity ↔ DTO

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

```java
public class ProjectMapper {
    public static ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setBudget(project.getBudget());
        dto.setDepartmentId(project.getDepartment().getId());
        dto.setProjectManagerId(project.getProjectManager().getId());
        return dto;
    }
    
    public static Project toEntity(ProjectDTO dto, Department department, Employee manager) {
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus());
        project.setBudget(dto.getBudget());
        project.setDepartment(department);
        project.setProjectManager(manager);
        return project;
    }
}
```

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

