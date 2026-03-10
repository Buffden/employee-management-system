#!/bin/bash

# Test Forgot Password Rate Limiting
# Expected: 5 attempts allowed, then rate limited

echo "============================================"
echo "Testing Forgot Password Rate Limiting"
echo "Allowed: 5 attempts per email"
echo "============================================"
echo ""

email="test@example.com"

for i in {1..7}; do 
  echo "Request $i:"
  response=$(curl -s -X POST http://localhost/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\"}" \
    -w "\nHTTP_CODE:%{http_code}")
  
  # Extract HTTP code
  http_code=$(echo "$response" | grep -oP 'HTTP_CODE:\K\d+')
  body=$(echo "$response" | sed 's/HTTP_CODE:[0-9]*//')
  
  echo "  Status: $http_code"
  echo "  Response: $body"
  
  if [ "$http_code" = "429" ]; then
    echo "  ✅ Rate limit triggered!"
  elif [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo "  ✓ Request processed (rate limit not hit yet)"
  fi
  
  echo ""
  sleep 1
done

echo "============================================"
echo "Test Complete!"
echo "Expected: Requests 1-5 return 200/404"
echo "          Requests 6-7 return 429"
echo "============================================"
