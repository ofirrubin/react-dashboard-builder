"use client"

import { PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import type { WidgetCatalog } from "./use-dashboard"

/**
 * The add-widget bar.
 *
 * A bar that expands in place rather than a popover, so you can see the
 * dashboard you are adding to while you choose — and so each entry has room for
 * a real miniature of the widget instead of just a name and an icon.
 *
 * Entries stagger in. The delay is capped so a large catalogue does not turn the
 * reveal into a slow cascade.
 */
const STAGGER_MS = 55
const STAGGER_CAP_MS = 330

export interface DashboardWidgetBarProps {
  widgets: WidgetCatalog
  onAddWidget: (type: string) => void
  className?: string
}

export function DashboardWidgetBar({
  widgets,
  onAddWidget,
  className,
}: DashboardWidgetBarProps) {
  const entries = Object.entries(widgets)

  return (
    <div
      data-slot="dashboard-widget-bar"
      className={cn(
        "bg-card/60 rounded-xl border p-3",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2",
        "motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.2,0,0,1)]",
        className
      )}
    >
      {entries.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No widgets registered.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(([type, definition], index) => {
            const Icon = definition.icon
            const size = definition.defaultSize ?? { w: 4, h: 3 }
            return (
              <button
                key={type}
                type="button"
                onClick={() => onAddWidget(type)}
                aria-label={`Add ${definition.title}`}
                style={{ animationDelay: `${Math.min(index * STAGGER_MS, STAGGER_CAP_MS)}ms` }}
                className={cn(
                  "group/entry flex flex-col gap-2 rounded-lg border p-2 text-left",
                  // Concentric: bar radius (--radius-xl) minus its p-3 inset.
                  "hover:border-primary/40 hover:bg-accent/40",
                  "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                  "transition-[background-color,border-color,box-shadow,translate] duration-150",
                  "motion-safe:hover:-translate-y-px hover:shadow-sm",
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1",
                  "motion-safe:fill-mode-backwards motion-safe:duration-300"
                )}
              >
                {/*
                  The miniature. `pointer-events-none` so the whole entry stays
                  one click target, and `overflow-hidden` so a preview that draws
                  outside its box cannot break the grid.
                */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "bg-background/60 pointer-events-none relative h-20 overflow-hidden rounded-md border p-2",
                    "transition-colors duration-150 group-hover/entry:border-primary/30"
                  )}
                >
                  {definition.preview ? (
                    definition.preview()
                  ) : (
                    <div className="text-muted-foreground/50 flex h-full items-center justify-center [&_svg]:size-6">
                      {Icon ? <Icon /> : <PlusIcon />}
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm leading-none font-medium">
                      {Icon && (
                        <span className="text-muted-foreground [&_svg]:size-3.5">
                          <Icon />
                        </span>
                      )}
                      <span className="truncate">{definition.title}</span>
                    </span>
                    {definition.description && (
                      <span className="text-muted-foreground text-xs text-pretty">
                        {definition.description}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {size.w}&times;{size.h}
                  </Badge>
                </div>

                {/*
                  Not a nested <button> — that would be invalid HTML inside a
                  button. It is a styled affordance; the whole entry is clickable.
                */}
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="pointer-events-none w-full group-hover/entry:bg-primary group-hover/entry:text-primary-foreground"
                >
                  <span>
                    <PlusIcon data-icon="inline-start" />
                    Add
                  </span>
                </Button>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
