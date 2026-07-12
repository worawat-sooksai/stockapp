import { prisma } from "@/lib/prisma"
import { getLowStockCount } from "@/lib/queries"
import { formatBaht, formatNumber } from "@/lib/format"
import { AppShell } from "@/components/layout/app-shell"
import { KpiCard } from "@/components/dashboard/kpi-card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"

export const dynamic = "force-dynamic"

const DAY_MS = 24 * 60 * 60 * 1000
const REPORT_DAYS = 30

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export default async function ReportsPage() {
  const since = startOfDay(new Date(Date.now() - (REPORT_DAYS - 1) * DAY_MS))

  const [products, txns, lowStockCount] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { category: "asc" },
    }),
    prisma.stockTransaction.findMany({
      where: { createdAt: { gte: since } },
      include: { product: { select: { name: true, sku: true, unit: true } } },
    }),
    getLowStockCount(),
  ])

  // สรุป KPI ช่วง 30 วัน
  let totalIn = 0
  let totalOut = 0
  for (const t of txns) {
    if (t.type === "IN") totalIn += t.quantity
    else totalOut += t.quantity
  }
  const stockValue = products.reduce(
    (sum, p) => sum + p.quantity * Number(p.price),
    0
  )

  // สรุปตามหมวดหมู่
  const catMap = new Map<
    string,
    { skuCount: number; qty: number; value: number }
  >()
  for (const p of products) {
    const c = catMap.get(p.category) ?? { skuCount: 0, qty: 0, value: 0 }
    c.skuCount += 1
    c.qty += p.quantity
    c.value += p.quantity * Number(p.price)
    catMap.set(p.category, c)
  }
  const categories = Array.from(catMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.value - a.value)

  // สินค้าที่เคลื่อนไหวสูงสุดในช่วง 30 วัน
  const moveMap = new Map<
    string,
    { sku: string; name: string; unit: string; inQty: number; outQty: number }
  >()
  for (const t of txns) {
    const m = moveMap.get(t.productId) ?? {
      sku: t.product.sku,
      name: t.product.name,
      unit: t.product.unit,
      inQty: 0,
      outQty: 0,
    }
    if (t.type === "IN") m.inQty += t.quantity
    else m.outQty += t.quantity
    moveMap.set(t.productId, m)
  }
  const topMoving = Array.from(moveMap.values())
    .sort((a, b) => b.inQty + b.outQty - (a.inQty + a.outQty))
    .slice(0, 8)

  return (
    <AppShell
      title="รายงาน"
      subtitle={`สรุปข้อมูลคลังสินค้าย้อนหลัง ${REPORT_DAYS} วัน`}
      lowStockCount={lowStockCount}
    >
      {/* KPI */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon="inTray"
          tone="success"
          label="รับเข้าทั้งหมด"
          value={`${formatNumber(totalIn)} หน่วย`}
          hint={`${REPORT_DAYS} วัน`}
        />
        <KpiCard
          icon="outTray"
          tone="warning"
          label="เบิกจ่ายทั้งหมด"
          value={`${formatNumber(totalOut)} หน่วย`}
          hint={`${REPORT_DAYS} วัน`}
        />
        <KpiCard
          icon="wallet"
          tone="info"
          label="มูลค่าสต็อกรวม"
          value={formatBaht(stockValue)}
          hint="ปัจจุบัน"
        />
        <KpiCard
          icon="chart"
          tone="primary"
          label="จำนวนธุรกรรม"
          value={`${formatNumber(txns.length)} รายการ`}
          hint={`${REPORT_DAYS} วัน`}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        {/* สรุปตามหมวดหมู่ */}
        <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
          <div className="border-b border-border px-5 py-4 text-sm font-bold text-foreground">
            มูลค่าสต็อกตามหมวดหมู่
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">SKU</TableHead>
                <TableHead className="text-right">คงเหลือ</TableHead>
                <TableHead className="text-right">มูลค่ารวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    ยังไม่มีสินค้าในคลัง
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="text-[13px] font-bold text-foreground">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-right text-[13px] text-text-medium">
                      {formatNumber(c.skuCount)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] text-text-medium">
                      {formatNumber(c.qty)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold text-foreground">
                      {formatBaht(c.value)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* สินค้าเคลื่อนไหวสูงสุด */}
        <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
          <div className="border-b border-border px-5 py-4 text-sm font-bold text-foreground">
            สินค้าเคลื่อนไหวสูงสุด ({REPORT_DAYS} วัน)
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-right">รับเข้า</TableHead>
                <TableHead className="text-right">เบิกจ่าย</TableHead>
                <TableHead className="text-right">สุทธิ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topMoving.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    ยังไม่มีการเคลื่อนไหวในช่วงนี้
                  </TableCell>
                </TableRow>
              ) : (
                topMoving.map((m) => {
                  const net = m.inQty - m.outQty
                  return (
                    <TableRow key={m.sku}>
                      <TableCell>
                        <div className="text-[13px] font-bold text-foreground">
                          {m.name}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {m.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-semibold text-success">
                        +{formatNumber(m.inQty)}
                      </TableCell>
                      <TableCell className="text-right text-[13px] font-semibold text-warning">
                        −{formatNumber(m.outQty)}
                      </TableCell>
                      <TableCell
                        className={
                          "text-right text-[13px] font-bold " +
                          (net >= 0 ? "text-foreground" : "text-danger")
                        }
                      >
                        {net >= 0 ? "+" : "−"}
                        {formatNumber(Math.abs(net))}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  )
}
