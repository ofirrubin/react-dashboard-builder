import { BaseWidgetProps, BarChartWidgetProps } from '../../types/shared';
import { cn } from '../../lib/utils';

export function BarChartWidget({ id, title, data }: BarChartWidgetProps & BaseWidgetProps) {
  const defaultData: BarChartWidgetProps['data'] = {
    label: 'Monthly Revenue',
    data: [
      { name: 'Jan', value: 65, color: '#3B82F6' },
      { name: 'Feb', value: 85, color: '#3B82F6' },
      { name: 'Mar', value: 75, color: '#3B82F6' },
      { name: 'Apr', value: 95, color: '#3B82F6' },
      { name: 'May', value: 80, color: '#3B82F6' },
      { name: 'Jun', value: 90, color: '#3B82F6' }
    ]
  };

  const widgetData = data || defaultData;
  const maxValue = Math.max(...widgetData.data.map(item => item.value));

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">
        {widgetData.label || title}
      </h3>
      
      <div className="flex-1 flex items-end justify-between gap-2 px-2 min-h-0">
        {widgetData.data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center group">
              <div className="flex-1 flex items-end w-full relative">
                <div
                  className="w-full rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-sm"
                  style={{
                    height: `${Math.max(4, height)}%`,
                    backgroundColor: item.color || '#3B82F6',
                  }}
                />
                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {item.value}
                </div>
              </div>
              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-3 text-center uppercase tracking-tighter">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BarChartPreview() {
  const heights = [40, 70, 50, 90, 60];
  
  return (
    <div className="p-3 h-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-end justify-center gap-0.5 p-1.5 border border-blue-100 dark:border-blue-800">
        {heights.map((h, i) => (
          <div key={i} className="flex-1 bg-blue-600 rounded-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">Bar Analytics</span>
        <span className="text-[10px] text-gray-500 uppercase font-medium">Comparison View</span>
      </div>
    </div>
  );
}
