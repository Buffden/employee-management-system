# UC-AU-003: Register/Add Admin

## Use Case Information

- **Use Case ID**: UC-AU-003
- **Title**: Register/Add Admin
- **Category**: Authentication / User Management
- **Priority**: High
- **Status**: Active (Implemented)

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
3. New user's username must not already exist
4. New user's email must not already exist

---

## Main Flow

1. **Navigation**: Actor navigates to "Add New Admin" section
   - Actor is on Dashboard (for SYSTEM_ADMIN)
   - Actor clicks "Add New Admin" button
   - System displays registration form

2. **Fill Registration Form**: Actor fills in new user details
   - **Required Fields**:
     - Username (String, 1-50 characters, unique, plain text)
     - Email (String, valid email format, unique)
     - Password (String, min 8 characters, will be hashed)
     - Confirm Password (String, must match password)
     - Role (Enum: SYSTEM_ADMIN or HR_MANAGER, required)
   - Actor selects role from dropdown (SYSTEM_ADMIN or HR_MANAGER)

3. **Submit Registration**: Actor clicks "Create Admin" button
   - Frontend performs client-side validation
   - Frontend hashes password (SHA-256) before sending
   - Frontend sends POST request to `/api/auth/register` with registration data
   - Frontend includes JWT token in Authorization header

4. **Backend Validation**: System validates input
   - System validates JWT token
   - System checks user has SYSTEM_ADMIN role
   - System validates username is unique
   - System validates email is unique
   - System validates role is SYSTEM_ADMIN or HR_MANAGER
   - If validation fails, proceed to Alternative Flow 4a

5. **Create User Record**: System creates new user
   - System creates User entity with provided data
   - System stores username as plain text (for user-friendliness)
   - System double-hashes password (SHA-256 from frontend + BCrypt)
   - System sets role (SYSTEM_ADMIN or HR_MANAGER)
   - System sets created timestamp
   - System saves user to database via UserRepository

6. **Success Response**: System displays success message
   - System returns HTTP 201 Created with AuthResponseDTO
   - Frontend displays success notification: "Admin user created successfully!"
   - Frontend redirects to dashboard
   - New user can now log in with created credentials

---

## Alternative Flows

### 4a. Validation Fails (Client-Side)
- **Trigger**: Client-side validation fails before form submission
- **Flow**:
  1. Frontend validates form fields
  2. Frontend detects validation errors (missing fields, password mismatch, etc.)
  3. Frontend displays inline error messages
  4. Frontend highlights invalid fields
  5. Actor corrects errors
  6. Use case continues from step 2

### 4b. Validation Fails (Server-Side)
- **Trigger**: Server-side validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors:
     - Username already exists
     - Email already exists
     - Invalid role (not SYSTEM_ADMIN or HR_MANAGER)
     - Missing required fields
  3. System returns HTTP 400 Bad Request or HTTP 409 Conflict
  4. Frontend displays error message with specific validation errors
  5. Actor corrects errors
  6. Use case continues from step 2

### 4c. Unauthorized Access
- **Trigger**: User does not have SYSTEM_ADMIN role
- **Flow**:
  1. System checks user role via `@PreAuthorize`
  2. System detects insufficient permissions
  3. System returns HTTP 403 Forbidden
  4. Frontend displays access denied message: "Access denied. Only administrators can register new users."
  5. Use case terminates

### 4d. Database Error
- **Trigger**: Database operation fails
- **Flow**:
  1. System attempts to save user
  2. Database operation fails
  3. System returns HTTP 500 Internal Server Error
  4. Frontend displays generic error message
  5. System logs error for administrator
  6. Use case terminates

---

## Postconditions

### Success Postconditions
- New user record is created in the database
- User has a unique username and email
- User password is securely stored (double-hashed)
- User can log in with created credentials
- User has appropriate role (SYSTEM_ADMIN or HR_MANAGER)

### Failure Postconditions
- No user record is created
- System state remains unchanged
- Error information is available for user review

---

## Business Rules

1. **Role Restriction**: Only SYSTEM_ADMIN can create new users
2. **Role Limitation**: Can only create SYSTEM_ADMIN or HR_MANAGER users (not DEPARTMENT_MANAGER or EMPLOYEE)
3. **Username Uniqueness**: Each username must be unique
4. **Email Uniqueness**: Each email must be unique
5. **Password Security**: Password is double-hashed (SHA-256 frontend + BCrypt backend)
6. **Username Storage**: Username is stored as plain text for user-friendliness
7. **Password Requirements**: Password must be at least 8 characters

---

## Validation Rules

### Required Fields
- `username`: String, 1-50 characters, unique, not null, plain text
- `email`: String, valid email format, unique, not null
- `password`: String, min 8 characters, not null
- `role`: String, must be "SYSTEM_ADMIN" or "HR_MANAGER", required

### Password Validation
- Minimum length: 8 characters
- Password and confirm password must match

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing required field | 400 | "Field {fieldName} is required" |
| VALIDATION_ERROR | Password mismatch | 400 | "Passwords do not match" |
| VALIDATION_ERROR | Invalid password length | 400 | "Password must be at least 8 characters" |
| CONFLICT | Username already exists | 409 | "Username already exists. Please use different credentials." |
| CONFLICT | Email already exists | 409 | "Email already exists. Please use different credentials." |
| VALIDATION_ERROR | Invalid role | 400 | "Only SYSTEM_ADMIN or HR_MANAGER roles can be created" |
| FORBIDDEN | Insufficient permissions | 403 | "Access denied. Only administrators can register new users." |
| INTERNAL_ERROR | Database error | 500 | "An error occurred during registration. Please try again." |

---

## Related Use Cases

- **UC-AU-001**: Login (new user can log in after creation)
- **UC-DB-001**: View Dashboard Metrics (entry point for SYSTEM_ADMIN)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Request Body**: `RegisterRequestDTO` (username, email, password, role)
- **Response**: `AuthResponseDTO` (HTTP 201 Created)

### Security
- **Authentication**: Required (JWT token)
- **Authorization**: `@PreAuthorize(hasRole('SYSTEM_ADMIN'))`
- **Password Security**: Double-hashing (SHA-256 frontend + BCrypt backend)
- **Username Storage**: Plain text (for user-friendliness)

### Components Involved
- **Frontend**: RegisterComponent, AuthService, DashboardComponent
- **Backend**: AuthController, AuthService, UserRepository
- **Validation**: @Valid annotations, custom role validation

### Design Patterns
- **Repository Pattern**: UserRepository for data access
- **Service Layer Pattern**: AuthService for business logic
- **DTO Pattern**: RegisterRequestDTO, AuthResponseDTO for data transfer

---

**Last Updated**: 2024-12-12  
**Status**: Active (Implemented)

