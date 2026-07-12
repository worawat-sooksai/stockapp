import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/icons"

type Tone = "primary" | "info" | "success" | "warning" | "danger"

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
}

export function KpiCard({
  icon,
  tone,
  label,
  value,
  hint,
  valueClassName,
}: {
  icon: IconName
  tone: Tone
  label: string
  value: string
  hint?: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-[18px] shadow-[0_1px_3px_rgba(1,45,46,0.06)]">
      <div className="mb-3 flex items-center justify-between">
        <div
          className={cn(
            "flex size-[38px] items-center justify-center rounded-[10px]",
            TONE_CLASS[tone]
          )}
        >
          <Icon name={icon} size={19} />
        </div>
        {hint && (
          <span className="text-[11px] font-semibold text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
      <div className="mb-1 text-[12.5px] text-text-medium">{label}</div>
      <div className={cn("text-[26px] font-bold text-foreground", valueClassName)}>
        {value}
      </div>
    </div>
  )
}
