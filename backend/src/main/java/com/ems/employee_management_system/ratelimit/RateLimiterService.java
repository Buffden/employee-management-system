package com.ems.employee_management_system.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.concurrent.TimeUnit;

/**
 * Redis-based rate limiter using Token Bucket algorithm
 * Provides global rate limiting across all application instances
 */
@Service
public class RateLimiterService {
    
    private static final Logger logger = LoggerFactory.getLogger(RateLimiterService.class);
    private static final String KEY_PREFIX = "rate_limit:";
    
    private final RedisTemplate<String, String> redisTemplate;
    
    public RateLimiterService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }
    
    /**
     * Check if request is allowed based on rate limit policy
     * 
     * @param identifier Unique identifier (e.g., "login:192.168.1.1" or "api:user123")
     * @param policy Rate limit policy defining capacity and refill rate
     * @return true if request is allowed, false if rate limit exceeded
     */
    public boolean allowRequest(String identifier, RateLimitPolicy policy) {
        String key = KEY_PREFIX + identifier;
        
        try {
            // Lua script for atomic token bucket operations
            String luaScript = 
                "local key = KEYS[1]\n" +
                "local capacity = tonumber(ARGV[1])\n" +
                "local refill_rate = tonumber(ARGV[2])\n" +
                "local cost = tonumber(ARGV[3])\n" +
                "local now = tonumber(ARGV[4])\n" +
                "local ttl = tonumber(ARGV[5])\n" +
                "\n" +
                "local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')\n" +
                "local tokens = tonumber(bucket[1])\n" +
                "local last_refill = tonumber(bucket[2])\n" +
                "\n" +
                "if tokens == nil then\n" +
                "  tokens = capacity\n" +
                "  last_refill = now\n" +
                "else\n" +
                "  -- Calculate tokens to add based on elapsed time\n" +
                "  local elapsed = math.max(0, now - last_refill)\n" +
                "  local tokens_to_add = (elapsed / 1000) * refill_rate\n" +
                "  tokens = math.min(capacity, tokens + tokens_to_add)\n" +
                "  last_refill = now\n" +
                "end\n" +
                "\n" +
                "local allowed = 0\n" +
                "if tokens >= cost then\n" +
                "  tokens = tokens - cost\n" +
                "  allowed = 1\n" +
                "end\n" +
                "\n" +
                "redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)\n" +
                "redis.call('EXPIRE', key, ttl)\n" +
                "\n" +
                "return {allowed, math.floor(tokens)}\n";
            
            RedisScript<java.util.List> script = RedisScript.of(luaScript, java.util.List.class);
            
            @SuppressWarnings("unchecked")
            java.util.List<Long> result = redisTemplate.execute(
                script,
                Collections.singletonList(key),
                String.valueOf(policy.getCapacity()),
                String.valueOf(policy.getRefillRate()),
                "1", // cost per request
                String.valueOf(System.currentTimeMillis()),
                String.valueOf(policy.getTtlSeconds())
            );
            
            if (result != null && result.size() >= 2) {
                boolean allowed = result.get(0) == 1;
                long remainingTokens = result.get(1);
                
                if (!allowed) {
                    logger.warn("Rate limit exceeded for identifier: {} (policy: {}, remaining: {})",
                        identifier, policy.name(), remainingTokens);
                }
                
                return allowed;
            }
            
            // If Redis execution fails, allow request (fail-open)
            logger.error("Rate limiter script returned unexpected result for: {}", identifier);
            return true;
            
        } catch (Exception e) {
            // If Redis is down or error occurs, allow request (fail-open)
            logger.error("Rate limiter error for identifier: {} - allowing request (fail-open)", identifier, e);
            return true;
        }
    }
    
    /**
     * Check rate limit with custom capacity and refill rate
     */
    public boolean allowRequest(String identifier, long capacity, double refillRate) {
        return allowRequest(identifier, new RateLimitPolicy("custom", capacity, refillRate, 3600));
    }
    
    /**
     * Reset rate limit for an identifier (useful for testing or admin overrides)
     */
    public void reset(String identifier) {
        String key = KEY_PREFIX + identifier;
        redisTemplate.delete(key);
        logger.info("Rate limit reset for identifier: {}", identifier);
    }
    
    /**
     * Get remaining tokens for an identifier (for debugging/monitoring)
     */
    public long getRemainingTokens(String identifier) {
        String key = KEY_PREFIX + identifier;
        try {
            String tokens = redisTemplate.opsForHash().get(key, "tokens").toString();
            return Long.parseLong(tokens);
        } catch (Exception e) {
            return -1;
        }
    }
}
