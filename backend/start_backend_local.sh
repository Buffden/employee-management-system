#!/bin/bash

# Load env vars and start backend for local dev (skips tests)
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "Environment variables loaded successfully"
else
    echo "Error: .env file not found"
    exit 1
fi
./mvnw spring-boot:run -DskipTests