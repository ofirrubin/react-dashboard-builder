"use client"

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { cn } from "@/lib/utils"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface ChartWidgetProps {
  data: { label: string; value: number }[]
  /** Legend/tooltip name for the series. */
  seriesName?: string
  variant?: "bar" | "area"
  /** Any chart token, e.g. "var(--chart-1)". */
  color?: string
  className?: string
}

/**
 * A compact chart sized to fill its grid cell.
 *
 * `ChartContainer` defaults to `aspect-video`; a dashboard widget has a height
 * fixed by the grid instead, so we swap in `aspect-auto` and fill the cell.
 *
 * Animation is off deliberately. The grid re-measures on resize, and replaying
 * a grow-from-zero intro on every measure both looks broken and can leave bars
 * stranded at zero height if measures arrive faster than the animation.
 */
export function ChartWidget({
  data,
  seriesName = "Value",
  variant = "bar",
  color = "var(--chart-1)",
  className,
}: ChartWidgetProps) {
  const config = {
    value: { label: seriesName, color },
  } satisfies ChartConfig

  const axis = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="label"
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        minTickGap={8}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
    </>
  )

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-full w-full", className)}
    >
      {variant === "area" ? (
        <AreaChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          {axis}
          <Area
            dataKey="value"
            type="natural"
            stroke="var(--color-value)"
            fill="var(--color-value)"
            fillOpacity={0.2}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
          {axis}
          <Bar dataKey="value" fill="var(--color-value)" radius={4} isAnimationActive={false} />
        </BarChart>
      )}
    </ChartContainer>
  )
}
