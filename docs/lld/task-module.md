# Task Module - Low-Level Design

## 1. Overview

The Task module handles task management including CRUD operations, status tracking, priority management, and task assignments to employees within projects.

## 2. Entities

### 2.1 Task Entity

**Location**: `backend/src/main/java/com/ems/employee_management_system/models/Task.java`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `UUID` | `@Id`, `@GeneratedValue` | Primary key |
| `name` | `String` | `@Column(nullable=false)` | Task name |
| `description` | `String` | `@Column(columnDefinition="TEXT")` | Task description |
| `status` | `String` | `@Column(nullable=false)` | Task status |
| `priority` | `String` | `@Column(nullable=false)` | Task priority |
| `startDate` | `LocalDate` | `@Column(nullable=false)` | Task start date |
| `dueDate` | `LocalDate` | - | Task due date (optional) |
| `completedDate` | `LocalDate` | - | Task completion date (optional) |
| `project` | `Project` | `@ManyToOne`, `@JoinColumn(nullable=false)` | Associated project |
| `assignedTo` | `Employee` | `@ManyToOne` | Assigned employee (optional) |

**Relationships**:
- `@ManyToOne` → Project (project, required)
- `@ManyToOne` → Employee (assignedTo, optional)

## 3. DTOs

### 3.1 TaskRequestDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/TaskRequestDTO.java`

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `name` | `String` | Task name |
| `description` | `String` | Task description |
| `status` | `String` | Task status |
| `priority` | `String` | Task priority |
| `startDate` | `LocalDate` | Task start date |
| `dueDate` | `LocalDate` | Task due date (optional) |
| `completedDate` | `LocalDate` | Task completion date (optional) |
| `projectId` | `UUID` | Project ID (for relationship) |
| `assignedToId` | `UUID` | Assigned employee ID (optional) |

**Note**: No `id` field (auto-generated on server side)

### 3.2 TaskResponseDTO

**Location**: `backend/src/main/java/com/ems/employee_management_system/dtos/TaskResponseDTO.java`

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `UUID` | Task unique identifier |
| `name` | `String` | Task name |
| `description` | `String` | Task description |
| `status` | `String` | Task status |
| `priority` | `String` | Task priority |
| `startDate` | `LocalDate` | Task start date |
| `dueDate` | `LocalDate` | Task due date |
| `completedDate` | `LocalDate` | Task completion date |
| `projectName` | `String` | Denormalized project name |
| `assignedToName` | `String` | Denormalized assigned employee name (firstName + lastName) |

**Note**: Uses denormalized names (`projectName`, `assignedToName`) for better API responses

## 4. Controllers

### 4.1 TaskController

**Location**: `backend/src/main/java/com/ems/employee_management_system/controllers/TaskController.java`

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/tasks` | Get all tasks | - | `List<TaskResponseDTO>` |
| GET | `/api/tasks/{id}` | Get task by ID | - | `TaskResponseDTO` |
| POST | `/api/tasks` | Create task | `TaskRequestDTO` | `TaskResponseDTO` |
| PUT | `/api/tasks/{id}` | Update task | `TaskRequestDTO` | `TaskResponseDTO` |
| DELETE | `/api/tasks/{id}` | Delete task | - | `void` |

**Dependencies**:
- `TaskService` - Business logic
- `ProjectService` - Project resolution
- `EmployeeService` - Assigned employee resolution
- `TaskMapper` - Entity ↔ DTO conversion

**Patterns Applied**:
- **Adapter Pattern**: TaskMapper converts Entity ↔ DTO (similar to EmployeeMapper, DepartmentMapper, LocationMapper, ProjectMapper pattern)

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

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toResponseDTO(Task task)` | `task` | `TaskResponseDTO` | Convert Entity to Response DTO (includes denormalized names) |
| `toEntity(TaskRequestDTO dto, Project project, Employee assignedTo)` | `dto`, `project`, `assignedTo` | `Task` | Convert Request DTO to Entity (resolves relationships) |

**Responsibilities**:
- Maps Entity to Response DTO (includes denormalized projectName and assignedToName)
- Maps Request DTO to Entity (excludes id, relationships resolved by IDs in controller)

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

## 10.1 Role-Based Access Control

| Operation | System Admin | HR Manager | Department Manager | Employee |
|-----------|--------------|------------|-------------------|----------|
| **View All Tasks** | ✅ | ✅ | ✅ | ❌ |
| **View Own Department Tasks** | ✅ | ✅ | ✅ | ❌ |
| **View Assigned Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Create Task** | ✅ | ❌ | ✅ (own dept projects) | ❌ |
| **Update Any Task** | ✅ | ❌ | ❌ | ❌ |
| **Update Own Department Tasks** | ✅ | ❌ | ✅ | ❌ |
| **Update Assigned Tasks** | ✅ | ❌ | ✅ | ✅ (status, progress only) |
| **Delete Task** | ✅ | ❌ | ✅ (own dept projects) | ❌ |

### 10.1.1 Implementation Details

**Service Layer Authorization**:

**Example - TaskService**:
```java
@PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isTaskProjectInOwnDepartment(#dto.projectId))")
public TaskResponseDTO create(TaskRequestDTO dto) { ... }

@PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isTaskProjectInOwnDepartmentByTaskId(#id)) or " +
              "(hasRole('EMPLOYEE') and @securityService.isTaskAssignedToUser(#id))")
public TaskResponseDTO update(UUID id, TaskRequestDTO dto) {
    // Employee can only update status and progress
    if (securityService.hasRole("EMPLOYEE")) {
        Task existing = taskRepository.findById(id).orElseThrow();
        // Only allow status and completedDate updates
        dto.setName(null);
        dto.setDescription(null);
        dto.setPriority(null);
        dto.setStartDate(null);
        dto.setDueDate(null);
        dto.setAssignedToId(null);
        dto.setProjectId(null);
    }
    // ... update logic
}

@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public Page<TaskResponseDTO> getAll(Pageable pageable) {
    String role = securityService.getCurrentUserRole();
    UUID departmentId = securityService.getCurrentUserDepartmentId();
    UUID userId = securityService.getCurrentUserId();
    
    return taskRepository.findAllFilteredByRole(role, departmentId, userId, pageable)
        .map(mapper::toResponseDTO);
}
```

**Repository-Level Filtering**:
```java
@Query("SELECT t FROM Task t WHERE " +
       "(:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER') OR " +
       "(:role = 'DEPARTMENT_MANAGER' AND t.project.department.id = :departmentId) OR " +
       "(:role = 'EMPLOYEE' AND t.assignedTo.id = :userId)")
Page<Task> findAllFilteredByRole(@Param("role") String role,
                                 @Param("departmentId") UUID departmentId,
                                 @Param("userId") UUID userId,
                                 Pageable pageable);
```

**Employee Restrictions**:
- Can only update tasks assigned to them
- Limited to status and progress updates
- Cannot modify task name, description, priority, dates, or assignment
- Field filtering: Only `status` and `completedDate` fields allowed

**Department Manager Scope**:
- Can manage tasks in projects belonging to their department
- Department determined by `user.employee.department`
- Validation: `@securityService.isTaskProjectInOwnDepartment(projectId)`

**See**: `docs/security/roles-and-permissions.md` for complete permission matrix

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

