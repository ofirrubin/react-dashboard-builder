// shadcn/ui/tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const TooltipTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const TooltipContent: React.FC<{ side?: string; className?: string; children: React.ReactNode }> = ({ children, className = '' }) => {
  return (
    <div className={`absolute z-50 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-md ${className}`}>
      {children}
    </div>
  );
};

export const Tooltip: React.FC<TooltipProps> = ({ children, content, side = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      let y = triggerRect.top - tooltipRect.height - 8;
      
      if (side === 'bottom') {
        y = triggerRect.bottom + 8;
      } else if (side === 'left') {
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      } else if (side === 'right') {
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
      }
      
      setPosition({ x, y });
    }
  }, [isVisible, side]);

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        className="cursor-pointer"
      >
        {children}
      </div>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-md ${className}`}
          style={{ left: position.x, top: position.y }}
        >
          {content}
        </div>
      )}
    </div>
  );
}; 