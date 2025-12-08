import React from 'react';

export interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  title: string;
  content?: () => React.ReactNode;
  isAnimating?: boolean;
  originalX?: number;
  originalY?: number;
  originalW?: number;
  originalH?: number;
}
export interface DragState {
  id: string;
  startX: number;
  startY: number;
  originalItem: GridItem;
}
export interface ResizeState extends DragState {
  handle: string;
}
export interface WidgetType {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  defaultSize: {
    w: number;
    h: number;
  };
  description: string;
  component: React.ComponentType<any>;
  preview: React.ComponentType<any>;
}
export type GridMode = 'elegant' | 'dots' | 'harsh' | 'blank';
export interface DashboardActions {
  toggleEditMode: () => void;
  toggleAddWidgetMode: () => void;
  autoOrganize: () => void;
  toggleFixedHeight: () => void;
  addWidget: (widget: WidgetType, x?: number, y?: number) => void;
  removeItem: (id: string) => void;
}
export interface DashboardState {
  isEditMode: boolean;
  isAddWidgetMode: boolean;
  isFixedHeight: boolean;
  gridDimensions: {
    width: number;
    height: number;
    cols: number;
    rows: number;
  };
  itemCount: number;
  items: GridItem[];
}

export interface SerializedDashboard {
  items: Omit<GridItem, 'content'>[];
}

export interface DashboardController {
  items: GridItem[];
  addItem: (item: GridItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<GridItem>) => void;
  setItems: (items: GridItem[] | ((prev: GridItem[]) => GridItem[])) => void;
  save: () => SerializedDashboard;
  load: (state: SerializedDashboard) => void;
  clear: () => void;
  // State for UI
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
}

export interface UseDashboardControllerOptions {
  initialItems?: GridItem[];
  initialEditMode?: boolean;
}

export interface CustomToolbarProps {
  state: DashboardState;
  actions: DashboardActions;
  availableWidgetTypes: WidgetType[];
}
export interface DashboardProps {
  availableWidgetTypes?: WidgetType[];
  initialItems?: Omit<GridItem, 'content'>[];
  widgetRegistry?: Record<string, React.ComponentType<any>>;
  onItemsChange?: (items: Omit<GridItem, 'content'>[]) => void;
  className?: string;
  enableEditMode?: boolean;
  defaultEditMode?: boolean;
  gridMode?: GridMode;
  showDefaultToolbar?: boolean;
  customToolbar?: React.ComponentType<CustomToolbarProps> | ((props: CustomToolbarProps) => React.ReactNode);
  toolbarClassName?: string;
  onEditModeChange?: (isEditMode: boolean) => void;
  onAddWidgetModeChange?: (isAddWidgetMode: boolean) => void;
  onFixedHeightChange?: (isFixedHeight: boolean) => void;
  controller?: DashboardController;
}
export interface DashboardToolbarProps {
  isEditMode: boolean;
  onToggleMode: () => void;
  onAutoOrganize: () => void;
  onToggleFixedHeight: () => void;
  isFixedHeight: boolean;
  gridDimensions: {
    width: number;
    height: number;
    cols: number;
    rows: number;
  };
  itemCount: number;
  isAddWidgetMode?: boolean;
  onToggleAddWidgetMode?: () => void;
  onAddWidget?: (widget: WidgetType) => void;
  availableWidgetTypes?: WidgetType[];
}

export interface BasicWidgetProps {
  id?: string;
  title?: string;
}
export interface ProgressBarData {
  label: string;
  value: number;
  max: number;
  color?: string;
}
export interface ProgressBarWidgetProps {
  data?: ProgressBarData;
}
export interface PieChartData {
  label: string;
  segments: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}
export interface PieChartWidgetProps {
  data?: PieChartData;
}
export interface BarChartData {
  label: string;
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}
export interface BarChartWidgetProps {
  data?: BarChartData;
}
export interface LineChartData {
  label: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
}
export interface LineChartWidgetProps {
  data?: LineChartData;
}