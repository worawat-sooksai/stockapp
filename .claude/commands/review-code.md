---
description: รีวิวไฟล์ตาม convention ของ StockApp — Correctness, Convention, Error Handling, Performance, Security แล้วสรุปเป็น ✅/⚠️/❌
argument-hint: @path/to/file.ts (ระบุไฟล์ที่จะ review ด้วย @)
---

# /review-code — รีวิวโค้ด StockApp

ไฟล์ที่ต้อง review: **$ARGUMENTS**

## Context อ้างอิง convention

- Project brain: @CLAUDE.md
- Type contracts: @lib/types.ts

> อ่านเนื้อไฟล์เป้าหมายจาก $ARGUMENTS ให้ครบก่อนเริ่ม (ถ้า user ไม่ได้แนบด้วย @ ให้เปิดอ่านเอง) — review **เฉพาะไฟล์ที่ระบุ** ไม่ต้องแก้โค้ดให้ เว้นแต่ user สั่ง

## ตรวจ 5 ด้าน

### 1. Correctness (ตรรกะถูกไหม)
- logic ทำงานตามที่ควรจริงไหม, edge case (ค่าว่าง, 0, ติดลบ, ซ้ำ) ครบไหม
- mutation ที่แตะ `quantity` ทำใน `prisma.$transaction` เดียว (atomic) ไหม
- Stock Out กันเบิกเกิน + กัน race ด้วย `updateMany({ where: { quantity: { gte } } })` (เช็ค `count === 0`) ไหม
- `Decimal` แปลงเป็น `Number(...)` ก่อนส่งข้าม RSC boundary ไหม

### 2. Convention (ตรงกฎโปรเจกต์ไหม)
- ⛔ **ไม่มี semicolon** ใน `.ts`/`.tsx`
- 🧩 server action คืนค่า **`ActionResult`** จาก `@/lib/types` (`{ ok, message }` / `{ ok:false, error, fieldErrors? }`)
- 🗑️ query `Product` **filter `deletedAt: null`** เสมอ (ผ่าน helper ใน `lib/queries.ts` ไม่ query ดิบ)
- ใช้ prisma singleton `@/lib/prisma` (ไม่ `new PrismaClient()`); import client/enum จาก `@/src/generated/prisma/*`
- validate input ด้วย **zod** ก่อนบันทึก; UI ภาษาไทย; ห้าม hardcode hex (ใช้ design token)
- RSC ใส่ `export const dynamic = "force-dynamic"`; client component ใส่ `"use client"`
- หลัง mutation มี `revalidatePath()` ครบทุกหน้าที่เกี่ยว

### 3. Error Handling
- จับ error ของ Prisma (เช่น `P2002` SKU ซ้ำ) แล้วคืน message ที่ผู้ใช้เข้าใจ (ไทย) ไหม
- ไม่กลืน error เงียบ ๆ, ไม่ leak stack/รายละเอียด DB ออกหน้าบ้าน
- คืน `fieldErrors` ให้ inline error ที่ฟอร์มเมื่อ validate ไม่ผ่าน

### 4. Performance
- ไม่มี N+1 query (ใช้ `include`/`select` เท่าที่ใช้), ไม่ดึง field เกินจำเป็น
- ใช้ index ที่มี (`productId`, `createdAt`, `deletedAt`) ให้เป็นประโยชน์
- ไม่ทำงานหนักซ้ำใน render / ไม่ loop query ที่ยุบเป็น query เดียวได้

### 5. Security
- ทุก input จาก client ผ่าน zod ก่อนแตะ DB (กัน injection ผ่าน type/รูปแบบ)
- ไม่ trust ค่าจาก client ตรง ๆ (เช่น id/ราคา) โดยไม่ตรวจ
- ไม่ log/return ข้อมูลลับ, ไม่ hardcode secret; คำนึงถึง auth guard ถ้าไฟล์อยู่หลัง proxy

## รูปแบบผลลัพธ์ (ภาษาไทย)

จัดกลุ่มผลเป็น 3 ระดับ อ้างเลขบรรทัด/ฟังก์ชันให้ชัด:

```
## รีวิว: <ชื่อไฟล์>

### ❌ ต้องแก้ด่วน (bug / ผิด convention เด็ดขาด / ช่องโหว่)
- <บรรทัด> <ปัญหา> → <วิธีแก้>

### ⚠️ ควรปรับ (ปรับปรุงได้ ไม่ถึงขั้นพัง)
- <บรรทัด> <ข้อเสนอ>

### ✅ ดีแล้ว (ทำถูกตาม convention)
- <จุดที่ดี>

### สรุป
<ประเมินรวม + ลำดับสิ่งที่ควรแก้ก่อน>
```

ถ้าไม่พบปัญหาระดับ ❌ ให้บอกชัดเจนว่า "ผ่าน ไม่มีจุดต้องแก้ด่วน"
