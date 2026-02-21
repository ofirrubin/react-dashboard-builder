import * as React from 'react';
import { BasicWidget, BasicWidgetPreview } from './BasicWidget';
import { ProgressBarWidget, ProgressBarPreview } from './ProgressBarWidget';
import { PieChartWidget, PieChartPreview } from './PieChartWidget';
import { BarChartWidget, BarChartPreview } from './BarChartWidget';
import { LineChartWidget, LineChartPreview } from './LineChartWidget';
import { BaseWidgetProps } from '../../types/shared';

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
export const widgetRegistry: Record<string, React.ComponentType<BaseWidgetProps>> = {
  basic: BasicWidget,
  progress: ProgressBarWidget as React.ComponentType<BaseWidgetProps>,
  pie: PieChartWidget as React.ComponentType<BaseWidgetProps>,
  bar: BarChartWidget as React.ComponentType<BaseWidgetProps>,
  line: LineChartWidget as React.ComponentType<BaseWidgetProps>
};

// Preview registry - maps widget types to their preview components
export const previewRegistry: Record<string, React.ComponentType<BaseWidgetProps>> = {
  basic: BasicWidgetPreview as React.ComponentType<BaseWidgetProps>,
  progress: ProgressBarPreview as React.ComponentType<BaseWidgetProps>,
  pie: PieChartPreview as React.ComponentType<BaseWidgetProps>,
  bar: BarChartPreview as React.ComponentType<BaseWidgetProps>,
  line: LineChartPreview as React.ComponentType<BaseWidgetProps>
};

// Function to get widget component by type
export function getWidgetComponent(type: string): React.ComponentType<BaseWidgetProps> {
  return widgetRegistry[type] || BasicWidget;
}

// Function to get preview component by type
export function getPreviewComponent(type: string): React.ComponentType<BaseWidgetProps> {
  return previewRegistry[type] || BasicWidgetPreview;
}
