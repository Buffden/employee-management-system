# EMS Certificate Migration — Let's Encrypt to Cloudflare Origin Certificate

**Created:** 2026-04-02
**Status:** In progress — EIP assigned, cert migration pending
**Urgency:** Current Let's Encrypt cert expires **May 20, 2026** (47 days)

---

## Why Migrate

### Current setup (Let's Encrypt via Certbot)

```
Browser → Cloudflare (proxy) → EC2 Nginx → Spring Boot
                                   ↑
                            Certbot cert
                            expires every 90 days
                            renewal via HTTP-01 challenge
```

**Problems with this setup:**

- Certbot renews via HTTP-01 challenge, which requires `ems.buffden.com` in Cloudflare DNS
  to point to the correct EC2 IP at renewal time
- EMS uses an **auto-assigned IP** that changes every time the instance stops and starts
- If the instance restarts (manually, via night scheduler, or EC2 maintenance) and Cloudflare
  DNS is not updated before the next renewal window, **the cert expires silently**
- Certbot runs as a separate Docker container, consuming ~30–50 MB RAM on an already-tight
  1 GB instance

### Target setup (Cloudflare Origin Certificate)

```
Browser → Cloudflare (proxy) → EC2 Nginx → Spring Boot
                                   ↑
                          Cloudflare Origin Cert
                          valid for 15 years
                          no renewal, no IP dependency
```

**Benefits:**

- **15-year validity** — never touch the cert again
- **Not IP-sensitive** — cert is valid regardless of what IP the EC2 has
- **Free** — Cloudflare issues it at no cost
- **Works with Full (Strict) SSL mode** — same security level as Let's Encrypt
- **One less Docker container** — remove `ems-certbot`, recover ~30–50 MB RAM
- Only trusted by Cloudflare's proxy (not by browsers directly) — this is fine because
  all traffic already routes through Cloudflare since it holds the nameservers

---

## Current State

| Property | Value |
| --- | --- |
| EC2 instance | ems-prod-app (t2.micro, us-east-1e) |
| **EIP** | **54.209.168.238** ✅ assigned 2026-04-02 |
| Cert issuer | Let's Encrypt (E8) |
| Domain | ems.buffden.com |
| Valid from | Feb 19, 2026 |
| Expires | **May 20, 2026** |
| Cert path on EC2 | `/etc/letsencrypt/live/ems.buffden.com/fullchain.pem` |
| Key path on EC2 | `/etc/letsencrypt/live/ems.buffden.com/privkey.pem` |
| Certbot container | `ems-certbot` (running, consuming RAM) |
| Cloudflare SSL mode | Full (Strict) — must stay this way |
| Cloudflare DNS (pending) | Update `ems` A record → `54.209.168.238` |

---

## ACM — Why Not

You already have a `*.buffden.com` ACM wildcard cert (used by the TinyURL ALB and CloudFront).
It technically covers `ems.buffden.com` but **ACM certs cannot be installed on EC2 instances** —
they only work with AWS-managed TLS terminators (ALB, CloudFront, API Gateway).

To use ACM for EMS you would need to put an ALB in front of it. An ALB costs ~$14/month.
That is not worth it for a single EC2.

---

## Also Recommended — Assign an EIP to EMS

EMS currently has an auto-assigned public IP (`52.87.255.254` as of 2026-04-02) that changes
on every stop/start.

Assigning an Elastic IP costs **$3.65/month** — the **exact same price** as the auto-IP you are
already paying for. Net additional cost = **$0**.

Benefits:
- Cloudflare DNS record `ems.buffden.com` never needs updating after a restart
- No risk of the instance being unreachable after the night scheduler stops and starts it

**✅ DONE 2026-04-02** — EIP allocated and associated with EMS instance.

The old auto-assigned IP was released automatically on association.

**Action still required:** Update Cloudflare DNS `ems` A record from the old IP to `54.209.168.238`.
Go to Cloudflare Dashboard → `buffden.com` → DNS → edit the `ems` A record.

---

## Migration Steps

### Step 1 — Generate Cloudflare Origin Certificate

1. Log into [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **buffden.com**
3. Go to **SSL/TLS** → **Origin Server**
4. Click **Create Certificate**
5. Settings:
   - **Hostnames:** `ems.buffden.com` (or `*.buffden.com` to cover all subdomains)
   - **Certificate validity:** 15 years
   - **Key type:** RSA (2048)
6. Click **Create**
7. **Copy and save both values immediately** — Cloudflare shows the private key only once:
   - **Origin Certificate** → save as `cloudflare-origin.pem`
   - **Private Key** → save as `cloudflare-origin.key`

> The Cloudflare Root CA used to sign Origin Certificates is at
> `https://developers.cloudflare.com/ssl/static/origin_ca_rsa_root.pem`
> — download it too, you will need it for the Nginx cert chain.

---

### Step 2 — Upload Cert Files to the EC2

Use SSM Session Manager (no SSH key needed):

```bash
# Start an SSM session
aws ssm start-session --target <your-ec2-instance-id>
```

Inside the session:

```bash
sudo mkdir -p /etc/ssl/cloudflare

# Paste the certificate content
sudo tee /etc/ssl/cloudflare/ems.pem << 'EOF'
-----BEGIN CERTIFICATE-----
<paste cloudflare-origin.pem content here>
-----END CERTIFICATE-----
EOF

# Paste the Cloudflare Root CA (for full chain)
sudo tee -a /etc/ssl/cloudflare/ems.pem << 'EOF'
-----BEGIN CERTIFICATE-----
<paste origin_ca_rsa_root.pem content here>
-----END CERTIFICATE-----
EOF

# Paste the private key
sudo tee /etc/ssl/cloudflare/ems.key << 'EOF'
-----BEGIN PRIVATE KEY-----
<paste cloudflare-origin.key content here>
-----END PRIVATE KEY-----
EOF

# Lock down permissions
sudo chmod 600 /etc/ssl/cloudflare/ems.key
sudo chmod 644 /etc/ssl/cloudflare/ems.pem
```

---

### Step 3 — Update Nginx Config

Find the Nginx config file used by the `ems-gateway` container. Based on the project structure
it is likely mounted from the host at a path like `~/ems/gateway/nginx/nginx.conf` or similar.

Locate the SSL cert lines and replace:

```nginx
# Before (Let's Encrypt via Certbot)
ssl_certificate     /etc/letsencrypt/live/ems.buffden.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/ems.buffden.com/privkey.pem;
```

```nginx
# After (Cloudflare Origin Certificate)
ssl_certificate     /etc/ssl/cloudflare/ems.pem;
ssl_certificate_key /etc/ssl/cloudflare/ems.key;
```

The `/etc/ssl/cloudflare/` directory on the host must be mounted into the Nginx container.
Add it to the `ems-gateway` volumes in `docker-compose.yml`:

```yaml
services:
  ems-gateway:
    volumes:
      - /etc/ssl/cloudflare:/etc/ssl/cloudflare:ro
      # ... existing volumes
```

---

### Step 4 — Test Before Switching

Reload Nginx without restarting the container to validate the config first:

```bash
# Test config syntax
docker exec ems-gateway nginx -t

# If OK, reload gracefully (zero downtime)
docker exec ems-gateway nginx -s reload
```

Then verify:

```bash
# Check what cert is now being served
echo | openssl s_client -connect localhost:443 -servername ems.buffden.com 2>/dev/null \
  | openssl x509 -noout -issuer -subject -dates

# Expected issuer: O=Cloudflare, Inc.
```

Also test from your browser: `https://ems.buffden.com` should load with a padlock.

---

### Step 5 — Remove the Certbot Container

Once the Cloudflare cert is confirmed working:

1. Remove `ems-certbot` from `docker-compose.yml`
2. Bring the stack down and back up:

```bash
docker compose down
docker compose up -d
```

3. Verify all four remaining containers are healthy:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected output:

```
NAMES          STATUS
ems-gateway    Up X minutes (healthy)
ems-backend    Up X minutes (healthy)
ems-postgres   Up X minutes (healthy)
ems-redis      Up X minutes (healthy)
```

---

### Step 6 — Clean Up Route 53 (Optional)

The Route 53 A record for `ems.buffden.com` is dead config — Cloudflare is the authoritative
DNS and Route 53 records for this domain are never queried. Safe to delete:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id <your-hosted-zone-id> \
  --change-batch '{
    "Changes": [{
      "Action": "DELETE",
      "ResourceRecordSet": {
        "Name": "ems.buffden.com.",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "<old-ip>"}]
      }
    }]
  }'
```

---

## Cloudflare SSL Mode — Must Stay on Full (Strict)

| Mode | Cloudflare → Browser | Cloudflare → Origin | Origin cert required |
| --- | --- | --- | --- |
| Flexible | HTTPS | HTTP | No |
| Full | HTTPS | HTTPS | Any (self-signed OK) |
| **Full (Strict)** | **HTTPS** | **HTTPS** | **Valid cert only** |

Keep it on **Full (Strict)**. The Cloudflare Origin Certificate satisfies this requirement.
Downgrading to Flexible would send traffic from Cloudflare to the EC2 over plain HTTP —
avoid this since the backend handles login credentials and JWT tokens.

---

## Rollback Plan

If anything goes wrong, revert Nginx to the Let's Encrypt cert:

```bash
# In Nginx config, restore:
ssl_certificate     /etc/letsencrypt/live/ems.buffden.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/ems.buffden.com/privkey.pem;

# Reload Nginx
docker exec ems-gateway nginx -s reload
```

The Let's Encrypt cert is still on the instance until you explicitly delete it.
Do not delete it until the Cloudflare cert has been stable for at least a few days.

---

## Post-Migration Checklist

- [ ] Cloudflare Origin Certificate generated (15-year validity)
- [ ] Cert and key uploaded to `/etc/ssl/cloudflare/` on EC2
- [ ] Nginx config updated to use new cert paths
- [ ] `/etc/ssl/cloudflare` volume mounted in `ems-gateway` container
- [ ] `nginx -t` passes, `nginx -s reload` applied
- [ ] `https://ems.buffden.com` loads correctly in browser
- [ ] `ems-certbot` container removed from `docker-compose.yml`
- [x] EIP assigned to EMS instance ✅ 2026-04-02
- [ ] Cloudflare DNS A record updated to `54.209.168.238`
- [ ] Route 53 stale A record deleted (optional cleanup)
