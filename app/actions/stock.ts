"use server"

import { revalidatePath } from "next/cache"

import { prisma } from "@/lib/prisma"
import { TransactionType } from "@/src/generated/prisma/enums"
import { stockMovementSchema } from "@/lib/validations"
import { formatNumber } from "@/lib/format"
import type { ActionResult } from "@/lib/types"

function parseMovement(formData: FormData) {
  return stockMovementSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    note: formData.get("note") ?? undefined,
  })
}

function firstFieldError(
  flattened: Record<string, string[] | undefined>
): string {
  for (const messages of Object.values(flattened)) {
    if (messages && messages.length > 0) return messages[0]
  }
  return "ข้อมูลไม่ถูกต้อง"
}

function revalidateAll() {
  revalidatePath("/")
  revalidatePath("/products")
  revalidatePath("/stock-in")
  revalidatePath("/stock-out")
  revalidatePath("/low-stock")
}

export async function stockIn(formData: FormData): Promise<ActionResult> {
  const parsed = parseMovement(formData)
  if (!parsed.success) {
    return { ok: false, error: firstFieldError(parsed.error.flatten().fieldErrors) }
  }
  const { productId, quantity, note } = parsed.data

  const outcome = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { name: true, quantity: true, unit: true },
    })
    if (!product) return { kind: "notfound" as const }

    // สร้าง transaction IN + เพิ่ม quantity ในทรานแซกชันเดียว (atomic)
    await tx.stockTransaction.create({
      data: { productId, type: TransactionType.IN, quantity, note },
    })
    const updated = await tx.product.update({
      where: { id: productId },
      data: { quantity: { increment: quantity } },
      select: { quantity: true },
    })

    return {
      kind: "ok" as const,
      name: product.name,
      unit: product.unit,
      remaining: updated.quantity,
    }
  })

  if (outcome.kind === "notfound") {
    return { ok: false, error: "ไม่พบสินค้าที่เลือก" }
  }

  revalidateAll()
  return {
    ok: true,
    message: `รับเข้า "${outcome.name}" +${formatNumber(quantity)} ${outcome.unit} · คงเหลือ ${formatNumber(outcome.remaining)}`,
  }
}

export async function stockOut(formData: FormData): Promise<ActionResult> {
  const parsed = parseMovement(formData)
  if (!parsed.success) {
    return { ok: false, error: firstFieldError(parsed.error.flatten().fieldErrors) }
  }
  const { productId, quantity, note } = parsed.data

  const outcome = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { name: true, quantity: true, unit: true },
    })
    if (!product) return { kind: "notfound" as const }

    // กันเบิกเกิน + กัน race: update แบบมีเงื่อนไข quantity >= จำนวนที่เบิก
    // ถ้าเงื่อนไขไม่ผ่าน count จะเป็น 0 → ปฏิเสธ ไม่แตะสต็อก ไม่สร้าง transaction
    const updated = await tx.product.updateMany({
      where: { id: productId, deletedAt: null, quantity: { gte: quantity } },
      data: { quantity: { decrement: quantity } },
    })
    if (updated.count === 0) {
      return {
        kind: "insufficient" as const,
        name: product.name,
        available: product.quantity,
        unit: product.unit,
      }
    }

    await tx.stockTransaction.create({
      data: { productId, type: TransactionType.OUT, quantity, note },
    })

    return {
      kind: "ok" as const,
      name: product.name,
      unit: product.unit,
      remaining: product.quantity - quantity,
    }
  })

  if (outcome.kind === "notfound") {
    return { ok: false, error: "ไม่พบสินค้าที่เลือก" }
  }
  if (outcome.kind === "insufficient") {
    return {
      ok: false,
      error: `เบิกเกินจำนวนคงเหลือ — "${outcome.name}" มีเพียง ${formatNumber(outcome.available)} ${outcome.unit}`,
      fieldErrors: { quantity: `เบิกได้ไม่เกิน ${formatNumber(outcome.available)}` },
    }
  }

  revalidateAll()
  return {
    ok: true,
    message: `เบิกจ่าย "${outcome.name}" −${formatNumber(quantity)} ${outcome.unit} · คงเหลือ ${formatNumber(outcome.remaining)}`,
  }
}
