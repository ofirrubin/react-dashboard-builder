"use client"

import * as React from "react"
import { GripVerticalIcon, XIcon } from "lucide-react"
import { gridToPixel, spanToPixels } from "rud-dashboard"
import type { GridFrame, GridRect, ResizeHandle } from "rud-dashboard"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * Resize affordances. Corners show a dot on hover; edges are invisible hit strips.
 *
 * The dots sit 8–16px inside each corner, which is further in than the card's
 * 12px padding — so rather than move them, the card makes room: on hover the
 * header and content ease their padding outward (see `INSET_ON_HOVER` below) and
 * the dots land in the gap that opens up. The mark stays in one place and never
 * covers a chart or a line of text.
 *
 * 24px hit area rather than the usual 40px minimum: a one-column widget is only
 * ~64px wide, so 40px corners would overlap each other, and overlapping hit
 * areas are worse than small ones. Keyboard resize (shift + arrows) is the
 * accessible path.
 */
/**
 * The inset that opens up in edit mode, freeing the corners for the resize dots.
 * Applied to the header and the content so the whole inside draws in together —
 * it reads as the card growing a frame, not as text jumping.
 *
 * Only `padding` transitions. That does reflow the content box, so two guards
 * apply below: it is skipped on cards too small to spare the room, and the
 * transition is dropped while a gesture is running so it never animates a reflow
 * on top of a resize.
 */
const INSET = "group-hover/item:px-5 group-focus-visible/item:px-5"
const INSET_Y = "group-hover/item:py-5 group-focus-visible/item:py-5"
const INSET_TRANSITION =
  "motion-safe:transition-[padding] motion-safe:duration-200 " +
  "motion-safe:ease-[cubic-bezier(0.2,0,0,1)]"

/**
 * Below this the inset would eat the content area rather than frame it — a
 * 1x1 cell is only ~64x56px, and 20px of padding leaves almost nothing.
 */
const MIN_WIDTH_FOR_INSET = 170
const MIN_HEIGHT_FOR_INSET = 130

const HANDLES: { handle: ResizeHandle; className: string; corner: boolean }[] = [
  { handle: "nw", className: "top-0 left-0 size-6 cursor-nwse-resize", corner: true },
  { handle: "ne", className: "top-0 right-0 size-6 cursor-nesw-resize", corner: true },
  { handle: "sw", className: "bottom-0 left-0 size-6 cursor-nesw-resize", corner: true },
  { handle: "se", className: "bottom-0 right-0 size-6 cursor-nwse-resize", corner: true },
  { handle: "n", className: "top-0 inset-x-6 h-2 cursor-ns-resize", corner: false },
  { handle: "s", className: "bottom-0 inset-x-6 h-2 cursor-ns-resize", corner: false },
  { handle: "w", className: "left-0 inset-y-6 w-2 cursor-ew-resize", corner: false },
  { handle: "e", className: "right-0 inset-y-6 w-2 cursor-ew-resize", corner: false },
]

export interface DashboardItemProps {
  item: GridRect & { type: string; title: string }
  frame: GridFrame
  isEditing: boolean
  /** This item is the one currently being dragged or resized. */
  isActive: boolean
  /**
   * Pixel position to paint at while this card is being dragged, overriding its
   * grid position. `snapping: false` means the pointer is moving fast and the
   * card should track it exactly, with no transition to lag behind.
   */
  float?: { x: number; y: number; snapping: boolean } | null
  onRemove?: (id: string) => void
  onDragStart?: (event: React.PointerEvent<HTMLElement>, item: GridRect) => void
  onResizeStart?: (event: React.PointerEvent<HTMLElement>, item: GridRect, handle: ResizeHandle) => void
  onNudge?: (id: string, delta: { x?: number; y?: number; w?: number; h?: number }) => void
  children?: React.ReactNode
}

function DashboardItemComponent({
  item,
  frame,
  isEditing,
  isActive,
  float,
  onRemove,
  onDragStart,
  onResizeStart,
  onNudge,
  children,
}: DashboardItemProps) {
  const slot = gridToPixel(item.x, item.y, frame)
  const size = spanToPixels(item.w, item.h, frame)

  /**
   * Only inset cards with room to spare, and hold the transition still during a
   * gesture: resizing already changes the box every frame, and animating padding
   * at the same time makes charts re-measure repeatedly and look like they are
   * fighting the pointer.
   */
  const canInset =
    isEditing && size.width >= MIN_WIDTH_FOR_INSET && size.height >= MIN_HEIGHT_FOR_INSET
  const insetClasses = canInset && [INSET, !isActive && INSET_TRANSITION]

  // While held, the card paints where the pointer is rather than in its slot.
  const isHeld = Boolean(float)
  const position = float ?? slot
  // Tracking the pointer must be instantaneous; settling into a slot should ease.
  const freeMoving = isHeld && !float!.snapping

  /**
   * Arrow keys move; Shift+arrows resize. Without this the grid is entirely
   * unusable without a pointer — the previous version offered no keyboard path
   * to move or resize a widget at all.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!isEditing || !onNudge) return
    const resizing = event.shiftKey
    const deltas: Record<string, { x?: number; y?: number; w?: number; h?: number }> = resizing
      ? {
          ArrowLeft: { w: -1 },
          ArrowRight: { w: 1 },
          ArrowUp: { h: -1 },
          ArrowDown: { h: 1 },
        }
      : {
          ArrowLeft: { x: -1 },
          ArrowRight: { x: 1 },
          ArrowUp: { y: -1 },
          ArrowDown: { y: 1 },
        }

    const delta = deltas[event.key]
    if (!delta) return
    event.preventDefault()
    onNudge(item.id, delta)
  }

  return (
    <Card
      data-slot="dashboard-item"
      data-editing={isEditing || undefined}
      data-active={isActive || undefined}
      role="group"
      aria-label={item.title || item.type}
      tabIndex={isEditing ? 0 : -1}
      onKeyDown={handleKeyDown}
      className={cn(
        "group/item absolute top-0 left-0 gap-0 overflow-hidden py-0",
        "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
        // Never `transition-all`: it would animate colour, border, and layout
        // properties we never change, and fights the pointer during a drag.
        // Mutually exclusive with the free-moving case below rather than
        // overridden with `!important` — Tailwind v4 spells that as a `!`
        // suffix, and `!transition-none` silently does nothing.
        !freeMoving && [
          "motion-safe:transition-[translate,width,height,box-shadow,opacity,scale]",
          "motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.2,0,0,1)]",
        ],
        // Tracking a fast pointer: any transition here reads as lag or rubber
        // banding. Only the settle back into a slot animates.
        freeMoving && "transition-none will-change-transform",
        isEditing && "cursor-grab active:cursor-grabbing",
        // Held: lifted above the grid, tracking the pointer. It must not
        // intercept pointer events — the gesture is handled on window.
        isHeld && "pointer-events-none z-30 scale-[1.02] shadow-xl",
        // Resizing keeps the card in place; fade it so the indicator reads.
        isActive && !isHeld && "pointer-events-none opacity-40 transition-none"
      )}
      style={{
        // Position via `translate` rather than left/top: the compositor can
        // animate it without a layout pass on every frame of a drag.
        translate: `${position.x}px ${position.y}px`,
        width: size.width,
        height: size.height,
      }}
      onPointerDown={(event) => {
        if (!isEditing) return
        // Ignore presses that started on a control or a resize handle.
        if ((event.target as HTMLElement).closest("[data-no-drag]")) return
        if (event.button !== 0) return
        onDragStart?.(event, item)
      }}
    >
      {/*
        Two things here are load-bearing:

        `relative z-20` — the corner resize handles are absolutely positioned
        over the whole card, so without it the `ne` handle sits on top of the
        remove button and swallows its clicks.

        No `flex` — `CardHeader` is a grid and `CardAction` right-aligns itself
        with `col-start-2`. Switching to flex silently breaks that and the remove
        button ends up jammed against the title. Only padding, gap, and
        alignment are overridden.
      */}
      <CardHeader
        className={cn(
          "relative z-20 shrink-0 items-center gap-0 border-b px-3 py-2",
          insetClasses
        )}
      >
        <CardTitle className="flex min-w-0 items-center gap-1.5 text-sm">
          {isEditing && (
            <GripVerticalIcon
              className="text-muted-foreground/60 size-3.5 shrink-0"
              aria-hidden="true"
            />
          )}
          <span className="truncate">{item.title}</span>
        </CardTitle>
        {isEditing && onRemove && (
          <CardAction data-no-drag>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Remove ${item.title || item.type}`}
              onClick={() => onRemove(item.id)}
              // Visually 24px to fit the compact header, but the pseudo-element
              // extends the hit area to 40px so it is comfortable to tap.
              className={cn(
                "text-muted-foreground hover:text-destructive relative size-6",
                "after:absolute after:top-1/2 after:left-1/2 after:size-10",
                "after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
              )}
            >
              <XIcon />
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent
        className={cn(
          "min-h-0 flex-1 overflow-auto p-3",
          insetClasses,
          // Vertical too, so the bottom corners are clear as well.
          canInset && INSET_Y
        )}
      >
        {children}
      </CardContent>

      {isEditing &&
        HANDLES.map(({ handle, className, corner }) => (
          <div
            key={handle}
            data-no-drag
            aria-hidden="true"
            onPointerDown={(event) => {
              event.stopPropagation()
              if (event.button !== 0) return
              onResizeStart?.(event, item, handle)
            }}
            className={cn(
              "absolute z-10 touch-none",
              className,
              corner && [
                "after:bg-primary after:absolute after:inset-2 after:rounded-full",
                "after:opacity-0 after:transition-opacity after:duration-200",
                // Scoped to this item: hinting on every widget at once whenever the
                // pointer is anywhere in the canvas is just noise.
                "group-hover/item:after:opacity-40 group-focus-visible/item:after:opacity-60",
                "hover:after:opacity-100",
              ]
            )}
          />
        ))}
    </Card>
  )
}

/**
 * Re-render only when something visible actually changes. A dashboard re-renders
 * on every pointer move during a drag, so every other widget must bail out.
 */
export const DashboardItem = React.memo(
  DashboardItemComponent,
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.x === next.item.x &&
    prev.item.y === next.item.y &&
    prev.item.w === next.item.w &&
    prev.item.h === next.item.h &&
    prev.item.title === next.item.title &&
    prev.isEditing === next.isEditing &&
    prev.isActive === next.isActive &&
    prev.float === next.float &&
    prev.frame === next.frame &&
    prev.children === next.children
)
