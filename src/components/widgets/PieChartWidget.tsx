import { BaseWidgetProps, PieChartWidgetProps } from '../../types/shared';

export function PieChartWidget({ id, title, data }: PieChartWidgetProps & BaseWidgetProps) {
  const defaultData: PieChartWidgetProps['data'] = {
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

  let cumulativePercentage = 0;
  const gradientStops = widgetData.segments.map(segment => {
    const percentage = (segment.value / total) * 100;
    const start = cumulativePercentage;
    const end = cumulativePercentage + percentage;
    cumulativePercentage = end;
    return `${segment.color} ${start}% ${end}%`;
  }).join(', ');

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
        {widgetData.label || title}
      </h3>
      
      <div className="flex-1 flex items-center justify-center min-h-0 relative">
        <div className="relative group">
          <div
            className="w-32 h-32 rounded-full shadow-lg group-hover:scale-105 transition-transform duration-500"
            style={{
              background: `conic-gradient(${gradientStops})`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                {total}
              </span>
              <span className="text-[8px] text-gray-400 uppercase font-bold tracking-tighter">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 flex-shrink-0">
        {widgetData.segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 truncate uppercase tracking-tight">
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
    <div className="p-3 h-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800 p-1.5">
        <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(#3B82F6 0% 40%, #EF4444 40% 70%, #10B981 70% 100%)' }} />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">Market Share</span>
        <span className="text-[10px] text-gray-500 uppercase font-medium">Segment Distribution</span>
      </div>
    </div>
  );
}
