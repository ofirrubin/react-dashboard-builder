import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface StatWidgetProps {
  label: string
  value: string
  /** Change since the previous period, e.g. "+20.1%". */
  delta?: string
  trend?: "up" | "down" | "flat"
  /** Small note under the value, e.g. "vs. last month". */
  hint?: string
  className?: string
}

/**
 * A single headline number.
 *
 * Every colour here comes from a theme token, so the widget follows the host
 * app's palette and dark mode with no `dark:` overrides of its own.
 */
export function StatWidget({
  label,
  value,
  delta,
  trend = "flat",
  hint,
  className,
}: StatWidgetProps) {
  const TrendIcon = trend === "up" ? TrendingUpIcon : trend === "down" ? TrendingDownIcon : null

  return (
    <div className={cn("flex h-full flex-col justify-center gap-1", className)}>
      <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {delta && (
          <Badge variant={trend === "down" ? "destructive" : "secondary"}>
            {TrendIcon && <TrendIcon data-icon="inline-start" />}
            {delta}
          </Badge>
        )}
      </div>
      {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
    </div>
  )
}
