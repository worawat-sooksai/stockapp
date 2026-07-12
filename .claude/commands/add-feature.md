---
description: วางแผนและ implement ฟีเจอร์ใหม่ใน StockApp — วิเคราะห์ผลกระทบต่อ model ก่อน แสดง plan เป็น checklist รอยืนยัน
argument-hint: <ชื่อ/คำอธิบายฟีเจอร์>
---

# /add-feature — เพิ่มฟีเจอร์ใหม่ให้ StockApp

ฟีเจอร์ที่ต้องการ: **$ARGUMENTS**

## Context ที่ต้องอ่านและวิเคราะห์ก่อน (บังคับ)

- Data model: @prisma/schema.prisma
- Project brain: @CLAUDE.md
- Requirements (single source of truth): @docs/spec.md
- Type contracts: @lib/types.ts

## ขั้นตอนที่ 1 — วิเคราะห์ผลกระทบ (ยังไม่เขียนโค้ด)

วิเคราะห์ฟีเจอร์ **$ARGUMENTS** แล้วสรุปให้ user (ภาษาไทย):

1. **กระทบ model ไหนบ้าง** — อ่าน `prisma/schema.prisma` แล้วระบุว่าต้อง
   - เพิ่ม model ใหม่ / เพิ่ม field / เพิ่ม enum / เพิ่ม index หรือไม่
   - ต้องทำ migration ไหม (`pnpm prisma migrate dev --name <ชื่อ>`)
   - มีผลกับ `deletedAt` / soft-delete หรือ denormalized `quantity` หรือไม่
2. **ตรงกับ spec หรือขยาย spec** — เทียบกับ `docs/spec.md`
   - อยู่ใน scope เดิม (F1–F4) หรือเป็นของใหม่
   - ชนกับ **Out of Scope (ข้อ 5)** หรือไม่ (เช่น roles, multi-warehouse, export) — ถ้าชน ให้เตือน user ก่อน
3. **ไฟล์ที่ต้องแตะ** — action / query / validation / page / component ไหนบ้าง (อ้างโครงจาก CLAUDE.md)

## ขั้นตอนที่ 2 — แสดง Plan เป็น checklist แล้ว **หยุดรอยืนยัน**

แสดงแผนในรูปแบบนี้ แล้ว **รอ user ยืนยันก่อนลงมือทุกครั้ง** (อย่าเขียนโค้ดก่อนได้ OK):

```
## แผนการเพิ่มฟีเจอร์: <ชื่อ>

### ผลกระทบต่อ data model
- [ ] <schema / migration ที่ต้องทำ — หรือ "ไม่กระทบ schema">

### ไฟล์ที่จะสร้าง/แก้
- [ ] lib/validations.ts — zod schema ...
- [ ] lib/queries.ts — query ... (filter deletedAt:null ถ้าเกี่ยวกับ Product)
- [ ] app/actions/<name>.ts — server action ...
- [ ] app/<route>/page.tsx — RSC ...
- [ ] components/<name>/... — client component ...

### เอกสาร
- [ ] อัปเดต docs/spec.md — เพิ่ม/แก้ไข section ที่เกี่ยว (feature + acceptance criteria + phase)

### ตรวจสอบ
- [ ] pnpm exec tsc --noEmit ผ่าน
```

> ⚠️ **เตือน user เสมอ:** ฟีเจอร์นี้ต้องอัปเดต `docs/spec.md` (single source of truth) ด้วย — อย่าปล่อยให้ spec ล้าหลังโค้ด

## ขั้นตอนที่ 3 — Implement (หลังยืนยันแล้วเท่านั้น)

- ทำตาม checklist ทีละข้อ, tick เมื่อเสร็จ
- **Server Actions** อยู่ใน `app/actions/` คืนค่า `ActionResult` จาก `@/lib/types` เสมอ
- ทุก input validate ด้วย zod ก่อนบันทึก
- หลัง mutation → `revalidatePath()` ทุกหน้าที่เกี่ยว + `sonner` toast
- ใช้ prisma singleton `@/lib/prisma` เท่านั้น; Product query ต้อง filter `deletedAt: null`
- อัปเดต `docs/spec.md` ตามที่วางแผน

## กฎเด็ดขาด

- ⛔ **ห้ามมี semicolon** ใน `.ts`/`.tsx`
- 📘 **TypeScript strict** — ไม่มี `any` ลอย ๆ, type ครบ, ไม่ปิด error ด้วย `// @ts-ignore`
- 🧩 **Server Actions + `ActionResult`** เป็น pattern หลักของ mutation (ไม่เขียน REST เอง)
- 🇹🇭 UI ภาษาไทย · 🎨 design token ห้าม hardcode hex

## ปิดงาน

รัน `pnpm exec tsc --noEmit` → สรุปภาษาไทย (ทำอะไรไปบ้าง + แก้ spec ตรงไหน) → **หยุดรอ review** อย่าเพิ่ง commit
