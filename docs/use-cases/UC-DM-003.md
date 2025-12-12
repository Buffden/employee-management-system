# UC-DM-003: Update Department

## Use Case Information

- **Use Case ID**: UC-DM-003
- **Title**: Update Department
- **Category**: Department Management
- **Priority**: High
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
3. **Department must exist** in the system
4. If changing location, the new location must exist
5. If assigning/changing department head, the employee must exist

---

## Main Flow

1. **Navigate to Department Details**: Actor navigates to department details page
   - Actor views department list (UC-DM-002)
   - Actor clicks on department to view details
   - System displays department details

2. **Initiate Edit**: Actor clicks "Edit" button
   - System displays department edit form
   - Form is pre-populated with current department data

3. **Modify Department Information**: Actor modifies department information
   - Actor can modify:
     - Name (must remain unique)
     - Description
     - Budget
     - Location
     - Department Head

4. **Submit Changes**: Actor clicks "Save Changes" button
   - Frontend performs client-side validation
   - System validates changes
   - System updates department record
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

### 4b. Department Not Found
- **Trigger**: Department does not exist
- **Flow**:
  1. System attempts to load department
  2. System finds no department with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Department not found" message

---

## Postconditions

### Success Postconditions
- Department record is updated in the database
- Updated timestamp is set
- Department information reflects the changes

---

## Business Rules

1. **Name Uniqueness**: Department name must remain unique (if changed)
2. **Budget Validation**: Budget must be non-negative
3. **Location Requirement**: Department must be assigned to a location

---

## Related Use Cases

- **UC-DM-002**: View Department List (to navigate to department)
- **UC-DM-001**: Create Department (similar validation rules)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/departments/{id}`
- **Request Body**: `DepartmentRequestDTO`
- **Response**: `DepartmentResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

