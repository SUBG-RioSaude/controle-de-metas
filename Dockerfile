FROM node:22-alpine AS base

# ── Dependências ──────────────────────────────────────────────────────────────
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── Build ─────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Receber variáveis no momento do build
ARG NEXT_PUBLIC_AUTH_API
ARG NEXT_PUBLIC_METAS_API
ARG NEXT_PUBLIC_SUPPORT_API
ARG NEXT_PUBLIC_SYSTEMS_API
ARG NEXT_PUBLIC_SYSTEM_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_DISCORD_CATEGORY_ID

ENV NEXT_PUBLIC_AUTH_API=$NEXT_PUBLIC_AUTH_API
ENV NEXT_PUBLIC_METAS_API=$NEXT_PUBLIC_METAS_API
ENV NEXT_PUBLIC_SUPPORT_API=$NEXT_PUBLIC_SUPPORT_API
ENV NEXT_PUBLIC_SYSTEMS_API=$NEXT_PUBLIC_SYSTEMS_API
ENV NEXT_PUBLIC_SYSTEM_ID=$NEXT_PUBLIC_SYSTEM_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_DISCORD_CATEGORY_ID=$NEXT_PUBLIC_DISCORD_CATEGORY_ID

RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
