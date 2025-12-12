# UC-EM-008: Update My Profile

## Use Case Information

- **Use Case ID**: UC-EM-008
- **Title**: Update My Profile
- **Category**: Employee Management
- **Priority**: Medium
- **Status**: Active

---

## Actor(s)

- **Employee** (`EMPLOYEE`)
- **All Authenticated Users** (can update their own profile)

**Role Requirements**:
- User must be authenticated
- User must have an associated employee record
- User can only update their own profile

---

## Preconditions

1. User must be authenticated and logged in
2. User must have an associated employee record
3. User must be viewing their own profile

---

## Main Flow

1. **Navigate to My Profile**: Actor navigates to "My Profile"
   - Actor views their profile (UC-EM-007)
   - Actor clicks "Edit" button
   - System displays profile edit form

2. **Modify Profile Information**: Actor modifies profile information
   - Actor can modify:
     - Personal information (phone, address)
     - Some employment information (limited fields)
   - Actor cannot modify:
     - Name (managed by HR)
     - Email (managed by HR)
     - Designation (managed by HR)
     - Salary (managed by HR)
     - Department (managed by HR)
     - Location (managed by HR)
     - Manager (managed by HR)

3. **Submit Changes**: Actor clicks "Save Changes" button
   - Frontend performs client-side validation
   - System validates changes
   - System updates employee record
   - System displays success message

---

## Alternative Flows

### 3a. Validation Fails
- **Trigger**: Validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error messages
  5. Actor corrects errors

### 3b. Unauthorized Modification Attempt
- **Trigger**: Actor tries to modify restricted fields
- **Flow**:
  1. System validates field permissions
  2. System detects attempt to modify restricted field
  3. System returns HTTP 403 Forbidden
  4. Frontend displays "You cannot modify this field. Please contact HR."
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- Employee profile is updated in the database
- Updated timestamp is set
- Profile information reflects the changes

---

## Business Rules

1. **Limited Field Access**: Employees can only update limited fields (phone, address, etc.)
2. **HR-Managed Fields**: Critical fields (name, email, designation, salary, department, location) are managed by HR only
3. **Self-Update Only**: User can only update their own profile

---

## Related Use Cases

- **UC-EM-007**: View My Profile (to view profile before editing)
- **UC-EM-004**: Update Employee (HR can update all fields)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/employees/me` or `/api/employees/{employeeId}` (where employeeId is from current user)
- **Request Body**: `EmployeeRequestDTO` (with limited fields)
- **Response**: `EmployeeResponseDTO` (HTTP 200 OK)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: User can only update their own profile with field-level restrictions

---

**Last Updated**: 2024-12-12  
**Status**: Active

