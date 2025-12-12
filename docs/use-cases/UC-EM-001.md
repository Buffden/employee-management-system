# UC-EM-001: Create Employee

## Use Case Information

- **Use Case ID**: UC-EM-001
- **Title**: Create Employee
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
3. **Department must exist** in the system
4. **Location must exist** in the system
5. If assigning a manager, the manager must exist in the system

---

## Main Flow

1. **Navigation**: Actor navigates to Employee Management page
   - Actor clicks on "Employees" in navigation menu
   - System displays Employee Management page

2. **Initiate Creation**: Actor clicks "Add Employee" button
   - System displays employee creation form
   - Form includes fields: firstName, lastName, email, phone, address, designation, salary, joiningDate, department, location, manager (optional)

3. **Fill Employee Details**: Actor fills in employee information
   - **Required Fields**:
     - First Name (String, 1-50 characters)
     - Last Name (String, 1-50 characters)
     - Email (String, valid email format, unique)
     - Designation (String, 1-100 characters)
     - Salary (Double, > 0)
     - Joining Date (LocalDate, not null)
   - **Optional Fields**:
     - Phone (String, valid phone format)
     - Address (String, max 255 characters)
     - Performance Rating (Double, 0.0 - 5.0)
     - Experience Years (Integer, >= 0)

4. **Select Department**: Actor selects department from dropdown
   - System validates department exists
   - System displays department details (name, location)

5. **Select Location**: Actor selects location from dropdown
   - System validates location exists
   - System displays location details (city, state, country)

6. **Assign Manager (Optional)**: Actor optionally selects a manager
   - If manager is selected:
     - System validates manager exists
     - System validates manager is in the same department as the employee
     - If validation fails, proceed to Alternative Flow 5a

7. **Submit Form**: Actor clicks "Create Employee" button
   - Frontend performs client-side validation
   - If validation passes, proceed to step 8
   - If validation fails, proceed to Alternative Flow 6a

8. **Backend Validation**: System validates input
   - Validate all required fields are present
   - Validate email format and uniqueness
   - Validate salary is positive
   - Validate joining date is not in the future
   - Validate department exists
   - Validate location exists
   - If manager is provided:
     - Validate manager exists
     - Validate manager is in same department
   - If validation fails, proceed to Alternative Flow 6a

9. **Create Employee Record**: System creates employee record
   - System generates UUID for employee ID
   - System creates Employee entity with provided data
   - System sets created timestamp
   - System saves employee to database via EmployeeRepository

10. **Success Response**: System displays success message
    - System returns HTTP 201 Created with EmployeeResponseDTO
    - Frontend displays success notification
    - Frontend optionally redirects to employee list or employee details page

---

## Alternative Flows

### 6a. Manager Not in Same Department
- **Trigger**: Actor selects a manager who is not in the same department as the employee
- **Flow**:
  1. System validates manager's department
  2. System detects department mismatch
  3. System displays validation error: "Manager must be in the same department as the employee"
  4. System highlights manager dropdown field
  5. Actor must select a different manager or remove manager assignment
  6. Use case continues from step 5

### 6a. Validation Fails (Client-Side)
- **Trigger**: Client-side validation fails before form submission
- **Flow**:
  1. Frontend validates form fields
  2. Frontend detects validation errors (missing required fields, invalid formats, etc.)
  3. Frontend displays inline error messages
  4. Frontend highlights invalid fields
  5. Actor corrects errors
  6. Use case continues from step 3

### 8a. Validation Fails (Server-Side)
- **Trigger**: Server-side validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors:
     - Missing required fields
     - Invalid email format
     - Duplicate email
     - Invalid salary (negative or zero)
     - Invalid date format
     - Department does not exist
     - Location does not exist
     - Manager does not exist (if provided)
     - Manager in different department (if provided)
  3. System returns HTTP 400 Bad Request with error details
  4. Frontend displays error message with specific validation errors
  5. Actor corrects errors
  6. Use case continues from step 3

### 8b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 8c. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to save employee
  2. Database operation fails (connection error, constraint violation, etc.)
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- Employee record is created in the database
- Employee has a unique UUID assigned
- Employee is associated with the selected department
- Employee is associated with the selected location
- If manager was assigned, employee has manager relationship established
- Employee appears in employee list
- Employee can be viewed, updated, or deleted by authorized users

### Failure Postconditions
- No employee record is created
- System state remains unchanged
- Error information is available for user review

---

## Business Rules

1. **Email Uniqueness**: Each employee must have a unique email address
2. **Department Requirement**: Employee must be assigned to a department
3. **Location Requirement**: Employee must be assigned to a location
4. **Manager Department Constraint**: If a manager is assigned, they must be in the same department as the employee
5. **Salary Validation**: Salary must be a positive number
6. **Joining Date**: Joining date cannot be in the future
7. **Performance Rating**: If provided, performance rating must be between 0.0 and 5.0
8. **Experience Years**: If provided, experience years must be non-negative

---

## Validation Rules

### Required Fields
- `firstName`: String, 1-50 characters, not null
- `lastName`: String, 1-50 characters, not null
- `email`: String, valid email format, unique, not null
- `designation`: String, 1-100 characters, not null
- `salary`: Double, > 0, not null
- `joiningDate`: LocalDate, not null, not in future
- `departmentId`: UUID, must exist in database
- `locationId`: UUID, must exist in database

### Optional Fields
- `phone`: String, valid phone format (if provided)
- `address`: String, max 255 characters
- `managerId`: UUID, must exist in database, must be in same department as employee
- `performanceRating`: Double, 0.0 - 5.0 (if provided)
- `experienceYears`: Integer, >= 0 (if provided)

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing required field | 400 | "Field {fieldName} is required" |
| VALIDATION_ERROR | Invalid email format | 400 | "Invalid email format" |
| DUPLICATE_EMAIL | Email already exists | 400 | "Email already exists" |
| VALIDATION_ERROR | Invalid salary | 400 | "Salary must be greater than 0" |
| VALIDATION_ERROR | Invalid joining date | 400 | "Joining date cannot be in the future" |
| NOT_FOUND | Department does not exist | 404 | "Department not found" |
| NOT_FOUND | Location does not exist | 404 | "Location not found" |
| NOT_FOUND | Manager does not exist | 404 | "Manager not found" |
| VALIDATION_ERROR | Manager in different department | 400 | "Manager must be in the same department as the employee" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while creating employee. Please try again." |

---

## Related Use Cases

- **UC-EM-002**: View Employee List (to see newly created employee)
- **UC-EM-003**: View Employee Details (to view created employee)
- **UC-EM-004**: Update Employee (to modify employee after creation)
- **UC-DM-001**: Create Department (must be done before creating employee)
- **UC-DM-002**: View Department List (to select department)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/employees`
- **Request Body**: `EmployeeRequestDTO`
- **Response**: `EmployeeResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`
- **Role-Based Filtering**: Not applicable (creation operation)

### Components Involved
- **Frontend**: EmployeeFormComponent, EmployeeService
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository, EmployeeMapper
- **Validation**: ValidationService, @Valid annotations
- **Database**: Employee entity, Department entity, Location entity

### Design Patterns
- **Repository Pattern**: EmployeeRepository for data access
- **Service Layer Pattern**: EmployeeService for business logic
- **DTO Pattern**: EmployeeRequestDTO, EmployeeResponseDTO for data transfer
- **Mapper Pattern**: EmployeeMapper for entity-DTO conversion

---

**Last Updated**: 2024-12-12  
**Status**: Active

