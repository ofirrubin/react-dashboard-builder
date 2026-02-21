import { ComponentChildren, ComponentType } from 'preact';
import * as Shared from './shared';

// Bind Preact types to the generic types
export type GridItem = Shared.GridItem<ComponentChildren>;
export type DragState = Shared.DragState<ComponentChildren>;
export type ResizeState = Shared.ResizeState<ComponentChildren>;
export type WidgetType = Shared.WidgetType<ComponentChildren, ComponentType<Shared.BaseWidgetProps>>;
export type DashboardActions = Shared.DashboardActions<ComponentChildren, ComponentType<Shared.BaseWidgetProps>>;
export type DashboardState = Shared.DashboardState<ComponentChildren>;
export type DashboardController = Shared.DashboardController<ComponentChildren>;
export type UseDashboardControllerOptions = Shared.UseDashboardControllerOptions<ComponentChildren>;
export type CustomToolbarProps = Shared.CustomToolbarProps<ComponentChildren, ComponentType<Shared.BaseWidgetProps>>;
export type DashboardProps = Shared.DashboardProps<ComponentChildren, ComponentType<Shared.BaseWidgetProps>, CustomToolbarProps>;
export type DashboardToolbarProps = Shared.DashboardToolbarProps<ComponentChildren, ComponentType<Shared.BaseWidgetProps>>;

// Re-export non-generic types
export type { 
  GridMode, 
  SerializedDashboard, 
  SerializedDashboardItem,
  BaseWidgetProps,
  BasicWidgetProps,
  ProgressBarData,
  ProgressBarWidgetProps,
  PieChartData,
  PieChartWidgetProps,
  BarChartData,
  BarChartWidgetProps,
  LineChartData,
  LineChartWidgetProps
} from './shared';
