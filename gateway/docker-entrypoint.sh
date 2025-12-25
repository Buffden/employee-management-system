#!/bin/sh
# Entrypoint script to select nginx template based on SSL_ENABLED

set -e

# Default to HTTP if SSL_ENABLED is not set
SSL_ENABLED=${SSL_ENABLED:-false}

if [ "$SSL_ENABLED" = "true" ]; then
    echo "SSL enabled - using HTTPS template"
    # Remove HTTP template to avoid duplicate upstream definitions
    rm -f /etc/nginx/templates/nginx-http.conf.template
    # Copy HTTPS template to default.conf.template
    if [ -f /etc/nginx/templates/nginx-https.conf.template ]; then
        cp /etc/nginx/templates/nginx-https.conf.template /etc/nginx/templates/default.conf.template
        # Remove the source template to avoid processing it twice
        rm -f /etc/nginx/templates/nginx-https.conf.template
    else
        echo "Error: /etc/nginx/templates/nginx-https.conf.template not found. Please rebuild the Docker image."
        exit 1
    fi
else
    echo "SSL disabled - using HTTP template"
    # Remove HTTPS template to avoid duplicate upstream definitions
    rm -f /etc/nginx/templates/nginx-https.conf.template
    # Copy HTTP template to default.conf.template
    if [ -f /etc/nginx/templates/nginx-http.conf.template ]; then
        cp /etc/nginx/templates/nginx-http.conf.template /etc/nginx/templates/default.conf.template
        # Remove the source template to avoid processing it twice
        rm -f /etc/nginx/templates/nginx-http.conf.template
    else
        echo "Error: /etc/nginx/templates/nginx-http.conf.template not found. Please rebuild the Docker image."
        exit 1
    fi
fi

# Call the original nginx entrypoint which processes templates and starts nginx
# The original entrypoint is at /docker-entrypoint.sh in nginx:alpine
exec /docker-entrypoint.sh "$@"

