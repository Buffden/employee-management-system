# UC-PM-005: Delete Project

## Use Case Information

- **Use Case ID**: UC-PM-005
- **Title**: Delete Project
- **Category**: Project Management
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
3. **Project must exist** in the system
4. **Project must have no active tasks** (critical precondition)
5. **Department Manager**: Can only delete projects in their own department

---

## Main Flow

1. **Navigate to Project Details**: Actor navigates to project details page
   - Actor views project list (UC-PM-002)
   - Actor clicks on project to view details
   - System displays project details

2. **Initiate Delete**: Actor clicks "Delete" button
   - System displays delete confirmation dialog
   - Dialog shows project name and warning

3. **Confirm Deletion**: Actor confirms deletion
   - Actor clicks "Confirm Delete" button

4. **Check Active Tasks**: System checks for active tasks
   - System queries TaskRepository for tasks in this project
   - System checks if project has any active tasks (status: TODO, IN_PROGRESS)
   - If active tasks found, proceed to Alternative Flow 4a
   - If no active tasks, proceed to step 5

5. **Delete Project Record**: System deletes project record
   - System deletes project from database
   - System handles cascading relationships:
     - EmployeeProject assignments are deleted (cascade)
     - Tasks are deleted (cascade) or set to cancelled
   - System returns success response

6. **Success Response**: System displays success message
   - Frontend displays success notification
   - Frontend redirects to project list
   - Project no longer appears in list

---

## Alternative Flows

### 4a. Project Has Active Tasks
- **Trigger**: Project has active tasks
- **Flow**:
  1. System checks for active tasks
  2. System finds active tasks in project
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error: "Cannot delete project. Project has active tasks. Please complete or cancel all tasks before deletion."
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Project record is deleted from the database
- Project no longer appears in project list
- EmployeeProject assignments are deleted
- Tasks are deleted or cancelled

### Failure Postconditions
- Project record remains unchanged
- Error information is displayed

---

## Business Rules

1. **Active Task Constraint**: Project cannot be deleted if it has active tasks
2. **Department Manager Constraint**: Department Managers can only delete projects in their own department
3. **Cascade Deletion**: When project is deleted, related EmployeeProject assignments and tasks are handled

---

## Related Use Cases

- **UC-PM-002**: View Project List (to navigate to project)
- **UC-TM-002**: Update Task Status (to complete tasks before deletion)

---

## Technical Notes

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/projects/{id}`
- **Response**: HTTP 200 OK or HTTP 204 No Content

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Department Managers can only delete their own department's projects

---

**Last Updated**: 2024-12-12  
**Status**: Active

