# UC-TM-004: Update Task

## Use Case Information

- **Use Case ID**: UC-TM-004
- **Title**: Update Task
- **Category**: Task Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **Department Manager** (`DEPARTMENT_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have `DEPARTMENT_MANAGER` or `SYSTEM_ADMIN` role
- Authorization enforced via `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role
3. **Task must exist** in the system
4. If changing assigned employee, the employee must exist
5. **Department Manager**: Can only update tasks in their department's projects

---

## Main Flow

1. **Navigate to Task Details**: Actor navigates to task details page
   - Actor views task details (UC-TM-003)
   - Actor clicks "Edit" button
   - System displays task edit form

2. **Modify Task Information**: Actor modifies task information
   - Actor can modify:
     - Name
     - Description
     - Priority
     - Due Date
     - Assigned Employee (can assign or reassign)
   - Actor cannot modify:
     - Task ID
     - Project (task belongs to project)
     - Created timestamp

3. **Submit Changes**: Actor clicks "Save Changes" button
   - Frontend performs client-side validation
   - System validates changes
   - System updates task record
   - System displays success message

---

## Alternative Flows

### 3a. Validation Fails
- **Trigger**: Validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error messages
  5. Actor corrects errors

### 3b. Task Not Found
- **Trigger**: Task does not exist
- **Flow**:
  1. System attempts to load task
  2. System finds no task with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Task not found" message

### 3c. Unauthorized Access
- **Trigger**: User does not have required role or trying to update task from different department
- **Flow**:
  1. System checks user role and department
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Task record is updated in the database
- Updated timestamp is set
- Task information reflects the changes

---

## Business Rules

1. **Department Manager Constraint**: Department Managers can only update tasks in their own department's projects
2. **Priority Levels**: Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL
3. **Due Date**: Due date validation (cannot be in the past, optional rule)
4. **Project Immutability**: Task's project cannot be changed (task belongs to project)

---

## Related Use Cases

- **UC-TM-003**: View Task Details (to navigate to task)
- **UC-TM-001**: Create Task (similar validation rules)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/tasks/{id}`
- **Request Body**: `TaskRequestDTO`
- **Response**: `TaskResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Department Managers can only update their own department's tasks

---

**Last Updated**: 2024-12-12  
**Status**: Active

