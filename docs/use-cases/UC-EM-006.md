# UC-EM-006: Assign Manager to Employee

## Use Case Information

- **Use Case ID**: UC-EM-006
- **Title**: Assign Manager to Employee
- **Category**: Employee Management
- **Priority**: Medium
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
4. **Manager must exist** in the system
5. **Employee and Manager must be in the same department** (critical precondition)

---

## Main Flow

1. **Navigate to Employee Edit**: Actor navigates to employee edit page
   - Actor views employee details (UC-EM-003)
   - Actor clicks "Edit" button (UC-EM-004)
   - System displays employee edit form

2. **Select Manager**: Actor selects manager from dropdown
   - Actor clicks on manager dropdown field
   - System displays list of available managers
   - System filters managers to show only managers in the same department as the employee
   - Actor selects a manager from the dropdown

3. **Validate Manager Department**: System validates manager is in same department
   - System retrieves employee's department
   - System retrieves selected manager's department
   - System compares departments
   - If departments match, proceed to step 4
   - If departments do not match, proceed to Alternative Flow 3a

4. **Save Changes**: Actor saves employee changes
   - Actor clicks "Save Changes" button
   - System validates all employee data (including manager assignment)
   - System updates employee record with manager assignment
   - System saves changes to database

5. **Success Response**: System displays success message
   - System returns HTTP 200 OK with updated EmployeeResponseDTO
   - Frontend displays success notification: "Manager assigned successfully"
   - Frontend refreshes employee details view
   - Manager relationship is displayed in employee details

---

## Alternative Flows

### 3a. Manager in Different Department
- **Trigger**: Selected manager is not in the same department as the employee
- **Flow**:
  1. System validates manager's department
  2. System detects department mismatch
  3. System displays validation error: "Manager must be in the same department as the employee"
  4. System highlights manager dropdown field
  5. System shows available managers from the same department
  6. Actor must:
     - Select a manager from the same department, OR
     - Remove manager assignment (set to null)
  7. Use case continues from step 2

### 4a. Manager Not Found
- **Trigger**: Selected manager does not exist in database
- **Flow**:
  1. System attempts to load manager
  2. System finds no employee with given manager ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Manager not found" message
  5. Actor must select a valid manager
  6. Use case continues from step 2

### 4b. Employee Not Found
- **Trigger**: Employee does not exist in database
- **Flow**:
  1. System attempts to load employee
  2. System finds no employee with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Employee not found" message
  5. Use case terminates

### 4c. Validation Fails
- **Trigger**: Other validation errors occur
- **Flow**:
  1. System validates employee data
  2. System detects validation errors
  3. System returns HTTP 400 Bad Request with error details
  4. Frontend displays error messages
  5. Actor corrects errors
  6. Use case continues from step 2

### 4d. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 4e. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to update employee
  2. Database operation fails
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- Employee record is updated with manager assignment
- Manager relationship is established in database
- Employee details display manager information
- Manager can be viewed in employee's profile

### Failure Postconditions
- Employee record remains unchanged
- Manager relationship is not established
- Error information is available for user review

---

## Business Rules

1. **Department Constraint**: Manager must be in the same department as the employee
2. **Self-Management**: Employee cannot be assigned as their own manager (future validation)
3. **Manager Hierarchy**: Manager can have their own manager (hierarchical structure)
4. **Optional Assignment**: Manager assignment is optional (can be null)

---

## Validation Rules

### Manager Assignment
- `managerId`: UUID, must exist in database, must be in same department as employee (if provided)
- `managerId`: Can be null (no manager assigned)

### Department Validation
- Employee's department must match manager's department
- Validation is performed at both client-side and server-side

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| NOT_FOUND | Employee does not exist | 404 | "Employee not found" |
| NOT_FOUND | Manager does not exist | 404 | "Manager not found" |
| VALIDATION_ERROR | Manager in different department | 400 | "Manager must be in the same department as the employee" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while assigning manager. Please try again." |

---

## Related Use Cases

- **UC-EM-003**: View Employee Details (to view employee before assignment)
- **UC-EM-004**: Update Employee (manager assignment is part of employee update)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/employees/{id}`
- **Path Parameters**: `id` (UUID)
- **Request Body**: `EmployeeRequestDTO` (includes managerId)
- **Response**: `EmployeeResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`
- **Role-Based Filtering**: Not applicable (update operation)

### Components Involved
- **Frontend**: EmployeeEditComponent, EmployeeService
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository, ValidationService
- **Validation**: Department matching validation

### Design Patterns
- **Repository Pattern**: EmployeeRepository for data access
- **Service Layer Pattern**: EmployeeService for business logic
- **Validation Pattern**: ValidationService for department matching

---

**Last Updated**: 2024-12-12  
**Status**: Active

