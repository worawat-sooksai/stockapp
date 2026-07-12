// สถานะสต็อกสินค้า — ใกล้หมด = quantity <= reorderPoint · หมด = quantity == 0
import type { badgeVariants } from "@/components/ui/badge"
import type { VariantProps } from "class-variance-authority"

export type StockStatus = "normal" | "low" | "out"

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"]

export function getStockStatus(quantity: number, reorderPoint: number): StockStatus {
  if (quantity <= 0) return "out"
  if (quantity <= reorderPoint) return "low"
  return "normal"
}

export const STATUS_META: Record<
  StockStatus,
  { label: string; variant: BadgeVariant; dot: string }
> = {
  normal: { label: "ปกติ", variant: "success", dot: "var(--success)" },
  low: { label: "ใกล้หมด", variant: "warning", dot: "var(--warning)" },
  out: { label: "หมดสต็อก", variant: "danger", dot: "var(--danger)" },
}
