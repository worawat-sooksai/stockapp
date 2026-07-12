// รูปสินค้าแบบ plain object (serialize ได้) สำหรับส่งเข้า client component
export type ProductDTO = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  quantity: number
  reorderPoint: number
  price: number
}

// ตัวเลือกสินค้าใน dropdown ของ Stock In/Out
export type ProductOption = {
  id: string
  sku: string
  name: string
  unit: string
  quantity: number
}

// ผลลัพธ์มาตรฐานของ server action — ใช้แสดง toast + inline error ฝั่ง client
export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }

// ตรวจว่าเป็น error unique constraint (SKU ซ้ำ) ของ Prisma
export function isUniqueConstraintError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  )
}
