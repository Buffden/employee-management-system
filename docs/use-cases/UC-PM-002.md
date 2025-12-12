# UC-PM-002: View Project List

## Use Case Information

- **Use Case ID**: UC-PM-002
- **Title**: View Project List
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

---

## Main Flow

1. **Navigation**: Actor navigates to Project List page
   - Actor clicks on "Projects" in navigation menu
   - System displays Project List page

2. **Load Project List**: System fetches project list
   - System applies role-based filtering:
     - **SYSTEM_ADMIN**: Sees all projects
     - **DEPARTMENT_MANAGER**: Sees only projects in their department
     - **EMPLOYEE**: Sees only projects they are assigned to
   - System returns project list

3. **Display Project List**: System displays project list
   - System displays project table with columns:
     - Name
     - Description
     - Department
     - Project Manager
     - Start Date
     - Status
   - Actor can filter by department and status

4. **View Project Details (Optional)**: Actor can click on project to view details
   - Actor clicks on project row
   - System displays project details

---

## Postconditions

### Success Postconditions
- Project list is displayed to the user
- List is filtered based on user's role

---

## Business Rules

1. **Role-Based Filtering**:
   - **SYSTEM_ADMIN**: Can view all projects
   - **DEPARTMENT_MANAGER**: Can only view projects in their department
   - **EMPLOYEE**: Can only view projects they are assigned to

---

## Related Use Cases

- **UC-PM-001**: Create Project (to add new projects)
- **UC-PM-003**: Assign Employee to Project (to assign employees to projects)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/projects`
- **Response**: `List<ProjectResponseDTO>` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'DEPARTMENT_MANAGER', 'EMPLOYEE'))`
- **Role-Based Filtering**: Applied at repository level

---

**Last Updated**: 2024-12-12  
**Status**: Active

