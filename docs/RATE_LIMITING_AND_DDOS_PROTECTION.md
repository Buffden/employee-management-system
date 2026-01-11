# Rate Limiting & DDoS Protection Strategy

## Overview

This document provides an in-depth analysis of four complementary rate limiting and DDoS protection methods for the Employee Management System. Each method targets different attack vectors and operates at different layers of the infrastructure stack.

---

## Method 1: Edge WAF / Rate Limiting (CloudFront + AWS WAF or ALB + WAF)

### Theory & Flow

**How it works:**
- Traffic flows through a Content Delivery Network (CDN) or Application Load Balancer (ALB) before reaching your origin servers
- AWS WAF (Web Application Firewall) inspects all incoming requests at the edge using configurable rules
- Rate-based rules track requests per IP address, HTTP header, or URI path
- Requests exceeding thresholds are blocked (5XX), throttled, or challenged with CAPTCHA
- Geographic blocks prevent traffic from certain countries
- IP reputation lists detect known malicious sources
- Volumetric attacks are absorbed by the CDN's massive infrastructure rather than hitting your origin

**Architecture Flow:**
```
Client Requests
    ↓
CloudFront/ALB (WAF Rules Applied Here)
    ├─ IP Reputation Check
    ├─ Geo-Block Check
    ├─ Rate Limit Rules (per IP, per URI, global)
    └─ Custom Rules (SQL injection, XSS patterns, etc.)
    ↓
Allow/Block/Challenge Decision
    ├─ ALLOW → Forward to Origin
    ├─ BLOCK → Return 403 Forbidden
    └─ CHALLENGE → CAPTCHA or Device Fingerprint
    ↓
Origin Servers (Protected)
```

**Rate-Based Rules (AWS WAF):**
- Aggregate requests by IP address over 5-minute windows
- Example: Block IPs sending >2000 requests/5min to `/api/auth/login`
- Automatically whitelist legitimate patterns
- Track across multiple instances (no shared state needed; AWS handles distribution)

**IP Reputation:**
- AWS Managed Rule Groups include IP reputation lists
- Block known botnet IPs, AWS threat intelligence feeds
- Geo-blocking: Restrict access from high-risk regions

### Implementation Details

**Prerequisites:**
- AWS CloudFront distribution or Application Load Balancer
- AWS WAF service enabled
- Cost: ~$5/month base + $0.60/million requests

**Configuration Example (AWS WAF):**

1. **Create IP Set for known bad IPs**
   ```
   IP Reputation IP Set:
   - Auto-updated via AWS managed rules
   - Or manually maintain based on logs
   ```

2. **Rate-Based Rule for Login Endpoint**
   ```
   Rule Name: RateLimitLoginAttempts
   Rate Limit: 100 requests per 5 minutes per IP
   Scope: POST /api/auth/login
   Action: Block (return 403)
   ```

3. **Geo-Block Rule**
   ```
   Rule Name: GeoBlockHighRisk
   Countries to Block: [NK, IR, SY, etc.]
   Action: Block
   ```

4. **SQL Injection / XSS Rules**
   ```
   Use AWS Managed Rule Group: AWSManagedRulesSQLiRuleSet
   Use AWS Managed Rule Group: AWSManagedRulesKnownBadInputsRuleSet
   ```

**Nginx/ALB Configuration (Layer 4-7):**
```nginx
# CloudFront headers indicate WAF passage
if ($http_cloudfront_forwarded_proto != "https") {
    return 403;
}

# Additional logging for WAF decisions
add_header X-WAF-Action $http_x_amzn_waf_action always;
```

### Effort Estimate

**Setup Time:** 2-4 hours
- Enable AWS WAF on CloudFront/ALB
- Configure 5-10 core rules (IP reputation, geo-block, rate limits)
- Test with load generator to validate thresholds
- Deploy monitoring dashboard

**Ongoing Time:** 30 minutes/week
- Monitor CloudFront metrics and WAF logs
- Adjust thresholds based on traffic patterns
- Review false positives (legitimate traffic blocked)
- Update IP reputation lists if manually maintained

**Total Effort:** 2-4 hours initial setup + medium ongoing

### Impact & Benefits

| Aspect | Impact | Details |
|--------|--------|---------|
| **DDoS Protection** | ⭐⭐⭐⭐⭐ | Absorbs volumetric attacks at edge (10+ Gbps) |
| **Bot/Credential Stuffing** | ⭐⭐⭐⭐ | Rate limits and IP reputation block most automated attacks |
| **Cost Savings** | ⭐⭐⭐⭐⭐ | Prevents origin overload; AWS handles bandwidth surge (cheaper than origin bills) |
| **Latency** | ⭐⭐⭐⭐⭐ | Edge caching + CDN reduces latency globally |
| **Application Load** | ⭐⭐⭐⭐⭐ | Origin servers protected from ~95% of attack traffic |
| **False Positive Risk** | ⭐⭐ | Requires careful tuning; legitimate users behind shared IPs may be blocked |
| **Complexity** | ⭐⭐⭐ | Moderate; AWS WAF rules can be complex, good documentation available |

**Real-World Impact:**
- Stops Mirai botnet style attacks (volumetric floods)
- Prevents credential stuffing to `/api/auth/login` endpoint
- Geo-block reduces spam from certain regions by 70-90%
- Typical CDN absorbs 90%+ of attack traffic before origin sees it

---

## Method 2: Shared Rate Limit Store (Redis-based)

### Theory & Flow

**How it works:**
- Each application instance must check a centralized rate limit store before processing requests
- Uses token bucket or leaky bucket algorithm to track request quotas per user/IP
- All instances share the same store, so rate limits are global (not per-container)
- Requests decrement a shared counter; when counter reaches zero, requests are rejected
- Automatic token refill at a fixed rate (e.g., 100 tokens/min per IP)

**Token Bucket Algorithm:**
```
Initial State:
  Available Tokens = 100
  Refill Rate = 10 tokens/second
  Max Capacity = 100 tokens

Request Arrives:
  if (available_tokens >= cost):
    available_tokens -= cost
    Process Request ✓
  else:
    Reject Request (429 Too Many Requests) ✗

Every 100ms (Refill Cycle):
  available_tokens = min(available_tokens + 1, max_capacity)
```

**Architecture Flow:**
```
Client Request (IP: 203.0.113.5)
    ↓
Load Balancer (Round-Robin)
    ↓
App Instance A / B / C
    ↓
Check Rate Limit (Redis Query):
    GET rate_limit:ip:203.0.113.5 → { tokens: 47, refilled_at: 1705000000 }
    ↓
Bucket Empty?
    ├─ YES: tokens >= cost → Decrement tokens, Process Request
    └─ NO: tokens < cost → Return 429 Too Many Requests
    ↓
Write Back to Redis:
    SET rate_limit:ip:203.0.113.5 { tokens: 46, refilled_at: now } EX 3600
```

**Key Benefits of Shared Store:**
- **Global Rate Limit:** 100 req/min limit applies across all 10 instances
  - Without shared store: Attacker hits Instance A 99 times, Instance B 99 times, etc. = bypass
  - With shared store: Attacker hits 100 total across all instances = blocked
- **Consistency:** All instances enforce same rules in real-time
- **Scalability:** Redis can handle 100K+ ops/second; minimal latency impact

**Atomic Operations (Lua Script):**
```lua
-- Fetch current state
local current = redis.call('GET', KEYS[1])
if not current then
  current = {tokens = capacity, refilled_at = now}
else
  -- Refill based on time elapsed
  local elapsed = now - current.refilled_at
  current.tokens = min(current.tokens + (elapsed * refill_rate), capacity)
  current.refilled_at = now
end

-- Check if enough tokens
if current.tokens >= cost then
  current.tokens -= cost
  redis.call('SET', KEYS[1], current, 'EX', ttl)
  return {allowed = true, remaining = current.tokens}
else
  return {allowed = false, remaining = 0}
end
```

### Implementation Details

**Redis Setup:**

1. **Single Redis Instance (Development):**
   ```bash
   docker run -d --name redis-cache redis:7-alpine
   ```

2. **Redis Cluster (Production):**
   - Use AWS ElastiCache or managed Redis service
   - Configure replication (master-replica) for high availability
   - Enable persistence (AOF) to survive crashes

**Application-Level Implementation (Spring Boot Example):**

```java
@Component
public class RateLimiter {
    private final RedisTemplate<String, String> redisTemplate;
    private static final String KEY_PREFIX = "rate_limit:";
    private static final long CAPACITY = 100; // tokens
    private static final long REFILL_RATE = 10; // tokens/second
    private static final long TTL = 3600; // seconds

    public RateLimiter(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean allowRequest(String identifier) {
        String key = KEY_PREFIX + identifier;
        
        // Lua script for atomic refill + consume
        String script = 
            "local current = redis.call('GET', KEYS[1]) or '{}'\n" +
            "local now = tonumber(ARGV[1])\n" +
            "local capacity = tonumber(ARGV[2])\n" +
            "local refill_rate = tonumber(ARGV[3])\n" +
            "local cost = tonumber(ARGV[4])\n" +
            // ... refill logic ...
            "if tokens >= cost then\n" +
            "  redis.call('SET', KEYS[1], cjson.encode({tokens=tokens-cost, refilled_at=now}), 'EX', 3600)\n" +
            "  return 1\n" +
            "else\n" +
            "  return 0\n" +
            "end";

        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(script, Long.class),
            Collections.singletonList(key),
            String.valueOf(System.currentTimeMillis()),
            String.valueOf(CAPACITY),
            String.valueOf(REFILL_RATE),
            "1" // cost per request
        );

        return result != null && result == 1;
    }
}
```

**Endpoint Configuration:**

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final RateLimiter rateLimiter;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequestDTO request, 
                                   HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        String identifier = "login:" + clientIp;
        
        if (!rateLimiter.allowRequest(identifier)) {
            return ResponseEntity.status(429)
                .body(new ErrorResponse("Too many login attempts. Try again in 1 minute."));
        }
        
        // Process login...
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        String identifier = "forgot:" + request.getEmail();
        
        if (!rateLimiter.allowRequest(identifier)) {
            return ResponseEntity.status(429)
                .body(new ErrorResponse("Too many password reset attempts."));
        }
        
        // Send reset email...
    }
}
```

**Different Rate Limits per Endpoint:**

```java
public enum RateLimitPolicy {
    LOGIN(100, 10),           // 100 tokens, 10/sec refill
    FORGOT_PASSWORD(50, 2),   // 50 tokens, 2/sec refill
    API_GENERAL(1000, 100);   // 1000 tokens, 100/sec refill

    public final long capacity;
    public final long refillRate;

    RateLimitPolicy(long capacity, long refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
    }
}
```

**Monitoring & Alerting:**

```java
@Component
public class RateLimitMetrics {
    private final MeterRegistry meterRegistry;
    
    public void recordRateLimitHit(String identifier) {
        Counter.builder("rate_limit.rejected")
            .tag("identifier", identifier)
            .register(meterRegistry)
            .increment();
    }
    
    public void recordAllowedRequest(String identifier) {
        Counter.builder("rate_limit.allowed")
            .tag("identifier", identifier)
            .register(meterRegistry)
            .increment();
    }
}
```

### Effort Estimate

**Setup Time:** 8-16 hours
- Deploy Redis cluster (or use managed service) - 2-4 hours
- Implement rate limiter service (Lua script, atomic operations) - 3-4 hours
- Integrate into auth endpoints - 2-3 hours
- Write tests for edge cases (clock skew, token refill timing) - 2-3 hours
- Load test with multiple instances to verify global enforcement - 2 hours

**Ongoing Time:** 1-2 hours/week
- Monitor Redis performance (CPU, memory, latency)
- Adjust rate limit thresholds based on legitimate traffic patterns
- Review logs for false positives
- Handle Redis failover events if using cluster

**Total Effort:** 8-16 hours initial setup + medium ongoing

### Impact & Benefits

| Aspect | Impact | Details |
|--------|--------|---------|
| **Bypass Prevention** | ⭐⭐⭐⭐⭐ | Stops attackers from distributing requests across instances |
| **Credential Stuffing** | ⭐⭐⭐⭐⭐ | Global limit prevents login brute-force attacks |
| **Fine-Grained Control** | ⭐⭐⭐⭐ | Different limits per endpoint, user, IP, or custom identifier |
| **Scalability** | ⭐⭐⭐⭐ | Horizontal scaling doesn't require shared state complexity |
| **Cost** | ⭐⭐⭐⭐ | Redis is cheap (~$15-30/month for managed service) |
| **Latency Impact** | ⭐⭐⭐ | Each request adds 1-5ms Redis latency (acceptable) |
| **Complexity** | ⭐⭐⭐ | Moderate; Lua scripts required for atomic operations |

**Real-World Impact:**
- Prevents account takeover via credential stuffing
- Typical login brute-force attempt: 1000 attempts/hour → blocked after 100 attempts
- Multi-instance bypass: Attacker distributing across 5 instances → still caught by global counter
- Password reset spam: 10 resets/email/day limit prevents targeted abuse

---

## Method 3: Nginx Connection/Request Limits

### Theory & Flow

**How it works:**
- Nginx (reverse proxy/gateway) enforces low-level connection and request rate limits
- Operates before requests reach the application layer
- Uses leaky bucket algorithm; requests exceeding rate are queued or rejected
- Configurations include:
  - Connection limits (concurrent connections per IP)
  - Request rate limits (requests/second per IP)
  - Request body size limits (prevent uploading huge payloads)
  - Timeout configurations (prevent slowloris attacks)

**Leaky Bucket Algorithm (Nginx):**
```
Bucket Capacity: 10 requests
Drain Rate: 5 requests/sec

Requests Arrive: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                     ↓
              [1, 2, 3, 4, 5] processed immediately (capacity)
              [6, 7, 8, 9, 10] queued (bucket fills)
              [11, 12] rejected (bucket overflow)
                     ↓
              After 1 sec: [6, 7, 8, 9, 10] processes (5 drained)
              After 2 secs: [11, 12] can be processed
```

**Attack Scenarios Prevented:**

1. **Slowloris Attack** (many slow connections)
   ```
   Without limits: Attacker opens 100 connections, each sending 1 byte/sec
   Result: Exhausts worker processes, server becomes unresponsive
   
   With limits: Max 20 concurrent connections per IP
   Result: Only 20 connections accepted, rest queued/rejected
   ```

2. **Simple Flood** (bulk requests)
   ```
   Without limits: Attacker sends 10K req/sec
   Result: All requests processed, backend CPU spikes, legitimate users timeout
   
   With limits: 100 req/sec per IP
   Result: Only 100 req/sec per IP accepted, others queued or rejected
   ```

3. **Large Upload Attack** (memory exhaustion)
   ```
   Without limits: Attacker uploads 500MB file
   Result: Nginx buffers entire file in memory, OOM
   
   With limits: Max body size 10MB
   Result: Requests > 10MB rejected immediately with 413 Payload Too Large
   ```

**Architecture Flow:**
```
Client Request
    ↓
Nginx Gateway
    ├─ Check Connection Count per IP (limit_conn)
    │  ├─ Under limit? → Increment counter, proceed
    │  └─ Over limit? → Queue or reject
    ├─ Check Request Rate per IP (limit_req)
    │  ├─ Under limit? → Decrement token bucket
    │  └─ Over limit? → Queue (burst) or reject
    ├─ Check Request Body Size
    │  ├─ Under limit? → Buffer request
    │  └─ Over limit? → Return 413
    └─ Check Timeouts
       ├─ client_body_timeout (default 60s)
       └─ client_header_timeout (default 60s)
    ↓
Forward to Backend (if all checks pass)
```

### Implementation Details

**Nginx Configuration (gateway/nginx/nginx.local.conf):**

```nginx
# Define rate limit zone (shared memory)
# 10MB zone can hold ~200K IPs (50 bytes per entry)
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

# Connection pool zone
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    listen 80;
    server_name localhost;

    # Global connection limit: max 20 concurrent connections per IP
    limit_conn addr 20;

    # Global request body size limit: 10MB
    client_max_body_size 10m;

    # Timeout settings
    client_body_timeout 30s;
    client_header_timeout 30s;
    keepalive_timeout 65s;
    send_timeout 30s;

    # API Gateway routes
    location /api {
        # General API limit: 100 req/sec, burst of 50, queue excess
        limit_req zone=api_limit burst=50 nodelay;
        # Connection limit: 10 concurrent per IP
        limit_conn conn_limit 10;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Return custom message when rate limited
        error_page 429 @rate_limit_exceeded;
    }

    # Auth endpoints: stricter limits
    location /api/auth/login {
        # 10 req/sec per IP, burst of 5
        limit_req zone=auth_limit burst=5 nodelay;
        limit_conn conn_limit 5;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        error_page 429 @rate_limit_exceeded;
    }

    location /api/auth/forgot-password {
        # 2 req/sec per IP, burst of 2
        limit_req_zone $binary_remote_addr zone=password_limit:10m rate=2r/s;
        limit_req zone=password_limit burst=2 nodelay;
        limit_conn conn_limit 3;

        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;

        error_page 429 @rate_limit_exceeded;
    }

    # Health check (no rate limiting)
    location /health {
        access_log off;
        return 200 "healthy\n";
    }

    # Error handler for rate limit
    location @rate_limit_exceeded {
        default_type application/json;
        return 429 '{"status":429,"error":"Too Many Requests","message":"Rate limit exceeded. Please try again later."}';
    }
}
```

**Advanced Configuration (Whitelisting):**

```nginx
# Whitelist trusted IPs (monitoring services, internal APIs)
geo $limit_api {
    default 1;
    10.0.0.0/8 0;           # Internal network
    203.0.113.5 0;          # Monitoring service
    127.0.0.1 0;            # Localhost
}

limit_req_zone $limit_api zone=conditional_api:10m rate=1000r/s;

location /api {
    limit_req zone=conditional_api burst=100;
    # ...
}
```

**Dynamic Updates (without Nginx restart):**

```nginx
# Use Lua module for dynamic rate limit adjustment
location /admin/rate-limit/update {
    access_by_lua_block {
        -- Update rate limit in shared memory
        ngx.shared.rate_limit_config:set("auth_limit", "20r/s")
    }
}
```

### Effort Estimate

**Setup Time:** 1-3 hours
- Review Nginx configuration syntax - 30 min
- Define rate limits per endpoint (tune based on baseline traffic) - 1 hour
- Configure custom error responses - 30 min
- Deploy and monitor initial threshold behavior - 1 hour

**Ongoing Time:** 30 min/week
- Monitor Nginx logs for 429 responses
- Adjust burst/rate parameters based on legitimate traffic patterns
- Investigate false positives (e.g., proxied traffic from same IP)

**Total Effort:** 1-3 hours initial setup + minimal ongoing

### Impact & Benefits

| Aspect | Impact | Details |
|--------|--------|---------|
| **Small/Medium Flood Protection** | ⭐⭐⭐⭐ | Prevents 1-10K req/sec floods |
| **Slowloris Prevention** | ⭐⭐⭐⭐⭐ | Connection limits block slow attacks |
| **Large Upload Prevention** | ⭐⭐⭐⭐ | Body size limits prevent memory exhaustion |
| **Setup Complexity** | ⭐⭐ | Simple config, well-documented |
| **Performance Overhead** | ⭐⭐⭐⭐⭐ | Minimal; operates at socket level |
| **Bypass Prevention** | ⭐ | Can be bypassed with distributed IPs |
| **Latency Impact** | ⭐⭐⭐⭐⭐ | No measurable impact; operates before proxy_pass |

**Real-World Impact:**
- Typical botnet flood: 100K req/sec from 10K IPs → ~10 req/sec per IP = within limit
- Single-IP flood: 10K req/sec from 1 IP → burst of 50 queued, rest rejected
- Slowloris attack: 1000 slow connections from 1 IP → max 20 concurrent = blocked
- Large upload abuse: Attacker tries 500MB upload → 413 Payload Too Large

**Limitations:**
- **Distributed Attacks:** If attacker uses 1000 unique IPs, each stays under limit
- **Shared IP Bypass:** Multiple legitimate users behind NAT/proxy hit same limit
- **Application-Layer Attacks:** Complex attacks (SQL injection, XXE) bypass these limits

---

## Method 4: Bot Protection on Auth Endpoints (CAPTCHA / Device Signals)

### Theory & Flow

**How it works:**
- Detect suspicious authentication requests (likely bots or automated attacks)
- Challenge suspicious requests with CAPTCHA or device fingerprinting
- Track suspicious patterns: rapid login attempts, failed auths, impossible travel
- Legitimate users complete challenge; automated attackers abandon attempt

**Challenge Mechanisms:**

1. **CAPTCHA** (Completely Automated Public Turing test)
   - Visual puzzle (hard for computers, easy for humans)
   - reCAPTCHA v3: Silent risk scoring (no user interaction)
   - hCaptcha: Privacy-focused alternative
   - Simple math CAPTCHA: Lightweight, but less secure

2. **Device Fingerprinting** (Passive Signals)
   - Browser user-agent
   - Screen resolution, timezone
   - Device accelerometer/gyro data
   - Canvas fingerprinting (WebGL rendering)
   - Device memory/CPU info
   - Combines signals for ML-based bot detection

3. **Behavioral Analysis**
   - Typing speed (legitimate: 30-100 WPM, bots: instant)
   - Mouse movement patterns
   - Key down/up timing
   - Scroll behavior
   - Tab/window focus changes

**Risk Scoring Flow:**
```
Login Request Arrives
    ↓
Extract Signals:
  - IP geolocation vs account location (impossible travel?)
  - Device fingerprint (new device?)
  - User-agent (known bot user-agent?)
  - Request metadata (VPN detected?)
  - Typing speed (too fast?)
  - Failed auth history (too many failures?)
    ↓
ML Model / Rule Engine
    ├─ Score: 0-100 (0=trusted, 100=bot)
    ├─ Trusted (score < 20): Allow login
    ├─ Suspicious (20-70): Challenge with CAPTCHA
    └─ Blocked (score > 70): Reject or hard CAPTCHA
    ↓
Response:
  - Allow: Set auth cookies, return JWT
  - Challenge: Show CAPTCHA challenge, require solve before proceeding
  - Block: Return 403 Forbidden
```

**Real-World Scenario:**
```
Credential Stuffing Attack:
  Attacker: IP 123.45.67.89, User-Agent: curl/7.68.0
  User Account: Last login from 203.0.113.5, US
  
  Risk Signals:
    - New IP (never seen before): +25 points
    - Non-browser user-agent (curl): +30 points
    - Impossible travel (UK to US in 1 minute): +25 points
    - Failed auth 5 times in 1 minute: +15 points
    - Total Score: 95 → BLOCK (reject immediately)
  
Legitimate User, New Location:
  User: IP 203.0.113.10, User-Agent: Chrome/120, Safari
  Account: Usually logs in from 203.0.113.5
  
  Risk Signals:
    - New IP (but same country): +10 points
    - Browser user-agent: -5 points
    - Reasonable time since last login: +0 points
    - Total Score: 5 → ALLOW (normal login flow)
  
Legitimate User, Weird Hours:
  User: IP 203.0.113.5, User-Agent: Chrome, 3 AM
  Account: Usually logs in 9-5
  
  Risk Signals:
    - Trusted IP: -10 points
    - Known user-agent: -5 points
    - Unusual time: +20 points
    - Total Score: 5 → ALLOW (might ask for MFA instead)
```

### Implementation Details

**Frontend: Device Fingerprinting & Behavioral Signals**

```typescript
// auth-signals.service.ts
import { Injectable } from '@angular/core';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

@Injectable({ providedIn: 'root' })
export class AuthSignalsService {
  private fingerprintAgent: any;
  private typingMetrics = { keyCount: 0, startTime: 0, endTime: 0 };
  private mouseMetrics = { moves: 0, speed: 0, variance: 0 };

  async getDeviceFingerprint(): Promise<string> {
    if (!this.fingerprintAgent) {
      this.fingerprintAgent = await FingerprintJS.load();
    }
    const result = await this.fingerprintAgent.get();
    return result.visitorId;
  }

  startTrackingTyping(): void {
    this.typingMetrics = { keyCount: 0, startTime: Date.now(), endTime: 0 };
  }

  recordKeyPress(): void {
    this.typingMetrics.keyCount++;
    this.typingMetrics.endTime = Date.now();
  }

  getTypingSpeed(): number {
    if (this.typingMetrics.keyCount === 0) return 0;
    const duration = this.typingMetrics.endTime - this.typingMetrics.startTime;
    return (this.typingMetrics.keyCount / duration) * 1000; // chars/sec
  }

  getDeviceSignals(): Promise<DeviceSignals> {
    return Promise.all([
      this.getDeviceFingerprint(),
      this.getUserAgent(),
      this.getScreenResolution(),
      this.getTimezone(),
      this.getLanguage(),
      this.getDeviceMemory(),
      this.getDeviceCores()
    ]).then(([fingerprint, ua, screen, tz, lang, memory, cores]) => ({
      fingerprint,
      userAgent: ua,
      screen,
      timezone: tz,
      language: lang,
      deviceMemory: memory,
      deviceCores: cores,
      typingSpeed: this.getTypingSpeed(),
      timestamp: Date.now()
    }));
  }

  private getUserAgent(): string {
    return navigator.userAgent;
  }

  private getScreenResolution(): { width: number; height: number } {
    return { width: window.screen.width, height: window.screen.height };
  }

  private getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  private getLanguage(): string {
    return navigator.language;
  }

  private getDeviceMemory(): number {
    return (navigator as any).deviceMemory || 0;
  }

  private getDeviceCores(): number {
    return navigator.hardwareConcurrency || 0;
  }
}

// login.component.ts
export class LoginComponent {
  constructor(
    private authService: AuthService,
    private authSignals: AuthSignalsService
  ) {}

  onPasswordInput(): void {
    this.authSignals.recordKeyPress();
  }

  async onSubmit(): Promise<void> {
    this.authSignals.startTrackingTyping();
    
    const credentials = this.loginForm.value;
    const signals = await this.authSignals.getDeviceSignals();

    // Include signals with login request
    this.authService.login(credentials, signals).subscribe({
      next: (response) => {
        // Handle CAPTCHA challenge if needed
        if (response.requiresCaptcha) {
          this.showCaptchaChallenge();
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error) => {
        this.errorMessage = error.message;
      }
    });
  }

  showCaptchaChallenge(): void {
    // Show reCAPTCHA v3 or hCaptcha modal
    // After solve, submit captcha token with login retry
  }
}
```

**Backend: Risk Scoring Engine**

```java
// BotDetectionService.java
@Service
public class BotDetectionService {
    private final UserRepository userRepository;
    private final AuthAuditLogRepository auditLog;
    private final GeoLocationService geoLocation;
    private final RedisTemplate<String, Object> redis;
    
    private static final int SCORE_THRESHOLD_CHALLENGE = 20;
    private static final int SCORE_THRESHOLD_BLOCK = 70;

    public BotDetectionResult analyzeLoginRequest(
            String username,
            AuthSignals signals,
            HttpServletRequest httpRequest) {
        
        int riskScore = 0;
        List<String> riskFactors = new ArrayList<>();
        
        User user = userRepository.findByUsername(username)
            .orElse(null);

        // 1. Device Fingerprint Analysis
        String currentFingerprint = signals.getFingerprint();
        String lastFingerprint = redis.opsForValue().get("device:" + username);
        
        if (lastFingerprint != null && !lastFingerprint.equals(currentFingerprint)) {
            riskScore += 20;
            riskFactors.add("New device fingerprint");
        }

        // 2. User-Agent Analysis
        String userAgent = signals.getUserAgent();
        if (isKnownBotUserAgent(userAgent)) {
            riskScore += 30;
            riskFactors.add("Bot user-agent detected: " + userAgent);
        } else if (!isBrowserUserAgent(userAgent)) {
            riskScore += 15;
            riskFactors.add("Non-browser user-agent: " + userAgent);
        }

        // 3. Geographic Analysis (Impossible Travel)
        if (user != null && user.getLastLoginIp() != null) {
            GeoLocation currentLocation = geoLocation.lookup(getClientIp(httpRequest));
            GeoLocation lastLocation = geoLocation.lookup(user.getLastLoginIp());
            
            long timeSinceLastLogin = System.currentTimeMillis() - user.getLastLoginAt().getTime();
            double distanceKm = calculateDistance(currentLocation, lastLocation);
            double maxPossibleKmPerHour = 900; // Max realistic travel speed (airplane)
            
            if (distanceKm > (maxPossibleKmPerHour * (timeSinceLastLogin / 3600000.0))) {
                riskScore += 25;
                riskFactors.add("Impossible travel detected");
            }
        }

        // 4. VPN/Proxy Detection
        if (isVpnDetected(getClientIp(httpRequest))) {
            riskScore += 10;
            riskFactors.add("VPN/Proxy detected");
        }

        // 5. Failed Authentication History
        long failedAttemptsLastMin = auditLog.countFailedLoginsSinceMinutesAgo(username, 1);
        if (failedAttemptsLastMin > 3) {
            riskScore += Math.min(20, failedAttemptsLastMin * 5);
            riskFactors.add("Multiple failed attempts: " + failedAttemptsLastMin);
        }

        // 6. Typing Speed Analysis
        if (signals.getTypingSpeed() > 0) {
            // Typical human: 5-10 chars/sec, bot: instant or 100+ chars/sec
            if (signals.getTypingSpeed() > 20) {
                riskScore += 15;
                riskFactors.add("Unusually fast typing detected");
            }
        }

        // 7. Request Rate Analysis
        long requestsLastMin = auditLog.countLoginAttempts(username, 1);
        if (requestsLastMin > 10) {
            riskScore += 25;
            riskFactors.add("Excessive login attempts");
        }

        // Determine action
        BotDetectionResult result = new BotDetectionResult();
        result.setRiskScore(riskScore);
        result.setRiskFactors(riskFactors);
        
        if (riskScore >= SCORE_THRESHOLD_BLOCK) {
            result.setAction(BotDetectionAction.BLOCK);
            result.setMessage("Login attempt blocked due to security concerns.");
        } else if (riskScore >= SCORE_THRESHOLD_CHALLENGE) {
            result.setAction(BotDetectionAction.CHALLENGE);
            result.setMessage("Please verify you are human by completing the CAPTCHA.");
            result.setCaptchaRequired(true);
        } else {
            result.setAction(BotDetectionAction.ALLOW);
            result.setMessage("Login allowed");
        }

        // Log for analysis
        auditLog.save(new LoginAttempt(
            username,
            riskScore,
            riskFactors,
            result.getAction(),
            getClientIp(httpRequest)
        ));

        return result;
    }

    private boolean isKnownBotUserAgent(String userAgent) {
        String[] botPatterns = {
            "curl", "wget", "python", "java", "node", "go-http-client",
            "scrapy", "selenium", "puppeteer", "playwright"
        };
        return Arrays.stream(botPatterns)
            .anyMatch(pattern -> userAgent.toLowerCase().contains(pattern));
    }

    private boolean isBrowserUserAgent(String userAgent) {
        return userAgent.matches(".*(Chrome|Firefox|Safari|Edge|Opera).*");
    }

    private boolean isVpnDetected(String ip) {
        // Query VPN/proxy detection API (MaxMind, IP2Location, etc.)
        // return vpnDetectionService.isVpn(ip);
        return false;
    }

    private double calculateDistance(GeoLocation loc1, GeoLocation loc2) {
        // Haversine formula
        double lat1 = Math.toRadians(loc1.getLatitude());
        double lat2 = Math.toRadians(loc2.getLatitude());
        double lon1 = Math.toRadians(loc1.getLongitude());
        double lon2 = Math.toRadians(loc2.getLongitude());
        
        double dlat = lat2 - lat1;
        double dlon = lon2 - lon1;
        
        double a = Math.sin(dlat / 2) * Math.sin(dlat / 2) +
                   Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) * Math.sin(dlon / 2);
        double c = 2 * Math.asin(Math.sqrt(a));
        double earthRadius = 6371; // km
        
        return earthRadius * c;
    }
}

// AuthController.java
@PostMapping("/login")
public ResponseEntity<?> login(@Valid @RequestBody AuthRequestDTO request,
                               @RequestBody(required = false) AuthSignals signals,
                               HttpServletRequest httpRequest,
                               HttpServletResponse response) {
    
    BotDetectionResult botCheck = botDetectionService.analyzeLoginRequest(
        request.getUsername(),
        signals != null ? signals : new AuthSignals(),
        httpRequest
    );

    if (botCheck.getAction() == BotDetectionAction.BLOCK) {
        return ResponseEntity.status(403)
            .body(new ErrorResponse("Login blocked due to security concerns."));
    }

    if (botCheck.getAction() == BotDetectionAction.CHALLENGE) {
        // Generate CAPTCHA challenge token
        String challengeToken = generateChallengeToken(request.getUsername());
        return ResponseEntity.status(401)
            .body(new ChallengeResponse(
                "CAPTCHA_REQUIRED",
                challengeToken,
                "https://www.google.com/recaptcha/api.js"
            ));
    }

    // Normal login flow
    try {
        AuthResponseDTO authResponse = authService.authenticate(request);
        addAuthCookies(response, authResponse);
        return ResponseEntity.ok(authResponse);
    } catch (Exception e) {
        return ResponseEntity.status(401).build();
    }
}

@PostMapping("/login/captcha-verify")
public ResponseEntity<?> verifyCaptchaAndLogin(
        @RequestBody CaptchaVerificationRequest request,
        HttpServletRequest httpRequest,
        HttpServletResponse response) {
    
    // Verify CAPTCHA with Google/hCaptcha
    if (!verifyCaptchaToken(request.getCaptchaToken())) {
        return ResponseEntity.status(400)
            .body(new ErrorResponse("CAPTCHA verification failed."));
    }

    // Verify challenge token
    if (!isValidChallengeToken(request.getChallengeToken())) {
        return ResponseEntity.status(400)
            .body(new ErrorResponse("Challenge token expired or invalid."));
    }

    // Proceed with login
    // ... same as normal login flow
}

private String generateChallengeToken(String username) {
    String token = UUID.randomUUID().toString();
    redis.opsForValue().set(
        "challenge:" + token,
        username,
        Duration.ofMinutes(5)
    );
    return token;
}

private boolean isValidChallengeToken(String token) {
    String username = redis.opsForValue().get("challenge:" + token);
    return username != null;
}
```

**CAPTCHA Integration (Frontend):**

```typescript
// captcha.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-captcha-challenge',
  template: `
    <div class="captcha-modal">
      <h2>Verify You're Human</h2>
      <p>Complete the CAPTCHA to continue</p>
      
      <!-- reCAPTCHA v3 (silent) -->
      <div class="g-recaptcha" 
           data-sitekey="YOUR_RECAPTCHA_SITE_KEY"
           data-callback="onCaptchaSuccess"
           data-expired-callback="onCaptchaExpired"></div>
      
      <button (click)="submitCaptcha()" [disabled]="!captchaToken">
        Verify
      </button>
    </div>
  `
})
export class CaptchaChallengeComponent {
  captchaToken: string | null = null;
  challengeToken: string;

  onCaptchaSuccess(token: string): void {
    this.captchaToken = token;
  }

  submitCaptcha(): void {
    if (!this.captchaToken) return;

    this.authService.verifyCaptchaAndLogin({
      captchaToken: this.captchaToken,
      challengeToken: this.challengeToken
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error) => alert('Verification failed: ' + error.message)
    });
  }
}
```

**Monitoring & Analytics:**

```java
@Component
public class BotDetectionAnalytics {
    private final AuthAuditLogRepository auditLog;
    private final MeterRegistry meterRegistry;

    @Scheduled(fixedDelay = 300000) // Every 5 minutes
    public void reportMetrics() {
        long blockedCount = auditLog.countLoginsByAction(BotDetectionAction.BLOCK, 5);
        long challengeCount = auditLog.countLoginsByAction(BotDetectionAction.CHALLENGE, 5);
        long allowedCount = auditLog.countLoginsByAction(BotDetectionAction.ALLOW, 5);
        
        Gauge.builder("auth.login.blocked", () -> blockedCount)
            .register(meterRegistry);
        Gauge.builder("auth.login.challenged", () -> challengeCount)
            .register(meterRegistry);
        Gauge.builder("auth.login.allowed", () -> allowedCount)
            .register(meterRegistry);
    }
}
```

### Effort Estimate

**Setup Time:** 16-32 hours
- Design risk scoring model and thresholds - 4-6 hours
- Implement device fingerprinting (FingerprintJS integration) - 3-4 hours
- Implement behavioral tracking (typing, mouse) - 3-4 hours
- Implement geolocation and impossible travel detection - 3-4 hours
- Integrate CAPTCHA provider (reCAPTCHA/hCaptcha) - 2-3 hours
- Implement backend risk scoring engine - 4-6 hours
- Integrate CAPTCHA verification endpoint - 2-3 hours
- Write tests and tune thresholds - 3-4 hours
- Deploy and monitor false positive rates - 2-3 hours

**Ongoing Time:** 2-4 hours/week
- Monitor bot detection logs for trends
- Adjust risk scoring thresholds based on false positives
- Tune CAPTCHA difficulty/frequency
- Review compromised credentials in audit logs
- Update VPN/proxy detection lists

**Total Effort:** 16-32 hours initial setup + medium-high ongoing

### Impact & Benefits

| Aspect | Impact | Details |
|--------|--------|---------|
| **Credential Stuffing** | ⭐⭐⭐⭐⭐ | Detects and challenges automated login attempts |
| **Account Takeover Prevention** | ⭐⭐⭐⭐⭐ | Catches attackers even with valid credentials |
| **Auth Endpoint Protection** | ⭐⭐⭐⭐⭐ | Specifically targets `/login`, `/forgot-password` |
| **User Experience** | ⭐⭐⭐ | CAPTCHA adds friction; reCAPTCHA v3 is silent |
| **False Positive Risk** | ⭐⭐ | Risk scoring can block legitimate users (travel, new devices) |
| **Complexity** | ⭐⭐⭐⭐ | High; requires ML/ML libraries, device fingerprinting |
| **Scalability** | ⭐⭐⭐⭐ | Device fingerprinting adds minimal server load |

**Real-World Impact:**
- Credential stuffing: 10K accounts tested with stolen passwords → 95%+ challenged/blocked
- Account takeover: Attacker with password faces CAPTCHA → abandons attempt
- New device login: Legitimate user logs in from new phone → transparent (no friction)
- Travel scenario: User travels, logs in from new country → may challenge, but allows eventual login
- Bot attacks: Selenium/Puppeteer scripts fail at CAPTCHA → attackers move to easier targets

**Limitations:**
- **False Positives:** New devices, travel, proxies may be incorrectly flagged
- **CAPTCHA Fatigue:** Users get annoyed by frequent challenges; harms UX
- **Sophisticated Attacks:** CAPTCHA solvers (2captcha service) exist; attackers may pay to solve
- **Accessibility:** CAPTCHAs create barriers for visually impaired users (audio CAPTCHA helps)

---

## Comparison & Recommendations

### When to Use Each Method

| Method | Best For | Avoid If |
|--------|----------|----------|
| **Edge WAF** | Large volumetric DDoS, global traffic filtering | Small app, limited budget, simple attacks |
| **Redis Rate Limiting** | Preventing distributed attacks, global enforcement | Very high request rate (>100K/sec), simple single-instance app |
| **Nginx Limits** | Quick protection, baseline defense, slowloris prevention | Complex rate limit rules, per-user limits |
| **Bot Protection** | Credential stuffing, account takeover, auth abuse | Volumetric DDoS, legitimate bot traffic needed |

### Recommended Stack (Defense in Depth)

**Tier 1 (Edge):** CloudFront + AWS WAF
- Absorbs 95% of attacks at edge
- Cost-effective (protects bandwidth)

**Tier 2 (Gateway):** Nginx Connection/Request Limits
- Simple, fast, no shared state required
- Catches remaining floods and slowloris

**Tier 3 (Application):** Redis Rate Limiting
- Fine-grained control per endpoint/user
- Prevents bypass via distributed IPs
- Pairs with bot protection

**Tier 4 (Auth Specific):** CAPTCHA + Bot Detection
- Targets credential stuffing and account takeover
- Behavioral analysis and device fingerprinting
- User-friendly (reCAPTCHA v3 silent)

**Implementation Order:**
1. Start with Nginx limits (1-3 hours, immediate protection)
2. Add Redis rate limiting for auth (16-32 hours, prevents distributed attacks)
3. Deploy bot protection (16-32 hours, stops credential stuffing)
4. Add AWS WAF (2-4 hours, protects from large DDoS)

### Cost Breakdown (Monthly)

| Component | Cost | Notes |
|-----------|------|-------|
| CloudFront | $0.085/GB + $5 WAF | 10GB/month = $5.85 + $5 WAF = $10.85 |
| AWS WAF | $5 | Fixed + per-rule cost (~$0.60/million requests) |
| Redis | $15-30 | AWS ElastiCache (1GB, t3.micro) |
| CAPTCHA | $0-20 | Free tier; pay-as-you-go for excess |
| **Total** | **~$40-60/month** | Protects from major attacks |

### Expected Attack Coverage

```
Volumetric DDoS (100K req/sec, 1K IPs):
  - WAF + CDN: 95% blocked at edge
  - Nginx limits: Remaining 5% queued/rejected
  - Result: Origin sees <1K req/sec

Credential Stuffing (10K accounts, 100 IPs):
  - Redis rate limiting: Blocks 70% (per-IP limits)
  - Bot protection + CAPTCHA: Blocks 95% (device/behavior detection)
  - Result: <500 valid attempts, attackers abandon

Single-IP Flood (10K req/sec):
  - Nginx limits: Requests queued/rejected at burst threshold
  - Redis limits: Additional per-endpoint rate limiting
  - Result: Origin handles gracefully, legitimate traffic prioritized

Slowloris Attack (1000 slow connections):
  - Nginx connection limits: Only 20 per IP accepted
  - Result: ~20 connections active, rest queued/rejected
```

---

## Implementation Roadmap

### Phase 1: Quick Win (Week 1)
- Configure Nginx limits for `/api/auth/login` endpoint
- Set limits: 100 req/5min per IP, max 10 concurrent connections
- Deploy and monitor false positives
- **Expected Result:** Block 80% of basic credential stuffing attacks

### Phase 2: Shared Rate Limiting (Week 2-3)
- Deploy Redis cluster (or use AWS ElastiCache)
- Implement token bucket rate limiter
- Integrate into AuthService
- Test across multiple app instances
- **Expected Result:** Prevent bypass via distributed IPs

### Phase 3: Bot Detection (Week 4-5)
- Integrate FingerprintJS for device identification
- Implement risk scoring engine
- Deploy reCAPTCHA v3 integration
- Tune thresholds based on false positive rate
- **Expected Result:** Stop sophisticated credential stuffing, prevent account takeover

### Phase 4: AWS WAF (Week 6)
- Enable AWS WAF on CloudFront/ALB
- Configure IP reputation, geo-blocking, rate-based rules
- Monitor WAF logs and adjust thresholds
- **Expected Result:** Mitigate large DDoS attacks, protect bandwidth

---

## Testing & Validation

### Load Testing Script (Apache Bench)

```bash
# Test Nginx limits
ab -n 200 -c 10 http://localhost/api/auth/login

# Expected: ~100 successful, ~100 rate limited (429)
```

### Bot Simulation Script (Python)

```python
import requests
import concurrent.futures

def test_distributed_attack(num_ips=100, attempts_per_ip=50):
    """Simulate credential stuffing from multiple IPs"""
    results = {'allowed': 0, 'blocked': 0}
    
    def attempt(ip):
        headers = {'X-Forwarded-For': f'203.0.113.{ip}'}
        for _ in range(attempts_per_ip):
            response = requests.post(
                'http://localhost/api/auth/login',
                json={'username': 'test', 'password': 'wrong'},
                headers=headers
            )
            if response.status_code == 429:
                results['blocked'] += 1
            else:
                results['allowed'] += 1
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        executor.map(attempt, range(num_ips))
    
    print(f"Attack Results: {results}")
    print(f"Block Rate: {results['blocked'] / (results['blocked'] + results['allowed']) * 100:.1f}%")

if __name__ == '__main__':
    test_distributed_attack()
```

---

## Conclusion

A **defense-in-depth** approach using all four methods provides comprehensive protection:

1. **Nginx limits** = First line of defense (low effort, immediate)
2. **Redis rate limiting** = Prevents distributed bypass (medium effort, high impact)
3. **Bot protection** = Stops credential stuffing and account takeover (high effort, auth-specific)
4. **AWS WAF** = Mitigates large DDoS (medium effort, protects all attack types)

**Recommended Priority:** Start with Nginx → Redis → Bot Protection → AWS WAF

**Expected Outcome:** 99%+ attack mitigation for reasonable threat model (10K req/sec, credential stuffing, account takeover)
