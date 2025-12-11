package com.ems.employee_management_system.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ems.employee_management_system.dtos.AuthRequestDTO;
import com.ems.employee_management_system.dtos.AuthResponseDTO;
import com.ems.employee_management_system.dtos.RegisterRequestDTO;
import com.ems.employee_management_system.dtos.RefreshTokenRequestDTO;
import com.ems.employee_management_system.services.AuthService;
import com.ems.employee_management_system.constants.RoleConstants;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    /**
     * User registration endpoint (System Admin only)
     * POST /api/auth/register
     * Requires SYSTEM_ADMIN role
     * Can create SYSTEM_ADMIN or HR_MANAGER users
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('" + RoleConstants.SYSTEM_ADMIN + "')")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody RegisterRequestDTO request) {
        logger.info("Registration request received for username: {}", request.getUsername());
        logger.info("Current authentication: {}", org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication());
        
        try {
            AuthResponseDTO response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            logger.error("Registration failed for username: {}", request.getUsername(), e);
            if (e.getMessage().contains("already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("Registration failed for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * User login endpoint
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO request) {
        logger.info("Login request for username: {}", request.getUsername());
        
        try {
            AuthResponseDTO response = authService.authenticate(request);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            logger.error("Login failed for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
    
    /**
     * Refresh token endpoint
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refresh(@Valid @RequestBody RefreshTokenRequestDTO request) {
        logger.info("Refresh token request");
        
        try {
            AuthResponseDTO response = authService.refreshToken(request);
            return ResponseEntity.status(HttpStatus.OK).body(response);
        } catch (Exception e) {
            logger.error("Token refresh failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }
    
    /**
     * User logout endpoint
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        logger.info("Logout request");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}

