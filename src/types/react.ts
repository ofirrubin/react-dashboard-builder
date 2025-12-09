import { ReactNode, ComponentType } from 'react';
import * as Shared from './shared';

// Bind React types to the generic types
export type GridItem = Shared.GridItem<ReactNode>;
export type DragState = Shared.DragState<ReactNode>;
export type ResizeState = Shared.ResizeState<ReactNode>;
export type WidgetType = Omit<Shared.WidgetType<ReactNode>, 'component' | 'preview'> & {
  component: ComponentType<any>;
  preview: ComponentType<any>;
};
export type DashboardActions = Shared.DashboardActions<ReactNode>;
export type DashboardState = Shared.DashboardState<ReactNode>;
export type DashboardController = Shared.DashboardController<ReactNode>;
export type UseDashboardControllerOptions = Shared.UseDashboardControllerOptions<ReactNode>;
export type CustomToolbarProps = Shared.CustomToolbarProps<ReactNode>;
export type DashboardProps = Shared.DashboardProps<ReactNode> & {
  widgetRegistry?: Record<string, ComponentType<any>>;
  customToolbar?: ComponentType<CustomToolbarProps> | ((props: CustomToolbarProps) => ReactNode);
};
export type DashboardToolbarProps = Shared.DashboardToolbarProps<ReactNode>;

// Re-export non-generic types
export type { GridMode, SerializedDashboard } from './shared';

// Re-export widget props (these don't need framework-specific types)
export * from './shared';
