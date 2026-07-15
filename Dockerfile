# syntax=docker/dockerfile:1

# =====================================
# DEPENDENCIES
# =====================================
FROM node:20-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# =====================================
# DATABASE MIGRATION IMAGE
# =====================================
FROM deps AS migrate

COPY prisma ./prisma
COPY prisma.config.ts ./

# Prisma Client generation only needs a syntactically valid URL here.
# The real runtime DATABASE_URL is injected by Docker Compose.
RUN DATABASE_URL="postgresql://postgres:postgres@postgres:5432/maskapai?schema=public" npx prisma generate

CMD ["npx", "prisma", "migrate", "deploy"]

# =====================================
# NEXT.JS BUILD
# =====================================
FROM deps AS builder

ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_RECAPTCHA_SITE_KEY=${NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=${NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Prevent Prisma generate / build-time imports from failing because .env
# is intentionally excluded from the Docker build context.
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/maskapai?schema=public"

COPY . .

RUN npx prisma generate
RUN npm run build

# =====================================
# PRODUCTION RUNTIME
# =====================================
FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
