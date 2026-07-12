"use client"

import { useState, useTransition, type FormEvent } from "react"
import { toast } from "sonner"

import type { ProductDTO } from "@/lib/types"
import { createProduct, updateProduct } from "@/app/actions/products"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/icons"

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-[11px] text-danger">
          <Icon name="x" size={13} strokeWidth={2} />
          {error}
        </span>
      )}
    </div>
  )
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: ProductDTO | null
}) {
  const isEdit = Boolean(product)
  const [pending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result =
        isEdit && product
          ? await updateProduct(product.id, formData)
          : await createProduct(formData)

      if (result.ok) {
        toast.success(result.message)
        setErrors({})
        onOpenChange(false)
      } else {
        setErrors(result.fieldErrors ?? {})
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setErrors({})
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "ปรับข้อมูลสินค้า — จำนวนคงเหลือแก้ผ่านรับเข้า/เบิกจ่ายเท่านั้น"
              : "กรอกข้อมูลสินค้า จำนวนคงเหลือเริ่มต้นที่ 0 (เพิ่มผ่านรับสินค้าเข้า)"}
          </DialogDescription>
        </DialogHeader>

        {/* key รีเซ็ตค่าในฟอร์มเมื่อสลับสินค้า/โหมด */}
        <form
          key={product?.id ?? "new"}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU" htmlFor="sku" error={errors.sku}>
              <Input
                id="sku"
                name="sku"
                placeholder="เช่น SKU-1008"
                defaultValue={product?.sku ?? ""}
                autoComplete="off"
              />
            </Field>
            <Field label="ชื่อสินค้า" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                name="name"
                placeholder="เช่น น้ำดื่ม 600ml (ลัง)"
                defaultValue={product?.name ?? ""}
              />
            </Field>
            <Field label="หมวดหมู่" htmlFor="category" error={errors.category}>
              <Input
                id="category"
                name="category"
                placeholder="เช่น เครื่องดื่ม"
                defaultValue={product?.category ?? ""}
              />
            </Field>
            <Field label="หน่วยนับ" htmlFor="unit" error={errors.unit}>
              <Input
                id="unit"
                name="unit"
                placeholder="เช่น ลัง / ชิ้น / กล่อง"
                defaultValue={product?.unit ?? ""}
              />
            </Field>
            <Field
              label="จุดสั่งซื้อ (reorder)"
              htmlFor="reorderPoint"
              error={errors.reorderPoint}
            >
              <Input
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                min={0}
                step={1}
                placeholder="10"
                defaultValue={product?.reorderPoint ?? 10}
              />
            </Field>
            <Field label="ราคา/หน่วย (บาท)" htmlFor="price" error={errors.price}>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                defaultValue={product?.price ?? ""}
              />
            </Field>
          </div>

          <DialogFooter className="mt-1">
            <DialogClose
              render={
                <Button type="button" variant="secondary" className="h-11 px-5">
                  ยกเลิก
                </Button>
              }
            />
            <Button type="submit" disabled={pending} className="h-11 gap-2 px-5">
              {pending ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Icon name="check" size={17} strokeWidth={2} />
              )}
              {isEdit ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
