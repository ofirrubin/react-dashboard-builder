"use client"

import * as React from "react"
import {
  DEFAULT_GRID,
  applyResize,
  clamp,
  findFreeSlot,
  gridToPixel,
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
  /**
   * A miniature of the widget, shown in the add-widget bar.
   *
   * Far more useful than a name and an icon — you can see what you are about to
   * place. Keep it cheap and static; it renders once per palette entry.
   */
  preview?: () => React.ReactNode
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
    a.scrolls === b.scrolls &&
    a.frame.columns === b.frame.columns &&
    a.frame.colWidth === b.frame.colWidth &&
    a.frame.rowHeight === b.frame.rowHeight &&
    a.frame.gap === b.frame.gap &&
    a.frame.padding === b.frame.padding
  )
}

/**
 * Pointer speed, in px/ms, above which a dragged card stops snapping and just
 * follows the pointer.
 *
 * ~0.35 px/ms is roughly 350px/s — a deliberate throw rather than a careful
 * placement. Below it the card is being positioned, so it snaps.
 */
const FREE_MOVE_SPEED = 0.35

/** How long the pointer must hold still before a free-moving card settles. */
const SETTLE_DELAY_MS = 90

/** Smoothing on the speed estimate. Raw per-event deltas are far too jittery. */
const SPEED_SMOOTHING = 0.4

/** An in-flight pointer gesture. */
type Gesture =
  | {
      kind: "drag"
      id: string
      /** Pointer offset inside the card at grab time, in px. */
      grabPxX: number
      grabPxY: number
    }
  | { kind: "resize"; id: string; handle: ResizeHandle; startX: number; startY: number; origin: GridRect }

/**
 * Where a dragged card is actually painted.
 *
 * While the pointer is moving quickly the card renders at `x`/`y` directly, so
 * it tracks the cursor 1:1 instead of stepping between cells. Once the pointer
 * slows or stops, `snapping` flips true and the card eases into the slot the
 * drop indicator is showing. Snapping on every move is what made dragging feel
 * like it was catching on something.
 */
export interface DragFloat {
  x: number
  y: number
  snapping: boolean
}

export interface UseDashboardOptions {
  widgets: WidgetCatalog
  layout?: SerializedItem[]
  defaultLayout?: SerializedItem[]
  onLayoutChange?: (items: SerializedItem[]) => void
  editing?: boolean
  defaultEditing?: boolean
  onEditingChange?: (editing: boolean) => void
  grid?: Partial<GridConfig>
  /**
   * Cap the canvas height, in px. Omit to grow with the content.
   *
   * The toolbar's "Limit height" switch turns this on and off; without it, that
   * switch falls back to a default of `2.5x` the minimum height.
   */
  maxHeight?: number
  /** `scroll` (default) caps the box and scrolls; `clamp` limits the grid rows. */
  maxHeightMode?: "scroll" | "clamp"
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
  maxHeight,
  maxHeightMode = "scroll",
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
    scrolls: false,
  }))

  /** Only commit metrics that actually differ, preserving object identity. */
  const setMetrics = React.useCallback((next: GridMetrics) => {
    setMetricsState((current) => (sameMetrics(current, next) ? current : next))
  }, [])
  const [heightCapped, setHeightCapped] = React.useState(false)
  /** The cap actually in force: null means "grow with the content". */
  const heightCap = heightCapped ? (maxHeight ?? Math.round(grid.minHeight * 2.5)) : null
  const [isAddWidgetMode, setAddWidgetMode] = React.useState(false)
  const [gesture, setGesture] = React.useState<Gesture | null>(null)
  const [preview, setPreview] = React.useState<GridRect | null>(null)
  const [float, setFloat] = React.useState<DragFloat | null>(null)

  // Pointer-speed tracking for the free-move behaviour above.
  const lastMoveRef = React.useRef<{ x: number; y: number; t: number } | null>(null)
  const speedRef = React.useRef(0)
  const settleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Latest snapped pixel position, so the settle timer needs no pointer event. */
  const snappedPxRef = React.useRef({ x: 0, y: 0 })

  // Mirrors of the latest values, so effects and callbacks can read "now"
  // without re-subscribing on every change.
  const itemsRef = React.useRef(items)
  itemsRef.current = items
  const metricsRef = React.useRef(metrics)
  metricsRef.current = metrics
  const previewRef = React.useRef(preview)
  previewRef.current = preview
  /**
   * In `clamp` mode nothing may be placed below the last visible row — that is
   * the whole point of the mode, so gestures have to respect it too.
   */
  const clampRowsRef = React.useRef(false)
  clampRowsRef.current = heightCap !== null && maxHeightMode === "clamp"

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
        setItems(reflowed)
        setMetrics(measureGrid(width, reflowed, grid, { maxHeight: heightCap, maxHeightMode }))
      } else {
        setMetrics(measureGrid(width, itemsRef.current, grid, { maxHeight: heightCap, maxHeightMode }))
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [grid, heightCap, maxHeightMode, setItems, setMetrics])

  // Keep the canvas height in step with the items themselves.
  React.useEffect(() => {
    const width = metricsRef.current.width
    if (width > 0) setMetrics(measureGrid(width, items, grid, { maxHeight: heightCap, maxHeightMode }))
  }, [items, grid, heightCap, maxHeightMode, setMetrics])

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

      // Grab offset in pixels, not cells: the card has to follow the pointer
      // without jumping to align its corner under the cursor.
      const at = gridToPixel(item.x, item.y, metricsRef.current.frame)
      setGesture({
        kind: "drag",
        id: item.id,
        grabPxX: point.x - at.x,
        grabPxY: point.y - at.y,
      })
      setPreview({ ...item })
      setFloat({ x: at.x, y: at.y, snapping: true })
      snappedPxRef.current = { x: at.x, y: at.y }
      lastMoveRef.current = { x: point.x, y: point.y, t: event.timeStamp }
      speedRef.current = 0
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

      // Smoothed pointer speed, in px/ms.
      const previous = lastMoveRef.current
      if (previous) {
        const dt = Math.max(1, event.timeStamp - previous.t)
        const distance = Math.hypot(point.x - previous.x, point.y - previous.y)
        speedRef.current =
          speedRef.current * (1 - SPEED_SMOOTHING) + (distance / dt) * SPEED_SMOOTHING
      }
      lastMoveRef.current = { x: point.x, y: point.y, t: event.timeStamp }

      // The drop indicator always snaps: it is what tells you where this lands.
      const cell = pixelToGrid(
        gesture.kind === "drag" ? point.x - gesture.grabPxX : point.x,
        gesture.kind === "drag" ? point.y - gesture.grabPxY : point.y,
        frame
      )

      if (gesture.kind === "drag") {
        const held = previewRef.current
        const span = held?.w ?? 1
        const spanH = held?.h ?? 1
        const maxY = clampRowsRef.current ? Math.max(0, rows - spanH) : Number.POSITIVE_INFINITY
        const targetCell = {
          x: clamp(cell.x, 0, Math.max(0, cols - span)),
          y: clamp(cell.y, 0, maxY),
        }
        // Remembered so the settle timer can snap without a pointer event.
        snappedPxRef.current = gridToPixel(targetCell.x, targetCell.y, frame)

        if (speedRef.current > FREE_MOVE_SPEED) {
          // Moving fast: track the pointer exactly.
          setFloat({ x: point.x - gesture.grabPxX, y: point.y - gesture.grabPxY, snapping: false })
        } else {
          // Slow enough to be placing it: sit in the slot the indicator shows.
          setFloat({ ...snappedPxRef.current, snapping: true })
        }

        // Hold still and it settles, even though no more pointermove events come.
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
        settleTimerRef.current = setTimeout(() => {
          speedRef.current = 0
          setFloat({ ...snappedPxRef.current, snapping: true })
        }, SETTLE_DELAY_MS)
      }

      setPreview((current) => {
        if (!current) return current

        if (gesture.kind === "drag") {
          const limitY = clampRowsRef.current
            ? Math.max(0, rows - current.h)
            : Number.POSITIVE_INFINITY
          return {
            ...current,
            x: clamp(cell.x, 0, Math.max(0, cols - current.w)),
            y: clamp(cell.y, 0, limitY),
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
          })
        )
      }

      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
      lastMoveRef.current = null
      speedRef.current = 0

      setGesture(null)
      setPreview(null)
      setFloat(null)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", finish)
      window.removeEventListener("pointercancel", finish)
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current)
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
      })
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
      const maxY = clampRowsRef.current
        ? Math.max(0, metricsRef.current.rows - h)
        : Number.POSITIVE_INFINITY
      const y = clamp(current.y + (delta.y ?? 0), 0, maxY)

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
        })
      )
    },
    [grid.maxSpan, grid.minSpan, setItems]
  )

  const toggleAddWidgetMode = React.useCallback(() => {
    setAddWidgetMode((current) => !current)
  }, [])

  const save = React.useCallback(
    (): SerializedLayout => serializeLayout(itemsRef.current),
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
        })
      )
    },
    [grid.minSpan, setItems]
  )

  const toggleFixedHeight = React.useCallback(() => {
    setHeightCapped((current) => !current)
  }, [])

  return {
    // state
    items,
    isEditing,
    metrics,
    grid,
    preview,
    /** Where the dragged card paints; null unless a drag is in flight. */
    float,
    /** False until the canvas has been measured once. */
    isMeasured: metrics.width > 0,
    activeId: gesture?.id ?? null,
    isFixedHeight: heightCapped,
    /** True when the canvas is capped and must scroll to show everything. */
    scrolls: metrics.scrolls,
    isAddWidgetMode: isEditing && isAddWidgetMode,
    canvasRef,
    widgets,
    // actions
    setEditing,
    toggleAddWidgetMode,
    setAddWidgetMode,
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
