"use client"

import * as React from "react"
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  XIcon,
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

const GRID_STYLES: { value: GridStyle; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "dots", label: "Dots" },
  { value: "bold", label: "Bold" },
  { value: "none", label: "None" },
]

/** ToggleGroup hands back a plain string; narrow it instead of asserting. */
function isGridStyle(value: string): value is GridStyle {
  return GRID_STYLES.some((style) => style.value === value)
}

export interface DashboardToolbarProps {
  itemCount: number
  isEditing: boolean
  editable?: boolean
  onEditingChange: (editing: boolean) => void
  isAddWidgetMode: boolean
  onToggleAddWidgetMode: () => void
  onTidy: () => void
  gridStyle: GridStyle
  onGridStyleChange: (style: GridStyle) => void
  isFixedHeight: boolean
  onFixedHeightChange: () => void
  className?: string
  children?: React.ReactNode
}

export function DashboardToolbar({
  itemCount,
  isEditing,
  editable = true,
  onEditingChange,
  isAddWidgetMode,
  onToggleAddWidgetMode,
  onTidy,
  gridStyle,
  onGridStyleChange,
  isFixedHeight,
  onFixedHeightChange,
  className,
  children,
}: DashboardToolbarProps) {
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAddWidgetMode ? "secondary" : "outline"}
                size="sm"
                aria-expanded={isAddWidgetMode}
                onClick={onToggleAddWidgetMode}
              >
                {/*
                  Both icons stay mounted and cross-fade, so the change animates
                  in both directions without a motion library. Values per the
                  interface-polish rules: scale 0.25 -> 1, blur 4px -> 0.
                */}
                <span
                  data-icon="inline-start"
                  className="relative inline-grid size-3.5 place-items-center"
                >
                  <PlusIcon
                    className={cn(
                      "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                      isAddWidgetMode
                        ? "scale-[0.25] opacity-0 blur-[4px]"
                        : "scale-100 opacity-100 blur-0"
                    )}
                  />
                  <XIcon
                    className={cn(
                      "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
                      isAddWidgetMode
                        ? "scale-100 opacity-100 blur-0"
                        : "scale-[0.25] opacity-0 blur-[4px]"
                    )}
                  />
                </span>
                {isAddWidgetMode ? "Close" : "Add widget"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isAddWidgetMode ? "Hide the widget bar" : "Browse available widgets"}
            </TooltipContent>
          </Tooltip>

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
                    if (isGridStyle(value)) onGridStyleChange(value)
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
