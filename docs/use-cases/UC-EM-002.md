# UC-EM-002: View Employee List

## Use Case Information

- **Use Case ID**: UC-EM-002
- **Title**: View Employee List
- **Category**: Employee Management
- **Priority**: High
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
2. User must have appropriate role (`HR_MANAGER`, `DEPARTMENT_MANAGER`, or `SYSTEM_ADMIN`)

---

## Main Flow

1. **Navigation**: Actor navigates to Employee List page
   - Actor clicks on "Employees" in navigation menu
   - System displays Employee List page

2. **Load Employee List**: System fetches employee list
   - Frontend calls `GET /api/employees` with pagination parameters
   - System validates JWT token
   - System extracts user role from token
   - System applies role-based filtering:
     - **SYSTEM_ADMIN**: Sees all employees
     - **HR_MANAGER**: Sees all employees
     - **DEPARTMENT_MANAGER**: Sees only employees in their department
   - System queries database via EmployeeRepository
   - System returns paginated employee list

3. **Display Employee List**: System displays paginated list
   - System displays employee table with columns:
     - Name (firstName + lastName)
     - Email
     - Designation
     - Department
     - Location
     - Salary
     - Joining Date
   - System displays pagination controls (page number, page size, total pages)
   - System displays total employee count

4. **Sort Employees (Optional)**: Actor can sort by column
   - Actor clicks on column header (name, salary, department, etc.)
   - System sends request with sort parameters (`sortBy`, `sortOrder`)
   - System re-fetches employee list with sorting applied
   - System displays sorted list

5. **Filter Employees (Optional)**: Actor can filter by criteria
   - Actor selects filter options:
     - Department (dropdown)
     - Designation (dropdown)
     - Location (dropdown)
   - Actor clicks "Apply Filters"
   - System sends request with filter parameters
   - System re-fetches employee list with filters applied
   - System displays filtered list

6. **Search Employees (Optional)**: Actor can search by name or email
   - Actor enters search query in search bar
   - System sends request with search parameter (`search`)
   - System searches across employee names and emails
   - System displays matching results

7. **Navigate Pages (Optional)**: Actor can navigate between pages
   - Actor clicks "Next Page" or "Previous Page"
   - System sends request with updated page number
   - System re-fetches employee list for new page
   - System displays new page of results

8. **View Employee Details (Optional)**: Actor can click on employee to view details
   - Actor clicks on employee row
   - System triggers UC-EM-003 (View Employee Details)
   - System displays employee details in modal/overlay

---

## Alternative Flows

### 2a. No Employees Found
- **Trigger**: No employees match the current filters/search criteria
- **Flow**:
  1. System queries database
  2. System finds no matching employees
  3. System returns empty list
  4. System displays "No employees found" message
  5. System suggests clearing filters or adjusting search criteria

### 2b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 2c. Database Error
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
- Employee list is displayed to the user
- List is filtered based on user's role
- Pagination state is maintained
- Sort and filter state is maintained (if applied)
- User can interact with the list (sort, filter, search, paginate)

### Failure Postconditions
- Error message is displayed
- Previous list state may be preserved (if available)

---

## Business Rules

1. **Role-Based Filtering**:
   - **SYSTEM_ADMIN**: Can view all employees across all departments
   - **HR_MANAGER**: Can view all employees across all departments
   - **DEPARTMENT_MANAGER**: Can only view employees in their own department

2. **Pagination**: Employee list is paginated with configurable page size (default: 10, 20, 50, 100)

3. **Sorting**: Employees can be sorted by any column (name, email, designation, department, location, salary, joining date)

4. **Filtering**: Employees can be filtered by:
   - Department
   - Designation
   - Location

5. **Search**: Full-text search across employee names and email addresses

6. **Data Privacy**: Salary information may be restricted based on role (future enhancement)

---

## Validation Rules

### Query Parameters
- `page`: Integer, >= 0, default: 0
- `size`: Integer, 1-100, default: 10
- `sortBy`: String, valid column name, default: "firstName"
- `sortOrder`: String, "ASC" or "DESC", default: "ASC"
- `departmentId`: UUID, must exist (if provided)
- `designation`: String (if provided)
- `locationId`: UUID, must exist (if provided)
- `search`: String, max 100 characters (if provided)

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| VALIDATION_ERROR | Invalid pagination parameters | 400 | "Invalid pagination parameters" |
| VALIDATION_ERROR | Invalid sort column | 400 | "Invalid sort column" |
| NOT_FOUND | Department not found (filter) | 404 | "Department not found" |
| NOT_FOUND | Location not found (filter) | 404 | "Location not found" |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while loading employees. Please try again." |

---

## Related Use Cases

- **UC-EM-001**: Create Employee (to add new employees to the list)
- **UC-EM-003**: View Employee Details (to view individual employee details)
- **UC-EM-004**: Update Employee (to modify employees from the list)
- **UC-EM-005**: Delete Employee (to remove employees from the list)
- **UC-SR-001**: Search Employees (related search functionality)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/employees`
- **Query Parameters**: `page`, `size`, `sortBy`, `sortOrder`, `departmentId`, `designation`, `locationId`, `search`
- **Response**: `PaginatedResponseDTO<EmployeeResponseDTO>` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Applied at repository level via `findAllFilteredByRole()`

### Components Involved
- **Frontend**: EmployeeListComponent, EmployeeService, PaginationComponent
- **Backend**: EmployeeController, EmployeeService, EmployeeRepository
- **Filtering**: Repository-level filtering based on user role and department

### Design Patterns
- **Repository Pattern**: EmployeeRepository with role-based filtering
- **Strategy Pattern**: Different filtering strategies for different roles
- **Pagination Pattern**: Server-side pagination for large datasets

---

**Last Updated**: 2024-12-12  
**Status**: Active

