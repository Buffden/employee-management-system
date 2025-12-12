# UC-SR-002: Search Departments

## Use Case Information

- **Use Case ID**: UC-SR-002
- **Title**: Search Departments
- **Category**: Search
- **Priority**: Medium
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
2. User must have appropriate role

---

## Main Flow

1. **Enter Search Query**: Actor enters search query
   - Actor navigates to department list or search page
   - Actor enters search query in search input field
   - Search query can be:
     - Department name
     - Department description

2. **Submit Search**: Actor submits search
   - Frontend sends GET request to `/api/departments/search?q={query}`
   - System validates JWT token
   - System extracts user role from token

3. **Perform Search**: System performs search
   - System searches across:
     - Department names
     - Department descriptions
   - System performs case-insensitive partial matching
   - System returns matching results

4. **Display Search Results**: System displays search results
   - System displays list of matching departments
   - Results show:
     - Department name
     - Description
     - Location
     - Employee count
   - Actor can click on result to view department details

---

## Alternative Flows

### 3a. No Results Found
- **Trigger**: No departments match the search query
- **Flow**:
  1. System performs search
  2. System finds no matching departments
  3. System returns empty list
  4. Frontend displays "No departments found" message
  5. Actor can modify search query and try again

---

## Postconditions

### Success Postconditions
- Search results are displayed to the user
- User can view department details from search results

---

## Business Rules

1. **Search Scope**: Search includes:
   - Department names
   - Department descriptions

2. **Search Type**: Case-insensitive partial matching

---

## Related Use Cases

- **UC-DM-002**: View Department List (related functionality)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/departments/search`
- **Query Parameters**: `q` (search query string)
- **Response**: `List<DepartmentResponseDTO>` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

