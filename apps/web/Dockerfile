# ==============================================================================
# Gapji Digital Marketing Platform - Web Frontend Production Dockerfile
# Multi-stage production container for Next.js App Router
# ==============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json* ./packages/shared/

RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV INTERNAL_API_URL="http://api.railway.internal:3001/api"

# Build shared package first
RUN pnpm --filter @gapji/shared build

# Build Web Application
RUN pnpm --filter @gapji/web build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy root node_modules and monorepo structure to preserve all pnpm dependencies
COPY --chown=nextjs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/packages/shared ./packages/shared
COPY --chown=nextjs:nodejs --from=builder /app/apps/web ./apps/web
COPY --chown=nextjs:nodejs --from=builder /app/package.json ./package.json
COPY --chown=nextjs:nodejs --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --chown=nextjs:nodejs --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER nextjs

WORKDIR /app
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "--filter", "@gapji/web", "start"]
