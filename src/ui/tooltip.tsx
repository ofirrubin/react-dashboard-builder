"use client"

import { createContext, useContext, useState, useRef, useEffect } from "react"
import { cn } from "../lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  delay: number
}

const TooltipContext = createContext<TooltipContextValue | undefined>(undefined)

interface TooltipProviderProps {
  children: any
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

interface TooltipProps {
  children: any
  delayDuration?: number
}

export function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipContext.Provider value={{ open, setOpen, delay: delayDuration }}>
      {children}
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps {
  children: any
  className?: string
  asChild?: boolean
  [key: string]: any
}

export function TooltipTrigger({ children, asChild, className, ...props }: TooltipTriggerProps) {
  const context = useContext(TooltipContext)
  if (!context) throw new Error("TooltipTrigger must be used within Tooltip")

  const { setOpen, delay } = context
  const timeoutRef = useRef<any>()

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setOpen(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("inline-block", className)}
      {...props}
    >
      {children}
    </div>
  )
}

TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps {
  children: any
  className?: string
  sideOffset?: number
  side?: "top" | "right" | "bottom" | "left"
  [key: string]: any
}

export function TooltipContent({ className, sideOffset = 4, side = "top", children, ...props }: TooltipContentProps) {
  const context = useContext(TooltipContext)
  if (!context) throw new Error("TooltipContent must be used within Tooltip")

  const { open } = context

  if (!open) return null

  const sideClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  }

  return (
    <div
      className={cn(
        "absolute z-50 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-800 px-3 py-1.5 text-sm",
        "text-gray-900 dark:text-gray-100 shadow-lg dark:shadow-gray-900/50",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

TooltipContent.displayName = "TooltipContent"
