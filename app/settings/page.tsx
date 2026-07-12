import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { getLowStockCount } from "@/lib/queries"
import { formatThaiDateShort } from "@/lib/format"
import { AppShell } from "@/components/layout/app-shell"
import { ThemeSetting } from "@/components/settings/theme-setting"

export const dynamic = "force-dynamic"

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span className="text-[13px] text-text-medium">{label}</span>
      <span className="text-[13px] font-semibold text-foreground">{value}</span>
    </div>
  )
}

function SettingsCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
      <div className="mb-3 text-sm font-bold text-foreground">{title}</div>
      {children}
    </div>
  )
}

export default async function SettingsPage() {
  const [session, lowStockCount] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLowStockCount(),
  ])

  const user = session?.user

  return (
    <AppShell
      title="ตั้งค่า"
      subtitle="ข้อมูลบัญชี การแสดงผล และรายละเอียดแอปพลิเคชัน"
      lowStockCount={lowStockCount}
    >
      <div className="grid max-w-3xl grid-cols-1 gap-4">
        {/* บัญชีของฉัน */}
        <SettingsCard title="บัญชีของฉัน">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold text-foreground">
                  {user.name}
                </div>
                <div className="truncate text-[13px] text-muted-foreground">
                  {user.email}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  สมัครเมื่อ {formatThaiDateShort(new Date(user.createdAt))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[13px] text-muted-foreground">
              ไม่พบข้อมูลบัญชี — กรุณาเข้าสู่ระบบใหม่
            </div>
          )}
        </SettingsCard>

        {/* ธีมการแสดงผล */}
        <SettingsCard title="ธีมการแสดงผล">
          <p className="mb-3 text-[12.5px] text-muted-foreground">
            เลือกโหมดการแสดงผล ระบบจะจดจำค่าไว้ในเบราว์เซอร์ของคุณ
          </p>
          <ThemeSetting />
        </SettingsCard>

        {/* เกี่ยวกับแอป */}
        <SettingsCard title="เกี่ยวกับแอปพลิเคชัน">
          <InfoRow label="ชื่อระบบ" value="Genius Stock" />
          <InfoRow label="คำอธิบาย" value="ระบบคลังสินค้าเบิกจ่าย" />
          <InfoRow label="เวอร์ชัน" value="1.0.0 (MVP · Phase 2)" />
          <InfoRow label="จำนวนคลัง" value="คลังเดียว" />
          <InfoRow label="ฐานข้อมูล" value="PostgreSQL" />
        </SettingsCard>
      </div>
    </AppShell>
  )
}
