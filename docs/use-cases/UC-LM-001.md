# UC-LM-001: Create Location

## Use Case Information

- **Use Case ID**: UC-LM-001
- **Title**: Create Location
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
2. User must have appropriate role (`HR_MANAGER` or `SYSTEM_ADMIN`)

---

## Main Flow

1. **Navigation**: Actor navigates to Location Management page
   - Actor clicks on "Locations" in navigation menu
   - System displays Location Management page

2. **Initiate Creation**: Actor clicks "Add Location" button
   - System displays location creation form
   - Form includes fields: name, address, city, state, country, postalCode

3. **Fill Location Details**: Actor fills in location information
   - **Required Fields**:
     - Name (String, 1-100 characters, unique)
     - City (String, 1-100 characters)
     - State (String, 1-100 characters)
     - Country (String, 1-100 characters, default: 'USA')
   - **Optional Fields**:
     - Address (String, max 255 characters)
     - Postal Code (String, max 20 characters)

4. **Submit Form**: Actor clicks "Create Location" button
   - Frontend performs client-side validation
   - If validation passes, proceed to step 5
   - If validation fails, proceed to Alternative Flow 4a

5. **Backend Validation**: System validates input
   - Validate all required fields are present
   - Validate location name is unique
   - Validate city, state, country are not empty
   - If validation fails, proceed to Alternative Flow 5a

6. **Create Location Record**: System creates location record
   - System generates UUID for location ID
   - System creates Location entity with provided data
   - System sets created timestamp
   - System saves location to database via LocationRepository

7. **Success Response**: System displays success message
   - System returns HTTP 201 Created with LocationResponseDTO
   - Frontend displays success notification
   - Frontend optionally redirects to location list or location details page

---

## Alternative Flows

### 4a. Validation Fails (Client-Side)
- **Trigger**: Client-side validation fails before form submission
- **Flow**:
  1. Frontend validates form fields
  2. Frontend detects validation errors
  3. Frontend displays inline error messages
  4. Frontend highlights invalid fields
  5. Actor corrects errors
  6. Use case continues from step 3

### 5a. Validation Fails (Server-Side)
- **Trigger**: Server-side validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors:
     - Missing required fields
     - Duplicate location name
     - Invalid field formats
  3. System returns HTTP 400 Bad Request with error details
  4. Frontend displays error message with specific validation errors
  5. Actor corrects errors
  6. Use case continues from step 3

### 5b. Unauthorized Access
- **Trigger**: User does not have required role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message
  5. Use case terminates

### 5c. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to save location
  2. Database operation fails
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- Location record is created in the database
- Location has a unique UUID assigned
- Location has a unique name
- Location appears in location list
- Location can be used when creating departments and employees

### Failure Postconditions
- No location record is created
- System state remains unchanged
- Error information is available for user review

---

## Business Rules

1. **Name Uniqueness**: Each location must have a unique name
2. **Required Fields**: Name, city, state, and country are required
3. **Default Country**: Country defaults to 'USA' if not specified
4. **Location Usage**: Location can be assigned to departments and employees

---

## Validation Rules

### Required Fields
- `name`: String, 1-100 characters, unique, not null
- `city`: String, 1-100 characters, not null
- `state`: String, 1-100 characters, not null
- `country`: String, 1-100 characters, not null, default: 'USA'

### Optional Fields
- `address`: String, max 255 characters
- `postalCode`: String, max 20 characters

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing required field | 400 | "Field {fieldName} is required" |
| DUPLICATE_NAME | Location name already exists | 400 | "Location name already exists" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Insufficient permissions." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while creating location. Please try again." |

---

## Related Use Cases

- **UC-LM-002**: View Location List (to see newly created location)
- **UC-LM-003**: Update Location (to modify location after creation)
- **UC-DM-001**: Create Department (location must exist before creating department)
- **UC-EM-001**: Create Employee (location must exist before creating employee)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/locations`
- **Request Body**: `LocationRequestDTO`
- **Response**: `LocationResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER'))`

### Components Involved
- **Frontend**: LocationFormComponent, LocationService
- **Backend**: LocationController, LocationService, LocationRepository, LocationMapper

---

**Last Updated**: 2024-12-12  
**Status**: Active

