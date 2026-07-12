"use client"

import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import type { ProductOption } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"
import { stockIn, stockOut } from "@/app/actions/stock"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icons"

type Mode = "in" | "out"

export function StockForm({
  mode,
  options,
}: {
  mode: Mode
  options: ProductOption[]
}) {
  const isIn = mode === "in"
  const [productId, setProductId] = useState<string>(options[0]?.id ?? "")
  const [qtyText, setQtyText] = useState<string>("1")
  const [note, setNote] = useState<string>("")
  const [pending, startTransition] = useTransition()

  const selected = options.find((o) => o.id === productId)
  const current = selected?.quantity ?? 0
  const qty = Number(qtyText)
  const validQty = Number.isInteger(qty) && qty > 0
  const overDraw = !isIn && validQty && qty > current
  const projected = validQty
    ? isIn
      ? current + qty
      : current - qty
    : current

  const canSubmit = Boolean(selected) && validQty && !overDraw && !pending

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selected) {
      toast.error("กรุณาเลือกสินค้า")
      return
    }
    if (!validQty) {
      toast.error("จำนวนต้องเป็นจำนวนเต็มบวก")
      return
    }

    const formData = new FormData()
    formData.set("productId", productId)
    formData.set("quantity", String(qty))
    if (note.trim()) formData.set("note", note.trim())

    startTransition(async () => {
      const result = isIn ? await stockIn(formData) : await stockOut(formData)
      if (result.ok) {
        toast.success(result.message)
        setQtyText("1")
        setNote("")
      } else {
        toast.error(result.error)
      }
    })
  }

  const accent = isIn ? "text-success" : "text-warning"
  const unit = selected?.unit ?? ""

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:max-w-[920px] lg:grid-cols-[1.4fr_1fr]">
      {/* ฟอร์ม */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-[18px] rounded-2xl border border-border bg-card p-6 shadow-[0_1px_3px_rgba(1,45,46,0.06)]"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product">เลือกสินค้า</Label>
          <Select
            value={productId}
            onValueChange={(value) => setProductId(value as string)}
          >
            <SelectTrigger id="product">
              <SelectValue placeholder="เลือกสินค้า">
                {(value) => {
                  const p = options.find((o) => o.id === value)
                  return p ? `${p.sku} · ${p.name}` : "เลือกสินค้า"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.sku} · {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <div className="text-[11.5px] text-muted-foreground">
              คงเหลือปัจจุบัน {formatNumber(current)} {unit}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">
            {isIn ? "จำนวนที่รับเข้า" : "จำนวนที่เบิก"}
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            step={1}
            value={qtyText}
            onChange={(e) => setQtyText(e.target.value)}
            aria-invalid={overDraw}
          />
          {overDraw && (
            <span className="flex items-center gap-1 text-[11px] text-danger">
              <Icon name="x" size={13} strokeWidth={2} />
              เบิกเกินจำนวนคงเหลือ (เบิกได้ไม่เกิน {formatNumber(current)})
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
          <Textarea
            id="note"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              isIn
                ? "เช่น เลขที่ใบสั่งซื้อ ซัพพลายเออร์..."
                : "เช่น ผู้เบิก แผนก จุดใช้งาน..."
            }
          />
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-12 gap-2 text-[14.5px]"
        >
          {pending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Icon name="check" size={18} strokeWidth={2} />
          )}
          {isIn ? "ยืนยันรับเข้า" : "ยืนยันการเบิกจ่าย"}
        </Button>
      </form>

      {/* สรุปรายการ */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
        <div className="mb-4 text-sm font-bold text-foreground">สรุปรายการ</div>
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-text-medium">คงเหลือปัจจุบัน</span>
            <span className="text-[15px] font-bold text-foreground">
              {formatNumber(current)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-text-medium">
              {isIn ? "จำนวนที่รับเข้า" : "จำนวนที่เบิก"}
            </span>
            <span className={cn("text-[15px] font-bold", accent)}>
              {isIn ? "+ " : "− "}
              {validQty ? formatNumber(qty) : 0}
            </span>
          </div>
          <div className="my-0.5 border-t border-border" />
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-foreground">
              คงเหลือหลังทำรายการ
            </span>
            <span
              className={cn(
                "text-[17px] font-bold",
                overDraw ? "text-danger" : "text-primary"
              )}
            >
              {overDraw ? "—" : formatNumber(projected)}
            </span>
          </div>
        </div>
        <div className="mt-5 flex gap-2 rounded-lg bg-primary-soft px-3.5 py-3">
          <Icon
            name="bulb"
            size={16}
            className="mt-0.5 shrink-0 text-primary"
          />
          <span className="text-[11.5px] leading-relaxed text-primary-dark">
            ระบบตรวจสอบยอดแบบเรียลไทม์ และตัดสต็อกใน Transaction เดียวเพื่อกันเบิกเกินและกัน race condition
          </span>
        </div>
      </div>
    </div>
  )
}
