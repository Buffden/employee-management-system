# UC-PM-007: Remove Employee from Project

## Use Case Information

- **Use Case ID**: UC-PM-007
- **Title**: Remove Employee from Project
- **Category**: Project Management
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
3. **Employee must exist** in the system
4. **Project must exist** in the system
5. **Employee must be assigned to the project** (EmployeeProject assignment must exist)

---

## Main Flow

1. **Navigate to Project Details**: Actor navigates to project details page
   - Actor views project details (UC-PM-006)
   - System displays project details with assigned employees list

2. **Initiate Removal**: Actor clicks "Remove" button next to employee
   - System displays removal confirmation dialog
   - Dialog shows employee name and project name

3. **Confirm Removal**: Actor confirms removal
   - Actor clicks "Confirm Remove" button

4. **Remove Assignment**: System removes employee-project assignment
   - System queries EmployeeProjectRepository for the assignment
   - System validates assignment exists
   - System deletes EmployeeProject assignment record
   - System returns success response

5. **Success Response**: System displays success message
   - System returns HTTP 200 OK or HTTP 204 No Content
   - Frontend displays success notification: "Employee removed from project successfully"
   - Frontend refreshes project details view
   - Employee no longer appears in assigned employees list

---

## Alternative Flows

### 4a. Assignment Not Found
- **Trigger**: Employee is not assigned to the project
- **Flow**:
  1. System queries EmployeeProjectRepository
  2. System finds no assignment for employee and project
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Employee is not assigned to this project" message
  5. Use case terminates

### 4b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 4c. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to delete assignment
  2. Database operation fails
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- EmployeeProject assignment is deleted from the database
- Employee no longer appears in project's assigned employees list
- Employee can be assigned to other projects
- Project details reflect the updated employee list

### Failure Postconditions
- Assignment remains unchanged
- Error information is displayed

---

## Business Rules

1. **Assignment Requirement**: Employee must be assigned to project before removal
2. **Task Assignment**: If employee has active tasks in the project, consider reassigning tasks (future enhancement)
3. **Cascade Handling**: Removal of employee from project does not delete employee or project records

---

## Related Use Cases

- **UC-PM-006**: View Project Details (to see assigned employees)
- **UC-PM-003**: Assign Employee to Project (opposite operation)

---

## Technical Notes

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/projects/{projectId}/employees/{employeeId}`
- **Path Parameters**: `projectId` (UUID), `employeeId` (UUID)
- **Response**: HTTP 200 OK or HTTP 204 No Content

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

### Components Involved
- **Frontend**: ProjectDetailsComponent, ProjectService
- **Backend**: ProjectController, EmployeeProjectController, EmployeeProjectService, EmployeeProjectRepository

---

**Last Updated**: 2024-12-12  
**Status**: Active

