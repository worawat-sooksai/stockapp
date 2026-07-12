import { prisma } from "@/lib/prisma"

// query ที่ใช้ร่วมหลายหน้า — สินค้าที่ยังไม่ถูกลบ (soft-delete)

const notDeleted = { deletedAt: null }

// ใกล้หมด/หมด = quantity <= reorderPoint (เทียบ field-to-field ด้วย field reference)
const lowStockWhere = {
  ...notDeleted,
  quantity: { lte: prisma.product.fields.reorderPoint },
}

export function getLowStockCount() {
  return prisma.product.count({ where: lowStockWhere })
}

export function getLowStockProducts() {
  return prisma.product.findMany({
    where: lowStockWhere,
    orderBy: [{ quantity: "asc" }, { updatedAt: "desc" }],
  })
}

export function getActiveProducts() {
  return prisma.product.findMany({
    where: notDeleted,
    orderBy: { createdAt: "desc" },
  })
}

// รายการสินค้าแบบย่อสำหรับ dropdown เลือกสินค้า (Stock In/Out)
export function getProductOptions() {
  return prisma.product.findMany({
    where: notDeleted,
    orderBy: { sku: "asc" },
    select: { id: true, sku: true, name: true, unit: true, quantity: true },
  })
}
