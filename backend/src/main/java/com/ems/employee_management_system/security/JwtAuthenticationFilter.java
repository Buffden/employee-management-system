package com.ems.employee_management_system.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.ems.employee_management_system.auth.JWTManager;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final JWTManager jwtManager;
    
    public JwtAuthenticationFilter(JWTManager jwtManager) {
        this.jwtManager = jwtManager;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.debug("No Authorization header found for request: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }
        
        logger.debug("Authorization header found for request: {}", request.getRequestURI());
        
        try {
            String token = authHeader.substring(7);
            
            // Check if token is expired before validation
            if (jwtManager.isTokenExpired(token)) {
                logger.warn("JWT token expired for request: {}", request.getRequestURI());
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"JWT token has expired\"}");
                return;
            }
            
            Claims claims = jwtManager.validateToken(token);
            String username = jwtManager.extractUsername(token);
            String role = claims.get("role", String.class);
            
            // Create authorities from role
            Collection<GrantedAuthority> authorities = new ArrayList<>();
            if (role != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
            }
            
            // Create authentication object
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                username,
                null,
                authorities
            );
            
            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            logger.info("JWT token validated for user: {} with role: {} for request: {}", username, role, request.getRequestURI());
            
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            logger.warn("JWT token expired: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"JWT token has expired\"}");
            return;
        } catch (io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException e) {
            logger.warn("Invalid JWT token: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Invalid JWT token\"}");
            return;
        } catch (Exception e) {
            logger.error("JWT token validation failed: {}", e.getMessage(), e);
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"Authentication failed\"}");
            return;
        }
        
        filterChain.doFilter(request, response);
    }
}

