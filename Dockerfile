# syntax=docker/dockerfile:1
# Multi-stage build Next.js 16 (output: standalone) untuk AngkaSara — PRODUKSI PostgreSQL.
# Stage `builder` dipakai ulang oleh service `migrate` & `seed` di docker-compose
# (punya Prisma CLI + tsx + prisma/data), sedangkan `runner` adalah image aplikasi ramping.

# ---------- deps: install dependency (termasuk devDependencies utk build/seed) ----------
FROM node:24-alpine AS deps
WORKDIR /app
# libc6-compat: kompatibilitas beberapa modul native di Alpine
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder: generate Prisma client (Postgres) + build Next ----------
FROM node:24-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Client Prisma untuk PRODUKSI = schema PostgreSQL (prisma/postgres/schema.prisma).
# URL palsu hanya utk resolusi env() saat generate; tak ada koneksi DB di tahap ini.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    npx prisma generate --config prisma/postgres/prisma.config.ts
RUN npm run build

# ---------- runner: image aplikasi (hanya artefak standalone) ----------
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# Aset publik + output standalone (server.js + node_modules terpangkas) + static.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
# Migrasi DB dijalankan service `migrate` (compose) SEBELUM app start — di sini cukup serve.
CMD ["node", "server.js"]
