package com.ems.employee_management_system.ratelimit;

/**
 * Rate limit policies for different endpoints
 * Uses Token Bucket algorithm:
 * - capacity: Maximum number of tokens (burst allowance)
 * - refillRate: Tokens added per second
 * - ttlSeconds: How long to keep the bucket in Redis
 */
public class RateLimitPolicy {
    
    private final String name;
    private final long capacity;
    private final double refillRate;
    private final int ttlSeconds;
    
    // Predefined policies for common endpoints
    public static final RateLimitPolicy AUTH_LOGIN = new RateLimitPolicy(
        "AUTH_LOGIN", 
        10,      // 10 attempts burst
        0.16,    // ~10 per minute refill (10/60 = 0.16 per second)
        3600     // 1 hour TTL
    );
    
    public static final RateLimitPolicy AUTH_FORGOT_PASSWORD = new RateLimitPolicy(
        "AUTH_FORGOT_PASSWORD",
        5,       // 5 attempts burst
        0.033,   // ~2 per minute refill (2/60 = 0.033 per second)
        3600     // 1 hour TTL
    );
    
    public static final RateLimitPolicy API_GENERAL = new RateLimitPolicy(
        "API_GENERAL",
        100,     // 100 requests burst
        10,      // 10 per second refill
        300      // 5 minutes TTL
    );
    
    public RateLimitPolicy(String name, long capacity, double refillRate, int ttlSeconds) {
        this.name = name;
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.ttlSeconds = ttlSeconds;
    }
    
    public String name() {
        return name;
    }
    
    public long getCapacity() {
        return capacity;
    }
    
    public double getRefillRate() {
        return refillRate;
    }
    
    public int getTtlSeconds() {
        return ttlSeconds;
    }
    
    @Override
    public String toString() {
        return String.format("RateLimitPolicy{name='%s', capacity=%d, refillRate=%.2f/s, ttl=%ds}",
            name, capacity, refillRate, ttlSeconds);
    }
}
