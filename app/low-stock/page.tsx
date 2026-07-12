import Link from "next/link"

import { getLowStockProducts } from "@/lib/queries"
import { formatNumber } from "@/lib/format"
import { AppShell } from "@/components/layout/app-shell"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Icon } from "@/components/icons"

export const dynamic = "force-dynamic"

export default async function LowStockPage() {
  const products = await getLowStockProducts()
  const lowStockCount = products.length

  return (
    <AppShell
      title="สินค้าใกล้หมด"
      subtitle={`รายการที่คงเหลือต่ำกว่าหรือเท่ากับจุดสั่งซื้อ (${formatNumber(lowStockCount)} รายการ)`}
      lowStockCount={lowStockCount}
    >
      <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>SKU</TableHead>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead className="text-right">คงเหลือ</TableHead>
              <TableHead className="text-right">จุดสั่งซื้อ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  🎉 ไม่มีสินค้าใกล้หมด — สต็อกทุกรายการอยู่เหนือจุดสั่งซื้อ
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-[11.5px] text-muted-foreground">
                    {p.sku}
                  </TableCell>
                  <TableCell>
                    <div className="text-[13px] font-bold text-foreground">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {p.category}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-[13px] font-bold text-foreground">
                    {formatNumber(p.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-[13px] text-text-medium">
                    {formatNumber(p.reorderPoint)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      quantity={p.quantity}
                      reorderPoint={p.reorderPoint}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Link
                        href="/stock-in"
                        className="inline-flex w-fit items-center gap-1.5 rounded-[9px] bg-primary px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground no-underline hover:bg-primary/90"
                      >
                        <Icon name="inTray" size={14} strokeWidth={2} />
                        รับเข้า
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  )
}
