"use client";

import * as React from "react";
import { createContext, useContext, useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  delay: number;
  triggerRef: React.RefObject<HTMLElement>;
}

const TooltipContext = createContext<TooltipContextValue | undefined>(undefined);

export function TooltipProvider({ children }: { children: any }) {
  return (<>{children}</>) as any;
}

export function Tooltip({
  children,
  delayDuration = 200
}: {
  children: any;
  delayDuration?: number;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  return (
    <TooltipContext.Provider value={{ open, setOpen, delay: delayDuration, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  ) as any;
}

export function TooltipTrigger({
  children,
  asChild,
  className,
  ...props
}: {
  children: any;
  asChild?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLElement>) {
  const context = useContext(TooltipContext);
  if (!context) throw new Error("TooltipTrigger must be used within Tooltip");

  const { setOpen, delay, triggerRef } = context;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(true), delay);
  }, [delay, setOpen]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  }, [setOpen]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const childClassName = React.isValidElement(children) ? (children.props as any).className : undefined;

  const commonProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    ref: triggerRef as React.RefObject<any>,
    ...props,
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...commonProps,
      className: cn(childClassName, className)
    }) as any;
  }

  return (
    <div {...(commonProps as any)} className={cn("inline-block", className)}>
      {children}
    </div>
  ) as any;
}

export function TooltipContent({
  className,
  sideOffset = 8,
  children,
  ...props
}: {
  className?: string;
  sideOffset?: number;
  children: any;
} & React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(TooltipContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  if (!context) throw new Error("TooltipContent must be used within Tooltip");

  const { open, triggerRef } = context;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = (triggerRef.current as HTMLElement).getBoundingClientRect();
    const contentRect = (contentRef.current as HTMLElement).getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    let left = triggerRect.left + scrollX + (triggerRect.width / 2) - (contentRect.width / 2);
    let top = triggerRect.top + scrollY - contentRect.height - sideOffset;

    if (triggerRect.top - contentRect.height - sideOffset < 0) {
      top = triggerRect.bottom + scrollY + sideOffset;
    }

    const margin = 8;
    left = Math.max(margin + scrollX, Math.min(left, window.innerWidth + scrollX - contentRect.width - margin));

    setPosition({ top, left });
    setIsPositioned(true);
  }, [triggerRef, sideOffset]);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
        setIsPositioned(false);
      };
    }
  }, [open, updatePosition]);

  if (!open) return null;

  const style: React.CSSProperties = {
    top: position.top,
    left: position.left,
    position: 'absolute',
    opacity: isPositioned ? 1 : 0,
    pointerEvents: 'none',
    zIndex: 100,
  };

  return createPortal(
    (<div
      ref={contentRef}
      style={style as any}
      className={cn(
        "px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 dark:border dark:border-gray-700 shadow-xl",
        "animate-in fade-in zoom-in-95 duration-200",
        "whitespace-nowrap select-none",
        className
      )}
      {...(props as any)}
    >
      {children}
    </div>) as any,
    document.body
  ) as any;
}
