#!/bin/sh
# Entrypoint script to select nginx template based on SSL_ENABLED

set -e

# Default to HTTP if SSL_ENABLED is not set
SSL_ENABLED=${SSL_ENABLED:-false}

if [ "$SSL_ENABLED" = "true" ]; then
    echo "SSL enabled - using HTTPS template"
    # Copy HTTPS template to default.conf.template
    cp /etc/nginx/templates/nginx-https.conf.template /etc/nginx/templates/default.conf.template
else
    echo "SSL disabled - using HTTP template"
    # Copy HTTP template to default.conf.template
    cp /etc/nginx/templates/nginx-http.conf.template /etc/nginx/templates/default.conf.template
fi

# Call the original nginx entrypoint which processes templates and starts nginx
# The original entrypoint is at /docker-entrypoint.sh in nginx:alpine
exec /docker-entrypoint.sh "$@"

