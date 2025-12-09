// Generic types that work with any framework
export interface GridItem<T = any> {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  title: string;
  content?: () => T;
  onMenuClick?: (event: any) => void;
  menuIcon?: T; // Custom icon for the menu button (e.g., Settings, Upload, Trash, etc.)
  isAnimating?: boolean;
  originalX?: number;
  originalY?: number;
  originalW?: number;
  originalH?: number;
}
export interface DragState<T = any> {
  id: string;
  startX: number;
  startY: number;
  originalItem: GridItem<T>;
}
export interface ResizeState<T = any> extends DragState<T> {
  handle: string;
}
export interface WidgetType<T = any> {
  id: string;
  type: string;
  title: string;
  icon: T;
  defaultSize: {
    w: number;
    h: number;
  };
  description: string;
  component: any;
  preview: any;
  onMenuClick?: (event: any) => void;
  menuIcon?: T;
}
export type GridMode = 'elegant' | 'dots' | 'harsh' | 'blank';
export interface DashboardActions<T = any> {
  toggleEditMode: () => void;
  toggleAddWidgetMode: () => void;
  autoOrganize: () => void;
  toggleFixedHeight: () => void;
  addWidget: (widget: WidgetType<T>, x?: number, y?: number) => void;
  removeItem: (id: string) => void;
}
export interface DashboardState<T = any> {
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
  items: GridItem<T>[];
}

export interface SerializedDashboard {
  items: Omit<GridItem<any>, 'content'>[];
}

export interface DashboardController<T = any> {
  items: GridItem<T>[];
  addItem: (item: GridItem<T>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<GridItem<T>>) => void;
  setItems: (items: GridItem<T>[] | ((prev: GridItem<T>[]) => GridItem<T>[])) => void;
  save: () => SerializedDashboard;
  load: (state: SerializedDashboard) => void;
  clear: () => void;
  // State for UI
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
}

export interface UseDashboardControllerOptions<T = any> {
  initialItems?: GridItem<T>[];
  initialEditMode?: boolean;
}

export interface CustomToolbarProps<T = any> {
  state: DashboardState<T>;
  actions: DashboardActions<T>;
  availableWidgetTypes: WidgetType<T>[];
}
export interface DashboardProps<T = any> {
  availableWidgetTypes?: WidgetType<T>[];
  initialItems?: Omit<GridItem<T>, 'content'>[];
  widgetRegistry?: Record<string, any>;
  onItemsChange?: (items: Omit<GridItem<T>, 'content'>[]) => void;
  className?: string;
  enableEditMode?: boolean;
  defaultEditMode?: boolean;
  gridMode?: GridMode;
  showDefaultToolbar?: boolean;
  customToolbar?: any;
  toolbarClassName?: string;
  onEditModeChange?: (isEditMode: boolean) => void;
  onAddWidgetModeChange?: (isAddWidgetMode: boolean) => void;
  onFixedHeightChange?: (isFixedHeight: boolean) => void;
  controller?: DashboardController<T>;
}
export interface DashboardToolbarProps<T = any> {
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
  onAddWidget?: (widget: WidgetType<T>) => void;
  availableWidgetTypes?: WidgetType<T>[];
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