import { ReactNode, ComponentType } from 'react';
import * as Shared from './shared';

// Bind React types to the generic types
export type GridItem = Shared.GridItem<ReactNode>;
export type DragState = Shared.DragState<ReactNode>;
export type ResizeState = Shared.ResizeState<ReactNode>;
export type WidgetType = Shared.WidgetType<ReactNode, ComponentType<Shared.BaseWidgetProps>>;
export type DashboardActions = Shared.DashboardActions<ReactNode, ComponentType<Shared.BaseWidgetProps>>;
export type DashboardState = Shared.DashboardState<ReactNode>;
export type DashboardController = Shared.DashboardController<ReactNode>;
export type UseDashboardControllerOptions = Shared.UseDashboardControllerOptions<ReactNode>;
export type CustomToolbarProps = Shared.CustomToolbarProps<ReactNode, ComponentType<Shared.BaseWidgetProps>>;
export type DashboardProps = Shared.DashboardProps<ReactNode, ComponentType<Shared.BaseWidgetProps>, CustomToolbarProps>;
export type DashboardToolbarProps = Shared.DashboardToolbarProps<ReactNode, ComponentType<Shared.BaseWidgetProps>>;

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
