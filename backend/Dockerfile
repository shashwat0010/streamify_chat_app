# Stage 1: Build dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

# Stage 2: Production runtime image
FROM node:20-slim
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
EXPOSE 5001
ENV NODE_ENV=production
CMD ["node", "src/server.js"]
