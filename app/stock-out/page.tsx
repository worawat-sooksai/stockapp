import Link from "next/link"

import { getProductOptions, getLowStockCount } from "@/lib/queries"
import { AppShell } from "@/components/layout/app-shell"
import { StockForm } from "@/components/stock/stock-form"

export const dynamic = "force-dynamic"

export default async function StockOutPage() {
  const [options, lowStockCount] = await Promise.all([
    getProductOptions(),
    getLowStockCount(),
  ])

  return (
    <AppShell
      title="เบิกจ่ายสินค้า"
      subtitle="บันทึกการเบิกจ่ายและตัดยอดสต็อกอัตโนมัติ (กันเบิกเกิน)"
      lowStockCount={lowStockCount}
    >
      {options.length === 0 ? (
        <EmptyState />
      ) : (
        <StockForm mode="out" options={options} />
      )}
    </AppShell>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
      <p className="text-sm text-muted-foreground">
        ยังไม่มีสินค้าในระบบ — กรุณา{" "}
        <Link href="/products" className="font-bold text-primary hover:underline">
          เพิ่มสินค้า
        </Link>{" "}
        ก่อนทำรายการเบิกจ่าย
      </p>
    </div>
  )
}
