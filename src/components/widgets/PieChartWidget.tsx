interface PieChartData {
  label: string;
  segments: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

interface PieChartWidgetProps {
  data?: PieChartData;
}

export function PieChartWidget({ data }: PieChartWidgetProps) {
  const defaultData: PieChartData = {
    label: 'Sales Distribution',
    segments: [
      { name: 'Product A', value: 40, color: '#3B82F6' },
      { name: 'Product B', value: 30, color: '#EF4444' },
      { name: 'Product C', value: 20, color: '#10B981' },
      { name: 'Product D', value: 10, color: '#F59E0B' }
    ]
  };

  const widgetData = data || defaultData;
  const total = widgetData.segments.reduce((sum, segment) => sum + segment.value, 0);

  // Create pie chart using conic-gradient
  let cumulativePercentage = 0;
  const gradientStops = widgetData.segments.map(segment => {
    const percentage = (segment.value / total) * 100;
    const start = cumulativePercentage;
    const end = cumulativePercentage + percentage;
    cumulativePercentage = end;
    return `${segment.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2 text-center flex-shrink-0">
        {widgetData.label}
      </h3>
      
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative">
          {/* Pie Chart */}
          <div
            className="w-24 h-24 rounded-full"
            style={{
              background: `conic-gradient(${gradientStops})`
            }}
          />
          
          {/* Center circle for donut effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                {total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-1 mt-2 flex-shrink-0">
        {widgetData.segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-1 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {segment.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PieChartPreview() {
  return (
    <div className="p-2 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex items-center gap-2">
        {/* Simplified pie chart */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 via-red-400 to-green-400 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-50 dark:bg-gray-800 rounded-full" />
          </div>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Pie Chart
        </div>
      </div>
    </div>
  );
} 