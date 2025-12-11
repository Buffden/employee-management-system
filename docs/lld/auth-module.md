# Authentication Module - Low-Level Design

## 1. Overview

The Authentication module handles user authentication, JWT token management, and session handling. It provides secure access control for the Employee Management System.

## 2. Entities

### 2.1 User Entity

**Location**: `backend/src/main/java/.../models/User.java`

```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String password; // BCrypt hashed
    
    private String email;
    
    @Column(nullable = false)
    private String role; // System Admin, HR Manager, Department Manager, Employee
    
    @ManyToOne
    private Employee employee; // Optional link to employee record
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime lastLogin;
    
    // Getters and setters
}
```

**Relationships**:
- `@ManyToOne` → Employee (optional, links user to employee record)

---

## 3. DTOs

### 3.1 AuthRequestDTO

**Location**: `backend/src/main/java/.../dtos/AuthRequestDTO.java`

```java
@Data
public class AuthRequestDTO {
    @NotBlank
    private String username;
    
    @NotBlank
    @Size(min = 8)
    private String password;
}
```

### 3.2 AuthResponseDTO

**Location**: `backend/src/main/java/.../dtos/AuthResponseDTO.java`

```java
@Builder
@Data
public class AuthResponseDTO {
    private String token;
    private String refreshToken;
    private UserDTO user;
    private Long expiresIn; // seconds
}
```

### 3.3 RefreshTokenRequestDTO

**Location**: `backend/src/main/java/.../dtos/RefreshTokenRequestDTO.java`

```java
@Data
public class RefreshTokenRequestDTO {
    @NotBlank
    private String refreshToken;
}
```

### 3.4 UserDTO

**Location**: `backend/src/main/java/.../dtos/UserDTO.java`

```java
@Builder
@Data
public class UserDTO {
    private UUID id;
    private String username;
    private String email;
    private String role;
    private UUID employeeId;
}
```

---

## 4. Controllers

### 4.1 AuthController

**Location**: `backend/src/main/java/.../controllers/AuthController.java`

**Endpoints**:

**Endpoints**:

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| POST | `/api/auth/login` | User login | `AuthRequestDTO` | `AuthResponseDTO` |
| POST | `/api/auth/logout` | User logout | `Authorization` header | `void` |
| POST | `/api/auth/refresh` | Refresh token | `RefreshTokenRequestDTO` | `AuthResponseDTO` |

**Dependencies**:
- `AuthService` - Authentication business logic

**Endpoints**:
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token

---

## 5. Services

### 5.1 AuthService

**Location**: `backend/src/main/java/.../services/AuthService.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `authenticate(AuthRequestDTO request)` | `request` | `AuthResponseDTO` | Authenticate user and generate tokens |
| `refreshToken(String refreshToken)` | `refreshToken` | `AuthResponseDTO` | Generate new tokens from refresh token |
| `logout(String token)` | `token` | `void` | Logout user (token invalidation) |

**Dependencies**:
- `UserRepository` - User data access
- `JWTManager` - Token generation and validation
- `PasswordEncoder` - Password verification (BCrypt)

**Business Logic**:
- Validates username and password
- Generates JWT access token (24 hours) and refresh token (7 days)
- Updates last login timestamp
- Validates refresh token and generates new tokens
- Includes role in JWT claims for authorization

**Patterns Applied**:
- **Singleton**: JWTManager for token operations

---

### 5.3 Security Configuration

**Location**: `backend/src/main/java/.../config/SecurityConfig.java`

**Purpose**: Spring Security configuration for JWT authentication and RBAC authorization

**Key Components**:

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| `SecurityFilterChain` | Main security filter chain | JWT filter, authentication, authorization |
| `JwtAuthenticationFilter` | JWT token validation filter | Extracts and validates JWT from Authorization header |
| `PasswordEncoder` | Password encoding | BCrypt with strength 10 |
| `AuthenticationEntryPoint` | Unauthorized access handler | Returns 401 for unauthenticated requests |
| `AccessDeniedHandler` | Forbidden access handler | Returns 403 for unauthorized requests |

**Security Filter Chain Configuration**:
- **Public Endpoints**: `/api/auth/login`, `/api/auth/refresh` (no authentication required)
- **Protected Endpoints**: All `/api/**` endpoints (require authentication)
- **JWT Filter**: Applied before authentication filter
- **CORS**: Configured for frontend origin
- **CSRF**: Disabled (stateless JWT authentication)

**Method Security**:
- `@EnableMethodSecurity` - Enables `@PreAuthorize` annotations
- `@PreAuthorize` - Method-level role-based authorization

**Bean Configuration Example**:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            );
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }
    
    @Bean
    public UserDetailsService userDetailsService() {
        return new UserDetailsServiceImpl(userRepository);
    }
}
```

**Key Annotations**:
- `@Configuration`: Marks class as Spring configuration
- `@EnableWebSecurity`: Enables Spring Security
- `@EnableMethodSecurity`: Enables `@PreAuthorize` method-level security

---

### 5.4 JWT Authentication Filter

**Location**: `backend/src/main/java/.../security/JwtAuthenticationFilter.java`

**Purpose**: Intercepts requests, validates JWT tokens, and sets authentication context

**Flow**:
1. Extract JWT token from `Authorization: Bearer <token>` header
2. Validate token signature and expiration
3. Extract user details (username, role) from token claims
4. Create `Authentication` object with user details and authorities
5. Set authentication in `SecurityContextHolder`
6. Continue filter chain

**Dependencies**:
- `JWTManager` - Token validation
- `UserRepository` - User lookup (optional, for additional validation)

**Error Handling**:
- Invalid token → 401 Unauthorized
- Expired token → 401 Unauthorized
- Missing token → Continue (handled by authentication entry point)

---

### 5.5 UserDetailsService

**Location**: `backend/src/main/java/.../security/UserDetailsServiceImpl.java`

**Purpose**: Loads user details from database for authentication

**Interface**: Implements Spring Security's `UserDetailsService`

**Key Method**:
```java
@Override
public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    
    return org.springframework.security.core.userdetails.User.builder()
        .username(user.getUsername())
        .password(user.getPassword())
        .roles(user.getRole())
        .build();
}
```

**Responsibilities**:
- Load user from database by username
- Convert `User` entity to Spring Security `UserDetails`
- Map role to Spring Security authorities
- Throw `UsernameNotFoundException` if user not found

**Usage**:
- Used during login authentication
- Called by `AuthenticationManager` to load user details
- Password comparison handled by Spring Security's `PasswordEncoder`

---

### 5.5 JWTManager (Singleton Pattern)

**Location**: `backend/src/main/java/.../auth/JWTManager.java`

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `generateToken(User user)` | `user` | `String` | Generate JWT access token (24 hours) |
| `generateRefreshToken(User user)` | `user` | `String` | Generate JWT refresh token (7 days) |
| `validateToken(String token)` | `token` | `Claims` | Validate and parse JWT token |
| `validateRefreshToken(String refreshToken)` | `refreshToken` | `Claims` | Validate refresh token |

**Configuration**:
- **Secret Key**: Environment variable `JWT_SECRET_KEY`
- **Access Token Expiration**: 24 hours
- **Refresh Token Expiration**: 7 days
- **Algorithm**: HS512

**Pattern**: Singleton Pattern
- Single instance for JWT operations
- Ensures consistent token generation

**Pattern**: Singleton Pattern

**Purpose**: Single instance for JWT operations, ensures consistent token generation

---

## 6. Repositories

### 6.1 UserRepository

**Location**: `backend/src/main/java/.../repositories/UserRepository.java`

```java
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEmployeeId(UUID employeeId);
}
```

**Methods**:
- `findAll()`: Get all users (inherited)
- `findById(UUID id)`: Get user by ID (inherited)
- `findByUsername(String username)`: Find user by username
- `findByEmail(String email)`: Find user by email
- `findByEmployeeId(UUID employeeId)`: Find user by employee ID

---

## 7. Mappers

### 7.1 UserMapper

**Location**: `backend/src/main/java/.../mappers/UserMapper.java`

**Pattern**: Adapter Pattern

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `toDTO(User user)` | `user` | `UserDTO` | Convert User Entity to DTO |

**Pattern**: Adapter Pattern
- Maps User entity to UserDTO
- Includes optional employee reference

---

## 8. Security Configuration

### 8.1 Password Encoding

**BCrypt Configuration**:
- **Algorithm**: BCrypt
- **Strength**: 10 rounds
- **Salt**: Automatic salt generation

### 8.2 JWT Configuration

- **Algorithm**: HS512
- **Access Token Expiration**: 24 hours
- **Refresh Token Expiration**: 7 days
- **Secret Key**: Environment variable `JWT_SECRET_KEY`

---

## 9. Design Patterns Summary

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Singleton** | JWTManager | Single JWT utility instance |

---

## 10. Validation Rules

- `username`: Required, max 100 characters, unique
- `password`: Required, min 8 characters
- `email`: Optional, valid email format if provided
- `role`: Required, must be one of: System Admin, HR Manager, Department Manager, Employee

---

## 11. Business Rules

1. **Username Uniqueness**: Username must be unique across all users
2. **Password Security**: Passwords must be hashed using BCrypt
3. **Token Expiration**: Access tokens expire after 24 hours
4. **Refresh Token**: Refresh tokens expire after 7 days
5. **Employee Link**: User can optionally be linked to an employee record
6. **Role Assignment**: Role determines access permissions

---

## 12. Sequence Diagram

See: `docs/diagrams/sequence/authentication-flow.puml`

## 13. ER Diagram

See: `docs/diagrams/architecture/database-er-diagram.puml` - Database entity relationships (includes User entity for authentication)

---

## 14. Security Considerations

### 14.1 Password Security
- **Hashing**: BCrypt with salt
- **Never Store**: Plain text passwords
- **Validation**: Minimum 8 characters

### 14.2 Token Security
- **Secret Key**: Stored in environment variable
- **HTTPS Only**: Tokens transmitted over HTTPS in production
- **Token Storage**: Client-side (localStorage or HttpOnly cookie)

### 14.3 Authorization

**Role-Based Access Control (RBAC)**:
- **Roles**: System Admin, HR Manager, Department Manager, Employee
- **Role Storage**: Role stored in `User` entity and included in JWT token claims
- **Token Validation**: Every request validates JWT token and extracts role
- **Permission Enforcement**: 
  - Method-level security with `@PreAuthorize` annotations
  - Role-based endpoint access control
  - Department-based data filtering for Department Managers
- **Token Blacklist**: Future: Implement token blacklist for logout

**Detailed Permissions**: See `docs/security/roles-and-permissions.md` for complete permission matrix

**Role Values**:
- `SYSTEM_ADMIN`: Full system access
- `HR_MANAGER`: HR and employee management
- `DEPARTMENT_MANAGER`: Department-specific management
- `EMPLOYEE`: Limited access to own data

### 14.4 RBAC Implementation Details

#### 14.4.1 Method-Level Security

**Service Layer Authorization**:

**Example - EmployeeService**:
```java
@PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER')")
public EmployeeResponseDTO create(EmployeeRequestDTO dto) { ... }

@PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isInOwnDepartment(#id))")
public EmployeeResponseDTO update(UUID id, EmployeeRequestDTO dto) { ... }

@PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isInOwnDepartment(#id)) or " +
              "(hasRole('EMPLOYEE') and @securityService.isOwnRecord(#id))")
public EmployeeResponseDTO getById(UUID id) { ... }
```

**Example - DepartmentService**:
```java
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public DepartmentResponseDTO create(DepartmentRequestDTO dto) { ... }

@PreAuthorize("hasRole('SYSTEM_ADMIN') or hasRole('HR_MANAGER') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isOwnDepartment(#id))")
public DepartmentResponseDTO update(UUID id, DepartmentRequestDTO dto) { ... }
```

**Example - ProjectService**:
```java
@PreAuthorize("hasRole('SYSTEM_ADMIN') or " +
              "(hasRole('DEPARTMENT_MANAGER') and @securityService.isProjectInOwnDepartment(#dto.departmentId))")
public ProjectResponseDTO create(ProjectRequestDTO dto) { ... }
```

#### 14.4.2 Security Service Helper

**Location**: `backend/src/main/java/.../security/SecurityService.java`

**Purpose**: Provides helper methods for role-based access checks

**Methods**:

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `getCurrentUser()` | - | `User` | Get currently authenticated user |
| `getCurrentUserId()` | - | `UUID` | Get current user ID |
| `getCurrentUserRole()` | - | `String` | Get current user role |
| `getCurrentUserDepartmentId()` | - | `UUID \| null` | Get current user's department ID (for Department Manager) |
| `getCurrentUserEmployeeId()` | - | `UUID \| null` | Get current user's employee ID (if linked) |
| `hasRole(String role)` | `role` | `boolean` | Check if user has specific role |
| `isInOwnDepartment(UUID employeeId)` | `employeeId` | `boolean` | Check if employee is in current user's department |
| `isOwnDepartment(UUID departmentId)` | `departmentId` | `boolean` | Check if department is current user's department |
| `isOwnRecord(UUID employeeId)` | `employeeId` | `boolean` | Check if employee record belongs to current user |
| `isProjectInOwnDepartment(UUID departmentId)` | `departmentId` | `boolean` | Check if project's department is user's department |
| `isProjectInOwnDepartmentByProjectId(UUID projectId)` | `projectId` | `boolean` | Check if project (by ID) is in user's department |
| `isTaskProjectInOwnDepartment(UUID projectId)` | `projectId` | `boolean` | Check if task's project is in user's department |
| `isTaskProjectInOwnDepartmentByTaskId(UUID taskId)` | `taskId` | `boolean` | Check if task (by ID) belongs to project in user's department |
| `isTaskAssignedToUser(UUID taskId)` | `taskId` | `boolean` | Check if task is assigned to current user |

**Implementation Details**:
- Extracts user from `SecurityContextHolder.getContext().getAuthentication()`
- For Department Manager: Gets department from `user.employee.department`
- For Employee: Compares `user.employee.id` with target employee ID
- Returns `null` for `getCurrentUserDepartmentId()` if user is not Department Manager or Employee
- Returns `null` for `getCurrentUserEmployeeId()` if user is not linked to employee record

**Usage in @PreAuthorize**:
- Methods can be called in SpEL expressions: `@securityService.isInOwnDepartment(#id)`
- `#id` refers to method parameter
- `#dto.departmentId` refers to nested property in DTO parameter
- Returns boolean for use in `and`/`or` expressions

**Example Usage**:
```java
// In service method
@PreAuthorize("hasRole('DEPARTMENT_MANAGER') and @securityService.isInOwnDepartment(#id)")
public EmployeeResponseDTO update(UUID id, EmployeeRequestDTO dto) {
    // Method body
}

// In service implementation
String role = securityService.getCurrentUserRole();
UUID departmentId = securityService.getCurrentUserDepartmentId();
if (role.equals("DEPARTMENT_MANAGER") && departmentId != null) {
    // Filter by department
}
```

#### 14.4.3 Repository-Level Filtering

**Role-Based Query Filtering**:

**Example - EmployeeRepository**:
```java
@Query("SELECT e FROM Employee e WHERE " +
       "(:role = 'SYSTEM_ADMIN' OR :role = 'HR_MANAGER') OR " +
       "(:role = 'DEPARTMENT_MANAGER' AND e.department.id = :departmentId) OR " +
       "(:role = 'EMPLOYEE' AND e.id = :userId)")
Page<Employee> findAllFilteredByRole(@Param("role") String role, 
                                     @Param("departmentId") UUID departmentId,
                                     @Param("userId") UUID userId,
                                     Pageable pageable);
```

**Service Implementation**:
- Department Manager: Automatically filters by `user.employee.department.id`
- Employee: Automatically filters by `user.employee.id`
- System Admin / HR Manager: No filtering (all records)

#### 14.4.4 Controller-Level Security

**Endpoint Security**:

**Example - EmployeeController**:
```java
@RestController
@RequestMapping("/api/employees")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'EMPLOYEE')")
public class EmployeeController {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER')")
    public ResponseEntity<PaginatedResponseDTO<EmployeeResponseDTO>> getAll(...) { ... }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'HR_MANAGER') or " +
                  "(hasRole('DEPARTMENT_MANAGER') and @securityService.isInOwnDepartment(#id)) or " +
                  "(hasRole('EMPLOYEE') and @securityService.isOwnRecord(#id))")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable UUID id) { ... }
}
```

#### 14.4.5 JWT Claims Structure

**Token Payload**:
```json
{
  "sub": "username",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "HR_MANAGER",
  "employeeId": "550e8400-e29b-41d4-a716-446655440001",
  "departmentId": "550e8400-e29b-41d4-a716-446655440002",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**Claims Extraction**:
- `sub`: Username (subject)
- `userId`: User UUID
- `role`: User role (SYSTEM_ADMIN, HR_MANAGER, DEPARTMENT_MANAGER, EMPLOYEE)
- `employeeId`: Linked employee ID (optional, for Department Manager and Employee)
- `departmentId`: Department ID (for Department Manager scope)

---

## 15. Future Enhancements

- **OAuth2**: Support for OAuth2 authentication
- **Multi-Factor Authentication**: 2FA/MFA support
- **Password Reset**: Password reset via email
- **Account Lockout**: Lock account after failed login attempts
- **Session Management**: Track active sessions
- **Token Blacklist**: Implement token blacklist for logout
- **Permission System**: Fine-grained permissions beyond roles

---

**Status**: Complete  
**Last Updated**: 2024-12-10
