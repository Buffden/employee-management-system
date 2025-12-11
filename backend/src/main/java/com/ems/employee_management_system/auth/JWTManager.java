package com.ems.employee_management_system.auth;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.ems.employee_management_system.models.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;

@Component
public class JWTManager {
    
    @Value("${jwt.secret.key:defaultSecretKeyForDevelopmentOnlyChangeInProduction}")
    private String secretKey;
    
    @Value("${jwt.access.token.expiration:86400000}") // 24 hours in milliseconds
    private Long accessTokenExpiration;
    
    @Value("${jwt.refresh.token.expiration:604800000}") // 7 days in milliseconds
    private Long refreshTokenExpiration;
    
    /**
     * Generate JWT access token (24 hours)
     */
    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole());
        claims.put("userId", user.getId().toString());
        if (user.getEmployee() != null) {
            claims.put("employeeId", user.getEmployee().getId().toString());
            if (user.getEmployee().getDepartment() != null) {
                claims.put("departmentId", user.getEmployee().getDepartment().getId().toString());
            }
        }
        
        return createToken(claims, user.getUsername(), accessTokenExpiration);
    }
    
    /**
     * Generate JWT refresh token (7 days)
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        claims.put("userId", user.getId().toString());
        
        return createToken(claims, user.getUsername(), refreshTokenExpiration);
    }
    
    /**
     * Validate and parse JWT token
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * Validate refresh token
     */
    public Claims validateRefreshToken(String refreshToken) {
        Claims claims = validateToken(refreshToken);
        String type = claims.get("type", String.class);
        if (!"refresh".equals(type)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        return claims;
    }
    
    /**
     * Extract username from token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }
    
    /**
     * Extract expiration date from token
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extract specific claim from token
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = validateToken(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Check if token is expired
     */
    public Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * Create JWT token
     */
    private String createToken(Map<String, Object> claims, String subject, Long expiration) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Get signing key from secret
     */
    private SecretKey getSigningKey() {
        try {
            // Try to decode as base64 first
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            // If decoded successfully and has minimum length, use it
            if (keyBytes.length >= 64) {
                return Keys.hmacShaKeyFor(keyBytes);
            }
        } catch (Exception e) {
            // Not base64 encoded, use directly
        }
        // Use secret key directly (will be padded by Keys.hmacShaKeyFor)
        // In production, ensure secret key is at least 64 bytes (512 bits for HS512)
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }
}

