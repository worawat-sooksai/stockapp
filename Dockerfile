# syntax=docker/dockerfile:1

# ---------- base: node + pnpm ----------
FROM node:22-alpine AS base
RUN npm install -g pnpm@11
WORKDIR /app


# ---------- deps: ติดตั้ง dependency ทั้งหมด (รวม dev) ----------
FROM base AS deps
# prisma.config.ts + prisma/ ต้องมีก่อน install เพราะ postinstall รัน `prisma generate`
# pnpm-workspace.yaml จำเป็นสำหรับ allowBuilds gate ของ pnpm 11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile


# ---------- builder: prisma generate + next build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# generate client ซ้ำอีกครั้ง — src/generated/prisma ถูก gitignore/dockerignore
# จึงไม่ติดมากับ COPY . . ข้างบน
RUN pnpm prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
# lib/prisma.ts throw ตอน import ถ้าไม่มี DATABASE_URL และ Next ต้อง import ทุก route
# ตอน "Collecting page data" → ต้องมีค่าหลอกไว้ให้ผ่าน build
# ไม่มีการต่อ DB จริง เพราะทุกหน้าเป็น force-dynamic (ไม่ render ตอน build)
# ค่าจริงส่งตอน runtime ผ่าน env ของ container
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"

# NEXT_PUBLIC_* ถูก inline เข้า client bundle ตอน build — ส่งตอน runtime ไม่มีผล
# lib/auth-client.ts ใช้ค่านี้ จึงต้องรับเป็น build arg
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

RUN pnpm build


# ---------- migrator: รัน migrate + seed แล้วจบ ----------
# ต่อยอดจาก deps (มี prisma CLI, tsx, schema, generated client ครบ)
# ไม่ใช้ runner เพราะ standalone ไม่มี prisma CLI / prisma/ / tsx
FROM deps AS migrator
COPY tsconfig.json ./
# RUN_SEED=false เพื่อข้าม seed (prisma/seed.ts ลบข้อมูลเดิมทั้งหมดก่อน insert)
ENV RUN_SEED=false
CMD ["sh", "-c", "pnpm prisma migrate deploy && if [ \"$RUN_SEED\" = \"true\" ]; then pnpm db:seed; else echo 'ข้าม seed (RUN_SEED != true)'; fi"]


# ---------- runner: production image ----------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# non-root user
RUN addgroup -g 1001 -S nodejs \
  && adduser -u 1001 -S nextjs -G nodejs

# standalone มี server.js + node_modules ที่ traced มาแล้ว
# (Prisma client generate เป็น TypeScript ใน src/generated/prisma → ถูก bundle เข้า build ไปแล้ว
#  และใช้ driver adapter @prisma/adapter-pg จึงไม่ต้อง copy engine binary)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 2 อย่างนี้ standalone ไม่ copy ให้อัตโนมัติ
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
