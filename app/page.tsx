import Link from "next/link"

import { prisma } from "@/lib/prisma"
import {
  formatBaht,
  formatNumber,
  formatThaiDate,
  formatThaiTime,
} from "@/lib/format"
import { AppShell } from "@/components/layout/app-shell"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { TrendChart, type TrendPoint } from "@/components/dashboard/trend-chart"
import { StatusBadge } from "@/components/status-badge"
import { Icon } from "@/components/icons"

export const dynamic = "force-dynamic"

const DAY_MS = 24 * 60 * 60 * 1000
const TREND_DAYS = 14

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function DashboardPage() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { sku: "asc" },
  })

  const skuCount = products.length
  const stockValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.price),
    0
  )
  const lowCount = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.reorderPoint
  ).length
  const outCount = products.filter((p) => p.quantity === 0).length
  const nearOrOut = lowCount + outCount

  const recent = await prisma.stockTransaction.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, unit: true } } },
  })

  // แนวโน้มการเคลื่อนไหว IN vs OUT ย้อนหลัง 14 วัน
  const trendStart = startOfDay(new Date(Date.now() - (TREND_DAYS - 1) * DAY_MS))
  const trendTxns = await prisma.stockTransaction.findMany({
    where: { createdAt: { gte: trendStart } },
    select: { type: true, quantity: true, createdAt: true },
  })
  const trend: TrendPoint[] = Array.from({ length: TREND_DAYS }, (_, i) => {
    const d = new Date(trendStart.getTime() + i * DAY_MS)
    return { label: String(d.getDate()), inQty: 0, outQty: 0 }
  })
  for (const t of trendTxns) {
    const idx = Math.floor(
      (startOfDay(t.createdAt).getTime() - trendStart.getTime()) / DAY_MS
    )
    if (idx >= 0 && idx < TREND_DAYS) {
      if (t.type === "IN") trend[idx].inQty += t.quantity
      else trend[idx].outQty += t.quantity
    }
  }

  const subtitle = `${formatThaiDate(new Date())} · ภาพรวมคลังสินค้า`

  return (
    <AppShell title="หน้าหลักคลังสินค้า" subtitle={subtitle} lowStockCount={nearOrOut}>
      {/* KPI */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="box"
          tone="primary"
          label="สินค้าทั้งหมด"
          value={`${formatNumber(skuCount)} รายการ`}
          hint="SKU"
        />
        <KpiCard
          icon="wallet"
          tone="info"
          label="มูลค่าสต็อกรวม"
          value={formatBaht(stockValue)}
          hint="คงเหลือ"
        />
        <KpiCard
          icon="alertTri"
          tone="warning"
          label="สินค้าใกล้หมด"
          value={`${formatNumber(lowCount)} รายการ`}
          hint="ต่ำกว่าจุดสั่งซื้อ"
          valueClassName={lowCount > 0 ? "text-warning" : undefined}
        />
        <KpiCard
          icon="alertTri"
          tone="danger"
          label="สินค้าหมดสต็อก"
          value={`${formatNumber(outCount)} รายการ`}
          hint="คงเหลือ 0"
          valueClassName={outCount > 0 ? "text-danger" : undefined}
        />
      </div>

      {/* Alert banner */}
      {nearOrOut > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-warning/25 bg-warning-bg px-4 py-3.5">
          <Icon name="alertTri" size={20} className="text-warning" />
          <div className="min-w-[200px] flex-1 text-[13px] text-warning-foreground">
            มีสินค้า <strong>{formatNumber(lowCount)} รายการ</strong>{" "}
            ต่ำกว่าจุดสั่งซื้อ และ{" "}
            <strong>{formatNumber(outCount)} รายการ</strong> หมดสต็อก —
            ควรเปิดใบสั่งซื้อรับเข้าโดยด่วน
          </div>
          <Link
            href="/low-stock"
            className="rounded-lg bg-warning px-4 py-2 text-[12.5px] font-bold whitespace-nowrap text-white no-underline"
          >
            ดูรายการ
          </Link>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* รายการสินค้าในคลัง */}
        <div className="overflow-x-auto rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
          <div className="mb-3.5 flex items-center justify-between">
            <div className="text-sm font-bold text-foreground">
              รายการสินค้าในคลัง
            </div>
            <Link
              href="/products"
              className="text-[12.5px] font-bold text-primary no-underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="min-w-[480px]">
            <div className="grid grid-cols-[90px_1fr_70px_90px] gap-2 border-b border-border px-2 pb-2.5 text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
              <span>SKU</span>
              <span>ชื่อสินค้า</span>
              <span>คงเหลือ</span>
              <span>สถานะ</span>
            </div>
            {products.length === 0 ? (
              <div className="px-2 py-8 text-center text-sm text-muted-foreground">
                ยังไม่มีสินค้าในคลัง
              </div>
            ) : (
              products.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[90px_1fr_70px_90px] items-center gap-2 border-b border-border px-2 py-2.5 last:border-0"
                >
                  <span className="font-mono text-[11.5px] text-muted-foreground">
                    {p.sku}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-foreground">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.category}
                    </div>
                  </div>
                  <span className="text-[13px] font-bold text-foreground">
                    {formatNumber(p.quantity)}
                  </span>
                  <StatusBadge quantity={p.quantity} reorderPoint={p.reorderPoint} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* ขวา: กราฟ + รายการล่าสุด */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
            <div className="mb-3.5 text-sm font-bold text-foreground">
              การเคลื่อนไหวสต็อก {TREND_DAYS} วัน
            </div>
            <TrendChart data={trend} />
            <div className="mt-2.5 flex justify-center gap-4">
              <span className="flex items-center gap-1.5 text-[11.5px] text-text-medium">
                <span className="size-2 rounded-full bg-primary" />
                รับเข้า
              </span>
              <span className="flex items-center gap-1.5 text-[11.5px] text-text-medium">
                <span className="size-2 rounded-full bg-gold" />
                เบิกจ่าย
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
            <div className="mb-3.5 text-sm font-bold text-foreground">
              รายการล่าสุด
            </div>
            {recent.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                ยังไม่มีการเคลื่อนไหว
              </div>
            ) : (
              recent.map((t) => {
                const isIn = t.type === "IN"
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-2.5 border-b border-border py-2.5 last:border-0"
                  >
                    <div
                      className={
                        "flex size-[30px] shrink-0 items-center justify-center rounded-[9px] " +
                        (isIn
                          ? "bg-success-bg text-success"
                          : "bg-warning-bg text-warning")
                      }
                    >
                      <Icon name={isIn ? "inTray" : "outTray"} size={15} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-foreground">
                        {isIn ? "รับเข้า" : "เบิกจ่าย"} · {t.product.name}
                      </div>
                      {t.note && (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {t.note}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={
                          "text-[13px] font-bold " +
                          (isIn ? "text-success" : "text-warning")
                        }
                      >
                        {isIn ? "+" : "−"}
                        {formatNumber(t.quantity)}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground">
                        {formatThaiTime(t.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
