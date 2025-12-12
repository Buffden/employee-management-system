# UC-LM-004: Delete Location

## Use Case Information

- **Use Case ID**: UC-LM-004
- **Title**: Delete Location
- **Category**: Location Management
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
3. **Location must exist** in the system
4. **Location must not be assigned to any department or employee** (critical precondition)

---

## Main Flow

1. **Navigate to Location Details**: Actor navigates to location details page
   - Actor views location list (UC-LM-002)
   - Actor clicks on location to view details
   - System displays location details

2. **Initiate Delete**: Actor clicks "Delete" button
   - System displays delete confirmation dialog
   - Dialog shows location name and warning

3. **Confirm Deletion**: Actor confirms deletion
   - Actor clicks "Confirm Delete" button

4. **Check Location Usage**: System checks for location usage
   - System queries DepartmentRepository for departments using this location
   - System queries EmployeeRepository for employees using this location
   - If location is in use, proceed to Alternative Flow 4a
   - If location is not in use, proceed to step 5

5. **Delete Location Record**: System deletes location record
   - System deletes location from database via LocationRepository
   - System returns success response

6. **Success Response**: System displays success message
   - Frontend displays success notification
   - Frontend redirects to location list
   - Location no longer appears in list

---

## Alternative Flows

### 4a. Location in Use
- **Trigger**: Location is assigned to departments or employees
- **Flow**:
  1. System checks for location usage
  2. System finds departments or employees using this location
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error: "Cannot delete location. Location is assigned to {count} department(s) and/or {count} employee(s). Please reassign or remove assignments before deletion."
  5. System displays list of departments and employees using this location
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- Location record is deleted from the database
- Location no longer appears in location list
- Location cannot be selected when creating/updating departments or employees

### Failure Postconditions
- Location record remains unchanged
- Error information is displayed

---

## Business Rules

1. **Usage Constraint**: Location cannot be deleted if it is assigned to any department or employee
2. **System Admin Only**: Only System Administrators can delete locations
3. **Cascade Prevention**: Deletion is prevented if location is in use (no cascade deletion)

---

## Related Use Cases

- **UC-LM-002**: View Location List (to navigate to location)
- **UC-DM-003**: Update Department (to reassign departments before deletion)
- **UC-EM-004**: Update Employee (to reassign employees before deletion)

---

## Technical Notes

### API Endpoint
- **Method**: `DELETE`
- **Path**: `/api/locations/{id}`
- **Response**: HTTP 200 OK or HTTP 204 No Content

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN'))`

### Components Involved
- **Frontend**: LocationDetailsComponent, LocationService
- **Backend**: LocationController, LocationService, LocationRepository, DepartmentRepository, EmployeeRepository

---

**Last Updated**: 2024-12-12  
**Status**: Active

