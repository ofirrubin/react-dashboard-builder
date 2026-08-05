"use client"

import * as React from "react"
import { LayoutGridIcon } from "lucide-react"
import { canvasHeight, colPitch, gridToPixel, rowPitch, spanToPixels } from "rud-dashboard"
import type { GridConfig, GridFrame, GridStyle, SerializedItem } from "rud-dashboard"

import { cn } from "@/lib/utils"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { TooltipProvider } from "@/components/ui/tooltip"

import { DashboardItem } from "./dashboard-item"
import { DashboardToolbar } from "./dashboard-toolbar"
import { DashboardWidgetBar } from "./dashboard-widget-bar"
import { useDashboard } from "./use-dashboard"
import type { DashboardApi, WidgetCatalog } from "./use-dashboard"

export interface DashboardProps {
  /** Every widget kind this dashboard can render, keyed by `type`. */
  widgets: WidgetCatalog
  /** Controlled layout. Pair with `onLayoutChange`. */
  layout?: SerializedItem[]
  /** Initial layout for uncontrolled use. */
  defaultLayout?: SerializedItem[]
  onLayoutChange?: (items: SerializedItem[]) => void
  /** Controlled edit mode. */
  editing?: boolean
  defaultEditing?: boolean
  onEditingChange?: (editing: boolean) => void
  /** Set false to lock the layout and hide the edit affordances entirely. */
  editable?: boolean
  /** Canvas background treatment. */
  gridStyle?: GridStyle
  /** Override grid geometry — columns, rowHeight, gap, padding, span limits. */
  grid?: Partial<GridConfig>
  /**
   * Cap the canvas height, in px. The toolbar's "Limit height" switch turns this
   * on; without it that switch falls back to 2.5x the minimum height.
   */
  maxHeight?: number
  /**
   * What the cap does.
   *
   * `scroll` (default) — the canvas stops growing and scrolls; widgets may sit
   * below the fold.
   * `clamp` — the grid is limited to the rows that fit, so nothing can be placed
   * out of sight. Drag, the drop indicator, and keyboard nudges all respect it.
   */
  maxHeightMode?: "scroll" | "clamp"
  /**
   * `false` hides the toolbar. A function replaces it, receiving the same api
   * the built-in toolbar uses.
   */
  toolbar?: boolean | ((api: DashboardApi) => React.ReactNode)
  /** Extra controls rendered at the end of the built-in toolbar. */
  toolbarActions?: React.ReactNode
  /** Replaces the default empty state. */
  emptyState?: React.ReactNode
  className?: string
}

/**
 * Canvas background, drawn from the same frame the layout engine uses — so the
 * guides always line up with where widgets actually land, at any width.
 */
function GridBackground({ style, frame }: { style: GridStyle; frame: GridFrame }) {
  if (style === "none") return null

  const cell = `${colPitch(frame)}px ${rowPitch(frame)}px`
  const origin = `${frame.padding}px ${frame.padding}px`
  const common = "pointer-events-none absolute inset-0 text-muted-foreground"

  if (style === "dots") {
    return (
      <div
        aria-hidden="true"
        className={cn(common, "opacity-40")}
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: cell,
          backgroundPosition: origin,
        }}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={cn(common, style === "bold" ? "opacity-25" : "opacity-10")}
      style={{
        backgroundImage:
          "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
        backgroundSize: cell,
        backgroundPosition: origin,
      }}
    />
  )
}

export function Dashboard({
  widgets,
  layout,
  defaultLayout,
  onLayoutChange,
  editing,
  defaultEditing,
  onEditingChange,
  editable = true,
  gridStyle: gridStyleProp,
  grid: gridOverrides,
  maxHeight,
  maxHeightMode,
  toolbar = true,
  toolbarActions,
  emptyState,
  className,
}: DashboardProps) {
  const api = useDashboard({
    widgets,
    layout,
    defaultLayout,
    onLayoutChange,
    editing,
    defaultEditing,
    onEditingChange,
    grid: gridOverrides,
    maxHeight,
    maxHeightMode,
  })

  const {
    items,
    isEditing,
    metrics,
    grid,
    preview,
    activeId,
    float,
    isFixedHeight,
    isAddWidgetMode,
    isMeasured,
    canvasRef,
    setEditing,
    toggleAddWidgetMode,
    addWidget,
    removeWidget,
    tidy,
    nudge,
    toggleFixedHeight,
    beginDrag,
    beginResize,
  } = api

  const [gridStyle, setGridStyle] = React.useState<GridStyle>(gridStyleProp ?? "lines")
  React.useEffect(() => {
    if (gridStyleProp) setGridStyle(gridStyleProp)
  }, [gridStyleProp])

  const renderBody = (item: SerializedItem) => {
    const definition = widgets[item.type]
    if (!definition) {
      return (
        <p className="text-muted-foreground text-sm">
          No widget registered for type <code className="font-mono">{item.type}</code>.
        </p>
      )
    }
    return definition.render({
      id: item.id,
      type: item.type,
      title: item.title,
      size: { w: item.w, h: item.h },
      isEditing,
    })
  }

  return (
    <TooltipProvider>
      <div
        data-slot="dashboard"
        data-editing={isEditing || undefined}
        className={cn("flex w-full flex-col gap-3", className)}
      >
        {toolbar === true && (
          <DashboardToolbar
            itemCount={items.length}
            isEditing={isEditing}
            editable={editable}
            onEditingChange={setEditing}
            isAddWidgetMode={isAddWidgetMode}
            onToggleAddWidgetMode={toggleAddWidgetMode}
            onTidy={tidy}
            gridStyle={gridStyle}
            onGridStyleChange={setGridStyle}
            isFixedHeight={isFixedHeight}
            onFixedHeightChange={toggleFixedHeight}
          >
            {toolbarActions}
          </DashboardToolbar>
        )}
        {typeof toolbar === "function" && toolbar(api)}

        {toolbar === true && isAddWidgetMode && (
          <DashboardWidgetBar widgets={widgets} onAddWidget={addWidget} />
        )}

        <div
          ref={canvasRef}
          data-slot="dashboard-canvas"
          data-editing={isEditing || undefined}
          className={cn(
            "group/canvas bg-card/40 relative w-full rounded-xl border transition-colors",
            isEditing && "border-primary/30 bg-primary/[0.02]",
            // Only scroll when the content genuinely exceeds the cap; a capped
            // canvas that happens to fit should not show a scrollbar.
            metrics.scrolls ? "overflow-auto" : "overflow-hidden",
            activeId && "touch-none select-none"
          )}
          style={{
            height: metrics.height,
            minHeight: grid.minHeight,
          }}
        >
          <GridBackground style={gridStyle} frame={metrics.frame} />

          {/*
            Nothing renders until the canvas has been measured once.

            Column width is only known after layout, so the very first render
            has a placeholder 1px-wide frame. Painting widgets at that size and
            letting them animate outward produced a visible snap on every load,
            and charts measured themselves against the placeholder. One frame of
            nothing is far better than one frame of wrong.
          */}
          {isMeasured && (
            <div
              className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
              style={{ height: canvasHeight(metrics.rows, metrics.frame) }}
            >
              {items.map((item) => (
                <DashboardItem
                  key={item.id}
                  item={item}
                  frame={metrics.frame}
                  isEditing={isEditing}
                  isActive={activeId === item.id}
                  float={activeId === item.id ? float : null}
                  onRemove={removeWidget}
                  onDragStart={beginDrag}
                  onResizeStart={beginResize}
                  onNudge={nudge}
                >
                  {renderBody(item)}
                </DashboardItem>
              ))}

              {/* Drop indicator: shows where the gesture will land. */}
              {preview && (
                <div
                  aria-hidden="true"
                  data-slot="dashboard-preview"
                  className="border-primary bg-primary/10 pointer-events-none absolute top-0 left-0 z-20 rounded-xl border-2 border-dashed"
                  style={(() => {
                    const at = gridToPixel(preview.x, preview.y, metrics.frame)
                    const size = spanToPixels(preview.w, preview.h, metrics.frame)
                    return {
                      translate: `${at.x}px ${at.y}px`,
                      width: size.width,
                      height: size.height,
                    }
                  })()}
                />
              )}

              {items.length === 0 &&
                (emptyState ?? (
                  <Empty className="absolute inset-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <LayoutGridIcon />
                      </EmptyMedia>
                      <EmptyTitle className="text-balance">No widgets yet</EmptyTitle>
                      <EmptyDescription className="text-pretty">
                        {isEditing
                          ? "Use “Add widget” to place your first one."
                          : editable
                            ? "Choose “Edit layout” to start building."
                            : "This dashboard is empty."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export { useDashboard }
export type { DashboardApi, WidgetCatalog, WidgetDefinition, WidgetRenderContext } from "./use-dashboard"
