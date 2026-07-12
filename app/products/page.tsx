import { getActiveProducts, getLowStockCount } from "@/lib/queries"
import { formatNumber } from "@/lib/format"
import type { ProductDTO } from "@/lib/types"
import { AppShell } from "@/components/layout/app-shell"
import { ProductsClient } from "@/components/products/products-client"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  const [products, lowStockCount] = await Promise.all([
    getActiveProducts(),
    getLowStockCount(),
  ])

  const dtos: ProductDTO[] = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    unit: p.unit,
    quantity: p.quantity,
    reorderPoint: p.reorderPoint,
    price: Number(p.price),
  }))

  return (
    <AppShell
      title="จัดการสินค้า"
      subtitle={`ทั้งหมด ${formatNumber(dtos.length)} รายการ`}
      lowStockCount={lowStockCount}
    >
      <ProductsClient products={dtos} />
    </AppShell>
  )
}
