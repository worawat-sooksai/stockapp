---
description: สร้าง CRUD เต็มชุด (server action + zod + query + list page + dialog form) สำหรับ Prisma model ตาม convention ของ StockApp
argument-hint: <PrismaModelName>
---

# /create-crud — Scaffold CRUD สำหรับ StockApp

สร้างโค้ด CRUD เต็มชุดสำหรับ Prisma model ชื่อ **$ARGUMENTS** ตาม convention ของโปรเจกต์นี้

## Context ที่ต้องอ่านก่อนเริ่ม (บังคับ)

- Prisma schema: @prisma/schema.prisma
- Project brain: @CLAUDE.md
- Type contracts: @lib/types.ts
- ตัวอย่าง reference ที่มีอยู่แล้ว (ลอกโครง ไม่ใช่ก็อป): @app/actions/products.ts · @lib/validations.ts · @lib/queries.ts

## ขั้นตอน

1. **ตรวจ model ก่อน** — หา `model $ARGUMENTS` ใน `prisma/schema.prisma`
   - ถ้าไม่เจอ → หยุด แจ้ง user ว่าไม่มี model นี้ พร้อม list model ที่มี อย่าเดา field เอง
   - อ่าน field ทั้งหมด, type, `@unique`, `@default`, field ที่เป็น `Decimal`, และมี `deletedAt DateTime?` หรือไม่
   - เตรียมชื่อ: `Model` = ชื่อจริง (เช่น `Product`), `modelLower` = camelCase/lowercase สำหรับ path (เช่น `product`), route = `/[modelLower]s` หรือถามถ้าพหูพจน์กำกวม

2. **Zod schema** → เพิ่มใน `lib/validations.ts`
   - 1 schema ต่อ 1 model (create/update ใช้ร่วมหรือแยกตามที่ products ทำ)
   - map ทุก field ที่ user กรอกได้ (ยกเว้น id/timestamps/deletedAt) เป็น zod rule
   - error message เป็น **ภาษาไทย**

3. **Read query** → เพิ่มใน `lib/queries.ts`
   - ถ้า model มี `deletedAt` → **ทุก query ต้อง `where: { deletedAt: null }`**
   - คืน DTO แบบ plain object — แปลง `Decimal` เป็น `Number(...)` ก่อนเสมอ (serialize ข้าม RSC ไม่ได้)

4. **Server Actions** → `app/actions/[modelLower].ts`
   - `"use server"` บนสุดไฟล์
   - `create[Model]`, `update[Model]`, `delete[Model]`
   - **delete = soft-delete** ถ้า model มี `deletedAt` (set `deletedAt: new Date()`) ไม่ลบจริง; ถ้าไม่มี `deletedAt` ค่อย `delete` จริง
   - validate ด้วย zod schema จากขั้นตอน 2 ก่อนแตะ DB เสมอ
   - คืนค่าเป็น `ActionResult` จาก `@/lib/types` (`{ ok, message }` / `{ ok:false, error, fieldErrors? }`)
   - ใช้ prisma singleton `import { prisma } from "@/lib/prisma"` เท่านั้น
   - หลัง mutation สำเร็จ → `revalidatePath()` ทุก path ที่เกี่ยว (list page + dashboard ถ้าเกี่ยว)
   - ถ้ามี field แบบ denormalized/atomic ให้ใช้ `prisma.$transaction` เหมือน pattern stock

5. **List page (RSC)** → `app/[modelLower]/page.tsx`
   - Server Component: `export const dynamic = "force-dynamic"`
   - query ผ่าน helper จาก `lib/queries.ts` (อย่า query prisma ดิบในหน้า)
   - ห่อด้วย `<AppShell title subtitle lowStockCount>` (ส่ง lowStockCount ถ้าเกี่ยวกับสต็อก)
   - ตารางข้อมูล + ปุ่มเปิด dialog เพิ่ม/แก้ไข

6. **Form dialog (Client)** → `components/[modelLower]/[modelLower]-form-dialog.tsx`
   - `"use client"`
   - เรียก server action ผ่าน `useTransition`
   - โชว์ผลด้วย `sonner` toast + inline `fieldErrors`
   - ใช้ UI primitives จาก `components/ui/` (Base UI) — Dialog/Input/Select/Button ที่มีอยู่

## กฎเด็ดขาด (ห้ามพลาด)

- ⛔ **ห้ามมี semicolon** ใน `.ts`/`.tsx` ทุกไฟล์
- 🇹🇭 **UI/label/ปุ่ม/error/toast เป็นภาษาไทย** ทั้งหมด
- 🎨 **ห้าม hardcode hex สี** — ใช้ design token (`bg-primary`, `text-text-medium`, `bg-warning-bg`, ฯลฯ)
- 📦 import alias `@/*`; Prisma client จาก `@/lib/prisma` เท่านั้น; enum จาก `@/src/generated/prisma/enums`
- ✅ ทุก input validate ด้วย zod ก่อนบันทึก
- 🗑️ soft-delete เมื่อ model มี `deletedAt` เท่านั้น

## เสร็จแล้ว

- รัน `pnpm exec tsc --noEmit` เพื่อ typecheck
- สรุปเป็นภาษาไทย: สร้าง/แก้ไฟล์อะไรบ้าง + ผล typecheck แล้ว **หยุดรอ review** อย่าเพิ่ง commit
