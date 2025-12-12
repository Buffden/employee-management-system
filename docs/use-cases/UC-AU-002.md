# UC-AU-002: Logout

## Use Case Information

- **Use Case ID**: UC-AU-002
- **Title**: Logout
- **Category**: Authentication
- **Priority**: High
- **Status**: Active

---

## Actor(s)

- **Authenticated Users** (All roles)

**Role Requirements**:
- User must be authenticated and logged in
- No specific role required (all authenticated users can logout)

---

## Preconditions

1. User must be authenticated and logged in
2. User must have a valid JWT token

---

## Main Flow

1. **Initiate Logout**: Actor clicks "Logout" button
   - Actor clicks "Logout" in navigation menu or user dropdown
   - System displays logout confirmation (optional) or proceeds directly

2. **Confirm Logout (Optional)**: Actor confirms logout
   - If confirmation dialog is shown, actor clicks "Confirm"
   - System proceeds to logout

3. **Invalidate Session**: System invalidates user session
   - Frontend calls `POST /api/auth/logout` (optional - token invalidation)
   - Frontend removes JWT token from localStorage
   - Frontend removes user information from storage
   - Frontend clears any cached data

4. **Redirect to Login**: System redirects to login page
   - Frontend redirects user to login page
   - Frontend clears authentication state
   - System displays login form

---

## Alternative Flows

### 3a. Logout Without Backend Call
- **Trigger**: Frontend-only logout (token removal)
- **Flow**:
  1. Frontend removes token from localStorage
  2. Frontend clears user information
  3. Frontend redirects to login page
  4. Backend token remains valid until expiration (stateless JWT)
  5. Use case completes

### 3b. Backend Token Invalidation (Future Enhancement)
- **Trigger**: Backend token blacklist implementation
- **Flow**:
  1. Frontend calls `POST /api/auth/logout`
  2. Backend adds token to blacklist
  3. Backend returns success response
  4. Frontend removes token from localStorage
  5. Frontend redirects to login page

---

## Postconditions

### Success Postconditions
- User is logged out
- JWT token is removed from client storage
- User session is terminated
- User is redirected to login page
- User cannot access protected resources without re-authentication

### Failure Postconditions
- User may remain logged in if logout fails
- Token may remain in storage (should be handled gracefully)

---

## Business Rules

1. **Token Removal**: JWT token is removed from localStorage on logout
2. **Stateless JWT**: With stateless JWT, token remains valid until expiration (unless blacklist is implemented)
3. **Session Termination**: Client-side session is terminated immediately
4. **Redirect**: User is always redirected to login page after logout

---

## Related Use Cases

- **UC-AU-001**: Login (to authenticate again after logout)

---

## Technical Notes

### API Endpoint (Optional)
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Request**: JWT token in Authorization header
- **Response**: HTTP 200 OK

### Security
- **Authentication**: Required (JWT token)
- **Token Management**: Token removal is primarily client-side (stateless JWT)

### Components Involved
- **Frontend**: HeaderComponent, AuthService
- **Backend**: AuthController, AuthService (optional - for token blacklist)

---

**Last Updated**: 2024-12-12  
**Status**: Active

