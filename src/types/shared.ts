/**
 * Generic types for the RUD library.
 * These are framework-agnostic and should be bound to specific framework types (React/Preact) 
 * in their respective type definition files.
 */

export interface BaseWidgetProps {
  id: string;
  title: string;
  type: string;
}

export interface GridItem<TNode> {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  title: string;
  content?: () => TNode;
  onMenuClick?: (event: MouseEvent | TouchEvent) => void;
  menuIcon?: TNode;
  isAnimating?: boolean;
  originalX?: number;
  originalY?: number;
  originalW?: number;
  originalH?: number;
}

export interface DragState<TNode> {
  id: string;
  startX: number;
  startY: number;
  originalItem: GridItem<TNode>;
}

export interface ResizeState<TNode> extends DragState<TNode> {
  handle: string;
}

export interface WidgetType<TNode, TComponent> {
  id: string;
  type: string;
  title: string;
  icon: TNode;
  defaultSize: {
    w: number;
    h: number;
  };
  description: string;
  component: TComponent | null;
  preview: TComponent | null;
  onMenuClick?: (event: MouseEvent | TouchEvent) => void;
  menuIcon?: TNode;
}

export type GridMode = 'elegant' | 'dots' | 'harsh' | 'blank';

export interface DashboardActions<TNode, TComponent> {
  toggleEditMode: () => void;
  toggleAddWidgetMode: () => void;
  autoOrganize: () => void;
  toggleFixedHeight: () => void;
  addWidget: (widget: WidgetType<TNode, TComponent>, x?: number, y?: number) => void;
  removeItem: (id: string) => void;
}

export interface DashboardState<TNode> {
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
  items: GridItem<TNode>[];
}

export interface SerializedDashboardItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  title: string;
  originalX?: number;
  originalY?: number;
  originalW?: number;
  originalH?: number;
  onMenuClick?: (event: MouseEvent | TouchEvent) => void;
}

export interface SerializedDashboard {
  version: number;
  items: SerializedDashboardItem[];
}

export interface DashboardController<TNode> {
  items: GridItem<TNode>[];
  addItem: (item: GridItem<TNode>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<GridItem<TNode>>) => void;
  setItems: (items: GridItem<TNode>[] | ((prev: GridItem<TNode>[]) => GridItem<TNode>[])) => void;
  save: () => SerializedDashboard;
  load: (state: SerializedDashboard) => void;
  clear: () => void;
  isEditMode: boolean;
  toggleEditMode: () => void;
  setEditMode: (enabled: boolean) => void;
}

export interface UseDashboardControllerOptions<TNode> {
  initialItems?: GridItem<TNode>[];
  initialEditMode?: boolean;
}

export interface CustomToolbarProps<TNode, TComponent> {
  state: DashboardState<TNode>;
  actions: DashboardActions<TNode, TComponent>;
  availableWidgetTypes: WidgetType<TNode, TComponent>[];
}

export interface DashboardProps<TNode, TComponent, TToolbarProps> {
  availableWidgetTypes?: WidgetType<TNode, TComponent>[];
  initialItems?: SerializedDashboardItem[];
  widgetRegistry?: Record<string, TComponent>;
  onItemsChange?: (items: SerializedDashboardItem[]) => void;
  className?: string;
  enableEditMode?: boolean;
  defaultEditMode?: boolean;
  gridMode?: GridMode;
  showDefaultToolbar?: boolean;
  customToolbar?: (props: TToolbarProps) => TNode;
  customToolbarActions?: (isEditMode: boolean) => TNode;
  toolbarClassName?: string;
  onEditModeChange?: (isEditMode: boolean) => void;
  onAddWidgetModeChange?: (isAddWidgetMode: boolean) => void;
  onFixedHeightChange?: (isFixedHeight: boolean) => void;
  controller?: DashboardController<TNode>;
  style?: Record<string, any>;
  innerClassName?: string;
  innerStyle?: Record<string, any>;
}

export interface DashboardToolbarProps<TNode, TComponent> {
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
  onAddWidget?: (widget: WidgetType<TNode, TComponent>) => void;
  availableWidgetTypes?: WidgetType<TNode, TComponent>[];
  gridMode?: GridMode;
  onGridModeChange?: (mode: GridMode) => void;
  customActions?: TNode;
}

export interface BasicWidgetProps extends BaseWidgetProps { }

export interface ProgressBarData {
  label: string;
  value: number;
  max: number;
  color?: string;
}

export interface ProgressBarWidgetProps extends BaseWidgetProps {
  data: ProgressBarData;
}

export interface PieChartData {
  label: string;
  segments: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface PieChartWidgetProps extends BaseWidgetProps {
  data: PieChartData;
}

export interface BarChartData {
  label: string;
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

export interface BarChartWidgetProps extends BaseWidgetProps {
  data: BarChartData;
}

export interface LineChartData {
  label: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
}

export interface LineChartWidgetProps extends BaseWidgetProps {
  data: LineChartData;
}
