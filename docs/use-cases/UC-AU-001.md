# UC-AU-001: Login

## Use Case Information

- **Use Case ID**: UC-AU-001
- **Title**: Login
- **Category**: Authentication
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **All Users** (System Administrator, HR Manager, Department Manager, Employee)

**Role Requirements**:
- User must have a valid account in the system
- No authentication required (this is the authentication use case)

---

## Preconditions

1. **User account must exist** in the system
2. User must have valid username and password

---

## Main Flow

1. **Navigate to Login Page**: Actor navigates to login page
   - Actor accesses application URL
   - System redirects unauthenticated users to login page
   - System displays login form

2. **Enter Credentials**: Actor enters username and password
   - Actor enters username in username field
   - Actor enters password in password field
   - Frontend performs client-side validation (required fields)

3. **Submit Login**: Actor clicks "Login" button
   - Frontend validates input (fields not empty)
   - Frontend hashes password (SHA-256) before sending
   - Frontend sends POST request to `/api/auth/login` with hashed credentials

4. **Validate Credentials**: System validates credentials
   - System receives login request
   - System queries UserRepository for user by username
   - System retrieves user's hashed password from database
   - System hashes received password with BCrypt and compares with stored hash
   - If credentials invalid, proceed to Alternative Flow 4a
   - If credentials valid, proceed to step 5

5. **Generate JWT Token**: System generates JWT token
   - System creates JWT token with claims:
     - Username
     - Role (SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
     - User ID
     - Department ID (if applicable)
   - System sets token expiration (e.g., 24 hours)

6. **Return Token**: System returns authentication response
   - System returns HTTP 200 OK with AuthResponseDTO:
     - JWT token
     - User information (username, role, etc.)
   - Frontend stores token in localStorage
   - Frontend stores user information

7. **Redirect to Dashboard**: System redirects to dashboard
   - Frontend redirects user to dashboard page
   - Frontend includes JWT token in subsequent API requests
   - System displays dashboard based on user's role

---

## Alternative Flows

### 4a. Invalid Credentials
- **Trigger**: Username or password is incorrect
- **Flow**:
  1. System validates credentials
  2. System detects invalid username or password
  3. System returns HTTP 401 Unauthorized
  4. Frontend displays error message: "Invalid username or password"
  5. Frontend highlights username/password fields
  6. Actor can retry login
  7. Use case continues from step 2

### 3a. Validation Fails (Client-Side)
- **Trigger**: Username or password field is empty
- **Flow**:
  1. Frontend validates form fields
  2. Frontend detects empty fields
  3. Frontend displays inline error messages
  4. Frontend highlights invalid fields
  5. Actor fills in missing fields
  6. Use case continues from step 2

### 4b. User Not Found
- **Trigger**: Username does not exist in database
- **Flow**:
  1. System queries UserRepository
  2. System finds no user with given username
  3. System returns HTTP 401 Unauthorized
  4. Frontend displays error message: "Invalid username or password"
  5. Use case continues from step 2

### 4c. Account Locked (Future Enhancement)
- **Trigger**: Account is locked due to too many failed login attempts
- **Flow**:
  1. System checks account lock status
  2. System detects account is locked
  3. System returns HTTP 423 Locked
  4. Frontend displays error message: "Account is locked. Please contact administrator."
  5. Use case terminates

---

## Postconditions

### Success Postconditions
- User is authenticated
- JWT token is generated and stored
- User session is created
- User is redirected to dashboard
- User can access protected resources

### Failure Postconditions
- User remains unauthenticated
- No session is created
- User remains on login page
- Error information is displayed

---

## Business Rules

1. **Password Hashing**: Password is double-hashed:
   - Frontend: SHA-256 hash
   - Backend: BCrypt hash of SHA-256 hash
2. **Token Expiration**: JWT token expires after configured time (e.g., 24 hours)
3. **Session Management**: Token is stored in localStorage (client-side)
4. **Role-Based Redirect**: User is redirected to dashboard appropriate for their role

---

## Validation Rules

### Required Fields
- `username`: String, not null, not empty
- `password`: String, not null, not empty, min 8 characters

---

## Error Conditions

| Error Code | Condition | HTTP Status | User Message |
|------------|-----------|-------------|--------------|
| VALIDATION_ERROR | Missing username or password | 400 | "Username and password are required" |
| UNAUTHORIZED | Invalid credentials | 401 | "Invalid username or password" |
| UNAUTHORIZED | User not found | 401 | "Invalid username or password" |
| LOCKED | Account locked (future) | 423 | "Account is locked. Please contact administrator." |

---

## Related Use Cases

- **UC-AU-002**: Logout (to end session)
- **UC-DB-001**: View Dashboard Metrics (redirected after login)

---

## Technical Notes

### API Endpoint
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Request Body**: `AuthRequestDTO` (username, password - both hashed on frontend)
- **Response**: `AuthResponseDTO` (token, user) (HTTP 200 OK)

### Security
- **Authentication**: Not required (this is the authentication endpoint)
- **Password Security**: Double-hashing (SHA-256 frontend + BCrypt backend)
- **Token Security**: JWT token with expiration

### Components Involved
- **Frontend**: LoginComponent, AuthService
- **Backend**: AuthController, AuthService, UserRepository, JWTManager
- **Security**: JwtAuthenticationFilter, SecurityService

---

**Last Updated**: 2024-12-12  
**Status**: Active

