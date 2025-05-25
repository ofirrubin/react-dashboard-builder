import React from 'react';

// Main grid item interface
export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  title: string;
  content: () => React.ReactNode;
  isAnimating?: boolean;
  originalX?: number;
  originalY?: number;
  originalW?: number;
  originalH?: number;
}

// Drag and resize state interfaces
export interface DragState {
  id: string;
  startX: number;
  startY: number;
  originalItem: GridItem;
}

export interface ResizeState extends DragState {
  handle: string;
}

// Widget type interface
export interface WidgetType {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number };
  description: string;
  component: React.ComponentType<any>;
  preview: React.ComponentType<any>;
}

// Dashboard props
export interface DashboardProps {
  availableWidgetTypes?: WidgetType[];
  initialItems?: Omit<GridItem, 'content'>[];
  widgetRegistry?: Record<string, React.ComponentType<any>>;
  onItemsChange?: (items: Omit<GridItem, 'content'>[]) => void;
  className?: string;
  enableEditMode?: boolean;
  defaultEditMode?: boolean;
}

// Toolbar props
export interface DashboardToolbarProps {
  isEditMode: boolean;
  onToggleMode: () => void;
  onAutoOrganize: () => void;
  onToggleFixedHeight: () => void;
  isFixedHeight: boolean;
  gridDimensions: { width: number; height: number; cols: number; rows: number };
  itemCount: number;
  isAddWidgetMode?: boolean;
  onToggleAddWidgetMode?: () => void;
  onAddWidget?: (widget: WidgetType) => void;
  availableWidgetTypes?: WidgetType[];
} 