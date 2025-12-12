# UC-LM-002: View Location List

## Use Case Information

- **Use Case ID**: UC-LM-002
- **Title**: View Location List
- **Category**: Location Management
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

1. **Navigation**: Actor navigates to Location List page
   - Actor clicks on "Locations" in navigation menu
   - System displays Location List page

2. **Load Location List**: System fetches location list
   - Frontend calls `GET /api/locations`
   - System validates JWT token
   - System queries database via LocationRepository
   - System returns location list

3. **Display Location List**: System displays location list
   - System displays location table with columns:
     - Name
     - Address
     - City
     - State
     - Country
     - Postal Code
   - System displays total location count

4. **View Location Details (Optional)**: Actor can click on location to view details
   - Actor clicks on location row
   - System displays location details in modal/overlay or navigates to details page

---

## Alternative Flows

### 2a. No Locations Found
- **Trigger**: No locations exist in the system
- **Flow**:
  1. System queries database
  2. System finds no locations
  3. System returns empty list
  4. System displays "No locations found" message
  5. System suggests creating a location

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
- Location list is displayed to the user
- User can view all locations
- User can navigate to location details

---

## Business Rules

1. **No Role-Based Filtering**: All authorized users see all locations (no department-based filtering)
2. **Location Usage**: Locations are shared across the organization

---

## Related Use Cases

- **UC-LM-001**: Create Location (to add new locations)
- **UC-LM-003**: Update Location (to modify locations)
- **UC-LM-004**: Delete Location (to remove locations)

---

## Technical Notes

### API Endpoint
- **Method**: `GET`
- **Path**: `/api/locations`
- **Response**: `List<LocationResponseDTO>` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER'))`

---

**Last Updated**: 2024-12-12  
**Status**: Active

