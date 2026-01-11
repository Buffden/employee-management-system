#!/bin/bash

# Test Redis Rate Limiting (Application Layer)
# Expected: First 10 requests succeed (401 auth error), requests 11-12 return 429 rate limit

echo "============================================"
echo "Testing Redis Rate Limiting (Layer 2)"
echo "Login endpoint: 10 attempts allowed"
echo "============================================"
echo ""

for i in {1..12}; do 
  echo "Request $i:"
  response=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test@example.com","password":"wrongpassword"}' \
    -w "\nHTTP_CODE:%{http_code}")
  
  # Extract HTTP code
  http_code=$(echo "$response" | grep -oP 'HTTP_CODE:\K\d+')
  body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*//')
  
  echo "  Status: $http_code"
  echo "  Response: $body"
  
  if [ "$http_code" = "429" ]; then
    echo "  ✅ Rate limit triggered!"
  elif [ "$http_code" = "401" ] || [ "$http_code" = "400" ]; then
    echo "  ✓ Auth rejected (rate limit not hit yet)"
  fi
  
  echo ""
  sleep 0.5
done

echo "============================================"
echo "Test Complete!"
echo "Expected: Requests 1-10 return 401/400"
echo "          Requests 11-12 return 429"
echo "============================================"
