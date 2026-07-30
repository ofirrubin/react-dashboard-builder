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

const PREVIEW_ROWS = [
  { fill: "72%", label: "w-10" },
  { fill: "45%", label: "w-8" },
  { fill: "88%", label: "w-12" },
]

/**
 * Miniature for the add-widget bar. The bars fill as the bar opens, staggered,
 * then rest at their real values — so it still reads as progress at rest.
 */
export function ProgressWidgetPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {PREVIEW_ROWS.map((row, index) => (
        <div key={row.fill} className="flex flex-col gap-1">
          <span className={cn("bg-muted-foreground/25 h-1 rounded-full", row.label)} />
          <span className="bg-muted h-1.5 overflow-hidden rounded-full">
            <span
              className="bg-primary block h-full origin-left rounded-full motion-safe:[animation:dashboard-fill-x_520ms_cubic-bezier(0.2,0,0,1)_backwards]"
              style={{ width: row.fill, animationDelay: `${index * 80}ms` }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}
