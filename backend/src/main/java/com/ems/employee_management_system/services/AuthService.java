package com.ems.employee_management_system.services;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.auth.JWTManager;
import com.ems.employee_management_system.dtos.AuthRequestDTO;
import com.ems.employee_management_system.dtos.AuthResponseDTO;
import com.ems.employee_management_system.dtos.RegisterRequestDTO;
import com.ems.employee_management_system.dtos.UserDTO;
import com.ems.employee_management_system.mappers.UserMapper;
import com.ems.employee_management_system.models.User;
import com.ems.employee_management_system.repositories.RefreshTokenRepository;
import com.ems.employee_management_system.repositories.UserRepository;
import com.ems.employee_management_system.utils.HashUtil;
import com.ems.employee_management_system.enums.UserRole;
import com.ems.employee_management_system.enums.UserStatus;
import com.ems.employee_management_system.models.RefreshToken;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Value("${app.demo.username:demoemployee}")
    private String demoUsername;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JWTManager jwtManager;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    
    public AuthService(UserRepository userRepository,
                      RefreshTokenRepository refreshTokenRepository,
                      JWTManager jwtManager,
                      UserMapper userMapper,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtManager = jwtManager;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }
    
    /**
     * Register a new user
     * Password is already hashed from frontend, username is plain text
     */
    @Transactional
    public AuthResponseDTO register(RegisterRequestDTO request) {
        logger.info("Registering new user: {}", request.getUsername());
        
        // Username is plain text, password is already hashed from frontend
        String plainUsername = request.getUsername();
        String hashedPassword = request.getPassword();
        
        // Check if username already exists
        if (userRepository.existsByUsername(plainUsername)) {
            throw new RuntimeException("Username already exists");
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Validate role - only SYSTEM_ADMIN or HR_MANAGER can be created by System Admin
        // Role is mandatory (validated by @NotBlank in DTO)
        String roleString = request.getRole();
        if (roleString == null || roleString.isEmpty()) {
            throw new RuntimeException("Role is required and cannot be empty");
        }
        
        // Convert to enum and validate
        UserRole role = UserRole.fromString(roleString);
        if (role == null) {
            throw new RuntimeException("Invalid role: " + roleString);
        }
        
        // Only allow SYSTEM_ADMIN or HR_MANAGER roles to be created
        if (role != UserRole.SYSTEM_ADMIN && role != UserRole.HR_MANAGER) {
            throw new RuntimeException("Only SYSTEM_ADMIN or HR_MANAGER roles can be created");
        }
        
        // Create new user with plain username
        // Password is already hashed from frontend, hash it again with BCrypt (double hashing)
        User user = new User();
        user.setUsername(plainUsername); // Store plain username for user-friendliness
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(hashedPassword)); // Double hash: frontend hash + BCrypt
        user.setRole(role.getValue());
        user.setCreatedAt(LocalDateTime.now());
        
        // Save user
        user = userRepository.save(user);
        logger.info("User registered successfully: {}", user.getUsername());
        
        // Build response
        UserDTO userDTO = userMapper.toDTO(user);
        
        return AuthResponseDTO.builder()
                .token(null)
                .refreshToken(null)
                .user(userDTO)
                .expiresIn(0L)
                .build();
    }
    
    /**
     * Validate if role is one of the allowed values
     */
    private boolean isValidRole(String role) {
        return UserRole.isValid(role);
    }
    
    /**
     * Authenticate user and generate tokens
     * Password is already hashed from frontend, username is plain text
     */
    @Transactional
    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        logger.info("Authenticating user: {}", request.getUsername());
        
        // Username is plain text, password is already hashed from frontend
        String plainUsername = request.getUsername();
        String hashedPassword = request.getPassword();
        
        // Load user by plain username
        User user = userRepository.findByUsername(plainUsername)
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        
        // Password from frontend is already hashed (SHA-256), but stored password is double-hashed (frontend hash + BCrypt)
        // Verify password: stored password = BCrypt(frontend_hash), provided password = frontend_hash
        if (!passwordEncoder.matches(hashedPassword, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Only ACTIVE users can log in
        if (user.getStatus() != null && user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User not active");
        }
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtManager.generateToken(user);
        String refreshToken = createAndStoreRefreshToken(user);
        
        // Build response
        UserDTO userDTO = userMapper.toDTO(user);
        
        logger.info("User authenticated successfully: {}", user.getUsername());
        
        return AuthResponseDTO.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(userDTO)
                .expiresIn(86400L) // 24 hours in seconds
                .build();
    }
    
    /**
     * Refresh access token using refresh token
     */
    @Transactional
    public AuthResponseDTO refreshToken(String refreshToken) {
        logger.info("Refreshing token");
        
        // Validate refresh token
        var claims = jwtManager.validateRefreshToken(refreshToken);
        String userId = claims.get("userId", String.class);

        String tokenHash = HashUtil.hashSHA256(refreshToken);
        RefreshToken storedToken = refreshTokenRepository
            .findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, LocalDateTime.now())
            .orElseThrow(() -> new RuntimeException("Invalid or expired refresh token"));
        
        // Load user
        User user = userRepository.findById(java.util.UUID.fromString(userId))
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (!storedToken.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Refresh token does not match user");
        }
        
        // Generate new tokens
        String accessToken = jwtManager.generateToken(user);
        String newRefreshToken = createAndStoreRefreshToken(user);

        storedToken.setRevokedAt(LocalDateTime.now());
        storedToken.setReplacedByTokenHash(HashUtil.hashSHA256(newRefreshToken));
        refreshTokenRepository.save(storedToken);
        
        // Build response
        UserDTO userDTO = userMapper.toDTO(user);
        
        logger.info("Token refreshed successfully for user: {}", user.getUsername());
        
        return AuthResponseDTO.builder()
                .token(accessToken)
                .refreshToken(newRefreshToken)
                .user(userDTO)
                .expiresIn(86400L) // 24 hours in seconds
                .build();
    }
    
    /**
     * Demo login — issues a real JWT for the demo user without requiring credentials.
     * The demo username is configured via app.demo.username (SSM: /ems/prod/app.demo.username).
     */
    @Transactional
    public AuthResponseDTO demoLogin() {
        logger.info("Demo login requested");

        User user = userRepository.findByUsername(demoUsername)
            .orElseThrow(() -> new RuntimeException("Demo user not configured"));

        if (user.getStatus() != null && user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Demo user is not active");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtManager.generateToken(user);
        String refreshToken = createAndStoreRefreshToken(user);

        logger.info("Demo login successful for user: {}", user.getUsername());

        return AuthResponseDTO.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toDTO(user))
                .expiresIn(3600L) // 1 hour — shorter than normal 24h session
                .build();
    }

    /**
     * Logout user (token invalidation - future: implement token blacklist)
     */
    public void logout(String refreshToken) {
        logger.info("User logout requested");
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }

        String tokenHash = HashUtil.hashSHA256(refreshToken);
        refreshTokenRepository
            .findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(tokenHash, LocalDateTime.now())
            .ifPresent(token -> {
                token.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(token);
            });
    }

    private String createAndStoreRefreshToken(User user) {
        String refreshToken = jwtManager.generateRefreshToken(user);
        String tokenHash = HashUtil.hashSHA256(refreshToken);

        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setTokenHash(tokenHash);
        token.setExpiresAt(jwtManager.extractExpiration(refreshToken).toInstant()
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDateTime());

        refreshTokenRepository.save(token);
        return refreshToken;
    }
}
