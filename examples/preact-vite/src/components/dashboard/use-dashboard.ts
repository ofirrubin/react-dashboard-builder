"use client"

import * as React from "react"
import {
  DEFAULT_GRID,
  applyResize,
  clamp,
  commitPlacement,
  findFreeSlot,
  fitLayout,
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
  spanToPixels,
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
   * Rows to use when the grid stacks to a single column, on phones.
   *
   * Every widget is full width there, so its desktop height is often wrong: a
   * chart that was 8 wide by 3 tall reads fine, but a 3x1 stat is suddenly a
   * thin strip and a 4x6 list is a long scroll. This changes only the stacked
   * view — widening back restores the desktop height, and the saved layout keeps
   * it.
   */
  stackedHeight?: number
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
  /**
   * Current span in grid cells. Prefer `pixelSize` or `compact` for layout
   * decisions: a cell is a different width at every breakpoint, and on a phone
   * `w: 1` is the whole screen.
   */
  size: { w: number; h: number }
  /** Outer size of the card, in px. */
  pixelSize: { width: number; height: number }
  /** Columns the grid currently has. */
  columns: number
  /** The grid is a single column: the phone layout, where every widget is full width. */
  stacked: boolean
  /**
   * The card is narrower than `COMPACT_WIDTH` — show less: drop secondary text,
   * hide axes, shorten numbers. For anything finer-grained, the widget body is a
   * CSS size container, so `@xs:`/`@sm:` variants respond to the card itself.
   */
  compact: boolean
  isEditing: boolean
}

/** Card width, in px, below which `WidgetRenderContext.compact` is true. */
export const COMPACT_WIDTH = 280

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

/**
 * Edge auto-scroll while a gesture is running. On a phone the stacked grid is
 * far taller than the screen, so without it a card can only be moved as far as
 * the viewport you happened to start in.
 */
const AUTOSCROLL_EDGE_PX = 56
const AUTOSCROLL_MAX_SPEED_PX = 18

/** The nearest ancestor that actually scrolls vertically, else the document. */
function scrollParent(element: HTMLElement | null): HTMLElement {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node
    }
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}

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
  const widgetsRef = React.useRef(widgets)
  widgetsRef.current = widgets
  /** False until the first real measure, which always fits the layout to the grid. */
  const fittedRef = React.useRef(false)
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

      const nextCols = resolveColumns(width, grid.columns)
      const previousCols = metricsRef.current.cols
      // The first measure fits the saved layout to this screen. It cannot be a
      // reflow from the one-column placeholder: on a phone that is "no change",
      // which left desktop layouts hanging off the right edge.
      const firstFit = !fittedRef.current
      fittedRef.current = true
      const heightAt = (item: SerializedItem, cols: number) =>
        cols === 1 ? widgetsRef.current[item.type]?.stackedHeight : undefined

      // Reflow before measuring rows, so the height accounts for the new layout.
      if ((firstFit || nextCols !== previousCols) && itemsRef.current.length > 0) {
        const reflowed = firstFit
          ? fitLayout(itemsRef.current, { cols: nextCols, minSpan: grid.minSpan, heightAt })
          : reflow(itemsRef.current, {
              fromCols: previousCols,
              toCols: nextCols,
              minSpan: grid.minSpan,
              heightAt,
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
  const pointerToCanvas = React.useCallback((event: { clientX: number; clientY: number }) => {
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

    /** Last pointer position in client coordinates, for auto-scroll ticks. */
    let lastClient: { x: number; y: number } | null = null
    let scrollFrame = 0
    const scroller = scrollParent(canvasRef.current)

    const handleMove = (event: Pick<PointerEvent, "clientX" | "clientY" | "timeStamp">) => {
      lastClient = { x: event.clientX, y: event.clientY }
      if (!scrollFrame) scrollFrame = requestAnimationFrame(autoScroll)
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

    /**
     * Scroll while the pointer sits near the top or bottom edge, faster the
     * closer it gets, and replay the last move so the card and indicator follow
     * the content that scrolled under them.
     */
    function autoScroll() {
      scrollFrame = 0
      if (!lastClient) return
      const isDocument = scroller === document.scrollingElement || scroller === document.documentElement
      const top = isDocument ? 0 : scroller.getBoundingClientRect().top
      const bottom = isDocument ? window.innerHeight : scroller.getBoundingClientRect().bottom
      const intoTop = AUTOSCROLL_EDGE_PX - (lastClient.y - top)
      const intoBottom = AUTOSCROLL_EDGE_PX - (bottom - lastClient.y)
      const pull = intoTop > 0 ? -intoTop : intoBottom > 0 ? intoBottom : 0
      if (pull === 0) return

      const step = Math.round((pull / AUTOSCROLL_EDGE_PX) * AUTOSCROLL_MAX_SPEED_PX)
      const before = scroller.scrollTop
      scroller.scrollTop += step
      if (scroller.scrollTop === before) return // hit the end

      handleMove({ clientX: lastClient.x, clientY: lastClient.y, timeStamp: performance.now() })
    }

    const finish = () => {
      const committed = previewRef.current
      const activeId = gesture.id
      lastClient = null
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
      scrollFrame = 0

      if (committed) {
        // The user chose this spot, so it becomes the anchor to return to —
        // unless the grid is too narrow to show the item at its real width.
        const cols = metricsRef.current.cols
        const updated = itemsRef.current.map((item) =>
          item.id === activeId ? commitPlacement(item, committed, cols) : item
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
      if (scrollFrame) cancelAnimationFrame(scrollFrame)
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
      const h = cols === 1 ? (definition.stackedHeight ?? size.h) : size.h

      const slot = findFreeSlot(
        { id, x: 0, y: 0, w: size.w, h },
        itemsRef.current,
        { cols, minSpan: grid.minSpan, ignoreAnchor: true, strategy: "compact" }
      )

      // Anchor at the intended size, not the slot: added on a phone, the slot is
      // one column wide, and that would be the widget's width on desktop forever.
      setItems([
        ...itemsRef.current,
        {
          id,
          type,
          title: definition.title,
          ...slot,
          anchorX: slot.x,
          anchorY: slot.y,
          anchorW: Math.max(slot.w, size.w),
          anchorH: size.h,
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
        item.id === id ? commitPlacement(item, { x, y, w, h }, cols) : item
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

  /** Everything a widget's `render` receives for one item. */
  const renderContext = React.useCallback(
    (item: SerializedItem): WidgetRenderContext => {
      const pixelSize = spanToPixels(item.w, item.h, metrics.frame)
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        size: { w: item.w, h: item.h },
        pixelSize,
        columns: metrics.cols,
        stacked: metrics.cols === 1,
        compact: pixelSize.width < COMPACT_WIDTH,
        isEditing,
      }
    },
    [isEditing, metrics.cols, metrics.frame]
  )

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
    /** The grid is a single column — the phone layout. */
    isStacked: metrics.cols === 1,
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
    renderContext,
    beginDrag,
    beginResize,
  }
}

export type DashboardApi = ReturnType<typeof useDashboard>
