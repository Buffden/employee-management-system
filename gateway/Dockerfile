# Multi-stage build: Build Angular app and serve with Nginx
FROM node:18 AS build
WORKDIR /app

# Copy frontend source
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

    # Copy unified nginx configuration (serves Angular + routes API)
    COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
