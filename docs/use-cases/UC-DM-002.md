# UC-DM-002: View Department List

## Use Case Information

- **Use Case ID**: UC-DM-002
- **Title**: View Department List
- **Category**: Department Management
- **Priority**: Medium
- **Status**: Active

---

## Actor(s)

- **HR Manager** (`HR_MANAGER`)
- **Department Manager** (`DEPARTMENT_MANAGER`)
- **System Administrator** (`SYSTEM_ADMIN`)

**Role Requirements**:
- User must be authenticated
- User must have one of the above roles
- Authorization enforced via `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have appropriate role

---

## Main Flow

1. **Navigation**: Actor navigates to Department List page
   - Actor clicks on "Departments" in navigation menu
   - System displays Department List page

2. **Load Department List**: System fetches department list
   - Frontend calls `GET /api/departments`
   - System validates JWT token
   - System extracts user role from token
   - System applies role-based filtering:
     - **SYSTEM_ADMIN**: Sees all departments
     - **HR_MANAGER**: Sees all departments
     - **DEPARTMENT_MANAGER**: Sees only their own department
   - System queries database via DepartmentRepository
   - System calculates employee counts for each department
   - System returns department list with employee counts

3. **Display Department List**: System displays department list
   - System displays department table with columns:
     - Name
     - Description
     - Location
     - Budget
     - Employee Count
     - Department Head
   - System displays total department count

4. **View Department Details (Optional)**: Actor can click on department to view details
   - Actor clicks on department row
   - System displays department details in modal/overlay or navigates to details page

---

## Alternative Flows

### 2a. No Departments Found
- **Trigger**: No departments exist or match user's role filter
- **Flow**:
  1. System queries database
  2. System finds no matching departments
  3. System returns empty list
  4. System displays "No departments found" message

### 2b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Department list is displayed to the user
- List is filtered based on user's role
- Employee counts are displayed for each department
- User can view department details

---

## Business Rules

1. **Role-Based Filtering**:
   - **SYSTEM_ADMIN**: Can view all departments
   - **HR_MANAGER**: Can view all departments
   - **DEPARTMENT_MANAGER**: Can only view their own department

2. **Employee Count**: Each department displays the count of employees assigned to it

---

## Related Use Cases

- **UC-DM-001**: Create Department (to add new departments)
- **UC-DM-003**: Update Department (to modify departments)
- **UC-DM-004**: Delete Department (to remove departments)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/departments`
- **Response**: `List<DepartmentResponseDTO>` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Applied at repository level

---

**Last Updated**: 2024-12-12  
**Status**: Active

