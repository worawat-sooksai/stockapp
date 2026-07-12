import { z } from "zod"

// zod schemas — validate ทุก input ก่อนบันทึก (กฎโปรเจกต์)

export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(1, "กรุณากรอก SKU")
    .max(50, "SKU ต้องไม่เกิน 50 ตัวอักษร"),
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อสินค้า")
    .max(200, "ชื่อสินค้ายาวเกินไป"),
  category: z
    .string()
    .trim()
    .min(1, "กรุณากรอกหมวดหมู่")
    .max(100, "หมวดหมู่ยาวเกินไป"),
  unit: z
    .string()
    .trim()
    .min(1, "กรุณากรอกหน่วยนับ")
    .max(50, "หน่วยนับยาวเกินไป"),
  reorderPoint: z.coerce
    .number({ message: "จุดสั่งซื้อต้องเป็นตัวเลข" })
    .int("จุดสั่งซื้อต้องเป็นจำนวนเต็ม")
    .min(0, "จุดสั่งซื้อต้องไม่ติดลบ"),
  price: z.coerce
    .number({ message: "ราคาต้องเป็นตัวเลข" })
    .min(0, "ราคาต้องไม่ติดลบ")
    .max(99_999_999, "ราคาสูงเกินไป"),
})

export type ProductInput = z.infer<typeof productSchema>

// รับเข้า / เบิกออก — จำนวนต้องเป็นจำนวนเต็มบวก
export const stockMovementSchema = z.object({
  productId: z.string().trim().min(1, "กรุณาเลือกสินค้า"),
  quantity: z.coerce
    .number({ message: "จำนวนต้องเป็นตัวเลข" })
    .int("จำนวนต้องเป็นจำนวนเต็ม")
    .positive("จำนวนต้องมากกว่า 0"),
  note: z
    .string()
    .trim()
    .max(500, "หมายเหตุยาวเกินไป")
    .optional()
    .transform((v) => (v ? v : undefined)),
})

export type StockMovementInput = z.infer<typeof stockMovementSchema>
