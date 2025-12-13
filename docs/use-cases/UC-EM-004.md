# UC-EM-004: Update Employee

## Use Case Information

- **Use Case ID**: UC-EM-004
- **Title**: Update Employee
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
4. If changing department, the new department must exist
5. If changing location, the new location must exist
6. If assigning/changing manager, the manager must exist and be in the same department

---

## Main Flow

1. **Navigate to Employee Details**: Actor navigates to employee details page
   - Actor views employee list (UC-EM-002) or employee details (UC-EM-003)
   - Actor clicks on employee to view details
   - System displays employee details

2. **Initiate Edit**: Actor clicks "Edit" button
   - System displays employee edit form
   - Form is pre-populated with current employee data
   - Form includes all editable fields
   - If employee has a manager assigned, system loads manager data and pre-populates typeahead
   - Manager field uses typeahead component for employee search (filtered by department)

3. **Modify Employee Information**: Actor modifies employee information
   - Actor can modify:
     - Personal information (firstName, lastName, phone, address)
     - Employment information (designation, salary, performanceRating, experienceYears)
     - Department (select from dropdown)
     - Location (select from dropdown)
     - Manager (using typeahead component)
       - Actor can search for new manager by typing name/email
       - System filters results by current department
       - Actor can clear selection to remove manager
       - System validates selected manager exists and is in same department before submission
   - Actor cannot modify:
     - Email (unique identifier)
     - Employee ID
     - Joining Date (immutable)

4. **Change Department (Optional)**: Actor changes employee's department
   - Actor selects new department from dropdown
   - System validates new department exists
   - If manager is assigned, proceed to step 5
   - If no manager, proceed to step 6

5. **Validate Manager in New Department**: System validates manager compatibility
   - If manager is assigned:
     - System checks if manager is in the new department
     - If manager is not in new department, proceed to Alternative Flow 5a
     - If manager is in new department, proceed to step 6

6. **Submit Changes**: Actor clicks "Save Changes" button
   - Frontend performs client-side validation
   - If validation passes, proceed to step 7
   - If validation fails, proceed to Alternative Flow 6a

7. **Backend Validation**: System validates changes
   - Validate all required fields are present
   - Validate salary is positive (if changed)
   - Validate performance rating is 0.0-5.0 (if changed)
   - Validate experience years is non-negative (if changed)
   - Validate department exists (if changed)
   - Validate location exists (if changed)
   - If manager is provided:
     - Validate manager exists
     - Validate manager is in same department as employee
   - If validation fails, proceed to Alternative Flow 7a

8. **Update Employee Record**: System updates employee record
   - System loads existing employee entity
   - System applies changes to employee entity
   - System sets updated timestamp
   - System saves updated employee to database via EmployeeRepository

9. **Success Response**: System displays success message
   - System returns HTTP 200 OK with updated EmployeeResponseDTO
   - Frontend displays success notification
   - Frontend refreshes employee details view
   - Frontend optionally redirects to employee list

---

## Alternative Flows

### 5a. Manager Not in New Department
- **Trigger**: Actor changes department but manager is not in the new department
- **Flow**:
  1. System validates manager's department
  2. System detects department mismatch
  3. System displays validation error: "Manager must be in the same department as the employee. Please remove manager or select a manager from the new department."
  4. System highlights manager dropdown field
  5. Actor must:
     - Remove manager assignment, OR
     - Select a manager from the new department, OR
     - Revert department change
  6. Use case continues from step 3

### 6a. Validation Fails (Client-Side)
- **Trigger**: Client-side validation fails before form submission
- **Flow**:
  1. Frontend validates form fields
  2. Frontend detects validation errors
  3. Frontend displays inline error messages
  4. Frontend highlights invalid fields
  5. Actor corrects errors
  6. Use case continues from step 3

### 7a. Validation Fails (Server-Side)
- **Trigger**: Server-side validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors:
     - Missing required fields
     - Invalid salary (negative or zero)
     - Invalid performance rating (outside 0.0-5.0 range)
     - Invalid experience years (negative)
     - Department does not exist
     - Location does not exist
     - Manager does not exist (if provided)
     - Manager in different department (if provided)
  3. System returns HTTP 400 Bad Request with error details
  4. Frontend displays error message with specific validation errors
  5. Actor corrects errors
  6. Use case continues from step 3

### 7b. Employee Not Found
- **Trigger**: Employee ID does not exist in database
- **Flow**:
  1. System attempts to load employee
  2. System finds no employee with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Employee not found" message
  5. Use case terminates

### 7c. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 7d. Database Error
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
- Employee record is updated in the database
- Updated timestamp is set
- Employee information reflects the changes
- Employee appears in employee list with updated information
- Related entities (department, location, manager) are updated if changed

### Failure Postconditions
- Employee record remains unchanged
- Error information is available for user review
- Form state may be preserved for correction

---

## Business Rules

1. **Email Immutability**: Employee email cannot be changed (unique identifier)
2. **Joining Date Immutability**: Employee joining date cannot be changed (historical record)
3. **Department Change**: When department is changed:
   - If manager is assigned, manager must be in the new department
   - Employee's manager relationship may need to be updated
4. **Manager Department Constraint**: Manager must always be in the same department as the employee
5. **Salary Validation**: Salary must be a positive number
6. **Performance Rating**: If provided, performance rating must be between 0.0 and 5.0
7. **Experience Years**: If provided, experience years must be non-negative

---

## Validation Rules

### Editable Fields
- `firstName`: String, 1-50 characters, not null
- `lastName`: String, 1-50 characters, not null
- `phone`: String, valid phone format (if provided)
- `address`: String, max 255 characters
- `designation`: String, 1-100 characters, not null
- `salary`: Double, > 0, not null
- `performanceRating`: Double, 0.0 - 5.0 (if provided)
- `experienceYears`: Integer, >= 0 (if provided)
- `departmentId`: UUID, must exist (if changed)
- `locationId`: UUID, must exist (if changed)
- `managerId`: UUID, must exist, must be in same department as employee (if provided)

### Immutable Fields
- `id`: Cannot be changed
- `email`: Cannot be changed
- `joiningDate`: Cannot be changed

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing required field | 400 | "Field {fieldName} is required" |
| VALIDATION_ERROR | Invalid salary | 400 | "Salary must be greater than 0" |
| VALIDATION_ERROR | Invalid performance rating | 400 | "Performance rating must be between 0.0 and 5.0" |
| VALIDATION_ERROR | Invalid experience years | 400 | "Experience years must be non-negative" |
| NOT_FOUND | Employee does not exist | 404 | "Employee not found" |
| NOT_FOUND | Department does not exist | 404 | "Department not found" |
| NOT_FOUND | Location does not exist | 404 | "Location not found" |
| NOT_FOUND | Manager does not exist | 404 | "Manager not found" |
| VALIDATION_ERROR | Manager in different department | 400 | "Manager must be in the same department as the employee" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while updating employee. Please try again." |

---

## Related Use Cases

- **UC-EM-002**: View Employee List (to navigate to employee)
- **UC-EM-003**: View Employee Details (to view employee before editing)
- **UC-EM-001**: Create Employee (similar validation rules)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/employees/{id}`
- **Path Parameters**: `id` (UUID)
- **Request Body**: `EmployeeRequestDTO`
- **Response**: `EmployeeResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`
- **Role-Based Filtering**: Not applicable (update operation)

### Components Involved
- **Frontend**: EmployeeFormComponent, EmployeeService, TypeaheadComponent
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository, EmployeeMapper
- **Validation**: ValidationService, @Valid annotations

### Design Patterns
- **Repository Pattern**: EmployeeRepository for data access
- **Service Layer Pattern**: EmployeeService for business logic
- **DTO Pattern**: EmployeeRequestDTO, EmployeeResponseDTO for data transfer
- **Mapper Pattern**: EmployeeMapper for entity-DTO conversion

---

**Last Updated**: 2024-12-12  
**Status**: Active

### UI Components
- **Typeahead Component**: Reusable autocomplete component for manager selection
  - Pre-loads current manager employee if assigned
  - Filters managers by selected department automatically
  - Provides real-time search as user types (minimum 2 characters)
  - Displays employee suggestions with name, email, and designation
  - Excludes current employee from search results in edit mode
  - Allows clearing selection to remove manager
  - Disabled until department is selected
  - Validates selection before form submission
  - Handles loading states and error messages

