# ==============================================================================
# Gapji Digital Marketing Platform - API Production Dockerfile
# Multi-stage production container with security hardening (non-root execution)
# ==============================================================================

# Stage 1: Base & Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json* ./packages/shared/

RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Build shared package
RUN pnpm --filter @gapji/shared build

# Generate Prisma Client
RUN pnpm --filter @gapji/api run prisma:generate

# Build NestJS Application
RUN pnpm --filter @gapji/api build

# Stage 3: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache dumb-init openssl

# Security: run as non-root user
USER node

# Copy root node_modules and monorepo structure to preserve all pnpm dependencies
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/packages/shared ./packages/shared
COPY --chown=node:node --from=builder /app/apps/api ./apps/api
COPY --chown=node:node --from=builder /app/package.json ./package.json

WORKDIR /app/apps/api
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "-e", "const fs = require('fs'); const entry = fs.existsSync('dist/src/main.js') ? 'dist/src/main.js' : 'dist/main.js'; require('./' + entry);"]
