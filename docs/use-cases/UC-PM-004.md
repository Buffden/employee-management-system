# UC-PM-004: Update Project

## Use Case Information

- **Use Case ID**: UC-PM-004
- **Title**: Update Project
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
4. If changing department, the new department must exist
5. If changing project manager, the employee must exist
6. **Department Manager**: Can only update projects in their own department

---

## Main Flow

1. **Navigate to Project Details**: Actor navigates to project details page
   - Actor views project list (UC-PM-002)
   - Actor clicks on project to view details
   - System displays project details

2. **Initiate Edit**: Actor clicks "Edit" button
   - System displays project edit form
   - Form is pre-populated with current project data
   - Form includes fields: name, description, startDate, budget, departmentId, projectManagerId

3. **Modify Project Information**: Actor modifies project information
   - Actor can modify:
     - Name
     - Description
     - Start Date
     - Budget
     - Department (Department Manager can only change within their department)
     - Project Manager
   - Actor cannot modify:
     - Project ID
     - Created timestamp

4. **Submit Changes**: Actor clicks "Save Changes" button
   - Frontend performs client-side validation
   - System validates changes
   - System updates project record
   - System displays success message

---

## Alternative Flows

### 4a. Validation Fails
- **Trigger**: Validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error messages
  5. Actor corrects errors

### 4b. Project Not Found
- **Trigger**: Project does not exist
- **Flow**:
  1. System attempts to load project
  2. System finds no project with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Project not found" message

### 4c. Unauthorized Access
- **Trigger**: User does not have required role or trying to update project from different department
- **Flow**:
  1. System checks user role and department
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Project record is updated in the database
- Updated timestamp is set
- Project information reflects the changes

---

## Business Rules

1. **Department Manager Constraint**: Department Managers can only update projects in their own department
2. **Budget Validation**: Budget must be non-negative
3. **Start Date**: Start date cannot be in the past (validation rule)
4. **Project Manager Requirement**: Project must have a valid project manager

---

## Related Use Cases

- **UC-PM-002**: View Project List (to navigate to project)
- **UC-PM-001**: Create Project (similar validation rules)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/projects/{id}`
- **Request Body**: `ProjectRequestDTO`
- **Response**: `ProjectResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Department Managers can only update their own department's projects

---

**Last Updated**: 2024-12-12  
**Status**: Active

