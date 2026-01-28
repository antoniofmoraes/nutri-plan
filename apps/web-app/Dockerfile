# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arg for API URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage - nginx
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
