import { ComponentChildren, ComponentType } from 'preact';
import * as Shared from './shared';

// Bind Preact types to the generic types
export type GridItem = Shared.GridItem<ComponentChildren>;
export type DragState = Shared.DragState<ComponentChildren>;
export type ResizeState = Shared.ResizeState<ComponentChildren>;
export type WidgetType = Shared.WidgetType<ComponentChildren> & {
  component: ComponentType<any>;
  preview: ComponentType<any>;
};
export type DashboardActions = Shared.DashboardActions<ComponentChildren>;
export type DashboardState = Shared.DashboardState<ComponentChildren>;
export type DashboardController = Shared.DashboardController<ComponentChildren>;
export type UseDashboardControllerOptions = Shared.UseDashboardControllerOptions<ComponentChildren>;
export type CustomToolbarProps = Shared.CustomToolbarProps<ComponentChildren>;
export type DashboardProps = Shared.DashboardProps<ComponentChildren> & {
  widgetRegistry?: Record<string, ComponentType<any>>;
  customToolbar?: ComponentType<CustomToolbarProps> | ((props: CustomToolbarProps) => ComponentChildren);
};
export type DashboardToolbarProps = Shared.DashboardToolbarProps<ComponentChildren>;

// Re-export non-generic types
export type { GridMode, SerializedDashboard } from './shared';

// Re-export widget props (these don't need framework-specific types)
export * from './shared';
