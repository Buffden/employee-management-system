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

**Patterns Applied**:
- **Singleton**: JWTManager for token operations

---

### 5.2 JWTManager (Singleton Pattern)

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

See: `docs/diagrams/architecture/database-er-diagram.puml` - Database entity relationships (User entity will be added in future)

---

## 14. Security Considerations

### 13.1 Password Security
- **Hashing**: BCrypt with salt
- **Never Store**: Plain text passwords
- **Validation**: Minimum 8 characters

### 13.2 Token Security
- **Secret Key**: Stored in environment variable
- **HTTPS Only**: Tokens transmitted over HTTPS in production
- **Token Storage**: Client-side (localStorage or HttpOnly cookie)

### 13.3 Authorization
- **Role-Based**: Different roles have different permissions
- **Token Validation**: Every request validates JWT token
- **Token Blacklist**: Future: Implement token blacklist for logout

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
