interface ProgressBarData {
  label: string;
  value: number;
  max: number;
  color?: string;
}

interface ProgressBarWidgetProps {
  data?: ProgressBarData;
}

export function ProgressBarWidget({ data }: ProgressBarWidgetProps) {
  const defaultData: ProgressBarData = {
    label: 'Progress',
    value: 75,
    max: 100,
    color: 'bg-blue-500'
  };

  const widgetData = data || defaultData;
  const percentage = (widgetData.value / widgetData.max) * 100;

  return (
    <div className="p-4 h-full flex flex-col justify-center overflow-hidden">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {widgetData.label}
        </h3>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {widgetData.value}%
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
          <div
            className={`h-3 rounded-full ${widgetData.color || 'bg-blue-500'} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {widgetData.value} of {widgetData.max}
        </p>
      </div>
    </div>
  );
}

export function ProgressBarPreview() {
  return (
    <div className="p-2 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
      <div className="w-full max-w-20">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">
          Progress
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
          <div className="bg-blue-400 h-1.5 rounded-full w-3/4 animate-pulse" />
        </div>
      </div>
    </div>
  );
} 