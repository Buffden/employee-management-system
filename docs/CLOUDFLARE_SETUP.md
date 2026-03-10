# CloudFlare Free Tier Setup Guide

## Overview

CloudFlare Free provides **$0/month** DDoS protection, CDN, and basic rate limiting. This guide helps you set up CloudFlare as a protective layer in front of your application.

---

## Benefits of CloudFlare Free

✅ **Unlimited DDoS Protection** - Stops volumetric attacks (10+ Gbps)  
✅ **Free CDN** - Global content delivery with caching  
✅ **SSL/TLS** - Free HTTPS certificates (auto-renewing)  
✅ **Basic Rate Limiting** - 5 rules on free tier  
✅ **Bot Protection** - Challenge suspected bots with CAPTCHA  
✅ **Analytics** - Traffic insights and attack monitoring  

**Cost:** $0/month (forever free)

---

## Setup Steps

### Step 1: Create CloudFlare Account

1. Go to [cloudflare.com](https://www.cloudflare.com/)
2. Click "Sign Up" (top right)
3. Enter email and password
4. Verify email

### Step 2: Add Your Domain

1. Click "Add a Site" from dashboard
2. Enter your domain name (e.g., `ems.buffden.com`)
3. Click "Add Site"

### Step 3: Choose Free Plan

1. Select "Free" plan ($0/month)
2. Click "Continue"

### Step 4: DNS Configuration

CloudFlare will scan your existing DNS records.

1. **Verify DNS Records:**
   ```
   Type   Name              Value                     Status
   A      ems.buffden.com   <your-ec2-public-ip>     Proxied (orange cloud)
   A      www               <your-ec2-public-ip>     Proxied (orange cloud)
   ```

2. **Important:** Ensure **orange cloud** (proxied) is enabled:
   - **Orange Cloud** = Traffic goes through CloudFlare (protection enabled)
   - **Gray Cloud** = Traffic goes directly to origin (no protection)

3. Click "Continue"

### Step 5: Update Nameservers

CloudFlare will provide 2 nameservers:

```
ns1.cloudflare.com
ns2.cloudflare.com
```

**Update at your domain registrar:**

1. Log in to your domain registrar (e.g., GoDaddy, Namecheap, AWS Route 53)
2. Find "DNS Settings" or "Nameservers"
3. Replace existing nameservers with CloudFlare's
4. Save changes

**DNS propagation takes 1-24 hours** (usually 15-30 minutes)

### Step 6: Verify Setup

1. CloudFlare will check nameserver propagation
2. You'll receive an email when setup is complete
3. Test your site: `https://ems.buffden.com`

---

## Security Configuration

### Enable "Under Attack Mode" (Emergency DDoS Protection)

If you're under active attack:

1. Go to CloudFlare Dashboard → **Security** → **Settings**
2. Enable **"I'm Under Attack Mode"**
3. All visitors will see a CAPTCHA challenge for 5 seconds
4. After 5 seconds, they're allowed through
5. **Disable after attack subsides** (hurts UX)

### SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Choose encryption mode:
   - **Full (strict)** - Recommended for production (requires valid SSL on origin)
   - **Full** - If you have self-signed SSL on origin
   - **Flexible** - CloudFlare → Visitor HTTPS, CloudFlare → Origin HTTP

**Recommendation:** Use **Full (strict)** with Let's Encrypt on your EC2 instance

### Firewall Rules (Free Tier: 5 Rules)

Go to **Security** → **WAF** → **Firewall Rules**

#### Rule 1: Block Known Bots

```
Field:       User Agent
Operator:    contains
Value:       curl
Action:      Block
```

#### Rule 2: Block Bad IPs (if you identify attackers)

```
Field:       IP Address
Operator:    equals
Value:       <attacker-ip>
Action:      Block
```

#### Rule 3: Geo-Block High-Risk Countries (Optional)

```
Field:       Country
Operator:    equals
Value:       North Korea, Iran, etc.
Action:      Block
```

**Note:** Free tier = 5 rules. Use wisely!

### Rate Limiting (Requires Paid Plan)

⚠️ **Rate limiting is NOT available on Free tier** (requires $20/month Pro plan)

**Workaround:** Use Nginx + Redis rate limiting (already implemented)

---

## Nginx Configuration for CloudFlare

Update your Nginx config to trust CloudFlare IPs:

```nginx
# /gateway/nginx/nginx.local.conf

# Trust CloudFlare IPs for X-Forwarded-For header
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2c0f:f248::/32;
set_real_ip_from 2a06:98c0::/29;

real_ip_header CF-Connecting-IP;
```

**Why:** This ensures rate limiting uses the real client IP, not CloudFlare's proxy IP

---

## Monitoring & Analytics

### View Attack Traffic

1. Go to **Security** → **Events**
2. See all blocked/challenged requests
3. Filter by:
   - Firewall rule
   - Country
   - User agent
   - Action (block, challenge, allow)

### Traffic Analytics

1. Go to **Analytics** → **Traffic**
2. View:
   - Requests per minute
   - Bandwidth saved by caching
   - Top countries
   - Top paths/URLs
   - Status codes (200, 403, 429, etc.)

### Set Up Email Alerts

1. Go to **Notifications**
2. Enable alerts for:
   - DDoS attacks detected
   - High traffic spikes
   - SSL certificate expiration

---

## Testing CloudFlare Protection

### Test 1: Verify Proxying

```bash
# Check if CloudFlare is active
dig ems.buffden.com

# Should return CloudFlare IPs (104.x.x.x, 172.x.x.x, etc.)
```

### Test 2: Verify Headers

```bash
curl -I https://ems.buffden.com

# Should see CloudFlare headers:
# cf-ray: <unique-id>
# cf-cache-status: HIT/MISS/DYNAMIC
# server: cloudflare
```

### Test 3: Simulate Attack (Firewall Block)

```bash
# Test User-Agent block rule
curl -A "curl/7.68.0" https://ems.buffden.com/api/auth/login

# Should return: 403 Forbidden (blocked by CloudFlare)
```

### Test 4: Verify Rate Limiting (Nginx + Redis)

```bash
# Send 20 login requests (should hit rate limit)
for i in {1..20}; do
  curl -X POST https://ems.buffden.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done

# After ~10 requests, should return: 429 Too Many Requests
```

---

## Cost Comparison

| Protection Layer | Monthly Cost | What It Protects |
|------------------|--------------|------------------|
| **Nginx Limits** | $0 | Simple floods, slowloris |
| **Redis Rate Limiting** | $0 (self-hosted) | Distributed attacks, credential stuffing |
| **CloudFlare Free** | $0 | Large DDoS (10+ Gbps), bot attacks |
| **Total** | **$0/month** | 95%+ of attacks |

---

## CloudFlare Free vs Paid

| Feature | Free | Pro ($20/mo) | Business ($200/mo) |
|---------|------|--------------|-------------------|
| DDoS Protection | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| CDN | ✅ | ✅ | ✅ |
| SSL/TLS | ✅ | ✅ | ✅ |
| Firewall Rules | 5 rules | 20 rules | 100 rules |
| **Rate Limiting** | ❌ | ✅ 10 rules | ✅ 100 rules |
| Bot Protection | Basic | Advanced | Enterprise |
| WAF | Basic | Advanced | Advanced + Custom |

**For this project:** Free tier is sufficient (Nginx + Redis handle rate limiting)

---

## Common Issues & Solutions

### Issue: "Too many redirects" error

**Cause:** SSL/TLS mode mismatch

**Solution:**
1. Go to **SSL/TLS** → **Overview**
2. Change to **Full** or **Full (strict)**
3. Ensure your origin server has SSL enabled

### Issue: Rate limiting doesn't work

**Cause:** CloudFlare Free doesn't include rate limiting feature

**Solution:** Use Nginx + Redis rate limiting (already implemented in this project)

### Issue: CloudFlare shows wrong IP in logs

**Cause:** Nginx not reading CF-Connecting-IP header

**Solution:** Add `real_ip_header CF-Connecting-IP;` to Nginx config (see above)

### Issue: CloudFlare caching breaks API

**Cause:** CloudFlare caches `/api/*` responses

**Solution:**
1. Go to **Rules** → **Page Rules**
2. Create rule: `*ems.buffden.com/api/*`
3. Setting: **Cache Level** = "Bypass"
4. Save

---

## Emergency: Disable CloudFlare

If CloudFlare causes issues:

### Quick Disable (Gray Cloud)

1. Go to **DNS** settings
2. Click **orange cloud** next to your A record
3. It turns **gray** = CloudFlare disabled
4. Traffic goes directly to origin

### Permanent Removal

1. Log in to domain registrar
2. Change nameservers back to original
3. Wait 1-24 hours for propagation

---

## Next Steps

Once CloudFlare is set up:

1. ✅ **Monitor dashboard** for 24-48 hours
2. ✅ **Test all endpoints** to ensure they work through CloudFlare
3. ✅ **Configure firewall rules** based on traffic patterns
4. ✅ **Enable "Under Attack Mode"** if DDoS detected
5. ✅ **Set up email alerts** for security events

---

## Summary

**What You Get (Free):**
- ✅ DDoS protection (10+ Gbps)
- ✅ CDN with global caching
- ✅ Free SSL/TLS certificates
- ✅ Basic bot protection
- ✅ 5 firewall rules
- ✅ Traffic analytics

**What You Need to Buy:**
- ❌ Nothing! Free tier is perfect for projects

**Combined Protection:**
```
CloudFlare Free (edge DDoS, bot protection)
    ↓
Nginx Rate Limits (simple floods, connection limits)
    ↓
Redis Rate Limiting (distributed attacks, auth protection)
    ↓
Your Application (protected ✅)
```

**Total Monthly Cost:** **$0** 🎉

---

## Support & Resources

- **CloudFlare Docs:** https://developers.cloudflare.com/
- **Community Forum:** https://community.cloudflare.com/
- **Status Page:** https://www.cloudflarestatus.com/

**Need help?** CloudFlare support is available via email (even on free tier, for account issues)
