import './index.css';
// Main Dashboard component
// Main Dashboard component
export { default as Dashboard } from './components/Dashboard';

// Controller
export { useDashboardController } from './lib/useDashboardController';

// Toolbar component
export { DashboardToolbar } from './components/DashboardToolbar';

// Widget components
export {
  BasicWidget,
  ProgressBarWidget,
  PieChartWidget,
  BarChartWidget,
  LineChartWidget,
  BasicWidgetPreview,
  ProgressBarPreview,
  PieChartPreview,
  BarChartPreview,
  LineChartPreview,
  widgetRegistry,
  previewRegistry,
  getWidgetComponent,
  getPreviewComponent
} from './components/widgets';

// Types
export type {
  GridItem,
  DragState,
  ResizeState,
  WidgetType,
  DashboardProps,
  DashboardToolbarProps
} from './types';

// Constants
export {
  GRID_SIZE,
  MARGIN,
  CELL_SIZE,
  ANIMATION_DURATION,
  MIN_SIZE,
  MAX_SIZE,
  CONTAINER_PADDING,
  MIN_CONTAINER_HEIGHT,
  DEBOUNCE_DELAY
} from './constants';

// UI Components
export { Button } from './ui/button';
export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip'; 