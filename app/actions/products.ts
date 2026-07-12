"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validations"
import { isUniqueConstraintError, type ActionResult } from "@/lib/types"

function parseProduct(formData: FormData) {
  return productSchema.safeParse({
    sku: formData.get("sku"),
    name: formData.get("name"),
    category: formData.get("category"),
    unit: formData.get("unit"),
    reorderPoint: formData.get("reorderPoint"),
    price: formData.get("price"),
  })
}

function toFieldErrors(
  flattened: Record<string, string[] | undefined>
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) result[key] = messages[0]
  }
  return result
}

function revalidateAll() {
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath("/stock-in")
  revalidatePath("/stock-out")
  revalidatePath("/low-stock")
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const parsed = parseProduct(formData)
  if (!parsed.success) {
    return {
      ok: false,
      error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    }
  }

  try {
    await prisma.product.create({ data: parsed.data })
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return {
        ok: false,
        error: `SKU "${parsed.data.sku}" ถูกใช้ไปแล้ว`,
        fieldErrors: { sku: "SKU นี้มีอยู่ในระบบแล้ว" },
      }
    }
    throw e
  }

  revalidateAll()
  return { ok: true, message: `เพิ่มสินค้า "${parsed.data.name}" เรียบร้อย` }
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseProduct(formData)
  if (!parsed.success) {
    return {
      ok: false,
      error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    }
  }

  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  })
  if (!existing) {
    return { ok: false, error: "ไม่พบสินค้าที่ต้องการแก้ไข" }
  }

  try {
    // ไม่แก้ quantity ตรง ๆ — ปรับได้ผ่าน Stock In/Out เท่านั้น
    await prisma.product.update({ where: { id }, data: parsed.data })
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return {
        ok: false,
        error: `SKU "${parsed.data.sku}" ถูกใช้ไปแล้ว`,
        fieldErrors: { sku: "SKU นี้มีอยู่ในระบบแล้ว" },
      }
    }
    throw e
  }

  revalidateAll()
  return { ok: true, message: `บันทึกการแก้ไข "${parsed.data.name}" เรียบร้อย` }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { name: true },
  })
  if (!existing) {
    return { ok: false, error: "ไม่พบสินค้าที่ต้องการลบ" }
  }

  // soft-delete — เก็บประวัติการเคลื่อนไหวไว้ (spec F1)
  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  revalidateAll()
  return { ok: true, message: `ลบสินค้า "${existing.name}" แล้ว (เก็บประวัติไว้)` }
}
