"use client"

import * as React from "react"
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react"
import type { GridStyle } from "rud-dashboard"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import type { WidgetCatalog } from "./use-dashboard"

const GRID_STYLES: { value: GridStyle; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "dots", label: "Dots" },
  { value: "bold", label: "Bold" },
  { value: "none", label: "None" },
]

export interface DashboardToolbarProps {
  widgets: WidgetCatalog
  itemCount: number
  isEditing: boolean
  editable?: boolean
  onEditingChange: (editing: boolean) => void
  onAddWidget: (type: string) => void
  onTidy: () => void
  gridStyle: GridStyle
  onGridStyleChange: (style: GridStyle) => void
  isFixedHeight: boolean
  onFixedHeightChange: () => void
  className?: string
  children?: React.ReactNode
}

export function DashboardToolbar({
  widgets,
  itemCount,
  isEditing,
  editable = true,
  onEditingChange,
  onAddWidget,
  onTidy,
  gridStyle,
  onGridStyleChange,
  isFixedHeight,
  onFixedHeightChange,
  className,
  children,
}: DashboardToolbarProps) {
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const entries = Object.entries(widgets)

  return (
    <div
      data-slot="dashboard-toolbar"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <Badge variant="secondary" className="tabular-nums">
        {itemCount} {itemCount === 1 ? "widget" : "widgets"}
      </Badge>

      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-6" />

      {editable && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => onEditingChange(!isEditing)}
            >
              {isEditing ? (
                <CheckIcon data-icon="inline-start" />
              ) : (
                <PencilIcon data-icon="inline-start" />
              )}
              {isEditing ? "Done" : "Edit layout"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isEditing ? "Lock the layout" : "Drag, resize, and add widgets"}
          </TooltipContent>
        </Tooltip>
      )}

      {isEditing && (
        <>
          <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <PlusIcon data-icon="inline-start" />
                Add widget
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-1">
              {entries.length === 0 ? (
                <p className="text-muted-foreground p-4 text-center text-sm">
                  No widgets registered.
                </p>
              ) : (
                <div className="flex max-h-80 flex-col gap-1 overflow-auto">
                  {entries.map(([type, definition]) => {
                    const Icon = definition.icon
                    const size = definition.defaultSize ?? { w: 4, h: 3 }
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          onAddWidget(type)
                          setPaletteOpen(false)
                        }}
                        className={cn(
                          "flex items-start gap-3 p-2 text-left",
                          // Concentric: popover radius (--radius-lg) minus its p-1 inset.
                          "rounded-sm",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none",
                          // Specific properties only — never `transition-all`.
                          "transition-[background-color,color,scale] duration-150",
                          "active:scale-[0.96]"
                        )}
                      >
                        {Icon && (
                          <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-sm [&_svg]:size-4">
                            <Icon />
                          </span>
                        )}
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-sm leading-none font-medium">
                            {definition.title}
                          </span>
                          {definition.description && (
                            <span className="text-muted-foreground text-xs">
                              {definition.description}
                            </span>
                          )}
                          <span className="text-muted-foreground/70 text-[11px] tabular-nums">
                            {size.w}&times;{size.h}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </PopoverContent>
          </Popover>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onTidy} disabled={itemCount === 0}>
                <SparklesIcon data-icon="inline-start" />
                Tidy up
              </Button>
            </TooltipTrigger>
            <TooltipContent>Repack widgets to remove gaps</TooltipContent>
          </Tooltip>
        </>
      )}

      <div className="ms-auto flex items-center gap-2">
        {children}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Canvas settings">
              <SettingsIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="dashboard-grid-style">Grid</FieldLabel>
                <ToggleGroup
                  id="dashboard-grid-style"
                  type="single"
                  variant="outline"
                  size="sm"
                  value={gridStyle}
                  onValueChange={(value) => {
                    // Radix clears the value when the active item is re-pressed.
                    if (value) onGridStyleChange(value as GridStyle)
                  }}
                  className="w-full"
                >
                  {GRID_STYLES.map(({ value, label }) => (
                    <ToggleGroupItem key={value} value={value} className="flex-1 text-xs">
                      {label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="dashboard-fixed-height">Fixed height</FieldLabel>
                  <FieldDescription>Scroll inside the canvas instead of growing.</FieldDescription>
                </FieldContent>
                <Switch
                  id="dashboard-fixed-height"
                  checked={isFixedHeight}
                  onCheckedChange={onFixedHeightChange}
                />
              </Field>
            </FieldGroup>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
