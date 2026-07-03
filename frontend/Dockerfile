# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

ARG VITE_STREAM_API_KEY
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_BACKEND_URL

ENV VITE_STREAM_API_KEY=$VITE_STREAM_API_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Increase Node heap to prevent OOM on low-RAM servers (t3.micro = 1GB)
ENV NODE_OPTIONS=--max_old_space_size=1536

RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
