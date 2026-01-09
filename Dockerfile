FROM node:20-slim AS base
ENV NEXT_TELEMETRY_DISABLED 1

FROM base AS deps
RUN apt-get update && apt-get install -y python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install curl and wget for healthchecks/scripts
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create directory for sqlite db
RUN mkdir -p /app/data
RUN chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV DB_PATH "/app/data/cba.db"

CMD ["node", "server.js"]
