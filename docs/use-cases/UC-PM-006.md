# UC-PM-006: View Project Details

## Use Case Information

- **Use Case ID**: UC-PM-006
- **Title**: View Project Details
- **Category**: Project Management
- **Priority**: Medium
- **Status**: Active

---

## Actor(s)

- **Department Manager** (`DEPARTMENT_MANAGER`)
- **Employee** (`EMPLOYEE`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have one of the above roles
- Authorization enforced via `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'DEPARTMENT_MANAGER', 'EMPLOYEE'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role
3. **Project must exist** in the system
4. User must have permission to view the project:
   - **SYSTEM_ADMIN**: Can view any project
   - **DEPARTMENT_MANAGER**: Can only view projects in their department
   - **EMPLOYEE**: Can only view projects they are assigned to

---

## Main Flow

1. **Initiate View**: Actor clicks on project in list or navigates to project details
   - Actor views project list (UC-PM-002)
   - Actor clicks on project row
   - OR Actor navigates directly to project details page via URL
   - System identifies project ID from click or URL parameter

2. **Request Project Details**: Frontend requests project details
   - Frontend calls `GET /api/projects/{id}` with project ID
   - Frontend includes JWT token in Authorization header

3. **Validate Access**: System validates user has permission to view project
   - System validates JWT token
   - System extracts user role and department/user ID from token
   - System checks authorization:
     - **SYSTEM_ADMIN**: Access granted
     - **DEPARTMENT_MANAGER**: Check if project is in their department
     - **EMPLOYEE**: Check if employee is assigned to project
   - If access denied, proceed to Alternative Flow 3a

4. **Fetch Project Data**: System retrieves project details
   - System queries ProjectRepository by ID
   - System loads related entities:
     - Department (with department details)
     - Project Manager (with employee details)
     - Assigned Employees (via EmployeeProjectRepository)
     - Tasks (via TaskRepository)
   - System constructs ProjectResponseDTO with all details

5. **Return Project Details**: System returns project data
   - System returns HTTP 200 OK with ProjectResponseDTO
   - Response includes:
     - Project information (name, description, start date, budget, status)
     - Department information
     - Project Manager information
     - Assigned employees list with roles
     - Tasks list

6. **Display Project Details**: Frontend displays project information
   - System displays project details in modal/overlay or dedicated page
   - System displays sections:
     - **Project Information**: Name, description, start date, budget, status
     - **Department**: Department name and details
     - **Project Manager**: Manager name and contact
     - **Assigned Employees**: List of employees with their roles
     - **Tasks**: List of tasks with status

---

## Alternative Flows

### 3a. Access Denied
- **Trigger**: User does not have permission to view the project
- **Flow**:
  1. System checks user role and project access
  2. System detects insufficient permissions:
     - Department Manager trying to view project from different department
     - Employee trying to view project they are not assigned to
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 3b. Project Not Found
- **Trigger**: Project ID does not exist in database
- **Flow**:
  1. System queries ProjectRepository
  2. System finds no project with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Project not found" message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Project details are displayed to the user
- User can view all accessible project information
- User can navigate to related entities (department, employees, tasks)
- User can perform authorized actions (edit, delete, assign employees) if permissions allow

---

## Business Rules

1. **Role-Based Access Control**:
   - **SYSTEM_ADMIN**: Can view any project's details
   - **DEPARTMENT_MANAGER**: Can only view projects in their own department
   - **EMPLOYEE**: Can only view projects they are assigned to

2. **Related Data Loading**: Project details include:
   - Department information
   - Project Manager information
   - Assigned employees with roles
   - Tasks with status

---

## Related Use Cases

- **UC-PM-002**: View Project List (entry point to view details)
- **UC-PM-003**: Assign Employee to Project (can be triggered from details page)
- **UC-PM-004**: Update Project (can be triggered from details page)
- **UC-TM-001**: Create Task (can be triggered from project details)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/projects/{id}`
- **Path Parameters**: `id` (UUID)
- **Response**: `ProjectResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'DEPARTMENT_MANAGER', 'EMPLOYEE'))`
- **Role-Based Filtering**: Applied at service level to check access permissions

---

**Last Updated**: 2024-12-12  
**Status**: Active

