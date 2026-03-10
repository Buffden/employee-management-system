#!/bin/bash

# Check Redis rate limit keys and their values

echo "============================================"
echo "Redis Rate Limit Keys"
echo "============================================"
echo ""

echo "All rate limit keys:"
docker exec ems-redis redis-cli KEYS "rate_limit:*"
echo ""

echo "============================================"
echo "Login Rate Limit Details"
echo "============================================"
echo ""

# Get all login keys
login_keys=$(docker exec ems-redis redis-cli KEYS "rate_limit:login:*")

if [ -z "$login_keys" ]; then
  echo "No login rate limit keys found."
  echo "Run test-redis-rate-limit.sh first to create keys."
else
  for key in $login_keys; do
    echo "Key: $key"
    docker exec ems-redis redis-cli HGETALL "$key"
    echo ""
  done
fi

echo "============================================"
echo "Forgot Password Rate Limit Details"
echo "============================================"
echo ""

# Get all forgot password keys
forgot_keys=$(docker exec ems-redis redis-cli KEYS "rate_limit:forgot_password:*")

if [ -z "$forgot_keys" ]; then
  echo "No forgot password rate limit keys found."
else
  for key in $forgot_keys; do
    echo "Key: $key"
    docker exec ems-redis redis-cli HGETALL "$key"
    echo ""
  done
fi

echo "============================================"
echo "Redis Memory Info"
echo "============================================"
echo ""
docker exec ems-redis redis-cli INFO memory | grep -E "used_memory_human|maxmemory_human"
echo ""

echo "============================================"
echo "Total Keys in Redis"
echo "============================================"
docker exec ems-redis redis-cli DBSIZE
