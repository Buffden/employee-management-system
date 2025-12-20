package com.ems.employee_management_system.security;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate limiting filter to prevent brute force attacks and API abuse.
 * Implements different rate limits for different endpoint types:
 * - Login endpoint: 5 requests per 15 minutes per IP
 * - General API: 100 requests per minute per IP
 * 
 * Uses a simple token bucket algorithm implemented in-memory.
 */
@Component
@Order(1) // Execute before JWT filter
public class RateLimitFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    
    // Rate limit buckets per IP address
    // Key: IP address, Value: TokenBucket
    private final Map<String, TokenBucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, TokenBucket> apiBuckets = new ConcurrentHashMap<>();
    
    @Value("${rate.limit.login.requests:5}")
    private int loginRequests;
    
    @Value("${rate.limit.login.window:900}")
    private int loginWindowSeconds;
    
    @Value("${rate.limit.api.requests:100}")
    private int apiRequests;
    
    @Value("${rate.limit.api.window:60}")
    private int apiWindowSeconds;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) throws ServletException, IOException {
        
        String requestPath = request.getRequestURI();
        String clientIp = getClientIpAddress(request);
        
        // Skip rate limiting for health check and actuator endpoints
        if (requestPath.startsWith("/actuator") || requestPath.equals("/health")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        TokenBucket bucket = null;
        String rateLimitType = null;
        int maxRequests = 0;
        
        // Apply stricter rate limit for login endpoint
        if (requestPath.equals("/api/auth/login")) {
            bucket = getLoginBucket(clientIp);
            rateLimitType = "login";
            maxRequests = loginRequests;
        } 
        // Apply general API rate limit for all other API endpoints
        else if (requestPath.startsWith("/api")) {
            bucket = getApiBucket(clientIp);
            rateLimitType = "api";
            maxRequests = apiRequests;
        }
        
        // If rate limit applies, check if request is allowed
        if (bucket != null) {
            if (!bucket.tryConsume()) {
                logger.warn("Rate limit exceeded for {} endpoint from IP: {}", rateLimitType, clientIp);
                
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                
                // Add rate limit headers
                long availableTokens = bucket.getAvailableTokens();
                long resetTime = bucket.getResetTime();
                response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
                response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, availableTokens)));
                response.setHeader("X-RateLimit-Reset", String.valueOf(resetTime));
                
                response.getWriter().write(
                    "{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Please try again later.\"}"
                );
                return;
            }
            
            // Add rate limit headers for successful requests
            long availableTokens = bucket.getAvailableTokens();
            long resetTime = bucket.getResetTime();
            response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(availableTokens));
            response.setHeader("X-RateLimit-Reset", String.valueOf(resetTime));
        }
        
        filterChain.doFilter(request, response);
    }
    
    /**
     * Get or create rate limit bucket for login endpoint
     */
    private TokenBucket getLoginBucket(String ip) {
        return loginBuckets.computeIfAbsent(ip, key -> 
            new TokenBucket(loginRequests, loginWindowSeconds * 1000L)
        );
    }
    
    /**
     * Get or create rate limit bucket for general API endpoints
     */
    private TokenBucket getApiBucket(String ip) {
        return apiBuckets.computeIfAbsent(ip, key -> 
            new TokenBucket(apiRequests, apiWindowSeconds * 1000L)
        );
    }
    
    /**
     * Extract client IP address from request
     * Handles X-Forwarded-For header for proxy/load balancer scenarios
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    /**
     * Simple token bucket implementation for rate limiting
     */
    private static class TokenBucket {
        private final int capacity;
        private final long windowMillis;
        private int tokens;
        private long lastRefillTime;
        
        public TokenBucket(int capacity, long windowMillis) {
            this.capacity = capacity;
            this.windowMillis = windowMillis;
            this.tokens = capacity;
            this.lastRefillTime = System.currentTimeMillis();
        }
        
        public synchronized boolean tryConsume() {
            refill();
            if (tokens > 0) {
                tokens--;
                return true;
            }
            return false;
        }
        
        public synchronized long getAvailableTokens() {
            refill();
            return tokens;
        }
        
        public synchronized long getResetTime() {
            if (tokens < capacity) {
                // Calculate when the next token will be available
                long elapsed = System.currentTimeMillis() - lastRefillTime;
                long tokensToRefill = elapsed / (windowMillis / capacity);
                if (tokensToRefill < capacity) {
                    long timeUntilNextToken = (windowMillis / capacity) - (elapsed % (windowMillis / capacity));
                    return (System.currentTimeMillis() + timeUntilNextToken) / 1000;
                }
            }
            return System.currentTimeMillis() / 1000;
        }
        
        private void refill() {
            long now = System.currentTimeMillis();
            long elapsed = now - lastRefillTime;
            
            if (elapsed >= windowMillis) {
                // Full refill
                tokens = capacity;
                lastRefillTime = now;
            } else {
                // Partial refill based on elapsed time
                long tokensToAdd = (elapsed * capacity) / windowMillis;
                if (tokensToAdd > 0) {
                    tokens = Math.min(capacity, tokens + (int) tokensToAdd);
                    lastRefillTime = now;
                }
            }
        }
    }
}
