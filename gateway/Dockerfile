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

# Remove default nginx entrypoint scripts (CRITICAL - disables template logic)
RUN rm -rf /docker-entrypoint.d

# Copy built Angular app (browser files only - SSR creates browser/ subdirectory)
COPY --from=build /app/dist/employee-management-system-gui/browser /usr/share/nginx/html

# Angular SSR builds index.csr.html as the main entry point, copy it to index.html
RUN if [ -f /usr/share/nginx/html/index.csr.html ]; then \
        cp /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html; \
    fi

# Copy static nginx configuration (production by default, local if BUILD_ENV=local)
# Build complete nginx.conf to bypass template scanning entirely
ARG BUILD_ENV=production
COPY gateway/nginx/nginx.${BUILD_ENV}.conf /tmp/server-blocks.conf
# Create complete nginx.conf with minimal structure + our server blocks
RUN echo 'user nginx;' > /etc/nginx/nginx.conf && \
    echo 'worker_processes auto;' >> /etc/nginx/nginx.conf && \
    echo 'error_log /var/log/nginx/error.log warn;' >> /etc/nginx/nginx.conf && \
    echo 'pid /var/run/nginx.pid;' >> /etc/nginx/nginx.conf && \
    echo 'events { worker_connections 1024; }' >> /etc/nginx/nginx.conf && \
    echo 'http {' >> /etc/nginx/nginx.conf && \
    echo '  include /etc/nginx/mime.types;' >> /etc/nginx/nginx.conf && \
    echo '  default_type application/octet-stream;' >> /etc/nginx/nginx.conf && \
    echo '  sendfile on;' >> /etc/nginx/nginx.conf && \
    echo '  keepalive_timeout 65;' >> /etc/nginx/nginx.conf && \
    cat /tmp/server-blocks.conf >> /etc/nginx/nginx.conf && \
    echo '}' >> /etc/nginx/nginx.conf && \
    rm /tmp/server-blocks.conf

# Health check (uses port 80 for health check, works for both HTTP and HTTPS)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80 443

# Explicit command - bypasses default entrypoint behavior completely
CMD ["nginx", "-g", "daemon off;"]
