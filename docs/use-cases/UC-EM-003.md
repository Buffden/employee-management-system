# UC-EM-003: View Employee Details

## Use Case Information

- **Use Case ID**: UC-EM-003
- **Title**: View Employee Details
- **Category**: Employee Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **HR Manager** (`HR_MANAGER`)
- **Department Manager** (`DEPARTMENT_MANAGER`)
- **Employee** (`EMPLOYEE`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have one of the above roles
- Authorization enforced via `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role
3. **Employee must exist** in the system
4. User must have permission to view the employee:
   - **SYSTEM_ADMIN**: Can view any employee
   - **HR_MANAGER**: Can view any employee
   - **DEPARTMENT_MANAGER**: Can only view employees in their department
   - **EMPLOYEE**: Can only view their own details

---

## Main Flow

1. **Initiate View**: Actor clicks on employee in list or navigates to employee details
   - Actor clicks on employee row in employee list (UC-EM-002)
   - OR Actor navigates directly to employee details page via URL
   - System identifies employee ID from click or URL parameter

2. **Request Employee Details**: Frontend requests employee details
   - Frontend calls `GET /api/employees/{id}` with employee ID
   - Frontend includes JWT token in Authorization header

3. **Validate Access**: System validates user has permission to view employee
   - System validates JWT token
   - System extracts user role and user ID from token
   - System checks authorization:
     - **SYSTEM_ADMIN** or **HR_MANAGER**: Access granted
     - **DEPARTMENT_MANAGER**: Check if employee is in their department
     - **EMPLOYEE**: Check if employee ID matches user's employee ID
   - If access denied, proceed to Alternative Flow 3a

4. **Fetch Employee Data**: System retrieves employee details
   - System queries EmployeeRepository by ID
   - System loads related entities:
     - Department (with department details)
     - Location (with location details)
     - Manager (if assigned, with manager details)
     - Assigned Projects (via EmployeeProjectRepository)
   - System constructs EmployeeResponseDTO with all details

5. **Return Employee Details**: System returns employee data
   - System returns HTTP 200 OK with EmployeeResponseDTO
   - Response includes:
     - Employee profile information
     - Department information
     - Location information
     - Manager information (if assigned)
     - Assigned projects list
     - Performance metrics (if available)

6. **Display Employee Details**: Frontend displays employee information
   - System displays employee details in modal/overlay or dedicated page
   - System displays sections:
     - **Personal Information**: Name, email, phone, address
     - **Employment Information**: Designation, salary, joining date, experience
     - **Department & Location**: Department name, location details
     - **Manager**: Manager name and contact (if assigned)
     - **Assigned Projects**: List of projects employee is assigned to
     - **Performance**: Performance rating (if available)

7. **View Project Details (Optional)**: Actor can view project details
   - Actor clicks on a project in assigned projects list
   - System triggers project details view (UC-PM-002 related)
   - System displays project information

---

## Alternative Flows

### 3a. Access Denied
- **Trigger**: User does not have permission to view the employee
- **Flow**:
  1. System checks user role and employee access
  2. System detects insufficient permissions:
     - Department Manager trying to view employee from different department
     - Employee trying to view another employee's details
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 3b. Employee Not Found
- **Trigger**: Employee ID does not exist in database
- **Flow**:
  1. System queries EmployeeRepository
  2. System finds no employee with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Employee not found" message
  5. Use case terminates

### 3c. Unauthorized Access
- **Trigger**: User is not authenticated or does not have required role
- **Flow**:
  1. System validates JWT token
  2. System detects invalid token or missing role
  3. System returns HTTP 401 Unauthorized or HTTP 403 Forbidden
  4. Frontend redirects to login page
  5. Use case terminates

### 3d. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to query database
  2. Database operation fails
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- Employee details are displayed to the user
- User can view all accessible employee information
- User can navigate to related entities (department, location, projects)
- User can perform authorized actions (edit, delete) if permissions allow

### Failure Postconditions
- Error message is displayed
- Employee details are not shown
- User remains on previous page

---

## Business Rules

1. **Role-Based Access Control**:
   - **SYSTEM_ADMIN**: Can view any employee's details
   - **HR_MANAGER**: Can view any employee's details
   - **DEPARTMENT_MANAGER**: Can only view employees in their own department
   - **EMPLOYEE**: Can only view their own details

2. **Data Privacy**: 
   - Salary information may be restricted based on role (future enhancement)
   - Performance ratings may be restricted based on role (future enhancement)

3. **Related Data Loading**: Employee details include:
   - Department information (name, description)
   - Location information (full address)
   - Manager information (if assigned)
   - Assigned projects (project name, role, status)

---

## Validation Rules

### Path Parameters
- `id`: UUID, must exist in database, required

### Authorization Checks
- User must be authenticated
- User must have appropriate role
- User must have permission to view the specific employee

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| UNAUTHORIZED | Not authenticated | 401 | "Please log in to view employee details" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. You do not have permission to view this employee." |
| NOT_FOUND | Employee does not exist | 404 | "Employee not found" |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while loading employee details. Please try again." |

---

## Related Use Cases

- **UC-EM-002**: View Employee List (entry point to view details)
- **UC-EM-004**: Update Employee (can be triggered from details page)
- **UC-EM-005**: Delete Employee (can be triggered from details page)
- **UC-PM-002**: View Project List (to view assigned projects)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/employees/{id}`
- **Path Parameters**: `id` (UUID)
- **Response**: `EmployeeResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE'))`
- **Role-Based Filtering**: Applied at service level to check access permissions

### Components Involved
- **Frontend**: EmployeeDetailsComponent, EmployeeService
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository, EmployeeProjectRepository
- **Authorization**: SecurityService for role and permission checks

### Design Patterns
- **Repository Pattern**: EmployeeRepository, EmployeeProjectRepository for data access
- **Service Layer Pattern**: EmployeeService for business logic and authorization
- **DTO Pattern**: EmployeeResponseDTO for data transfer

---

**Last Updated**: 2024-12-12  
**Status**: Active

