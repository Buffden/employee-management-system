package com.ems.employee_management_system.services;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.auth.JWTManager;
import com.ems.employee_management_system.dtos.AuthRequestDTO;
import com.ems.employee_management_system.dtos.AuthResponseDTO;
import com.ems.employee_management_system.dtos.RegisterRequestDTO;
import com.ems.employee_management_system.dtos.RefreshTokenRequestDTO;
import com.ems.employee_management_system.dtos.UserDTO;
import com.ems.employee_management_system.mappers.UserMapper;
import com.ems.employee_management_system.models.User;
import com.ems.employee_management_system.repositories.UserRepository;
import com.ems.employee_management_system.utils.HashUtil;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    private final UserRepository userRepository;
    private final JWTManager jwtManager;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    
    public AuthService(UserRepository userRepository,
                      JWTManager jwtManager,
                      UserMapper userMapper,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
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
        
        // Validate role (default to EMPLOYEE if not provided or invalid)
        String role = request.getRole();
        if (role == null || role.isEmpty()) {
            role = "EMPLOYEE";
        }
        
        // Validate role is one of the allowed values
        if (!isValidRole(role)) {
            role = "EMPLOYEE"; // Default to EMPLOYEE if invalid
        }
        
        // Create new user with plain username
        // Password is already hashed from frontend, hash it again with BCrypt (double hashing)
        User user = new User();
        user.setUsername(plainUsername); // Store plain username for user-friendliness
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(hashedPassword)); // Double hash: frontend hash + BCrypt
        user.setRole(role);
        user.setCreatedAt(LocalDateTime.now());
        
        // Save user
        user = userRepository.save(user);
        logger.info("User registered successfully: {}", user.getUsername());
        
        // Generate tokens
        String accessToken = jwtManager.generateToken(user);
        String refreshToken = jwtManager.generateRefreshToken(user);
        
        // Build response
        UserDTO userDTO = userMapper.toDTO(user);
        
        return AuthResponseDTO.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(userDTO)
                .expiresIn(86400L) // 24 hours in seconds
                .build();
    }
    
    /**
     * Validate if role is one of the allowed values
     */
    private boolean isValidRole(String role) {
        return role != null && (
            role.equals("SYSTEM_ADMIN") ||
            role.equals("HR_MANAGER") ||
            role.equals("DEPARTMENT_MANAGER") ||
            role.equals("EMPLOYEE")
        );
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
        // So we check: BCrypt.matches(frontend_hash, BCrypt(frontend_hash))
        if (!passwordEncoder.matches(hashedPassword, user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtManager.generateToken(user);
        String refreshToken = jwtManager.generateRefreshToken(user);
        
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
    public AuthResponseDTO refreshToken(RefreshTokenRequestDTO request) {
        logger.info("Refreshing token");
        
        // Validate refresh token
        var claims = jwtManager.validateRefreshToken(request.getRefreshToken());
        String userId = claims.get("userId", String.class);
        
        // Load user
        User user = userRepository.findById(java.util.UUID.fromString(userId))
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Generate new tokens
        String accessToken = jwtManager.generateToken(user);
        String refreshToken = jwtManager.generateRefreshToken(user);
        
        // Build response
        UserDTO userDTO = userMapper.toDTO(user);
        
        logger.info("Token refreshed successfully for user: {}", user.getUsername());
        
        return AuthResponseDTO.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(userDTO)
                .expiresIn(86400L) // 24 hours in seconds
                .build();
    }
    
    /**
     * Logout user (token invalidation - future: implement token blacklist)
     */
    public void logout(String token) {
        logger.info("User logout requested");
        // Future: Add token to blacklist
        // For now, client should discard the token
    }
}

