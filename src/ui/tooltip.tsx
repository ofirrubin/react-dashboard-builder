"use client"

import { createContext, useContext, useState, useRef, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { cn } from "../lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  delay: number
  triggerRef: { current: HTMLDivElement | null }
}

const TooltipContext = createContext<TooltipContextValue | undefined>(undefined)

interface TooltipProviderProps {
  children?: unknown
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>
}

interface TooltipProps {
  children?: unknown
  delayDuration?: number
}

export function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)

  const content: any = <div ref={triggerRef} className="relative inline-block">
    {children as any}
  </div>

  return (
    <TooltipContext.Provider value={{ open, setOpen, delay: delayDuration, triggerRef }}>
      {content}
    </TooltipContext.Provider>
  )
}

interface TooltipTriggerProps {
  children?: unknown
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
      {children as any}
    </div>
  )
}

TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps {
  children?: unknown
  className?: string
  sideOffset?: number
  side?: "top" | "right" | "bottom" | "left"
  [key: string]: any
}

export function TooltipContent({ className, sideOffset = 4, side = "top", children, ...props }: TooltipContentProps) {
  const context = useContext(TooltipContext)
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isPositioned, setIsPositioned] = useState(false)

  if (!context) throw new Error("TooltipContent must be used within Tooltip")

  const { open, triggerRef } = context

  useLayoutEffect(() => {
    if (open && triggerRef.current && contentRef.current) {
      const updatePosition = () => {
        const triggerRect = triggerRef.current!.getBoundingClientRect()
        const contentRect = contentRef.current!.getBoundingClientRect()
        const scrollY = window.scrollY
        const scrollX = window.scrollX

        let top = 0
        let left = 0

        // Calculate center Left
        left = triggerRect.left + scrollX + (triggerRect.width / 2) - (contentRect.width / 2)

        // Calculate Top (defaulting to 'top' side logic for now as requested)
        // Default: Place above
        top = triggerRect.top + scrollY - contentRect.height - sideOffset

        // Flip logic: If top goes off screen (including scroll), move to bottom
        if (triggerRect.top - contentRect.height - sideOffset < 0) {
          // Place below
          top = triggerRect.bottom + scrollY + sideOffset
        }

        setPosition({ top, left })
        setIsPositioned(true)
      }

      updatePosition()
      // Optional: Listen to window resize/scroll to update position
      window.addEventListener('resize', updatePosition)
      window.addEventListener('scroll', updatePosition, true)

      return () => {
        window.removeEventListener('resize', updatePosition)
        window.removeEventListener('scroll', updatePosition, true)
        setIsPositioned(false)
      }
    }
  }, [open, sideOffset])

  if (!open) return null

  return createPortal(
    <div
      ref={contentRef}
      style={{
        top: position.top,
        left: position.left,
        position: 'absolute',
        opacity: isPositioned ? 1 : 0,
        pointerEvents: 'none',
      }}
      className={cn(
        "z-50 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700",
        "bg-white dark:bg-gray-800 px-3 py-1.5 text-sm",
        "text-gray-900 dark:text-gray-100 shadow-lg dark:shadow-gray-900/50",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        "whitespace-nowrap",
        className
      )}
      {...props}
    >
      {children as any}
    </div> as any,
    document.body
  )
}

TooltipContent.displayName = "TooltipContent"
