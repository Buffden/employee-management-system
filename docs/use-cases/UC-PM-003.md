# UC-PM-003: Assign Employee to Project

## Use Case Information

- **Use Case ID**: UC-PM-003
- **Title**: Assign Employee to Project
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
3. **Employee must exist** in the system
4. **Project must exist** in the system

---

## Main Flow

1. **Navigate to Project Details**: Actor navigates to project details page
   - Actor views project list (UC-PM-002)
   - Actor clicks on project to view details
   - System displays project details

2. **Initiate Assignment**: Actor clicks "Assign Employee" button
   - System displays employee assignment form
   - Form includes: employee selection, role selection

3. **Select Employee and Role**: Actor selects employee and role
   - Actor selects employee from dropdown
   - Actor selects role for the employee in the project
   - System validates employee exists

4. **Submit Assignment**: Actor clicks "Assign" button
   - System validates input
   - System creates employee-project assignment
   - System displays success message

---

## Postconditions

### Success Postconditions
- Employee is assigned to project
- EmployeeProject assignment record is created
- Employee appears in project's assigned employees list

---

## Business Rules

1. **Employee Requirement**: Employee must exist
2. **Project Requirement**: Project must exist
3. **Role Assignment**: Employee must have a role in the project

---

## Related Use Cases

- **UC-PM-002**: View Project List (to navigate to project)
- **UC-EM-002**: View Employee List (to select employee)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/projects/{projectId}/employees`
- **Request Body**: `EmployeeProjectRequestDTO`
- **Response**: `EmployeeProjectResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('DEPARTMENT_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

