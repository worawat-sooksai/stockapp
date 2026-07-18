# CLAUDE.md — StockApp

สมองของโปรเจกต์ StockApp สำหรับ Claude Code — อ่านก่อนเริ่มงานทุกครั้ง
Requirements ทั้งหมดอยู่ที่ [`docs/spec.md`](docs/spec.md) (single source of truth)

---

## ภาพรวม

**StockApp** = ระบบคลังสินค้าเบิกจ่าย (Inventory Management) สำหรับทีมคลัง/สโตร์
บันทึกสินค้า · รับเข้า (Stock In) · เบิกออก (Stock Out) · Dashboard + แจ้งเตือนใกล้หมด

**MVP scope:** คลังเดียว · **UI ภาษาไทย** · มี seed data ตัวอย่าง · ยังไม่มี roles — ระบบ Auth (Better Auth) เป็นงานค้าง Phase 2 ตามแผนปรับ (ยังไม่ implement)

---

## Tech Stack (เวอร์ชันจริงในโปรเจกต์)

| ด้าน | เทคโนโลยี | หมายเหตุสำคัญ |
|------|-----------|----------------|
| Framework | **Next.js 16** (App Router, Turbopack) | `next lint` ถูกลบแล้ว — อย่าเพิ่ม script นี้ |
| Runtime | React 19 | |
| Language | TypeScript 5.9 | |
| Styling | **Tailwind CSS v4** | config อยู่ใน `app/globals.css` (`@theme inline`) ไม่มี `tailwind.config.js` |
| UI | **shadcn/ui** style `base-nova` (บน **Base UI** ไม่ใช่ Radix) | เพิ่ม component: `pnpm dlx shadcn@latest add <name>` |
| ORM | **Prisma 7** | เปลี่ยนแปลงเยอะจาก v6 — ดูหัวข้อ Prisma ด้านล่าง |
| Database | PostgreSQL 17 (Docker) | dev: `localhost:5432` |
| Package Manager | **pnpm** 11 | |

---

## กฎการเขียนโค้ด (Conventions)

- ⛔ **ห้ามใส่ semicolon ใน TypeScript/JavaScript ทุกไฟล์** — กฎเด็ดขาดของโปรเจกต์นี้
- UI เป็น **ภาษาไทย** (label, ปุ่ม, ข้อความ error, toast)
- ทุก input **validate ด้วย zod** ก่อนบันทึก
- Import alias: `@/*` → root (เช่น `@/lib/prisma`, `@/components/ui/button`)
- ยังไม่มี Prettier — โค้ด Phase 2 ทั้งหมดเขียนแบบ no-semi แล้ว เหลือไฟล์ config scaffold (`next.config.ts`, `prisma.config.ts`) ที่ **ยังมี semicolon ค้างอยู่** รอ format รวบตอนตั้ง Prettier (`semi: false`)

## สถาปัตยกรรม

- **Server Actions** อยู่ใน [`app/actions/`](app/actions) (`products.ts`, `stock.ts`) — mutation หลักทั้งหมด เรียกจาก client form ผ่าน `useTransition` ไม่เขียน REST เอง
  - คืนค่าเป็น `ActionResult` (`{ ok, message }` / `{ ok:false, error, fieldErrors? }` ใน [`lib/types.ts`](lib/types.ts)) → client เอาไปโชว์ `sonner` toast + inline error
- **Server Components (RSC)** = ทุกหน้า (dashboard/list/form page) query Prisma ตรง ๆ — ใส่ `export const dynamic = "force-dynamic"` เพื่อให้ข้อมูลสดเสมอ (spec F4)
- **Client Components** = เฉพาะส่วน interactive (form, dialog, select, chart, theme toggle, sidebar) — ใส่ `"use client"`
- ส่งข้อมูลเข้า client component เป็น **plain object (DTO)** เสมอ — แปลง `Decimal` → `Number(price)` ก่อน (Decimal serialize ข้าม RSC boundary ไม่ได้)
- `product.quantity` เป็นค่า **denormalized** — ต้องอัปเดตพร้อมสร้าง `StockTransaction` ภายใน **`prisma.$transaction` เดียวกัน** (atomic) เสมอ
- **Stock Out กันเบิกเกิน + กัน race**: ใช้ `updateMany({ where: { id, quantity: { gte: qty } }, data: { quantity: { decrement: qty } } })` ใน transaction — ถ้า `count === 0` แปลว่าเบิกเกิน → ปฏิเสธ ไม่สร้าง txn (เงื่อนไข gte ที่ระดับ row กัน race ไม่ให้ติดลบ) ดู [`app/actions/stock.ts`](app/actions/stock.ts)
- หลัง mutation: `revalidatePath()` ทุกหน้าที่เกี่ยว + `sonner` toast

---

## Design System (Genius Stock) — ธีมจาก `project-ui/`

- **สีแบรนด์:** Primary Teal `#01787B` (light `#0EA1A0`, dark `#014C4E`, soft `#E3F2F1`), Accent Gold `#D98F2B`
- **Semantic:** ปกติ/success เขียว · ใกล้หมด/warning ส้ม · หมด/danger แดง · info ม่วง — ทุกตัวมี token `--color-{success,warning,danger,info}[-bg|-foreground]` ใน `app/globals.css`
- **Design tokens อยู่ใน [`app/globals.css`](app/globals.css)** (`:root` + `.dark` + `@theme inline`) — ใช้ผ่าน utility เช่น `bg-primary`, `text-text-medium`, `bg-warning-bg` **อย่า hardcode hex ในคอมโพเนนต์**
- **ฟอนต์:** Inter (อังกฤษ/ตัวเลข) + Anuphan (ไทย) + JetBrains Mono (SKU/mono) — โหลดใน `app/layout.tsx` ผ่าน `next/font`
- **Dark mode:** toggle เพิ่ม/ถอด class `.dark` ที่ `<html>` + เก็บใน `localStorage['geniusstock-theme']` (มี no-flash script ใน layout) → [`components/layout/theme-toggle.tsx`](components/layout/theme-toggle.tsx)
- **Layout:** ทุกหน้าห่อด้วย `<AppShell title subtitle lowStockCount>` (sidebar teal + topbar + drawer มือถือ) — RSC ส่ง `lowStockCount` เข้าไปให้ badge sidebar
- **Radius:** input 8 · button/tile 10 · table row 12 · card 16 (`rounded-2xl`) · badge/pill 20

---

## Prisma 7 — ต้องรู้ (ต่างจาก v6 มาก)

- **Generated client อยู่ที่ `src/generated/prisma/`** (gitignored) ไม่ใช่ `node_modules/@prisma/client`
  - import client: `import { PrismaClient } from "@/src/generated/prisma/client"`
  - import enum: `import { TransactionType } from "@/src/generated/prisma/enums"`
- **ใช้ singleton จาก [`lib/prisma.ts`](lib/prisma.ts) เท่านั้น** — `import { prisma } from "@/lib/prisma"` อย่า `new PrismaClient()` ที่อื่น
- **Driver adapter บังคับ** — `new PrismaClient({ adapter })` โดย `adapter = new PrismaPg({ connectionString })` (v6 สร้างเปล่า ๆ ได้ แต่ v7 error)
- Config อยู่ที่ **`prisma.config.ts`** (ไม่ใช่ใน schema) — โหลด `DATABASE_URL` ผ่าน `dotenv`
- `datasource db` ใน `schema.prisma` **ไม่มี `url`** แล้ว (ย้ายไป config)
- หลังแก้ `schema.prisma` ต้อง `pnpm prisma generate` (หรือ migrate ซึ่ง gen ให้อัตโนมัติ) — client ถูก gitignore มี `postinstall: prisma generate` ให้ทีม gen หลัง install

---

## Data Model (ดูเต็มใน `prisma/schema.prisma`)

- **Product**: `id` (cuid), `sku` @unique, `name`, `category`, `unit`, `quantity` Int, `reorderPoint` Int, `price` Decimal(12,2), **`deletedAt` DateTime? (soft-delete)**, timestamps
  - ใกล้หมด = `quantity <= reorderPoint` · หมด = `quantity == 0`
- **StockTransaction**: `id`, `productId` (FK), `type` (`IN`/`OUT`), `quantity` (บวกเสมอ), `note?`, `createdAt` — index ที่ `productId`, `createdAt`
- **enum TransactionType**: `IN`, `OUT`

✅ **Delete = soft-delete** (ตัดสินใจ + implement แล้วใน Phase 2) — `deleteProduct` เซ็ต `deletedAt = now()` ไม่ลบจริง เก็บประวัติ transaction ไว้ครบ (FK ยังเป็น `ON DELETE RESTRICT`)
- ⚠️ **ทุก query สินค้าต้อง filter `deletedAt: null`** — ใช้ helper ใน [`lib/queries.ts`](lib/queries.ts) เป็นหลัก อย่า query `product` ดิบ ๆ โดยไม่กรอง
- ⚠️ ข้อจำกัด: SKU @unique ครอบ row ที่ soft-delete ด้วย → สร้าง SKU ที่เคยลบซ้ำจะติด `P2002` (MVP รับได้ ถ้าจะแก้ค่อยทำ partial unique index `WHERE deletedAt IS NULL`)

---

## คำสั่งที่ใช้บ่อย

```bash
pnpm dev                              # dev server (Turbopack)
pnpm build                            # production build
pnpm exec tsc --noEmit                # typecheck (ใช้ตรวจก่อน commit)

pnpm db:seed                          # seed ข้อมูลตัวอย่าง (tsx prisma/seed.ts, idempotent)
pnpm prisma migrate dev --name <ชื่อ>  # สร้าง+apply migration
pnpm prisma generate                  # regenerate client → src/generated/prisma
pnpm prisma studio                    # เปิด GUI ดูข้อมูล
pnpm prisma format && pnpm prisma validate

pnpm dlx shadcn@latest add <name>     # เพิ่ม UI component (เช่น table, dialog, input)
```

---

## Database (dev)

- PostgreSQL 17 (`postgres:17-alpine`) รันใน Docker container `stockapp-db` (map `5432:5432`)
- `DATABASE_URL` อยู่ใน `.env` (gitignored) — template สำหรับทีมอยู่ที่ `.env.example`
- dev credentials: `stock` / `stock` / db `stockapp` @ `localhost:5432`
- ยังไม่มี `docker-compose.yml` (จะทำใน Phase 4)

---

## Gotchas ของ toolchain นี้

- **pnpm build-script gate**: pnpm 11 บล็อก native build scripts จนกว่าจะ approve ใน `pnpm-workspace.yaml` (`allowBuilds`) — ตอนนี้ approve แล้ว: `sharp`, `esbuild`, `prisma`, `@prisma/engines` ถ้าลง dep ใหม่ที่มี build script อาจต้อง set `allowBuilds.<pkg>: true` แล้ว `pnpm install` ซ้ำ
- **shadcn `base-nova` init บน Windows มีบั๊ก**: `init` ไม่ยอมสร้าง `lib/utils.ts` กับ theme ใน `globals.css` — 2 ไฟล์นี้เขียนมือไว้แล้ว ถ้า add component แล้วพังเรื่อง token/utils ให้เช็ค 2 ไฟล์นี้ก่อน
- **UI primitives ใน `components/ui/` Phase 2 เขียนมือบน Base UI** (`@base-ui/react/*`) ไม่ได้ผ่าน `shadcn add` — เลี่ยงบั๊ก base-nova บน Windows + คุมสไตล์ให้ตรงดีไซน์เอง โครง component API เลียนแบบ shadcn (Dialog/Select ใช้ compound parts) จะ add ของใหม่ก็ได้ แต่เช็คสไตล์ให้เข้าธีม
- **ไอคอน:** พอร์ต Hugeicons Stroke Rounded เป็น `<Icon name=... />` เดียวใน [`components/icons.tsx`](components/icons.tsx) (คุมสีผ่าน `currentColor`/`text-*`) — ไม่ได้ใช้ `lucide-react` เพื่อให้ตรงดีไซน์เป๊ะ
- generated Prisma client (`src/generated/prisma`) และ `.env` ถูก gitignore — clone ใหม่ต้อง `pnpm install` (postinstall gen) + สร้าง `.env`

---

## โครงสร้างโฟลเดอร์

```
app/
  page.tsx              # Dashboard (/)
  products/             # /products
  stock-in/  stock-out/ # /stock-in, /stock-out
  low-stock/            # /low-stock
  actions/              # server actions — products.ts, stock.ts
components/
  ui/                   # UI primitives (Base UI + hand-written) — input, select, dialog, table, badge, card, sonner, ...
  layout/               # app-shell, sidebar, theme-toggle
  products/             # products-client, product-form-dialog
  stock/                # stock-form (mode in/out)
  dashboard/            # kpi-card, trend-chart
  status-badge.tsx      # badge สถานะสต็อก (ปกติ/ใกล้หมด/หมด)
  icons.tsx             # Icon component (พอร์ต Hugeicons)
lib/
  prisma.ts             # Prisma client singleton (ใช้ตัวนี้เท่านั้น)
  queries.ts            # query สินค้า (filter deletedAt:null) — ใช้ร่วมทุกหน้า
  validations.ts        # zod schemas (product, stock movement)
  product-status.ts     # getStockStatus() + STATUS_META
  format.ts             # format เงิน/ตัวเลข/วันที่ ไทย
  types.ts              # ActionResult, ProductDTO, ProductOption
  utils.ts              # cn() helper
prisma/
  schema.prisma         # data model
  seed.ts               # seed script (pnpm db:seed)
  migrations/           # migration history
src/generated/prisma/   # generated client (gitignored)
docs/spec.md            # requirements — source of truth
```
