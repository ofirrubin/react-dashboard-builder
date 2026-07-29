import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

export interface ProgressWidgetRow {
  label: string
  value: number
  max?: number
  /** Optional right-hand caption. Defaults to a percentage. */
  caption?: string
}

export interface ProgressWidgetProps {
  rows: ProgressWidgetRow[]
  className?: string
}

/** A stack of labelled progress bars — quotas, goals, capacity. */
export function ProgressWidget({ rows, className }: ProgressWidgetProps) {
  return (
    <div className={cn("flex h-full flex-col justify-center gap-3", className)}>
      {rows.map((row) => {
        const max = row.max ?? 100
        const percent = max === 0 ? 0 : Math.round((row.value / max) * 100)
        return (
          <div key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm font-medium">{row.label}</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {row.caption ?? `${percent}%`}
              </span>
            </div>
            <Progress value={percent} aria-label={`${row.label}: ${percent}%`} />
          </div>
        )
      })}
    </div>
  )
}
