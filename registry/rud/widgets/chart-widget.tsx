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

const PREVIEW_BARS = [45, 80, 60, 95, 70]

/**
 * Miniature for the add-widget bar.
 *
 * Plain CSS bars rather than a real chart: recharts would mount a
 * ResponsiveContainer and its own resize observer for every palette entry,
 * which is a lot of machinery for an 80px thumbnail.
 *
 * The bars grow up as the bar opens, staggered, then rest at their real heights
 * — so it reads as a chart even after the animation finishes. `scaleY` keeps the
 * work on the compositor; animating `height` would relayout every frame.
 */
export function ChartWidgetPreview() {
  return (
    <div className="flex h-full items-end gap-1">
      {PREVIEW_BARS.map((height, index) => (
        <span
          key={index}
          // Uses the same chart token as the real widget, so the miniature is
          // an honest preview of what gets placed.
          className="flex-1 origin-bottom rounded-sm bg-[var(--chart-1)] opacity-80 motion-safe:[animation:dashboard-grow-y_460ms_cubic-bezier(0.2,0,0,1)_backwards]"
          style={{ height: `${height}%`, animationDelay: `${index * 55}ms` }}
        />
      ))}
    </div>
  )
}
