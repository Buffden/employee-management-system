# Frontend Dockerfile - Build only (no nginx)
# The gateway Dockerfile builds and serves the frontend with nginx
FROM node:18 AS build
WORKDIR /app

# Copy only essential files first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application and build the Angular app
COPY . .
RUN npm run build

# This is a build-only stage
# The built artifacts are used by the gateway Dockerfile
# No runtime stage needed - gateway handles serving
