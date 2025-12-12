# UC-AU-004: Change Password

## Use Case Information

- **Use Case ID**: UC-AU-004
- **Title**: Change Password
- **Category**: Authentication
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **All Authenticated Users**

**Role Requirements**:
- User must be authenticated and logged in
- User can only change their own password

---

## Preconditions

1. User must be authenticated and logged in
2. User must know their current password

---

## Main Flow

1. **Navigation**: Actor navigates to password change page
   - Actor clicks "Change Password" in settings or profile page
   - System displays password change form

2. **Enter Current Password**: Actor enters current password
   - Actor enters current password in "Current Password" field
   - Frontend hashes password (SHA-256) before sending

3. **Enter New Password**: Actor enters new password
   - Actor enters new password in "New Password" field
   - Actor confirms new password in "Confirm New Password" field
   - Frontend validates password match
   - Frontend validates password strength (min 8 characters)

4. **Submit Password Change**: Actor clicks "Change Password" button
   - Frontend performs client-side validation
   - Frontend hashes current and new passwords (SHA-256)
   - Frontend sends PUT request to `/api/auth/change-password` with:
     - Current password (hashed)
     - New password (hashed)
   - Frontend includes JWT token in Authorization header

5. **Validate Current Password**: System validates current password
   - System extracts user ID from JWT token
   - System queries UserRepository for user
   - System retrieves user's stored password hash
   - System hashes received current password with BCrypt and compares
   - If current password invalid, proceed to Alternative Flow 5a

6. **Update Password**: System updates password
   - System hashes new password with BCrypt (double-hashing: SHA-256 from frontend + BCrypt)
   - System updates user's password in database
   - System sets password updated timestamp
   - System returns success response

7. **Success Response**: System displays success message
   - System returns HTTP 200 OK
   - Frontend displays success notification: "Password changed successfully"
   - Frontend optionally logs out user and requires re-login
   - OR Frontend keeps user logged in (depends on security policy)

---

## Alternative Flows

### 5a. Current Password Invalid
- **Trigger**: Current password is incorrect
- **Flow**:
  1. System validates current password
  2. System detects password mismatch
  3. System returns HTTP 401 Unauthorized
  4. Frontend displays error message: "Current password is incorrect"
  5. Frontend highlights current password field
  6. Actor can retry with correct password
  7. Use case continues from step 2

### 4a. Validation Fails (Client-Side)
- **Trigger**: Client-side validation fails
- **Flow**:
  1. Frontend validates form fields
  2. Frontend detects validation errors:
     - Password mismatch
     - Password too short
     - Missing fields
  3. Frontend displays inline error messages
  4. Frontend highlights invalid fields
  5. Actor corrects errors
  6. Use case continues from step 3

### 4b. Validation Fails (Server-Side)
- **Trigger**: Server-side validation fails
- **Flow**:
  1. System validates input data
  2. System detects validation errors:
     - New password too short
     - New password same as current password
  3. System returns HTTP 400 Bad Request
  4. Frontend displays error message with specific validation errors
  5. Actor corrects errors
  6. Use case continues from step 3

### 6a. User Not Found
- **Trigger**: User does not exist in database
- **Flow**:
  1. System queries UserRepository
  2. System finds no user with given ID
  3. System returns HTTP 404 Not Found
  4. Frontend displays "User not found" message
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- User's password is updated in the database
- New password is securely stored (double-hashed)
- User can log in with new password
- Old password is no longer valid

### Failure Postconditions
- Password remains unchanged
- Error information is available for user review

---

## Business Rules

1. **Current Password Verification**: User must provide correct current password
2. **Password Strength**: New password must meet minimum requirements (min 8 characters)
3. **Password Uniqueness**: New password should be different from current password (validation rule)
4. **Password Security**: Password is double-hashed (SHA-256 frontend + BCrypt backend)
5. **Session Management**: After password change, user may be required to re-authenticate (security best practice)

---

## Validation Rules

### Required Fields
- `currentPassword`: String, not null, not empty
- `newPassword`: String, min 8 characters, not null
- `confirmPassword`: String, must match newPassword

### Password Requirements
- Minimum length: 8 characters
- Should be different from current password
- Password and confirm password must match

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing required field | 400 | "Field {fieldName} is required" |
| VALIDATION_ERROR | Password mismatch | 400 | "New password and confirm password do not match" |
| VALIDATION_ERROR | Password too short | 400 | "Password must be at least 8 characters" |
| VALIDATION_ERROR | Same password | 400 | "New password must be different from current password" |
| UNAUTHORIZED | Current password incorrect | 401 | "Current password is incorrect" |
| NOT_FOUND | User not found | 404 | "User not found" |
| INTERNAL_ERROR | Database error | 500 | "An error occurred while changing password. Please try again." |

---

## Related Use Cases

- **UC-AU-001**: Login (to log in with new password)
- **UC-EM-007**: View My Profile (entry point to change password)

---

## Technical Notes

### API Endpoint
- **Method**: `PUT`
- **Path**: `/api/auth/change-password`
- **Request Body**: `ChangePasswordRequestDTO` (currentPassword, newPassword, confirmPassword)
- **Response**: HTTP 200 OK

### Security
- **Authentication**: Required (JWT token)
- **Password Security**: Double-hashing (SHA-256 frontend + BCrypt backend)
- **Session Management**: May require re-authentication after password change

### Components Involved
- **Frontend**: ChangePasswordComponent, AuthService
- **Backend**: AuthController, AuthService, UserRepository
- **Validation**: Password strength validation, current password verification

---

**Last Updated**: 2024-12-12  
**Status**: Active

