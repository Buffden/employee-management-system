#!/bin/bash

# Test Nginx Rate Limiting (Gateway Layer)
# Expected: Nginx limits to 10 requests per minute for auth endpoints

echo "============================================"
echo "Testing Nginx Rate Limiting (Layer 1)"
echo "Auth endpoint: 10 req/min allowed"
echo "============================================"
echo ""

success_count=0
rate_limited_count=0

for i in {1..15}; do 
  http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}')
  
  echo "Request $i: HTTP $http_code"
  
  if [ "$http_code" = "429" ]; then
    ((rate_limited_count++))
    echo "  ✅ Nginx rate limit triggered!"
  else
    ((success_count++))
  fi
  
  sleep 0.3
done

echo ""
echo "============================================"
echo "Results:"
echo "  Successful requests: $success_count"
echo "  Rate limited (429): $rate_limited_count"
echo "============================================"
echo ""
echo "Expected: ~10-12 successful, 3-5 rate limited"
