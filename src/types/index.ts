// Internal types for components - use 'any' for flexibility
import * as Shared from './shared';

export type GridItem = Shared.GridItem<any>;
export type DragState = Shared.DragState<any>;
export type ResizeState = Shared.ResizeState<any>;
export type WidgetType = Shared.WidgetType<any>;
export type DashboardActions = Shared.DashboardActions<any>;
export type DashboardState = Shared.DashboardState<any>;
export type DashboardController = Shared.DashboardController<any>;
export type UseDashboardControllerOptions = Shared.UseDashboardControllerOptions<any>;
export type CustomToolbarProps = Shared.CustomToolbarProps<any>;
export type DashboardProps = Shared.DashboardProps<any>;
export type DashboardToolbarProps = Shared.DashboardToolbarProps<any>;

// Re-export everything else
export * from './shared';

