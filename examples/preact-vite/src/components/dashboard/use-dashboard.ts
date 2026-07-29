"use client"

import * as React from "react"
import {
  DEFAULT_GRID,
  applyResize,
  clamp,
  findFreeSlot,
  measureGrid,
  nextItemId,
  packItems,
  parseLayout,
  pixelToGrid,
  reflow,
  resolveColumns,
  resolveFrame,
  resolveCollisions,
  serializeLayout,
} from "rud-dashboard"
import type {
  DashboardItem,
  GridConfig,
  GridMetrics,
  GridRect,
  ResizeHandle,
  SerializedItem,
  SerializedLayout,
} from "rud-dashboard"

/** How to render one kind of widget, and how it should appear in the palette. */
export interface WidgetDefinition {
  /** Shown in the item header and in the palette. */
  title: string
  /** Shown in the palette only. */
  description?: string
  /**
   * Any icon component. Rendered with no props and sized by CSS, so the type
   * only has to say "a component that needs no props".
   *
   * Deliberately not `ComponentType<{ className?: string }>`: under Preact,
   * `className` is `Signalish<string>` rather than `string`, so naming the prop
   * here makes every `lucide-react` icon fail to typecheck on Preact. Widening
   * it is the whole of the Preact compatibility story for this file.
   */
  icon?: React.ElementType
  /** Span used when added from the palette. Defaults to 4x3. */
  defaultSize?: { w: number; h: number }
  /** Renders the widget body. */
  render: (context: WidgetRenderContext) => React.ReactNode
}

export interface WidgetRenderContext {
  id: string
  type: string
  title: string
  /** Current span in grid cells — useful for switching density. */
  size: { w: number; h: number }
  isEditing: boolean
}

/** Every widget kind the dashboard can render, keyed by `type`. */
export type WidgetCatalog = Record<string, WidgetDefinition>

/**
 * Value-equality for metrics.
 *
 * `measureGrid` builds a fresh object every pass, so storing its result
 * unconditionally changes `metrics.frame` by identity even when the numbers are
 * unchanged. That re-renders every widget on any measure — and re-mounting a
 * chart mid-animation leaves its bars stuck at zero height. Keeping the old
 * object when nothing moved makes the memo on `DashboardItem` actually work.
 */
function sameMetrics(a: GridMetrics, b: GridMetrics): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.cols === b.cols &&
    a.rows === b.rows &&
    a.frame.columns === b.frame.columns &&
    a.frame.colWidth === b.frame.colWidth &&
    a.frame.rowHeight === b.frame.rowHeight &&
    a.frame.gap === b.frame.gap &&
    a.frame.padding === b.frame.padding
  )
}

/** An in-flight pointer gesture. */
type Gesture =
  | { kind: "drag"; id: string; grabX: number; grabY: number }
  | { kind: "resize"; id: string; handle: ResizeHandle; startX: number; startY: number; origin: GridRect }

export interface UseDashboardOptions {
  widgets: WidgetCatalog
  layout?: SerializedItem[]
  defaultLayout?: SerializedItem[]
  onLayoutChange?: (items: SerializedItem[]) => void
  editing?: boolean
  defaultEditing?: boolean
  onEditingChange?: (editing: boolean) => void
  grid?: Partial<GridConfig>
}

/**
 * Support both controlled and uncontrolled use with one hook, the way native
 * inputs do. The previous API needed three overlapping mechanisms for this
 * (`initialItems`, `onItemsChange`, and an optional external `controller`),
 * which meant the source of truth depended on which props you happened to pass.
 */
function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void
): [T, (next: T | ((prev: T) => T)) => void] {
  const isControlled = controlled !== undefined
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const value = isControlled ? controlled : uncontrolled

  // Keep the latest callback in a ref so `setValue` stays referentially stable.
  const onChangeRef = React.useRef(onChange)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })

  const valueRef = React.useRef(value)
  valueRef.current = value

  const setValue = React.useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(valueRef.current) : next
      if (!isControlled) setUncontrolled(resolved)
      onChangeRef.current?.(resolved)
    },
    [isControlled]
  )

  return [value, setValue]
}

export function useDashboard({
  widgets,
  layout,
  defaultLayout,
  onLayoutChange,
  editing,
  defaultEditing = false,
  onEditingChange,
  grid: gridOverrides,
}: UseDashboardOptions) {
  const grid = React.useMemo<GridConfig>(
    () => ({ ...DEFAULT_GRID, ...gridOverrides }),
    [gridOverrides]
  )

  const [items, setItems] = useControllableState<SerializedItem[]>(
    layout,
    // Normalise the initial layout once, so a malformed saved payload cannot
    // crash the first render.
    React.useMemo(() => parseLayout({ version: 1, items: defaultLayout ?? [] }).layout.items, []),
    onLayoutChange
  )
  const [isEditing, setEditing] = useControllableState(editing, defaultEditing, onEditingChange)

  const canvasRef = React.useRef<HTMLDivElement>(null)
  const [metrics, setMetricsState] = React.useState<GridMetrics>(() => ({
    frame: resolveFrame(0, grid),
    width: 0,
    height: grid.minHeight,
    cols: resolveColumns(0, grid.columns),
    rows: 1,
  }))

  /** Only commit metrics that actually differ, preserving object identity. */
  const setMetrics = React.useCallback((next: GridMetrics) => {
    setMetricsState((current) => (sameMetrics(current, next) ? current : next))
  }, [])
  const [fixedHeight, setFixedHeight] = React.useState<number | null>(null)
  const [gesture, setGesture] = React.useState<Gesture | null>(null)
  const [preview, setPreview] = React.useState<GridRect | null>(null)

  // Mirrors of the latest values, so effects and callbacks can read "now"
  // without re-subscribing on every change.
  const itemsRef = React.useRef(items)
  itemsRef.current = items
  const metricsRef = React.useRef(metrics)
  metricsRef.current = metrics
  const previewRef = React.useRef(preview)
  previewRef.current = preview

  /* ------------------------------- measuring ------------------------------ */

  React.useEffect(() => {
    const element = canvasRef.current
    if (!element) return

    const measure = () => {
      const width = element.clientWidth
      if (width === 0) return

      const previousCols = metricsRef.current.cols
      const nextCols = resolveColumns(width, grid.columns)

      // Reflow before measuring rows, so the height accounts for the new layout.
      if (nextCols !== previousCols && itemsRef.current.length > 0) {
        const reflowed = reflow(itemsRef.current, {
          fromCols: previousCols,
          toCols: nextCols,
          minSpan: grid.minSpan,
        })
        setItems(reflowed as SerializedItem[])
        setMetrics(measureGrid(width, reflowed, grid, { fixedHeight }))
      } else {
        setMetrics(measureGrid(width, itemsRef.current, grid, { fixedHeight }))
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [grid, fixedHeight, setItems, setMetrics])

  // Keep the canvas height in step with the items themselves.
  React.useEffect(() => {
    const width = metricsRef.current.width
    if (width > 0) setMetrics(measureGrid(width, items, grid, { fixedHeight }))
  }, [items, grid, fixedHeight, setMetrics])

  /* ------------------------------- gestures ------------------------------- */

  /** Pointer position relative to the canvas box, in px. */
  const pointerToCanvas = React.useCallback((event: PointerEvent | React.PointerEvent<HTMLElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }, [])

  const beginDrag = React.useCallback(
    (event: React.PointerEvent<HTMLElement>, item: GridRect) => {
      if (!isEditing) return
      const point = pointerToCanvas(event)
      if (!point) return
      const cell = pixelToGrid(point.x, point.y, metricsRef.current.frame)
      setGesture({ kind: "drag", id: item.id, grabX: cell.x - item.x, grabY: cell.y - item.y })
      setPreview({ ...item })
    },
    [isEditing, pointerToCanvas]
  )

  const beginResize = React.useCallback(
    (event: React.PointerEvent<HTMLElement>, item: GridRect, handle: ResizeHandle) => {
      if (!isEditing) return
      const point = pointerToCanvas(event)
      if (!point) return
      const cell = pixelToGrid(point.x, point.y, metricsRef.current.frame)
      setGesture({
        kind: "resize",
        id: item.id,
        handle,
        startX: cell.x,
        startY: cell.y,
        origin: { ...item },
      })
      setPreview({ ...item })
    },
    [isEditing, pointerToCanvas]
  )

  // A single pointer-event pipeline. The previous implementation bound
  // `onTouchStart` but only ever listened for `mousemove`/`mouseup`, so a touch
  // drag would start, show a preview, and then never move or commit. Pointer
  // events cover mouse, touch, and pen in one path.
  React.useEffect(() => {
    if (!gesture) return

    const handleMove = (event: PointerEvent) => {
      const point = pointerToCanvas(event)
      if (!point) return
      const { cols, rows, frame } = metricsRef.current
      const cell = pixelToGrid(point.x, point.y, frame)

      setPreview((current) => {
        if (!current) return current

        if (gesture.kind === "drag") {
          return {
            ...current,
            x: clamp(cell.x - gesture.grabX, 0, Math.max(0, cols - current.w)),
            y: Math.max(0, cell.y - gesture.grabY),
          }
        }

        return {
          ...current,
          ...applyResize(
            gesture.origin,
            gesture.handle,
            cell.x - gesture.startX,
            cell.y - gesture.startY,
            { cols, rows: Math.max(rows, gesture.origin.y + grid.maxSpan), minSpan: grid.minSpan, maxSpan: grid.maxSpan }
          ),
        }
      })
    }

    const finish = () => {
      const committed = previewRef.current
      const activeId = gesture.id

      if (committed) {
        const updated = itemsRef.current.map((item) =>
          item.id === activeId
            ? {
                ...item,
                x: committed.x,
                y: committed.y,
                w: committed.w,
                h: committed.h,
                // The user chose this spot: make it the anchor to return to.
                anchorX: committed.x,
                anchorY: committed.y,
                anchorW: committed.w,
                anchorH: committed.h,
              }
            : item
        )
        setItems(
          resolveCollisions(updated, {
            cols: metricsRef.current.cols,
            minSpan: grid.minSpan,
            pinnedId: activeId,
          }) as SerializedItem[]
        )
      }

      setGesture(null)
      setPreview(null)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", finish)
      window.removeEventListener("pointercancel", finish)
    }
  }, [gesture, grid, pointerToCanvas, setItems])

  /* -------------------------------- actions ------------------------------- */

  const addWidget = React.useCallback(
    (type: string) => {
      const definition = widgets[type]
      if (!definition) return

      const size = definition.defaultSize ?? { w: 4, h: 3 }
      const cols = metricsRef.current.cols
      const id = nextItemId(itemsRef.current)

      const slot = findFreeSlot(
        { id, x: 0, y: 0, w: size.w, h: size.h },
        itemsRef.current,
        { cols, minSpan: grid.minSpan, ignoreAnchor: true, strategy: "compact" }
      )

      setItems([
        ...itemsRef.current,
        {
          id,
          type,
          title: definition.title,
          ...slot,
          anchorX: slot.x,
          anchorY: slot.y,
          anchorW: slot.w,
          anchorH: slot.h,
        },
      ])
    },
    [grid.minSpan, setItems, widgets]
  )

  const removeWidget = React.useCallback(
    (id: string) => {
      setItems(itemsRef.current.filter((item) => item.id !== id))
    },
    [setItems]
  )

  const tidy = React.useCallback(() => {
    setItems(
      packItems(itemsRef.current, {
        cols: metricsRef.current.cols,
        minSpan: grid.minSpan,
      }) as SerializedItem[]
    )
  }, [grid.minSpan, setItems])

  const clear = React.useCallback(() => setItems([]), [setItems])

  /** Move or resize the focused item from the keyboard. */
  const nudge = React.useCallback(
    (id: string, delta: { x?: number; y?: number; w?: number; h?: number }) => {
      const { cols } = metricsRef.current
      const current = itemsRef.current.find((item) => item.id === id)
      if (!current) return

      const w = clamp(current.w + (delta.w ?? 0), grid.minSpan, Math.min(grid.maxSpan, cols))
      const h = clamp(current.h + (delta.h ?? 0), grid.minSpan, grid.maxSpan)
      const x = clamp(current.x + (delta.x ?? 0), 0, Math.max(0, cols - w))
      const y = Math.max(0, current.y + (delta.y ?? 0))

      const moved = itemsRef.current.map((item) =>
        item.id === id
          ? { ...item, x, y, w, h, anchorX: x, anchorY: y, anchorW: w, anchorH: h }
          : item
      )
      setItems(
        resolveCollisions(moved, {
          cols,
          minSpan: grid.minSpan,
          pinnedId: id,
        }) as SerializedItem[]
      )
    },
    [grid.maxSpan, grid.minSpan, setItems]
  )

  const save = React.useCallback(
    (): SerializedLayout => serializeLayout(itemsRef.current as DashboardItem[]),
    []
  )

  const load = React.useCallback(
    (payload: unknown) => {
      const { layout: parsed, warnings } = parseLayout(payload)
      // Always surface these: a dropped item means the stored payload is bad,
      // which is worth knowing in production too. No bundler-specific globals
      // here, so this file works unchanged in Vite, Next.js, and Preact.
      if (warnings.length > 0) {
        console.warn("[dashboard] layout loaded with warnings:", warnings)
      }
      setItems(
        resolveCollisions(parsed.items, {
          cols: metricsRef.current.cols,
          minSpan: grid.minSpan,
        }) as SerializedItem[]
      )
    },
    [grid.minSpan, setItems]
  )

  const toggleFixedHeight = React.useCallback(() => {
    setFixedHeight((current) => (current === null ? Math.round(grid.minHeight * 2.5) : null))
  }, [grid.minHeight])

  return {
    // state
    items,
    isEditing,
    metrics,
    grid,
    preview,
    /** False until the canvas has been measured once. */
    isMeasured: metrics.width > 0,
    activeId: gesture?.id ?? null,
    isFixedHeight: fixedHeight !== null,
    canvasRef,
    widgets,
    // actions
    setEditing,
    addWidget,
    removeWidget,
    tidy,
    clear,
    nudge,
    save,
    load,
    toggleFixedHeight,
    beginDrag,
    beginResize,
  }
}

export type DashboardApi = ReturnType<typeof useDashboard>
