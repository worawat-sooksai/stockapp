# StockApp — Specification

ระบบคลังสินค้าเบิกจ่าย (Inventory Management System)

> เอกสารนี้เป็นแหล่งอ้างอิงหลัก (single source of truth) ของ requirements และแผนการพัฒนา StockApp

---

## 1. ภาพรวมระบบ (System Overview)

**StockApp** คือระบบจัดการคลังสินค้าเบิกจ่าย สำหรับทีมคลัง/สโตร์ ใช้บันทึกสินค้า รับสินค้าเข้าคลัง
เบิกจ่ายสินค้าออก และดูภาพรวมสต็อกแบบ real-time พร้อมแจ้งเตือนเมื่อสินค้าใกล้หมด

### เป้าหมาย (Goals)
- จัดการข้อมูลสินค้า (master data) พร้อม SKU ที่ไม่ซ้ำ
- บันทึกการเคลื่อนไหวของสต็อกทุกครั้ง (รับเข้า / เบิกออก) เพื่อตรวจสอบย้อนหลังได้
- ป้องกันการเบิกสินค้าเกินจำนวนคงเหลือ (data integrity)
- ให้ผู้ใช้เห็นสถานะคลังในหน้าเดียว และรู้ทันทีว่าสินค้าใดใกล้หมด

### ขอบเขต MVP (Scope)
- **ไม่มีระบบ Login / roles** ใน MVP — เน้น core features ก่อนเพื่อส่งมอบเร็ว (เผื่อ schema ไว้เพิ่มภายหลัง)
- ใช้งานคลังเดียว (single warehouse)
- UI ภาษาไทย พร้อม seed data ตัวอย่าง

### Tech Stack
| ด้าน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Package Manager | pnpm |

### สถาปัตยกรรมโดยสังเขป (Architecture)
- **Server Actions** เป็นหลักสำหรับ mutation (สร้าง/แก้ไขสินค้า, stock in/out) — เรียกจาก form ได้ตรง ไม่ต้องเขียน REST API เอง
- **Server Components (RSC)** สำหรับหน้า list / dashboard (query Prisma ตรงในคอมโพเนนต์)
- **Client Components** เฉพาะส่วน interactive (forms, dialogs, chart)
- `quantity` (คงเหลือ) denormalize ไว้บน `Product` และอัปเดตพร้อมสร้าง `StockTransaction`
  ภายใน **`prisma.$transaction`** เดียวกัน — กันสต็อกเพี้ยนและ validate การเบิกเกินได้แบบ atomic

---

## 2. Data Model

### Product
| Field | Type | หมายเหตุ |
|-------|------|----------|
| `id` | String (cuid) | Primary key |
| `sku` | String **@unique** | รหัสสินค้า ไม่ซ้ำ |
| `name` | String | ชื่อสินค้า |
| `category` | String | หมวดหมู่ |
| `unit` | String | หน่วยนับ เช่น ชิ้น / กล่อง / แพ็ค |
| `quantity` | Int | จำนวนคงเหลือในคลัง (denormalized) |
| `reorderPoint` | Int | จุดสั่งซื้อ/แจ้งเตือน — ถ้า `quantity <= reorderPoint` ถือว่าใกล้หมด |
| `price` | Decimal(12,2) | ราคา/ต้นทุนต่อหน่วย ใช้คำนวณมูลค่าสต็อกรวม |
| `createdAt` | DateTime | สร้างเมื่อ |
| `updatedAt` | DateTime | แก้ไขล่าสุดเมื่อ |

### StockTransaction
| Field | Type | หมายเหตุ |
|-------|------|----------|
| `id` | String (cuid) | Primary key |
| `productId` | String | FK → Product |
| `type` | enum `TransactionType` | `IN` (รับเข้า) หรือ `OUT` (เบิกออก) |
| `quantity` | Int | จำนวนที่เคลื่อนไหว (บวกเสมอ ทิศทางดูจาก `type`) |
| `note` | String? | หมายเหตุ/อ้างอิง (optional) — เลขบิล, ผู้เบิก/ผู้รับ, ซัพพลายเออร์ |
| `createdAt` | DateTime | เวลาทำรายการ (timestamp อัตโนมัติ) |

### Enum
```prisma
enum TransactionType {
  IN
  OUT
}
```

### Prisma schema (ตัวอย่าง)
```prisma
model Product {
  id            String             @id @default(cuid())
  sku           String             @unique
  name          String
  category      String
  unit          String
  quantity      Int                @default(0)
  reorderPoint  Int                @default(10)
  price         Decimal            @db.Decimal(12, 2) @default(0)
  transactions  StockTransaction[]
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
}

enum TransactionType {
  IN
  OUT
}

model StockTransaction {
  id         String          @id @default(cuid())
  productId  String
  product    Product         @relation(fields: [productId], references: [id])
  type       TransactionType
  quantity   Int
  note       String?
  createdAt  DateTime        @default(now())

  @@index([productId])
  @@index([createdAt])
}
```

---

## 3. ฟีเจอร์ทั้งหมด + Acceptance Criteria

### F1 — จัดการสินค้า (Product CRUD)
บันทึก แก้ไข ดู และลบสินค้าพร้อม SKU

**Acceptance Criteria**
- [ ] สร้างสินค้าใหม่ได้ โดยระบุ SKU, ชื่อ, หมวดหมู่, หน่วยนับ, ราคา, reorderPoint
- [ ] SKU ต้องไม่ซ้ำ — ถ้าซ้ำต้องแสดง error ที่ชัดเจน ไม่บันทึก
- [ ] แก้ไขข้อมูลสินค้าได้ (ยกเว้นไม่ควรแก้ `quantity` ตรง ๆ — ต้องผ่าน Stock In/Out)
- [ ] แสดงรายการสินค้าทั้งหมดในตาราง พร้อมค้นหา/กรองได้
- [ ] ลบสินค้าได้ โดยยังคงรักษาประวัติการเคลื่อนไหว (transaction) ไว้
- [ ] ทุก input ผ่านการ validate ด้วย zod ก่อนบันทึก

### F2 — รับสินค้าเข้าคลัง (Stock In)
เพิ่มจำนวนสินค้าเข้าคลังพร้อมบันทึกการเคลื่อนไหว

**Acceptance Criteria**
- [ ] เลือกสินค้า + ระบุจำนวน (> 0) + หมายเหตุ (optional) แล้วบันทึกได้
- [ ] เมื่อบันทึก: สร้าง `StockTransaction` type=`IN` และเพิ่ม `product.quantity` ในทรานแซกชันเดียวกัน
- [ ] จำนวนต้องเป็นจำนวนเต็มบวกเท่านั้น
- [ ] หลังบันทึกสำเร็จ แสดง toast ยืนยัน และหน้ารายการ/Dashboard อัปเดตทันที

### F3 — เบิกจ่ายสินค้า (Stock Out) + กันเบิกเกิน
ลดจำนวนสินค้าออกจากคลัง โดยห้ามเบิกเกินจำนวนคงเหลือ

**Acceptance Criteria**
- [ ] เลือกสินค้า + ระบุจำนวน (> 0) + หมายเหตุ (optional) แล้วบันทึกได้
- [ ] **ถ้าจำนวนที่เบิก > `quantity` คงเหลือ → ปฏิเสธพร้อมข้อความ error ชัดเจน และไม่แก้ไขสต็อก**
- [ ] เมื่อสำเร็จ: สร้าง `StockTransaction` type=`OUT` และลด `product.quantity` ใน `prisma.$transaction` เดียว (atomic)
- [ ] ต้องกัน race condition — สองรายการเบิกพร้อมกันต้องไม่ทำให้สต็อกติดลบ
- [ ] หลังบันทึกสำเร็จ แสดง toast ยืนยัน และ Dashboard อัปเดตทันที

### F4 — Dashboard + แจ้งเตือนสินค้าใกล้หมด
หน้าสรุปภาพรวมคลังในที่เดียว

**Acceptance Criteria**
- [ ] KPI cards: จำนวน SKU ทั้งหมด, มูลค่าสต็อกรวม (`Σ quantity × price`), จำนวนสินค้าใกล้หมด, จำนวนสินค้าหมด
- [ ] ตารางสินค้าใกล้หมด: แสดงสินค้าที่ `quantity <= reorderPoint` (เรียงจากวิกฤตที่สุด)
- [ ] รายการเคลื่อนไหวล่าสุด: 10 รายการล่าสุด (IN/OUT) พร้อมชื่อสินค้าและเวลา
- [ ] กราฟแนวโน้ม: การเคลื่อนไหว IN vs OUT ย้อนหลัง (เช่น 14 วัน)
- [ ] ข้อมูลทั้งหมด query จากฐานข้อมูลจริง และสดเสมอหลังทำรายการ (revalidate)

---

## 4. แผนการพัฒนา (5 Phases)

### Phase 1 — Foundation (วันที่ 1)
วางรากฐานโปรเจกต์ ฐานข้อมูล และ "สมอง" ของโปรเจกต์

- [x] ตั้งโปรเจกต์ Next.js 16 (App Router) + TypeScript ด้วย pnpm
- [x] ติดตั้ง Tailwind CSS v4 + init shadcn/ui
- [x] ติดตั้งและตั้งค่า Prisma
- [x] เขียน Prisma schema: `Product`, `StockTransaction`, enum `TransactionType{IN,OUT}`
- [x] เชื่อมต่อ PostgreSQL (`DATABASE_URL` ใน `.env`)
- [x] รัน migration ครั้งแรก (`prisma migrate dev`)
- [x] เขียน seed script + Seed ข้อมูลตัวอย่าง **SKU-1001 ถึง SKU-1007** (รวมเคสใกล้หมด/หมด)
- [x] วาง `CLAUDE.md` — สมองของโปรเจกต์ (context, conventions, คำสั่งที่ใช้บ่อย, สถาปัตยกรรม)

### Phase 2 — Core Features (วันที่ 2)
สร้างฟีเจอร์หลักให้ใช้งานได้ครบวงจร

- [ ] CRUD สินค้าครบวงจร: Create / Read / Update / Delete (server actions + zod)
- [ ] หน้า Products: ตาราง (shadcn table) + ProductForm dialog (create/edit)
- [ ] Stock In: ฟอร์ม + action (สร้าง txn IN + เพิ่ม quantity)
- [ ] Stock Out: ฟอร์ม + action พร้อม**กันเบิกเกินด้วย `prisma.$transaction`** (atomic)
- [ ] Dashboard: KPI cards + สินค้าใกล้หมด + เคลื่อนไหวล่าสุด + กราฟแนวโน้ม
- [ ] แจ้งเตือนสินค้าใกล้หมด (`quantity <= reorderPoint`)
- [ ] `revalidatePath()` หลัง mutation + `sonner` toast แจ้งผล
- [ ] Custom Slash Commands สำหรับงานที่ทำบ่อย (เช่น สร้างสินค้า, seed, ตรวจสต็อก)

### Phase 3 — Agentic Quality (วันที่ 3)
ยกระดับคุณภาพด้วย agents, MCP และ automation

- [ ] Sub-agent: `code-reviewer` — รีวิวโค้ดอัตโนมัติ
- [ ] Sub-agent: `test-writer` — เขียน/เสริมเทสต์
- [ ] Sub-agent: `security-auditor` — ตรวจช่องโหว่ความปลอดภัย
- [ ] MCP integration: PostgreSQL MCP (query/inspect ฐานข้อมูล)
- [ ] MCP integration: GitHub MCP (จัดการ issue/PR)
- [ ] Hooks: รัน lint / format / test อัตโนมัติหลังแก้ไขโค้ด

### Phase 4 — Team & Containerization (วันที่ 4)
เตรียมทำงานเป็นทีมและ containerize

- [ ] แชร์ `.claude/` config ผ่าน Git ให้ทีมใช้ร่วมกัน
- [ ] Git workflow: commit message convention (เช่น Conventional Commits)
- [ ] PR template + แนวทาง code review
- [ ] `Dockerfile` แบบ multi-stage build (Next.js `standalone` output)
- [ ] `docker-compose.yml`: app + postgres
- [ ] CI ด้วย GitHub Actions: build + push image ไป `ghcr.io`

### Phase 5 — Production (วันที่ 5)
นำขึ้น production จริงพร้อมความปลอดภัยและ monitoring

- [ ] Deploy บน VPS Ubuntu
- [ ] SSH hardening (ปิด password login, ใช้ key, เปลี่ยน default port)
- [ ] ตั้ง UFW firewall (เปิดเฉพาะพอร์ตที่จำเป็น)
- [ ] Nginx reverse proxy
- [ ] HTTPS ด้วย Let's Encrypt (certbot + auto-renew)
- [ ] CD อัตโนมัติ: pull image ใหม่ + zero-downtime restart
- [ ] Backup strategy (dump ฐานข้อมูลเป็นระยะ) + Rollback strategy
- [ ] Monitoring: health check endpoint + alert เมื่อระบบล่ม

---

## 5. Out of Scope (MVP)

- Authentication / roles / permissions (เผื่อ schema ไว้เพิ่มภายหลัง)
- หลายคลัง (multi-warehouse), lot / expiry, รูปภาพสินค้า
- Supplier เป็นตารางแยก (MVP เก็บเป็น text ใน `note`)
- Export รายงาน (CSV/PDF), การแก้ไข/ยกเลิก transaction ย้อนหลัง
