# Stage 1: Build the application
FROM node:20-alpine AS build
WORKDIR /app

# 1. Install dependencies only when package files change
# Using npm ci for faster, predictable builds in CI/Docker
COPY package*.json ./
RUN npm install --quiet

# 2. Copy the rest of the application source
COPY . .

# 3. Generate production build (adjust command if using 'npm run build:prod')
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy custom nginx configuration to handle SPA routing
COPY backend/nginx.conf /etc/nginx/conf.d/default.conf

# 4. Clean default static assets and copy build output
# Note: Change '/app/dist' to '/app/build' if your framework uses that folder
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]