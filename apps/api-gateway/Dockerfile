FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy this service
COPY apps/api-gateway ./apps/api-gateway

# Install all dependencies
RUN pnpm install --filter @ai-coach/api-gateway... --frozen-lockfile || pnpm install --filter @ai-coach/api-gateway...

# Build the service
RUN pnpm --filter @ai-coach/api-gateway build

# Deploy (creates standalone node_modules)
RUN pnpm --filter @ai-coach/api-gateway deploy --prod /app/deploy

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/deploy/dist ./dist
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/deploy/package.json ./
EXPOSE 3001
CMD ["node", "dist/main"]
