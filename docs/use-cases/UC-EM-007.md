# UC-EM-007: View My Profile

## Use Case Information

- **Use Case ID**: UC-EM-007
- **Title**: View My Profile
- **Category**: Employee Management
- **Priority**: Medium
- **Status**: Active

---

## Actor(s)

- **Employee** (`EMPLOYEE`)
- **All Authenticated Users** (can view their own profile)

**Role Requirements**:
- User must be authenticated
- User must have an associated employee record
- User can only view their own profile

---

## Preconditions

1. User must be authenticated and logged in
2. User must have an associated employee record in the system

---

## Main Flow

1. **Navigation**: Actor navigates to "My Profile"
   - Actor clicks "My Profile" in user dropdown menu (header)
   - OR Actor navigates to profile page via URL
   - System identifies current user from JWT token

2. **Request Profile Data**: Frontend requests employee profile
   - Frontend calls `GET /api/employees/me` or `GET /api/employees/{employeeId}`
   - Frontend includes JWT token in Authorization header
   - System extracts user ID and employee ID from token

3. **Fetch Employee Profile**: System retrieves employee profile
   - System queries EmployeeRepository by employee ID (from user's employee relationship)
   - System loads related entities:
     - Department (with department details)
     - Location (with location details)
     - Manager (if assigned, with manager details)
     - Assigned Projects (via EmployeeProjectRepository)
     - Assigned Tasks (via TaskRepository)
   - System constructs EmployeeResponseDTO with profile details

4. **Return Profile Data**: System returns employee profile
   - System returns HTTP 200 OK with EmployeeResponseDTO
   - Response includes:
     - Personal information (name, email, phone, address)
     - Employment information (designation, salary, joining date, experience)
     - Department and location information
     - Manager information (if assigned)
     - Assigned projects list
     - Assigned tasks list

5. **Display Profile**: Frontend displays employee profile
   - System displays profile page with sections:
     - **Personal Information**: Name, email, phone, address
     - **Employment Information**: Designation, salary, joining date, experience, performance rating
     - **Department & Location**: Department name, location details
     - **Manager**: Manager name and contact (if assigned)
     - **Assigned Projects**: List of projects employee is assigned to
     - **Assigned Tasks**: List of tasks with status

---

## Alternative Flows

### 3a. Employee Not Found
- **Trigger**: User does not have an associated employee record
- **Flow**:
  1. System queries EmployeeRepository
  2. System finds no employee associated with user
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Employee profile not found" message
  5. Use case terminates

### 3b. Unauthorized Access
- **Trigger**: User is not authenticated
- **Flow**:
  1. System validates JWT token
  2. System detects invalid or missing token
  3. System returns HTTP 401 Unauthorized
  4. Frontend redirects to login page
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Employee profile is displayed to the user
- User can view all their own profile information
- User can navigate to related entities (projects, tasks)
- User can perform authorized actions (update profile) if permissions allow

---

## Business Rules

1. **Self-View Only**: User can only view their own profile
2. **Employee Association**: User must have an associated employee record
3. **Data Privacy**: All profile data is visible to the employee (their own data)

---

## Related Use Cases

- **UC-EM-008**: Update My Profile (to modify profile information)
- **UC-EM-003**: View Employee Details (similar but for viewing other employees)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/employees/me` or `/api/employees/{employeeId}` (where employeeId is from current user)
- **Response**: `EmployeeResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: User can only access their own profile (employee ID from token must match)

### Components Involved
- **Frontend**: ProfileComponent, EmployeeService
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository

---

**Last Updated**: 2024-12-12  
**Status**: Active

