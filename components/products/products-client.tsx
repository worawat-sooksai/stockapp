"use client"

import { useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

import type { ProductDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatBaht, formatNumber } from "@/lib/format"
import { getStockStatus, type StockStatus } from "@/lib/product-status"
import { deleteProduct } from "@/app/actions/products"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Icon } from "@/components/icons"
import { StatusBadge } from "@/components/status-badge"
import { ProductFormDialog } from "@/components/products/product-form-dialog"

type Filter = "all" | StockStatus

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "normal", label: "ปกติ" },
  { key: "low", label: "ใกล้หมด" },
  { key: "out", label: "หมดสต็อก" },
]

export function ProductsClient({ products }: { products: ProductDTO[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [deleting, setDeleting] = useState<ProductDTO | null>(null)
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchQuery =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      const matchFilter =
        filter === "all" || getStockStatus(p.quantity, p.reorderPoint) === filter
      return matchQuery && matchFilter
    })
  }, [products, query, filter])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: ProductDTO) {
    setEditing(product)
    setFormOpen(true)
  }

  function confirmDelete() {
    if (!deleting) return
    const target = deleting
    startTransition(async () => {
      const result = await deleteProduct(target.id)
      if (result.ok) {
        toast.success(result.message)
        setDeleting(null)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="flex min-w-[200px] max-w-sm flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5">
          <Icon name="search" size={16} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อสินค้า หรือ SKU..."
            className="min-w-0 flex-1 bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-primary bg-primary font-bold text-primary-foreground"
                  : "border-border bg-card text-text-medium hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button onClick={openCreate} className="ml-auto h-11 gap-1.5 px-4">
          <Icon name="plus" size={16} strokeWidth={2} />
          เพิ่มสินค้า
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>SKU</TableHead>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead className="text-right">คงเหลือ</TableHead>
              <TableHead className="text-right">จุดสั่งซื้อ</TableHead>
              <TableHead className="text-right">มูลค่ารวม</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {products.length === 0
                    ? "ยังไม่มีสินค้า — กดปุ่ม “เพิ่มสินค้า” เพื่อเริ่มต้น"
                    : "ไม่พบสินค้าที่ตรงกับเงื่อนไข"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
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
                  <TableCell className="text-right text-[13px] font-semibold text-foreground">
                    {formatBaht(p.quantity * p.price)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      quantity={p.quantity}
                      reorderPoint={p.reorderPoint}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="text-[12.5px] font-bold text-primary hover:underline"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(p)}
                        className="text-[12.5px] font-bold text-danger hover:underline"
                      >
                        ลบ
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
      />

      {/* ยืนยันการลบ */}
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(next) => {
          if (!next && !pending) setDeleting(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยืนยันการลบสินค้า</DialogTitle>
            <DialogDescription>
              ต้องการลบ{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>{" "}
              ({deleting?.sku}) ใช่หรือไม่? ประวัติการเคลื่อนไหวจะยังถูกเก็บไว้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 px-5"
                  disabled={pending}
                >
                  ยกเลิก
                </Button>
              }
            />
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending}
              className="h-11 gap-2 px-5"
            >
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-danger/30 border-t-danger" />
              ) : (
                <Icon name="trash" size={16} strokeWidth={2} />
              )}
              ลบสินค้า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
