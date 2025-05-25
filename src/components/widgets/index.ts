import { BasicWidget, BasicWidgetPreview } from './BasicWidget';
import { ProgressBarWidget, ProgressBarPreview } from './ProgressBarWidget';
import { PieChartWidget, PieChartPreview } from './PieChartWidget';
import { BarChartWidget, BarChartPreview } from './BarChartWidget';
import { LineChartWidget, LineChartPreview } from './LineChartWidget';

export {
  BasicWidget,
  ProgressBarWidget,
  PieChartWidget,
  BarChartWidget,
  LineChartWidget
};

// Export all preview components
export {
  BasicWidgetPreview,
  ProgressBarPreview,
  PieChartPreview,
  BarChartPreview,
  LineChartPreview
};

// Widget registry - maps widget types to their components
export const widgetRegistry = {
  basic: BasicWidget,
  progress: ProgressBarWidget,
  pie: PieChartWidget,
  bar: BarChartWidget,
  line: LineChartWidget
};

// Preview registry - maps widget types to their preview components
export const previewRegistry = {
  basic: BasicWidgetPreview,
  progress: ProgressBarPreview,
  pie: PieChartPreview,
  bar: BarChartPreview,
  line: LineChartPreview
};

// Function to get widget component by type
export function getWidgetComponent(type: string) {
  return widgetRegistry[type as keyof typeof widgetRegistry] || BasicWidget;
}

// Function to get preview component by type
export function getPreviewComponent(type: string) {
  return previewRegistry[type as keyof typeof previewRegistry] || BasicWidgetPreview;
} 