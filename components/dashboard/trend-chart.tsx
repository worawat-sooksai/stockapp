import { formatNumber } from "@/lib/format"

export type TrendPoint = { label: string; inQty: number; outQty: number }

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.inQty, d.outQty]))

  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex flex-1 flex-col items-center gap-1.5"
        >
          <div className="flex h-[100px] w-full items-end justify-center gap-[3px]">
            <div
              className="w-1.5 rounded-full bg-primary"
              style={{ height: `${Math.max(3, (d.inQty / max) * 100)}%` }}
              title={`รับเข้า ${formatNumber(d.inQty)}`}
            />
            <div
              className="w-1.5 rounded-full bg-gold"
              style={{ height: `${Math.max(3, (d.outQty / max) * 100)}%` }}
              title={`เบิกจ่าย ${formatNumber(d.outQty)}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
