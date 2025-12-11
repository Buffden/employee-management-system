# Task Module - Low-Level Design

## 1. Overview

The Task module handles task management including CRUD operations, status tracking, priority management, and task assignments to employees within projects.

## 2. Entities

### 2.1 Task Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/Task.java`

```java
@Entity
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String status;
    
    @Column(nullable = false)
    private String priority;
    
    @Column(nullable = false)
    private LocalDate startDate;
    
    private LocalDate dueDate;
    private LocalDate completedDate;
    
    @ManyToOne
    @JoinColumn(nullable = false)
    private Project project;
    
    @ManyToOne
    private Employee assignedTo;
    
    // Getters and setters
}
```

**Relationships**:
- `@ManyToOne` → Project (project, required)
- `@ManyToOne` → Employee (assignedTo, optional)

## 3. DTOs

### 3.1 TaskDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/TaskDTO.java`

```java
public class TaskDTO {
    private UUID id;
    private String name;
    private String description;
    private String status;
    private String priority;
    private LocalDate startDate;
    private LocalDate dueDate;
    private LocalDate completedDate;
    private UUID projectId;
    private UUID assignedToId;
    
    // Getters and setters
}
```

**Fields**:
- `id` (UUID): Task unique identifier
- `name` (String, required): Task name
- `description` (String, optional): Task description
- `status` (String, required): Task status (Not Started, In Progress, On Hold, Completed, Cancelled)
- `priority` (String, required): Task priority (Low, Medium, High, Critical)
- `startDate` (Date, required): Task start date
- `dueDate` (Date, optional): Task due date
- `completedDate` (Date, optional): Task completion date
- `projectId` (UUID, required): Reference to project
- `assignedToId` (UUID, optional): Reference to assigned employee

## 4. Controllers

### 4.1 TaskController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/TaskController.java`

**Endpoints**:

| Method | Endpoint | Description | Status Code |
|--------|----------|-------------|-------------|
| GET | `/api/tasks` | Get all tasks | 200 |
| GET | `/api/tasks/{id}` | Get task by ID | 200, 404 |
| POST | `/api/tasks` | Create new task | 201, 400 |
| PUT | `/api/tasks/{id}` | Update task | 200, 404, 400 |
| DELETE | `/api/tasks/{id}` | Delete task | 204, 404 |

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/tasks` | Get all tasks | - | `List<TaskDTO>` |
| GET | `/api/tasks/{id}` | Get task by ID | - | `TaskDTO` |
| POST | `/api/tasks` | Create task | `TaskDTO` | `TaskDTO` |
| PUT | `/api/tasks/{id}` | Update task | `TaskDTO` | `TaskDTO` |
| DELETE | `/api/tasks/{id}` | Delete task | - | `void` |

**Dependencies**:
- `TaskService` - Business logic
- `ProjectService` - Project resolution
- `EmployeeService` - Assigned employee resolution
- `TaskMapper` - Entity ↔ DTO conversion

**Patterns Applied**:
- **Adapter Pattern**: TaskMapper converts Entity ↔ DTO

## 5. Services

### 5.1 TaskService

**Location**: `backend/src/main/java/com/ems/employee_management_system/services/TaskService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getAll()` | - | `List<Task>` | Get all tasks |
| `getById(UUID id)` | `id` | `Task` | Get task by ID |
| `save(Task task)` | `task` | `Task` | Save task |
| `delete(UUID id)` | `id` | `void` | Delete task |

**Dependencies**:
- `TaskRepository` - Data access

**Patterns Applied**:
- **Adapter Pattern**: TaskMapper for Entity ↔ DTO conversions

## 6. Repositories

### 6.1 TaskRepository

**Location**: `backend/src/main/java/com/ems/employee_management_system/repositories/TaskRepository.java`

```java
@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {
    List<Task> findByProjectId(UUID projectId);
    
    List<Task> findByAssignedToId(UUID employeeId);
    
    List<Task> findByStatus(String status);
    
    List<Task> findByPriority(String priority);
    
    List<Task> findByDueDateBefore(LocalDate date);
}
```

**Methods**:
- `findAll()`: Get all tasks (inherited)
- `findById(UUID id)`: Get task by ID (inherited)
- `findByProjectId(UUID projectId)`: Get tasks by project
- `findByAssignedToId(UUID employeeId)`: Get tasks assigned to employee
- `findByStatus(String status)`: Get tasks by status
- `findByPriority(String priority)`: Get tasks by priority
- `findByDueDateBefore(LocalDate date)`: Get overdue tasks

## 7. Mappers

### 7.1 TaskMapper

**Location**: `backend/src/main/java/com/ems/employee_management_system/mappers/TaskMapper.java`

**Pattern**: Adapter Pattern

```java
public class TaskMapper {
    public static TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setName(task.getName());
        dto.setDescription(task.getDescription());
        dto.setStatus(task.getStatus());
        dto.setPriority(task.getPriority());
        dto.setStartDate(task.getStartDate());
        dto.setDueDate(task.getDueDate());
        dto.setCompletedDate(task.getCompletedDate());
        dto.setProjectId(task.getProject().getId());
        dto.setAssignedToId(task.getAssignedTo() != null 
            ? task.getAssignedTo().getId() : null);
        return dto;
    }
    
    public static Task toEntity(TaskDTO dto, Project project, Employee assignedTo) {
        Task task = new Task();
        task.setName(dto.getName());
        task.setDescription(dto.getDescription());
        task.setStatus(dto.getStatus());
        task.setPriority(dto.getPriority());
        task.setStartDate(dto.getStartDate());
        task.setDueDate(dto.getDueDate());
        task.setCompletedDate(dto.getCompletedDate());
        task.setProject(project);
        task.setAssignedTo(assignedTo);
        return task;
    }
}
```

## 8. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Adapter** | TaskMapper | Entity ↔ DTO conversion |

## 9. Validation Rules

- `name`: Required, max 200 characters
- `status`: Required, must be one of: Not Started, In Progress, On Hold, Completed, Cancelled
- `priority`: Required, must be one of: Low, Medium, High, Critical
- `startDate`: Required, valid date
- `dueDate`: Optional, must be >= startDate if provided
- `completedDate`: Optional, must be >= startDate if provided
- `projectId`: Required, must exist
- `assignedToId`: Optional, must exist if provided

## 10. Business Rules

1. **Date Validation**: Due date and completed date must be >= start date
2. **Status Transitions**: Status must follow valid state machine (see state diagrams)
3. **Project Assignment**: Task must belong to exactly one project
4. **Employee Assignment**: Task can be assigned to at most one employee
5. **Cascade Delete**: Deleting project deletes all associated tasks
6. **Status Updates**: When status changes to "Completed", set completedDate automatically

## 11. State Machine

See: `docs/diagrams/state/task-status-state.puml`

**Valid States**:
- Not Started (initial)
- In Progress
- On Hold
- Completed (final)
- Cancelled (final)

**Valid Transitions**:
- Not Started → In Progress
- In Progress → On Hold
- On Hold → In Progress
- In Progress → Completed
- In Progress → Cancelled
- On Hold → Cancelled
- Not Started → Cancelled

## 12. Priority Levels

**Valid Priorities**:
- Low
- Medium
- High
- Critical

## 13. Future Enhancements

- **Task Dependencies**: Link tasks that depend on each other
- **Time Tracking**: Track time spent on tasks
- **Task Comments**: Add comments/notes to tasks
- **File Attachments**: Attach files to tasks
- **Task Templates**: Pre-configured task templates
- **Recurring Tasks**: Support for recurring tasks
- **Task Reminders**: Email/notification reminders
- **Task Analytics**: Task completion metrics and reports

---

**Status**: Complete  
**Last Updated**: 2024-12-10

