package com.ems.employee_management_system.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.ems.employee_management_system.dtos.AuthRequestDTO;
import com.ems.employee_management_system.dtos.AuthResponseDTO;
import com.ems.employee_management_system.dtos.ActivateAccountRequestDTO;
import com.ems.employee_management_system.dtos.ForgotPasswordRequestDTO;
import com.ems.employee_management_system.dtos.ResetPasswordRequestDTO;
import com.ems.employee_management_system.dtos.RegisterRequestDTO;
import com.ems.employee_management_system.dtos.RefreshTokenRequestDTO;
import com.ems.employee_management_system.services.AuthService;
import com.ems.employee_management_system.services.AccountProvisioningService;
import com.ems.employee_management_system.constants.RoleConstants;
import com.ems.employee_management_system.auth.JWTManager;
import com.ems.employee_management_system.ratelimit.RateLimiterService;
import com.ems.employee_management_system.ratelimit.RateLimitPolicy;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private static final String ACCESS_COOKIE_NAME = "access_token";
    private static final String REFRESH_COOKIE_NAME = "refresh_token";
    
    private final AuthService authService;
    private final AccountProvisioningService accountProvisioningService;
    private final JWTManager jwtManager;
    private final RateLimiterService rateLimiterService;

    @Value("${app.cookies.secure:true}")
    private boolean secureCookies;

    @Value("${app.cookies.same-site:Strict}")
    private String sameSite;

    @Value("${app.cookies.domain:}")
    private String cookieDomain;

    @Value("${app.cookies.path:/}")
    private String cookiePath;

    @Value("${app.auth.suppress-tokens-for-browser:false}")
    private boolean suppressTokensForBrowser;
    
    public AuthController(AuthService authService,
                          AccountProvisioningService accountProvisioningService,
                          JWTManager jwtManager,
                          RateLimiterService rateLimiterService) {
        this.authService = authService;
        this.accountProvisioningService = accountProvisioningService;
        this.jwtManager = jwtManager;
        this.rateLimiterService = rateLimiterService;
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
            AuthResponseDTO responseBody = authService.register(request);
            // Do not switch the current admin session when creating users
            responseBody.setToken(null);
            responseBody.setRefreshToken(null);
            responseBody.setExpiresIn(0L);
            return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);
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
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO request,
                                                 HttpServletRequest httpRequest,
                                                 HttpServletResponse response) {
        // Apply rate limiting
        String clientIp = getClientIp(httpRequest);
        String rateLimitKey = "login:" + clientIp;
        
        if (!rateLimiterService.allowRequest(rateLimitKey, RateLimitPolicy.AUTH_LOGIN)) {
            logger.warn("Rate limit exceeded for login from IP: {}", clientIp);
            return ResponseEntity.status(429)
                .body(AuthResponseDTO.builder()
                    .message("Too many login attempts. Please try again later.")
                    .build());
        }
        
        logger.info("Login request for username: {}", request.getUsername());
        
        try {
            AuthResponseDTO responseBody = authService.authenticate(request);
            addAuthCookies(response, responseBody);
            maybeStripTokens(httpRequest, responseBody);
            return ResponseEntity.status(HttpStatus.OK).body(responseBody);
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
    public ResponseEntity<AuthResponseDTO> refresh(@RequestBody(required = false) RefreshTokenRequestDTO request,
                                                   HttpServletRequest httpRequest,
                                                   HttpServletResponse response) {
        logger.info("Refresh token request");
        
        try {
            String refreshToken = request != null ? request.getRefreshToken() : null;
            if (refreshToken == null || refreshToken.isBlank()) {
                refreshToken = getCookieValue(httpRequest, REFRESH_COOKIE_NAME);
            }

            if (refreshToken == null || refreshToken.isBlank()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            AuthResponseDTO responseBody = authService.refreshToken(refreshToken);
            addAuthCookies(response, responseBody);
            maybeStripTokens(httpRequest, responseBody);
            return ResponseEntity.status(HttpStatus.OK).body(responseBody);
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
    public ResponseEntity<Void> logout(@RequestHeader(value = "Authorization", required = false) String authHeader,
                                       HttpServletRequest request,
                                       HttpServletResponse response) {
        logger.info("Logout request");
        
        String refreshToken = getCookieValue(request, REFRESH_COOKIE_NAME);
        if (refreshToken == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            refreshToken = authHeader.substring(7);
        }

        authService.logout(refreshToken);
        clearAuthCookies(response);
        
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    /**
     * Activate account using invite token
     */
    @PostMapping("/activate")
    public ResponseEntity<Void> activate(@Valid @RequestBody ActivateAccountRequestDTO request) {
        accountProvisioningService.activateAccount(request.getToken(), request.getPassword());
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    /**
     * Resend invite token
     */
    @PostMapping("/invites/{userId}/resend")
    @PreAuthorize("hasAnyRole('" + RoleConstants.SYSTEM_ADMIN + "','" + RoleConstants.HR_MANAGER + "')")
    public ResponseEntity<Map<String, String>> resendInvite(@PathVariable java.util.UUID userId) {
        String token = accountProvisioningService.resendInvite(userId);
        Map<String, String> body = new java.util.HashMap<>();
        body.put("inviteToken", token); // Returned for demo mode
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    /**
     * Forgot password - create reset token
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDTO request,
                                                               HttpServletRequest httpRequest) {
        // Apply rate limiting - stricter for password reset
        String rateLimitKey = "forgot:" + request.getEmail();
        
        if (!rateLimiterService.allowRequest(rateLimitKey, RateLimitPolicy.AUTH_FORGOT_PASSWORD)) {
            logger.warn("Rate limit exceeded for forgot password: {}", request.getEmail());
            // Return generic response to avoid email enumeration
            Map<String, String> body = new java.util.HashMap<>();
            body.put("message", "If the email exists, a reset link will be sent.");
            return ResponseEntity.status(HttpStatus.OK).body(body);
        }
        
        String token = accountProvisioningService.createResetToken(request.getEmail());
        Map<String, String> body = new java.util.HashMap<>();
        body.put("resetToken", token); // Returned for demo mode
        return ResponseEntity.status(HttpStatus.OK).body(body);
    }

    /**
     * Reset password using token
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequestDTO request) {
        accountProvisioningService.resetPassword(request.getToken(), request.getPassword());
        return ResponseEntity.status(HttpStatus.OK).build();
    }

    private void addAuthCookies(HttpServletResponse response, AuthResponseDTO responseBody) {
        if (responseBody.getToken() == null || responseBody.getRefreshToken() == null) {
            return;
        }

        long accessMaxAgeSeconds = Math.max(0L, responseBody.getExpiresIn() != null ? responseBody.getExpiresIn() : 0L);
        long refreshMaxAgeSeconds = Math.max(
            0L,
            (jwtManager.extractExpiration(responseBody.getRefreshToken()).getTime() - System.currentTimeMillis()) / 1000
        );

        ResponseCookie accessCookie = buildCookie(ACCESS_COOKIE_NAME, responseBody.getToken(), accessMaxAgeSeconds);
        ResponseCookie refreshCookie = buildCookie(REFRESH_COOKIE_NAME, responseBody.getRefreshToken(), refreshMaxAgeSeconds);

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private void clearAuthCookies(HttpServletResponse response) {
        ResponseCookie accessCookie = buildCookie(ACCESS_COOKIE_NAME, "", 0);
        ResponseCookie refreshCookie = buildCookie(REFRESH_COOKIE_NAME, "", 0);
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
    }

    private ResponseCookie buildCookie(String name, String value, long maxAgeSeconds) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, value)
            .httpOnly(true)
            .secure(secureCookies)
            .sameSite(sameSite)
            .path(cookiePath)
            .maxAge(maxAgeSeconds);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        return builder.build();
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }

        for (var cookie : request.getCookies()) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // Take first IP if multiple are present (proxy chain)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    private void maybeStripTokens(HttpServletRequest request, AuthResponseDTO responseBody) {
        if (!suppressTokensForBrowser) {
            return;
        }

        String overrideHeader = request.getHeader("X-Response-Tokens");
        if (overrideHeader != null && overrideHeader.equalsIgnoreCase("true")) {
            return;
        }

        String userAgent = request.getHeader("User-Agent");
        boolean isBrowser = userAgent != null && userAgent.contains("Mozilla");
        if (isBrowser) {
            responseBody.setToken(null);
            responseBody.setRefreshToken(null);
            responseBody.setExpiresIn(0L);
        }
    }
}
