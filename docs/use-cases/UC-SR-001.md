# UC-SR-001: Search Employees

## Use Case Information

- **Use Case ID**: UC-SR-001
- **Title**: Search Employees
- **Category**: Search
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

1. **Enter Search Query**: Actor enters search query in search bar
   - Actor navigates to employee list or search page
   - Actor enters search query in search input field
   - Search query can be:
     - Employee name (first name or last name)
     - Email address
     - Designation

2. **Submit Search**: Actor submits search (by clicking search button or pressing Enter)
   - Frontend sends GET request to `/api/employees/search?q={query}`
   - System validates JWT token
   - System extracts user role from token

3. **Perform Search**: System performs search
   - System applies role-based filtering:
     - **SYSTEM_ADMIN**: Searches all employees
     - **HR_MANAGER**: Searches all employees
     - **DEPARTMENT_MANAGER**: Searches only employees in their department
   - System searches across:
     - Employee names (firstName, lastName)
     - Email addresses
     - Designations
   - System performs case-insensitive partial matching
   - System returns matching results

4. **Display Search Results**: System displays search results
   - System displays list of matching employees
   - Results show:
     - Employee name
     - Email
     - Designation
     - Department
   - Actor can click on result to view employee details (UC-EM-003)

---

## Alternative Flows

### 3a. No Results Found
- **Trigger**: No employees match the search query
- **Flow**:
  1. System performs search
  2. System finds no matching employees
  3. System returns empty list
  4. Frontend displays "No employees found" message
  5. Actor can modify search query and try again

### 3b. Empty Search Query
- **Trigger**: Actor submits empty search query
- **Flow**:
  1. Frontend validates search query
  2. Frontend detects empty query
  3. Frontend displays all employees (or shows validation message)
  4. Use case continues

---

## Postconditions

### Success Postconditions
- Search results are displayed to the user
- Results are filtered based on user's role
- User can view employee details from search results

---

## Business Rules

1. **Role-Based Filtering**:
   - **SYSTEM_ADMIN**: Can search all employees
   - **HR_MANAGER**: Can search all employees
   - **DEPARTMENT_MANAGER**: Can only search employees in their department

2. **Search Scope**: Search includes:
   - Employee names (first name, last name)
   - Email addresses
   - Designations

3. **Search Type**: Case-insensitive partial matching

---

## Related Use Cases

- **UC-EM-002**: View Employee List (related functionality)
- **UC-EM-003**: View Employee Details (to view search results)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/employees/search`
- **Query Parameters**: `q` (search query string)
- **Response**: `List<EmployeeResponseDTO>` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`
- **Role-Based Filtering**: Applied at repository level

---

**Last Updated**: 2024-12-12  
**Status**: Active

