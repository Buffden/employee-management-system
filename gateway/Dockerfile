# Multi-stage build: Build Angular app and serve with Nginx
FROM node:18 AS build
WORKDIR /app

# Copy frontend source (build context is root directory)
COPY frontend/package*.json ./
RUN npm install

COPY frontend ./
RUN npm run build

# Runtime stage: Nginx with Angular app
FROM nginx:alpine

# Copy built Angular app (browser files only - SSR creates browser/ subdirectory)
COPY --from=build /app/dist/employee-management-system-gui/browser /usr/share/nginx/html

# Angular SSR builds index.csr.html as the main entry point, copy it to index.html
RUN if [ -f /usr/share/nginx/html/index.csr.html ]; then \
        cp /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html; \
    fi

# Copy nginx configuration to templates directory
# nginx:alpine automatically processes .template files in /etc/nginx/templates/
# We copy nginx.conf and rename it to .template so nginx processes it at startup
COPY gateway/nginx.conf /etc/nginx/templates/default.conf.template

# Environment variables (must be set in docker-compose or db/.env):
# - NGINX_PORT
# - NGINX_SERVER_NAME
# - BACKEND_HOST
# - BACKEND_PORT
# - CORS_ALLOWED_ORIGINS

# Health check (uses NGINX_PORT environment variable)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:${NGINX_PORT}/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
