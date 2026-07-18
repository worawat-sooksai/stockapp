import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ต้องสดเสมอ — ห้าม cache ผลตรวจสุขภาพ
export const dynamic = "force-dynamic"

// กัน DB ค้าง (connection hang) ไม่ให้ health check แขวนยาว
// compose/CD healthcheck ต้องได้คำตอบภายในเวลาที่กำหนด
const DB_TIMEOUT_MS = 5000

async function checkDatabase() {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`database timeout after ${DB_TIMEOUT_MS}ms`)), DB_TIMEOUT_MS)
  )

  await Promise.race([prisma.$queryRaw`SELECT 1`, timeout])
}

export async function GET() {
  const startedAt = Date.now()

  try {
    await checkDatabase()

    return NextResponse.json(
      {
        status: "ok",
        database: "up",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    // log รายละเอียดจริงไว้ฝั่ง server เท่านั้น — endpoint นี้ไม่ผ่าน auth
    // จึงไม่ส่ง error message ออกไป (กันหลุด host/credential ของ DB)
    console.error("[health] database check failed:", error)

    return NextResponse.json(
      {
        status: "error",
        database: "down",
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    )
  }
}
