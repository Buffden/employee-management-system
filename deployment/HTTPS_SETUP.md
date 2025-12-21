# HTTPS Setup with Let's Encrypt

This guide explains how to set up HTTPS for `ems.buffden.com` using Let's Encrypt.

## Prerequisites

1. **Domain DNS Configuration**
   - Point `ems.buffden.com` A record to your EC2 instance public IP: `100.25.10.178`
   - Wait for DNS propagation (can take a few minutes to hours)

2. **Verify DNS**
   ```bash
   dig ems.buffden.com
   # Should return: 100.25.10.178
   ```

3. **EC2 Security Group**
   - Ensure ports 80 and 443 are open:
     - Port 80: `0.0.0.0/0` (for HTTP and ACME challenge)
     - Port 443: `0.0.0.0/0` (for HTTPS)

## Quick Setup Steps

### 1. Update Environment Variables

Ensure `db/.env.production` has:
```bash
NGINX_SERVER_NAME=ems.buffden.com
SSL_ENABLED=true
CORS_ALLOWED_ORIGINS=https://ems.buffden.com
```

### 2. Deploy Application (HTTP first)

```bash
cd ~/employee-management-system/deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

Wait for services to be healthy:
```bash
docker-compose -f docker-compose.prod.yml ps
```

### 3. Obtain Let's Encrypt Certificate

**On EC2 instance**, run:
```bash
cd ~/employee-management-system/deployment
./init-letsencrypt.sh
```

This script will:
- Create a temporary self-signed certificate
- Start nginx with HTTPS config
- Request a real certificate from Let's Encrypt
- Reload nginx with the real certificate

### 4. Verify HTTPS

Visit: `https://ems.buffden.com`

You should see:
- ✅ Green padlock in browser
- ✅ No certificate warnings
- ✅ Application loads correctly

## Auto-Renewal

The `certbot` container automatically renews certificates every 12 hours. Certificates are valid for 90 days, so this ensures they're always fresh.

## Troubleshooting

### Certificate Request Fails

**Error: "Connection refused" or "Timeout"**
- Verify DNS is pointing to EC2: `dig ems.buffden.com`
- Check EC2 security group allows port 80 from internet
- Ensure gateway container is running: `docker ps`

**Error: "Invalid domain"**
- Wait for DNS propagation (can take up to 48 hours)
- Verify domain A record: `nslookup ems.buffden.com`

### Nginx Fails to Start

**Error: "SSL certificate not found"**
- Run `init-letsencrypt.sh` first to obtain certificates
- Check certificates exist: `docker exec ems-certbot ls -la /etc/letsencrypt/live/ems.buffden.com/`

### Certificate Expired

Certificates auto-renew, but if renewal fails:
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot renew --force-renewal
docker-compose -f docker-compose.prod.yml exec gateway nginx -s reload
```

## Manual Certificate Renewal

If needed, manually renew:
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot renew
docker-compose -f docker-compose.prod.yml exec gateway nginx -s reload
```

## Testing with Staging

To test without hitting Let's Encrypt rate limits, edit `init-letsencrypt.sh`:
```bash
STAGING=1  # Use Let's Encrypt staging environment
```

Then run the script. Staging certificates won't be trusted by browsers but are useful for testing.

## Security Notes

- Let's Encrypt certificates are free and valid for 90 days
- Auto-renewal runs every 12 hours (well before expiration)
- HSTS header is enabled (forces HTTPS for 1 year)
- Modern TLS only (TLS 1.2 and 1.3)

