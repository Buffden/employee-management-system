# Cloudflare Worker Fallback — EMS Offline Page

**Status:** Deployed ✅
**Applies to:** EMS production domain (ems-prod-app EC2, us-east-1e)

---

## Why Cloudflare Worker (not CloudFront)

Cloudflare is already the DNS authority and reverse proxy for the production domain. Adding CloudFront behind it would create double-proxying with SSL chain complications. The Worker sits in the correct layer — at the Cloudflare edge — without touching any AWS infrastructure.

---

## Architecture

```text
Visitor
  ↓
Cloudflare Worker  (route: production domain /*)
  ├── origin healthy  →  pass through to EC2 → Nginx → app
  └── origin 5xx / timeout  →  serve branded offline page
```

No DNS changes. No AWS changes. Cloudflare already handles HTTPS.

---

## What Was Built

| Component | Location |
| --- | --- |
| Worker entry point | `cloudflare/ems-worker/src/index.js` |
| Offline page markup | `cloudflare/ems-worker/src/offline.html` |
| Offline page styles | `cloudflare/ems-worker/src/offline.css` |
| Worker config + route | `cloudflare/ems-worker/wrangler.toml` |
| CI/CD deployment | `.github/workflows/deploy-cloudflare-worker.yml` |

The Worker proxies all requests to the EC2 origin. On any 5xx or connection failure (EC2 stopped), it injects the CSS inline into the HTML and serves a branded maintenance page. Auto-recovers when the EC2 restarts — no manual intervention needed.

---

## Redeploying Manually

```bash
cd cloudflare/ems-worker
npx wrangler deploy
```

Or trigger the **Deploy Cloudflare Worker** workflow from the GitHub Actions tab.

The GitHub Actions workflow runs automatically on any push to `main` that touches `cloudflare/ems-worker/**`. Requires `CLOUDFLARE_API_TOKEN` secret in repo settings.

---

## Cost

All within Cloudflare's free tier (100k requests/day). No additional AWS cost.

---