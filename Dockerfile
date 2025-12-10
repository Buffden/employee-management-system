# Use Node.js 18 as the base image for the build process
FROM node:18 AS build
WORKDIR /app

# Copy only essential files first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application and build the Angular app
COPY . .
RUN npm run build

# Use a lightweight server to serve the app
FROM nginx:alpine
COPY --from=build /app/dist/employee-management-system-gui /usr/share/nginx/html

# Add a health check to monitor the app
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:80 || exit 1

# Expose port 80
EXPOSE 80

# Start the NGINX server
CMD ["nginx", "-g", "daemon off;"]
