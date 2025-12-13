# UC-DM-001: Create Department

## Use Case Information

- **Use Case ID**: UC-DM-001
- **Title**: Create Department
- **Category**: Department Management
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
3. **Location must exist** in the system
4. If assigning department head, the employee must exist

---

## Main Flow

1. **Navigation**: Actor navigates to Department Management page
   - Actor clicks on "Departments" in navigation menu
   - System displays Department Management page

2. **Initiate Creation**: Actor clicks "Add Department" button
   - System displays department creation form
   - Form includes fields: name, description, budget, location, departmentHead (optional)
   - Department head field uses typeahead component for employee search

3. **Fill Department Details**: Actor fills in department information
   - **Required Fields**:
     - Name (String, 1-100 characters, unique)
     - Description (String, max 500 characters)
     - Budget (Double, >= 0)
     - Location (UUID, must exist)
   - **Optional Fields**:
     - Department Head (UUID, employee ID, must exist if provided)

4. **Select Location**: Actor selects location from dropdown
   - System validates location exists
   - System displays location details (city, state, country)

5. **Assign Department Head (Optional)**: Actor optionally selects department head using typeahead component
   - Actor types employee name or email in typeahead field (minimum 2 characters)
   - System searches employees matching the search term via `/api/employees/search`
   - System displays matching employees in dropdown with name, email, and designation
   - Actor selects an employee from the suggestions
   - System stores the selected employee ID
   - If department head is selected:
     - System validates employee exists
     - System displays employee details (name, email) in the typeahead field

6. **Submit Form**: Actor clicks "Create Department" button
   - Frontend performs client-side validation
   - If validation passes, proceed to step 7
   - If validation fails, proceed to Alternative Flow 6a

7. **Backend Validation**: System validates input
   - Validate all required fields are present
   - Validate department name is unique
   - Validate budget is non-negative
   - Validate location exists
   - If department head is provided, validate employee exists
   - If validation fails, proceed to Alternative Flow 7a

8. **Create Department Record**: System creates department record
   - System generates UUID for department ID
   - System creates Department entity with provided data
   - System sets created timestamp
   - System saves department to database via DepartmentRepository

9. **Success Response**: System displays success message
   - System returns HTTP 201 Created with DepartmentResponseDTO
   - Frontend displays success notification
   - Frontend optionally redirects to department list or department details page

---

## Alternative Flows

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
     - Duplicate department name
     - Invalid budget (negative)
     - Location does not exist
     - Department head does not exist (if provided)
  3. System returns HTTP 400 Bad Request with error details
  4. Frontend displays error message with specific validation errors
  5. Actor corrects errors
  6. Use case continues from step 3

### 7b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 7c. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to save department
  2. Database operation fails
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- Department record is created in the database
- Department has a unique UUID assigned
- Department is associated with the selected location
- If department head was assigned, department has head relationship established
- Department appears in department list
- Department can be viewed, updated, or deleted by authorized users

### Failure Postconditions
- No department record is created
- System state remains unchanged
- Error information is available for user review

---

## Business Rules

1. **Name Uniqueness**: Each department must have a unique name
2. **Location Requirement**: Department must be assigned to a location
3. **Budget Validation**: Budget must be non-negative
4. **Department Head**: Department head is optional but must be a valid employee if provided

---

## Validation Rules

### Required Fields
- `name`: String, 1-100 characters, unique, not null
- `description`: String, max 500 characters, not null
- `budget`: Double, >= 0, not null
- `locationId`: UUID, must exist in database

### Optional Fields
- `departmentHeadId`: UUID, must exist in database (if provided)

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing required field | 400 | "Field {fieldName} is required" |
| DUPLICATE_NAME | Department name already exists | 400 | "Department name already exists" |
| VALIDATION_ERROR | Invalid budget | 400 | "Budget must be non-negative" |
| NOT_FOUND | Location does not exist | 404 | "Location not found" |
| NOT_FOUND | Department head does not exist | 404 | "Department head not found" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while creating department. Please try again." |

---

## Related Use Cases

- **UC-DM-002**: View Department List (to see newly created department)
- **UC-DM-003**: Update Department (to modify department after creation)
- **UC-DM-004**: Delete Department (to remove department)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/departments`
- **Request Body**: `DepartmentRequestDTO`
- **Response**: `DepartmentResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

### Components Involved
- **Frontend**: DepartmentFormComponent, DepartmentService, TypeaheadComponent, EmployeeService
- **Backend**: DepartmentController, DepartmentService, DepartmentRepository, DepartmentMapper, EmployeeService, EmployeeRepository

---

**Last Updated**: 2024-12-12  
**Status**: Active

### UI Components
- **Typeahead Component**: Reusable autocomplete component for employee selection
  - Provides real-time search as user types
  - Displays employee suggestions with name, email, and designation
  - Validates selection before form submission
  - Handles loading states and error messages

