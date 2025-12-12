# UC-LM-003: Update Location

## Use Case Information

- **Use Case ID**: UC-LM-003
- **Title**: Update Location
- **Category**: Location Management
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
3. **Location must exist** in the system

---

## Main Flow

1. **Navigate to Location Details**: Actor navigates to location details page
   - Actor views location list (UC-LM-002)
   - Actor clicks on location to view details
   - System displays location details

2. **Initiate Edit**: Actor clicks "Edit" button
   - System displays location edit form
   - Form is pre-populated with current location data
   - Form includes fields: name, address, city, state, country, postalCode

3. **Modify Location Information**: Actor modifies location information
   - Actor can modify:
     - Name (must remain unique)
     - Address
     - City
     - State
     - Country
     - Postal Code

4. **Submit Changes**: Actor clicks "Save Changes" button
   - Frontend performs client-side validation
   - System validates changes
   - System updates location record
   - System displays success message

---

## Alternative Flows

### 4a. Validation Fails
- **Trigger**: Validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors:
     - Duplicate location name (if name changed)
     - Missing required fields
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error messages
  5. Actor corrects errors

### 4b. Location Not Found
- **Trigger**: Location does not exist
- **Flow**:
  1. System attempts to load location
  2. System finds no location with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "Location not found" message

### 4c. Unauthorized Access
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
- Location record is updated in the database
- Updated timestamp is set
- Location information reflects the changes
- Departments and employees using this location see updated information

---

## Business Rules

1. **Name Uniqueness**: Location name must remain unique (if changed)
2. **Required Fields**: Name, city, state, and country are required
3. **Cascade Update**: Changes to location affect all departments and employees using it

---

## Related Use Cases

- **UC-LM-002**: View Location List (to navigate to location)
- **UC-LM-001**: Create Location (similar validation rules)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/locations/{id}`
- **Request Body**: `LocationRequestDTO`
- **Response**: `LocationResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

