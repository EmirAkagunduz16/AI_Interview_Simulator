FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy shared packages
COPY packages/shared-types ./packages/shared-types
COPY packages/kafka-client ./packages/kafka-client

# Copy this service
COPY apps/auth-service ./apps/auth-service

# Install all dependencies
RUN pnpm install --filter @ai-coach/auth-service... --frozen-lockfile || pnpm install --filter @ai-coach/auth-service...

# Build shared packages first
RUN pnpm --filter @ai-coach/shared-types build
RUN pnpm --filter @ai-coach/kafka-client build

# Build the service
RUN pnpm --filter @ai-coach/auth-service build

# Deploy (creates standalone node_modules)
RUN pnpm --filter @ai-coach/auth-service deploy --prod /app/deploy

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/deploy/dist ./dist
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/deploy/package.json ./
EXPOSE 3002
CMD ["node", "dist/main"]
