import * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { overlaps } from "rud-dashboard"
import type { SerializedItem } from "rud-dashboard"
import { describe, expect, it } from "vitest"

import { Dashboard } from "@/components/dashboard/dashboard"
import type { WidgetCatalog, WidgetRenderContext } from "@/components/dashboard/dashboard"

import { resizeCanvas, setCanvasWidth } from "./canvas"

/** Phone and desktop canvas widths. 360 resolves one column, 1200 twelve. */
const PHONE = 360
const DESKTOP = 1200
/** Default grid: 12px padding, 56px rows, 12px gaps. */
const PADDING = 12
const ROW_PITCH = 56 + 12

const contexts = new Map<string, WidgetRenderContext>()

const widgets: WidgetCatalog = {
  stat: {
    title: "Stat",
    defaultSize: { w: 3, h: 2 },
    render: (ctx) => {
      contexts.set(ctx.id, ctx)
      return <p>body {ctx.id}</p>
    },
  },
  chart: {
    title: "Chart",
    defaultSize: { w: 6, h: 4 },
    stackedHeight: 5,
    render: (ctx) => {
      contexts.set(ctx.id, ctx)
      return <p>body {ctx.id}</p>
    },
  },
}

/** No anchors: the shape of a hand-written default layout. */
const DESKTOP_LAYOUT: SerializedItem[] = [
  { id: "a", type: "stat", title: "A", x: 0, y: 0, w: 6, h: 2 },
  { id: "b", type: "stat", title: "B", x: 6, y: 0, w: 6, h: 2 },
  { id: "c", type: "chart", title: "C", x: 0, y: 2, w: 8, h: 4 },
]

function renderDashboard({
  width,
  layout = DESKTOP_LAYOUT,
  editing = false,
}: {
  width: number
  layout?: SerializedItem[]
  editing?: boolean
}) {
  setCanvasWidth(width)
  contexts.clear()
  const state = { layout }
  function Harness() {
    const [current, setCurrent] = React.useState(layout)
    state.layout = current
    return (
      <Dashboard
        widgets={widgets}
        layout={current}
        onLayoutChange={setCurrent}
        defaultEditing={editing}
      />
    )
  }
  render(<Harness />)
  return state
}

const rects = (items: SerializedItem[]) =>
  Object.fromEntries(items.map(({ id, x, y, w, h }) => [id, { x, y, w, h }]))

const card = (id: string) => {
  const element = document.querySelector<HTMLElement>(`[data-item-id="${id}"]`)
  if (!element) throw new Error(`no card ${id}`)
  return element
}
const header = (id: string) => card(id).querySelector<HTMLElement>("[data-drag-handle]")!
const preview = () => document.querySelector('[data-slot="dashboard-preview"]')

function expectNoOverlaps(items: SerializedItem[]) {
  for (const a of items) for (const b of items) if (a !== b) expect(overlaps(a, b)).toBe(false)
}

describe("first load", () => {
  it("renders the cards, not an empty canvas", () => {
    renderDashboard({ width: DESKTOP })
    expect(screen.getAllByRole("group")).toHaveLength(3)
    expect(screen.getByText("body c")).toBeTruthy()
  })

  it("keeps a desktop layout as authored at desktop width", () => {
    const state = renderDashboard({ width: DESKTOP })
    expect(rects(state.layout)).toEqual(rects(DESKTOP_LAYOUT))
  })

  it("fits a desktop layout to one column on a phone", () => {
    // Regression: the pre-measure placeholder is also one column, so the
    // phone's first measure saw no change and left `b` hanging off-screen.
    const state = renderDashboard({ width: PHONE })
    for (const item of state.layout) expect(item).toMatchObject({ x: 0, w: 1 })
    expectNoOverlaps(state.layout)
    expect(card("b").style.width).toBe(`${PHONE - PADDING * 2}px`)
  })

  it("remembers the desktop layout while showing the phone one", () => {
    const state = renderDashboard({ width: PHONE })
    expect(state.layout.find((i) => i.id === "b")).toMatchObject({ anchorX: 6, anchorW: 6 })
    expect(state.layout.find((i) => i.id === "c")).toMatchObject({ anchorW: 8, anchorH: 4 })
  })

  it("uses a widget's stackedHeight in the single-column layout", () => {
    const state = renderDashboard({ width: PHONE })
    expect(state.layout.find((i) => i.id === "c")?.h).toBe(5)
  })
})

describe("resizing the window", () => {
  it("restores the desktop layout when a phone layout widens", () => {
    const state = renderDashboard({ width: PHONE })
    resizeCanvas(DESKTOP)
    expect(rects(state.layout)).toEqual(rects(DESKTOP_LAYOUT))
  })

  it("survives desktop -> phone -> desktop", () => {
    const state = renderDashboard({ width: DESKTOP })
    resizeCanvas(PHONE)
    expect(state.layout.every((i) => i.w === 1)).toBe(true)
    resizeCanvas(DESKTOP)
    expect(rects(state.layout)).toEqual(rects(DESKTOP_LAYOUT))
  })
})

describe("touch gestures", () => {
  it("lets a finger on the card body scroll instead of starting a drag", () => {
    renderDashboard({ width: PHONE, editing: true })
    fireEvent.pointerDown(screen.getByText("body a"), { pointerType: "touch", button: 0 })
    expect(preview()).toBeNull()
  })

  it("starts a touch drag from the card header", () => {
    renderDashboard({ width: PHONE, editing: true })
    fireEvent.pointerDown(header("a"), { pointerType: "touch", button: 0 })
    expect(preview()).not.toBeNull()
    fireEvent.pointerUp(window)
    expect(preview()).toBeNull()
  })

  it("still drags from anywhere on the card with a mouse", () => {
    renderDashboard({ width: DESKTOP, editing: true })
    fireEvent.pointerDown(screen.getByText("body a"), { pointerType: "mouse", button: 0 })
    expect(preview()).not.toBeNull()
    fireEvent.pointerUp(window)
  })

  it("claims the header for dragging, so the browser does not pan instead", () => {
    renderDashboard({ width: PHONE, editing: true })
    expect(header("a").className).toContain("touch-none")
  })

  it("rearranges on a phone without overwriting the desktop layout", () => {
    const state = renderDashboard({ width: PHONE, editing: true })
    // Stacked: a (rows 0-1), b (2-3), c (4-8). Drag c's header to the top.
    const cTop = PADDING + 4 * ROW_PITCH
    fireEvent.pointerDown(header("c"), { pointerType: "touch", button: 0, clientX: 20, clientY: cTop + 10 })
    fireEvent.pointerMove(window, { pointerType: "touch", clientX: 20, clientY: PADDING + 10 })
    fireEvent.pointerUp(window, { pointerType: "touch" })

    expect(state.layout.find((i) => i.id === "c")).toMatchObject({ y: 0, w: 1 })
    expectNoOverlaps(state.layout)
    // The real regression: the drop used to become the anchor, so c came back
    // one column wide on desktop.
    expect(state.layout.find((i) => i.id === "c")).toMatchObject({ anchorX: 0, anchorY: 2, anchorW: 8 })

    resizeCanvas(DESKTOP)
    expect(rects(state.layout)).toEqual(rects(DESKTOP_LAYOUT))
  })
})

describe("resize handles", () => {
  const handles = (id: string) =>
    Array.from(card(id).querySelectorAll<HTMLElement>("[data-handle]"))
      .map((h) => h.dataset.handle)
      .sort()

  it("offers only height handles when the grid is stacked", () => {
    renderDashboard({ width: PHONE, editing: true })
    expect(handles("a")).toEqual(["s", "se"])
  })

  it("offers every handle on a multi-column grid", () => {
    renderDashboard({ width: DESKTOP, editing: true })
    expect(handles("a")).toHaveLength(8)
  })

  it("shows no handles outside edit mode", () => {
    renderDashboard({ width: DESKTOP })
    expect(handles("a")).toHaveLength(0)
  })
})

describe("widget render context", () => {
  it("tells a widget it is stacked, and how big it is", () => {
    renderDashboard({ width: PHONE })
    expect(contexts.get("a")).toMatchObject({
      stacked: true,
      columns: 1,
      compact: false,
      pixelSize: { width: PHONE - PADDING * 2 },
    })
  })

  it("flags a narrow card as compact on desktop", () => {
    renderDashboard({
      width: DESKTOP,
      layout: [
        { id: "wide", type: "stat", title: "Wide", x: 0, y: 0, w: 6, h: 2 },
        { id: "slim", type: "stat", title: "Slim", x: 6, y: 0, w: 2, h: 2 },
      ],
    })
    expect(contexts.get("wide")).toMatchObject({ stacked: false, columns: 12, compact: false })
    expect(contexts.get("slim")).toMatchObject({ compact: true })
  })

  it("makes the widget body a size container for @-variants", () => {
    renderDashboard({ width: DESKTOP })
    const body = screen.getByText("body a").closest('[data-slot="card-content"]')
    expect(body?.className.split(" ")).toContain("@container")
  })
})

describe("adding a widget on a phone", () => {
  it("anchors it at its intended desktop size, not the phone's one column", () => {
    const state = renderDashboard({ width: PHONE, editing: true })
    fireEvent.click(screen.getByRole("button", { name: "Add widget" }))
    const bar = document.querySelector<HTMLElement>('[data-slot="dashboard-widget-bar"]')!
    fireEvent.click(within(bar).getByRole("button", { name: "Add Chart" }))

    const added = state.layout.find((i) => !["a", "b", "c"].includes(i.id))
    expect(added).toMatchObject({ x: 0, w: 1, h: 5, anchorW: 6, anchorH: 4 })
    expectNoOverlaps(state.layout)
  })
})

describe("toolbar on a phone", () => {
  it("keeps an accessible name on icon-only actions", () => {
    renderDashboard({ width: PHONE, editing: true })
    expect(screen.getByRole("button", { name: "Tidy up" })).toBeTruthy()
  })
})
