# UC-EM-005: Delete Employee

## Use Case Information

- **Use Case ID**: UC-EM-005
- **Title**: Delete Employee
- **Category**: Employee Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **HR Manager** (`HR_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have `HR_MANAGER` or `SYSTEM_ADMIN` role
- Authorization enforced via `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role (`HR_MANAGER` or `SYSTEM_ADMIN`)
3. **Employee must exist** in the system
4. **Employee must have no active project assignments** (critical precondition)

---

## Main Flow

1. **Navigate to Employee Details**: Actor navigates to employee details page
   - Actor views employee list (UC-EM-002) or employee details (UC-EM-003)
   - Actor clicks on employee to view details
   - System displays employee details

2. **Initiate Delete**: Actor clicks "Delete" button
   - System displays delete confirmation dialog
   - Dialog shows:
     - Employee name
     - Warning message about deletion
     - Confirmation checkbox (optional, for safety)

3. **Confirm Deletion**: Actor confirms deletion
   - Actor reviews employee information
   - Actor checks confirmation checkbox (if required)
   - Actor clicks "Confirm Delete" button

4. **Check Active Assignments**: System checks for active project assignments
   - System queries EmployeeProjectRepository for employee's project assignments
   - System checks if employee has any active assignments:
     - Active projects (status: IN_PROGRESS, PLANNED)
     - Any project assignments with status: ACTIVE
   - If active assignments found, proceed to Alternative Flow 4a
   - If no active assignments, proceed to step 5

5. **Delete Employee Record**: System deletes employee record
   - System loads employee entity
   - System deletes employee from database via EmployeeRepository
   - System handles cascading relationships:
     - EmployeeProject assignments are deleted (cascade)
     - Manager relationships are updated (employees reporting to this employee)
   - System returns success response

6. **Success Response**: System displays success message
   - System returns HTTP 200 OK or HTTP 204 No Content
   - Frontend displays success notification: "Employee deleted successfully"
   - Frontend redirects to employee list
   - Employee no longer appears in employee list

---

## Alternative Flows

### 4a. Employee Has Active Project Assignments
- **Trigger**: Employee has active project assignments
- **Flow**:
  1. System checks for active assignments
  2. System finds active project assignments
  3. System returns HTTP 400 Bad Request with error details
  4. Frontend displays error message: "Cannot delete employee. Employee has active project assignments. Please remove employee from all active projects before deletion."
  5. Frontend displays list of active projects:
     - Project names
     - Project status
     - Option to navigate to project details
  6. Actor must:
     - Remove employee from all active projects (UC-PM-003 related), OR
     - Cancel deletion
  7. Use case terminates or continues after assignments are removed

### 3a. Deletion Cancelled
- **Trigger**: Actor cancels deletion
- **Flow**:
  1. Actor clicks "Cancel" in confirmation dialog
  2. System closes confirmation dialog
  3. System returns to employee details view
  4. Employee record remains unchanged
  5. Use case terminates

### 5a. Employee Not Found
- **Trigger**: Employee ID does not exist in database
- **Flow**:
  1. System attempts to load employee
  2. System finds no employee with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Employee not found" message
  5. Use case terminates

### 5b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 5c. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to delete employee
  2. Database operation fails (constraint violation, connection error, etc.)
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Employee record remains unchanged
  7. Use case terminates

### 5d. Employee is Manager
- **Trigger**: Employee is a manager for other employees
- **Flow**:
  1. System checks if employee is a manager
  2. System finds employees reporting to this employee
  3. System handles manager relationship:
     - Option 1: Set manager to null for reporting employees
     - Option 2: Prevent deletion and require reassignment
  4. If Option 1: Proceed with deletion, update reporting employees
  5. If Option 2: Display error, require manager reassignment first

---

## Postconditions

### Success Postconditions
- Employee record is deleted from the database
- Employee no longer appears in employee list
- EmployeeProject assignments are deleted (cascade)
- Manager relationships are updated (if employee was a manager)
- System state is consistent

### Failure Postconditions
- Employee record remains unchanged
- Error information is available for user review
- System state remains consistent

---

## Business Rules

1. **Active Assignment Constraint**: Employee cannot be deleted if they have active project assignments
2. **Cascade Deletion**: When employee is deleted:
   - EmployeeProject assignments are automatically deleted
   - Manager relationships are updated (employees reporting to deleted employee have manager set to null)
3. **Soft Delete Consideration**: Future enhancement may implement soft delete (mark as deleted instead of physical deletion)
4. **Audit Trail**: Deletion should be logged for audit purposes (future enhancement)

---

## Validation Rules

### Path Parameters
- `id`: UUID, must exist in database, required

### Business Validation
- Employee must have no active project assignments
- Employee must exist

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| NOT_FOUND | Employee does not exist | 404 | "Employee not found" |
| VALIDATION_ERROR | Employee has active assignments | 400 | "Cannot delete employee. Employee has active project assignments. Please remove employee from all active projects before deletion." |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while deleting employee. Please try again." |

---

## Related Use Cases

- **UC-EM-002**: View Employee List (to navigate to employee)
- **UC-EM-003**: View Employee Details (to view employee before deletion)
- **UC-PM-003**: Assign Employee to Project (to remove assignments before deletion)

---

## Technical Notes

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/employees/{id}`
- **Path Parameters**: `id` (UUID)
- **Response**: HTTP 200 OK or HTTP 204 No Content

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`
- **Role-Based Filtering**: Not applicable (delete operation)

### Components Involved
- **Frontend**: EmployeeDetailsComponent, EmployeeService, ConfirmationDialogComponent
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository, EmployeeProjectRepository
- **Validation**: Business rule validation for active assignments

### Design Patterns
- **Repository Pattern**: EmployeeRepository, EmployeeProjectRepository for data access
- **Service Layer Pattern**: EmployeeService for business logic and validation
- **Cascade Pattern**: Database cascade deletion for related entities

### Database Considerations
- **Cascade Delete**: EmployeeProject assignments should be deleted when employee is deleted
- **Foreign Key Constraints**: Manager relationships should be handled (set to null or prevent deletion)

---

**Last Updated**: 2024-12-12  
**Status**: Active

