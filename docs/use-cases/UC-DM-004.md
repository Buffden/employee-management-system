# UC-DM-004: Delete Department

## Use Case Information

- **Use Case ID**: UC-DM-004
- **Title**: Delete Department
- **Category**: Department Management
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **System Administrator** (`SYSTEM_ADMIN`) **ONLY**

**Role Requirements**:
- User must be authenticated
- User must have `SYSTEM_ADMIN` role
- Authorization enforced via `@PreAuthorize(hasRole('SYSTEM_ADMIN'))`

---

## Preconditions

1. User must be authenticated and logged in
2. User must have `SYSTEM_ADMIN` role
3. **Department must exist** in the system
4. **Department must have no employees assigned** (critical precondition)

---

## Main Flow

1. **Navigate to Department Details**: Actor navigates to department details page
   - Actor views department list (UC-DM-002)
   - Actor clicks on department to view details
   - System displays department details

2. **Initiate Delete**: Actor clicks "Delete" button
   - System displays delete confirmation dialog
   - Dialog shows department name and warning

3. **Confirm Deletion**: Actor confirms deletion
   - Actor clicks "Confirm Delete" button

4. **Check Employee Assignments**: System checks for employee assignments
   - System queries EmployeeRepository for employees in this department
   - If employees found, proceed to Alternative Flow 4a
   - If no employees, proceed to step 5

5. **Delete Department Record**: System deletes department record
   - System deletes department from database
   - System returns success response

6. **Success Response**: System displays success message
   - Frontend displays success notification
   - Frontend redirects to department list
   - Department no longer appears in list

---

## Alternative Flows

### 4a. Department Has Employees
- **Trigger**: Department has employees assigned
- **Flow**:
  1. System checks for employees
  2. System finds employees in department
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error: "Cannot delete department. Department has employees assigned. Please reassign or remove employees before deletion."
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Department record is deleted from the database
- Department no longer appears in department list

### Failure Postconditions
- Department record remains unchanged
- Error information is displayed

---

## Business Rules

1. **Employee Constraint**: Department cannot be deleted if it has employees assigned
2. **System Admin Only**: Only System Administrators can delete departments

---

## Related Use Cases

- **UC-DM-002**: View Department List (to navigate to department)
- **UC-EM-004**: Update Employee (to reassign employees before deletion)

---

## Technical Notes

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/departments/{id}`
- **Response**: HTTP 200 OK or HTTP 204 No Content

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

