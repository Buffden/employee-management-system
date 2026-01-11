#!/bin/bash

# Monitor logs from all containers for rate limiting events

echo "============================================"
echo "Monitoring Rate Limiting Logs"
echo "Press Ctrl+C to stop"
echo "============================================"
echo ""

# Check what the user wants to monitor
if [ "$1" = "backend" ]; then
  echo "Monitoring backend logs for rate limit events..."
  docker logs ems-backend --tail 50 -f | grep -i --color=always -E "rate|429|limit"
  
elif [ "$1" = "nginx" ] || [ "$1" = "gateway" ]; then
  echo "Monitoring nginx logs for rate limit events..."
  docker logs ems-gateway --tail 50 -f | grep -E "limiting requests|429"
  
elif [ "$1" = "redis" ]; then
  echo "Monitoring Redis logs..."
  docker logs ems-redis --tail 50 -f
  
elif [ "$1" = "all" ]; then
  echo "Monitoring all container logs (rate limit related)..."
  docker compose logs --tail 50 -f | grep -i --color=always -E "rate|429|limit|redis"
  
else
  echo "Usage: ./monitor-logs.sh [backend|nginx|redis|all]"
  echo ""
  echo "Examples:"
  echo "  ./monitor-logs.sh backend  # Monitor backend rate limiter"
  echo "  ./monitor-logs.sh nginx    # Monitor nginx rate limits"
  echo "  ./monitor-logs.sh redis    # Monitor Redis logs"
  echo "  ./monitor-logs.sh all      # Monitor all logs"
  echo ""
  echo "Starting backend monitoring by default..."
  sleep 2
  docker logs ems-backend --tail 50 -f | grep -i --color=always -E "rate|429|limit"
fi
