"use client"

import * as React from "react"
import {
  ActivityIcon,
  BarChart3Icon,
  DollarSignIcon,
  GaugeIcon,
  StickyNoteIcon,
} from "lucide-react"
import type { SerializedItem } from "rud-dashboard"

import { Button } from "@/components/ui/button"
import { Dashboard } from "@/components/dashboard/dashboard"
import type { WidgetCatalog } from "@/components/dashboard/dashboard"
import { ChartWidget, ChartWidgetPreview } from "@/components/dashboard/widgets/chart-widget"
import { NotesWidget, NotesWidgetPreview } from "@/components/dashboard/widgets/notes-widget"
import { ProgressWidget, ProgressWidgetPreview } from "@/components/dashboard/widgets/progress-widget"
import { StatWidget, StatWidgetPreview } from "@/components/dashboard/widgets/stat-widget"

const REVENUE = [
  { label: "Mar", value: 186 },
  { label: "Apr", value: 305 },
  { label: "May", value: 237 },
  { label: "Jun", value: 273 },
  { label: "Jul", value: 209 },
  { label: "Aug", value: 314 },
]

const TRAFFIC = [
  { label: "Mon", value: 4200 },
  { label: "Tue", value: 5100 },
  { label: "Wed", value: 4800 },
  { label: "Thu", value: 6300 },
  { label: "Fri", value: 7100 },
  { label: "Sat", value: 3900 },
  { label: "Sun", value: 3200 },
]

/**
 * One object describes every widget the dashboard can render. `type` is the key
 * stored in the saved layout, so it must stay stable; everything else is free
 * to change.
 */
const widgets: WidgetCatalog = {
  revenue: {
    title: "Revenue",
    description: "Monthly recurring revenue",
    icon: DollarSignIcon,
    defaultSize: { w: 3, h: 2 },
    preview: () => <StatWidgetPreview />,
    render: () => (
      <StatWidget
        label="Revenue"
        value="$45,231"
        delta="+20.1%"
        trend="up"
        hint="vs. last month"
      />
    ),
  },
  activeUsers: {
    title: "Active users",
    description: "Signed in over the last 24h",
    icon: ActivityIcon,
    defaultSize: { w: 3, h: 2 },
    preview: () => <StatWidgetPreview />,
    render: () => (
      <StatWidget label="Active users" value="2,338" delta="-4.3%" trend="down" hint="vs. yesterday" />
    ),
  },
  revenueChart: {
    title: "Revenue trend",
    description: "Bar chart, last 6 months",
    icon: BarChart3Icon,
    defaultSize: { w: 6, h: 4 },
    preview: () => <ChartWidgetPreview />,
    render: () => <ChartWidget data={REVENUE} seriesName="Revenue" variant="bar" />,
  },
  traffic: {
    title: "Traffic",
    description: "Area chart, last 7 days",
    icon: ActivityIcon,
    defaultSize: { w: 6, h: 4 },
    preview: () => <ChartWidgetPreview />,
    render: () => (
      <ChartWidget data={TRAFFIC} seriesName="Visits" variant="area" color="var(--chart-2)" />
    ),
  },
  quotas: {
    title: "Quotas",
    description: "Usage against plan limits",
    icon: GaugeIcon,
    defaultSize: { w: 3, h: 4 },
    preview: () => <ProgressWidgetPreview />,
    render: () => (
      <ProgressWidget
        rows={[
          { label: "Storage", value: 68, caption: "68 / 100 GB" },
          { label: "Seats", value: 12, max: 20, caption: "12 / 20" },
          { label: "API calls", value: 91, caption: "91%" },
        ]}
      />
    ),
  },
  notes: {
    title: "Release notes",
    description: "Prose, styled by Typeset",
    icon: StickyNoteIcon,
    defaultSize: { w: 3, h: 4 },
    preview: () => <NotesWidgetPreview />,
    render: () => (
      <NotesWidget>
        <h3>What&rsquo;s new</h3>
        <p>
          Widgets are plain components in <em>your</em> project. Restyle them, delete the ones you
          do not need, and add your own.
        </p>
        <ul>
          <li>Drag and resize with mouse, touch, or pen</li>
          <li>
            Keyboard: <code>arrows</code> move, <code>shift</code> + arrows resize
          </li>
          <li>Layouts serialize to plain JSON</li>
        </ul>
      </NotesWidget>
    ),
  },
}

/** Spans are in grid cells on a 12-column grid, so `w: 6` is always half-width. */
const DEFAULT_LAYOUT: SerializedItem[] = [
  { id: "1", type: "revenue", title: "Revenue", x: 0, y: 0, w: 3, h: 2 },
  { id: "2", type: "activeUsers", title: "Active users", x: 3, y: 0, w: 3, h: 2 },
  { id: "3", type: "revenueChart", title: "Revenue trend", x: 6, y: 0, w: 6, h: 4 },
  { id: "4", type: "quotas", title: "Quotas", x: 0, y: 2, w: 3, h: 4 },
  { id: "5", type: "notes", title: "Release notes", x: 3, y: 2, w: 3, h: 4 },
  { id: "6", type: "traffic", title: "Traffic", x: 6, y: 4, w: 6, h: 4 },
]

const STORAGE_KEY = "dashboard-demo-layout"

export function DashboardDemo() {
  // Controlled layout, persisted to localStorage. `useState` initialises from
  // storage so the first paint already has the saved arrangement.
  const [layout, setLayout] = React.useState<SerializedItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_LAYOUT
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_LAYOUT
    try {
      const parsed = JSON.parse(saved)
      return Array.isArray(parsed?.items) && parsed.items.length > 0 ? parsed.items : DEFAULT_LAYOUT
    } catch {
      return DEFAULT_LAYOUT
    }
  })

  React.useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items: layout }))
  }, [layout])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-muted-foreground text-sm">
            Drag, resize, and add widgets. The layout is saved as you go.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.localStorage.removeItem(STORAGE_KEY)
            setLayout(DEFAULT_LAYOUT)
          }}
        >
          Reset layout
        </Button>
      </div>

      <Dashboard
        widgets={widgets}
        layout={layout}
        onLayoutChange={setLayout}
        defaultEditing={false}
        gridStyle="dots"
      />
    </div>
  )
}
