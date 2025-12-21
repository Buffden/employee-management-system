#!/bin/bash
# Initialize Let's Encrypt certificates for ems.buffden.com
# Run this script ONCE to obtain initial certificates

set -e

DOMAIN="ems.buffden.com"
EMAIL="ems.buffden@gmail.com"  # Change to your email
STAGING=0  # Set to 1 if you want to use Let's Encrypt staging (for testing)

if [ -d "certbot" ]; then
  read -p "Existing certbot directory found. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit
  fi
fi

if [ ! -e "./certbot/conf/letsencrypt.ini" ]; then
  echo "### Creating dummy certificate for $DOMAIN ..."
  mkdir -p "./certbot/conf/live/$DOMAIN"
  docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:2048 -days 1\
      -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem' \
      -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem' \
      -subj '/CN=localhost'" certbot
  echo
fi

echo "### Starting nginx ..."
docker-compose -f docker-compose.prod.yml up --force-recreate -d gateway

echo "### Deleting dummy certificate for $DOMAIN ..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$DOMAIN && \
  rm -Rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -Rf /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

echo "### Requesting Let's Encrypt certificate for $DOMAIN ..."
# Join $DOMAIN to domains args
domain_args=""
for domain in "$DOMAIN"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$EMAIL" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $EMAIL" ;;
esac

# Enable staging mode if needed
if [ $STAGING != "0" ]; then staging_arg="--staging"; fi

docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal" certbot

echo "### Reloading nginx ..."
docker-compose -f docker-compose.prod.yml exec gateway nginx -s reload

echo "### Certificate obtained! Your site should now be available at https://$DOMAIN"
echo "### Certificates will auto-renew via the certbot container"

