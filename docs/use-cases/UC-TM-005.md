# UC-TM-005: Delete Task

## Use Case Information

- **Use Case ID**: UC-TM-005
- **Title**: Delete Task
- **Category**: Task Management
- **Priority**: Medium
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
4. **Department Manager**: Can only delete tasks in their department's projects

---

## Main Flow

1. **Navigate to Task Details**: Actor navigates to task details page
   - Actor views task details (UC-TM-003)
   - System displays task details

2. **Initiate Delete**: Actor clicks "Delete" button
   - System displays delete confirmation dialog
   - Dialog shows task name and warning

3. **Confirm Deletion**: Actor confirms deletion
   - Actor clicks "Confirm Delete" button

4. **Delete Task Record**: System deletes task record
   - System deletes task from database via TaskRepository
   - System returns success response

5. **Success Response**: System displays success message
   - Frontend displays success notification
   - Frontend redirects to project details or task list
   - Task no longer appears in list

---

## Alternative Flows

### 4a. Task Not Found
- **Trigger**: Task does not exist
- **Flow**:
  1. System attempts to load task
  2. System finds no task with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Task not found" message

### 4b. Unauthorized Access
- **Trigger**: User does not have required role or trying to delete task from different department
- **Flow**:
  1. System checks user role and department
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Task record is deleted from the database
- Task no longer appears in task list
- Task is removed from project's task list

---

## Business Rules

1. **Department Manager Constraint**: Department Managers can only delete tasks in their own department's projects
2. **Soft Delete Consideration**: Future enhancement may implement soft delete (mark as deleted instead of physical deletion)

---

## Related Use Cases

- **UC-TM-003**: View Task Details (to navigate to task)
- **UC-PM-006**: View Project Details (to see tasks)

---

## Technical Notes

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/tasks/{id}`
- **Response**: HTTP 200 OK or HTTP 204 No Content

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Department Managers can only delete their own department's tasks

---

**Last Updated**: 2024-12-12  
**Status**: Active

