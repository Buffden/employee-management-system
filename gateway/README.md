# API Gateway

This folder contains the unified Gateway service that serves both the Angular frontend and routes API requests.

## Overview

The Gateway is implemented using **Nginx** and serves as:
- **Frontend Server**: Serves the Angular application (SPA)
- **API Gateway**: Routes `/api/*` requests to backend services
- **Single Entry Point**: Only service exposed to the host (port 80)

## Features

- **Unified Service**: Serves Angular app AND routes API requests
- **Request Routing**: Routes `/api/*` requests directly to backend
- **CORS Handling**: Manages Cross-Origin Resource Sharing
- **Health Checks**: Provides health check endpoint at `/health`
- **Performance**: Gzip compression, static asset caching
- **SPA Support**: Handles Angular routing with `try_files`

## Architecture

```
Host (Port 80) → Gateway (Nginx)
                ├── / → Serves Angular app
                └── /api → Proxies to Backend
```

## Configuration

The unified configuration is in `nginx.conf`. It:
- Serves Angular static files from `/usr/share/nginx/html`
- Routes `/api` requests directly to `backend:8080`
- Handles CORS headers for API requests
- Provides health check at `/health`
- Optimizes with gzip compression and caching

## Docker

The gateway runs as a Docker container with a multi-stage build:
1. **Build Stage**: Builds Angular app using Node.js
2. **Runtime Stage**: Serves app with Nginx

The gateway is included in the main `docker-compose.yml` in the deployment folder.

## Port

- **Gateway**: Port 80 (exposed to host)
- **Backend**: Internal only (accessed via gateway)

## Benefits

✅ **Simplified Architecture**: One service instead of two (frontend + gateway)  
✅ **Reduced Latency**: Direct API routing (no double proxy)  
✅ **Single Entry Point**: Only gateway exposed to host  
✅ **Better Performance**: Unified nginx configuration

