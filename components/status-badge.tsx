import { Badge } from "@/components/ui/badge"
import { getStockStatus, STATUS_META } from "@/lib/product-status"

export function StatusBadge({
  quantity,
  reorderPoint,
}: {
  quantity: number
  reorderPoint: number
}) {
  const meta = STATUS_META[getStockStatus(quantity, reorderPoint)]
  return (
    <Badge variant={meta.variant}>
      <span
        className="size-1.5 rounded-full"
        style={{ background: meta.dot }}
      />
      {meta.label}
    </Badge>
  )
}
