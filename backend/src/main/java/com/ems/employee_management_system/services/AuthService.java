package com.ems.employee_management_system.services;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ems.employee_management_system.auth.JWTManager;
import com.ems.employee_management_system.dtos.AuthRequestDTO;
import com.ems.employee_management_system.dtos.AuthResponseDTO;
import com.ems.employee_management_system.dtos.RefreshTokenRequestDTO;
import com.ems.employee_management_system.dtos.UserDTO;
import com.ems.employee_management_system.mappers.UserMapper;
import com.ems.employee_management_system.models.User;
import com.ems.employee_management_system.repositories.UserRepository;

@Service
public class AuthService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);
    
    private final UserRepository userRepository;
    private final JWTManager jwtManager;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    
    public AuthService(UserRepository userRepository,
                      JWTManager jwtManager,
                      AuthenticationManager authenticationManager,
                      UserMapper userMapper) {
        this.userRepository = userRepository;
        this.jwtManager = jwtManager;
        this.authenticationManager = authenticationManager;
        this.userMapper = userMapper;
    }
    
    /**
     * Authenticate user and generate tokens
     */
    @Transactional
    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        logger.info("Authenticating user: {}", request.getUsername());
        
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(),
                request.getPassword()
            )
        );
        
        // Load user from database
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found after authentication"));
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        // Generate tokens
        String accessToken = jwtManager.generateToken(user);
        String refreshToken = jwtManager.generateRefreshToken(user);
        
        // Build response
        UserDTO userDTO = userMapper.toDTO(user);
        
        logger.info("User authenticated successfully: {}", request.getUsername());
        
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

