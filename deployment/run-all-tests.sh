#!/bin/bash

# Run all rate limiting tests

echo "╔════════════════════════════════════════════╗"
echo "║   Rate Limiting Test Suite                 ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check if containers are running
if ! docker ps | grep -q ems-backend; then
  echo "❌ Error: Containers not running!"
  echo "Please run: docker compose up -d"
  exit 1
fi

echo "✅ Containers are running. Starting tests..."
echo ""
sleep 2

# Test 1: Redis Rate Limiting (Login)
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   TEST 1: Redis Login Rate Limiting       ║"
echo "╚════════════════════════════════════════════╝"
./test-redis-rate-limit.sh
sleep 3

# Test 2: Forgot Password Rate Limiting
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   TEST 2: Forgot Password Rate Limiting   ║"
echo "╚════════════════════════════════════════════╝"
./test-forgot-password-rate-limit.sh
sleep 3

# Test 3: Nginx Rate Limiting
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   TEST 3: Nginx Gateway Rate Limiting     ║"
echo "╚════════════════════════════════════════════╝"
./test-nginx-rate-limit.sh
sleep 2

# Check Redis Keys
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   Redis Keys & Memory Status              ║"
echo "╚════════════════════════════════════════════╝"
./check-redis-keys.sh

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   All Tests Complete!                      ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "To monitor real-time logs:"
echo "  ./monitor-logs.sh backend  # Backend rate limiter"
echo "  ./monitor-logs.sh nginx    # Nginx rate limits"
echo "  ./monitor-logs.sh all      # All containers"
