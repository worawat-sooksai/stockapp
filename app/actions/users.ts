"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { ActionResult } from "@/lib/types"

export async function deleteUser(id: string): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { ok: false, error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }
  }
  if (session.user.id === id) {
    return { ok: false, error: "ไม่สามารถลบบัญชีของตัวเองได้" }
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  })
  if (!existing) {
    return { ok: false, error: "ไม่พบผู้ใช้ที่ต้องการลบ" }
  }

  // ลบผู้ใช้ + session/account ที่ผูกไว้จะถูกลบตาม (FK onDelete: Cascade)
  await prisma.user.delete({ where: { id } })

  revalidatePath("/users")
  return { ok: true, message: `ลบผู้ใช้ "${existing.name}" แล้ว` }
}
