# UC-TM-002: Update Task Status

## Use Case Information

- **Use Case ID**: UC-TM-002
- **Title**: Update Task Status
- **Category**: Task Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **Employee** (`EMPLOYEE`)
- **Department Manager** (`DEPARTMENT_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have appropriate role
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

1. **Navigate to Task Details**: Actor navigates to task details page
   - Actor views task in project details or task list
   - Actor clicks on task to view details
   - System displays task details

2. **Update Task Status**: Actor updates task status
   - Actor selects new status from dropdown
   - Status options: TODO, IN_PROGRESS, COMPLETED, CANCELLED
   - Actor clicks "Update Status" button

3. **Validate Permission**: System validates permission
   - System checks if actor is assigned to task OR is a manager
   - If permission denied, proceed to Alternative Flow 3a
   - If permission granted, proceed to step 4

4. **Update Task Record**: System updates task record
   - System updates task status in database
   - System sets updated timestamp
   - System returns success response

5. **Success Response**: System displays success message
   - Frontend displays success notification
   - Frontend refreshes task details view
   - Task status is updated in UI

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

---

## Postconditions

### Success Postconditions
- Task status is updated in the database
- Task status is reflected in UI
- Updated timestamp is set

---

## Business Rules

1. **Permission Requirement**: Only assigned employee or manager can update task status
2. **Status Transitions**: Valid status transitions should be enforced (future enhancement)
3. **Status Options**: Status must be one of: TODO, IN_PROGRESS, COMPLETED, CANCELLED

---

## Related Use Cases

- **UC-TM-001**: Create Task (to create tasks)
- **UC-PM-002**: View Project List (to navigate to project and tasks)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/tasks/{id}/status`
- **Request Body**: `TaskStatusUpdateDTO`
- **Response**: `TaskResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: Custom permission check (assigned employee OR manager)

---

**Last Updated**: 2024-12-12  
**Status**: Active

