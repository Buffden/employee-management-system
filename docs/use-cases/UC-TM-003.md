# UC-TM-003: View Task Details

## Use Case Information

- **Use Case ID**: UC-TM-003
- **Title**: View Task Details
- **Category**: Task Management
- **Priority**: Medium
- **Status**: Active

---

## Actor(s)

- **Employee** (`EMPLOYEE`)
- **Department Manager** (`DEPARTMENT_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have one of the above roles
- User must be assigned to the task OR be a manager
- Authorization enforced via `@PreAuthorize` with custom permission check

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role
3. **Task must exist** in the system
4. **Actor must be assigned to the task OR be a manager** (Department Manager or System Admin)

---

## Main Flow

1. **Initiate View**: Actor clicks on task in list or navigates to task details
   - Actor views task in project details or task list
   - Actor clicks on task row
   - OR Actor navigates directly to task details page via URL
   - System identifies task ID from click or URL parameter

2. **Request Task Details**: Frontend requests task details
   - Frontend calls `GET /api/tasks/{id}` with task ID
   - Frontend includes JWT token in Authorization header

3. **Validate Permission**: System validates user has permission to view task
   - System validates JWT token
   - System extracts user role and user ID from token
   - System checks permission:
     - **SYSTEM_ADMIN**: Access granted
     - **DEPARTMENT_MANAGER**: Check if task's project is in their department
     - **EMPLOYEE**: Check if employee is assigned to task
   - If permission denied, proceed to Alternative Flow 3a

4. **Fetch Task Data**: System retrieves task details
   - System queries TaskRepository by ID
   - System loads related entities:
     - Project (with project details)
     - Assigned Employee (if assigned, with employee details)
   - System constructs TaskResponseDTO with all details

5. **Return Task Details**: System returns task data
   - System returns HTTP 200 OK with TaskResponseDTO
   - Response includes:
     - Task information (name, description, priority, due date, status)
     - Project information
     - Assigned employee information (if assigned)

6. **Display Task Details**: Frontend displays task information
   - System displays task details in modal/overlay or dedicated page
   - System displays sections:
     - **Task Information**: Name, description, priority, due date, status
     - **Project**: Project name and details
     - **Assigned Employee**: Employee name (if assigned)

---

## Alternative Flows

### 3a. Permission Denied
- **Trigger**: Actor is not assigned to task and is not a manager
- **Flow**:
  1. System checks permission
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays "Access denied. You must be assigned to this task or be a manager."
  5. Use case terminates

### 3b. Task Not Found
- **Trigger**: Task ID does not exist in database
- **Flow**:
  1. System queries TaskRepository
  2. System finds no task with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Task not found" message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Task details are displayed to the user
- User can view all accessible task information
- User can perform authorized actions (update status, update task) if permissions allow

---

## Business Rules

1. **Permission Requirement**: Only assigned employee or manager can view task details
2. **Role-Based Access**:
   - **SYSTEM_ADMIN**: Can view any task
   - **DEPARTMENT_MANAGER**: Can view tasks in their department's projects
   - **EMPLOYEE**: Can only view tasks they are assigned to

---

## Related Use Cases

- **UC-TM-001**: Create Task (to create tasks)
- **UC-TM-002**: Update Task Status (to update task status)
- **UC-TM-004**: Update Task (to modify task details)
- **UC-PM-006**: View Project Details (entry point to view tasks)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/tasks/{id}`
- **Path Parameters**: `id` (UUID)
- **Response**: `TaskResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: Custom permission check (assigned employee OR manager)

---

**Last Updated**: 2024-12-12  
**Status**: Active

