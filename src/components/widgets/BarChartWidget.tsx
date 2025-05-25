import React from 'react';

interface BarChartData {
  label: string;
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

interface BarChartWidgetProps {
  data?: BarChartData;
}

export function BarChartWidget({ data }: BarChartWidgetProps) {
  const defaultData: BarChartData = {
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
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
        {widgetData.label}
      </h3>
      
      <div className="flex-1 flex items-end justify-between gap-1 px-2">
        {widgetData.data.map((item, index) => {
          const height = (item.value / maxValue) * 100;
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="flex-1 flex items-end w-full">
                <div
                  className="w-full rounded-t transition-all duration-500 hover:opacity-80"
                  style={{
                    height: `${height}%`,
                    backgroundColor: item.color || '#3B82F6',
                    minHeight: '4px'
                  }}
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BarChartPreview() {
  const heights = [60, 80, 40, 90, 70];
  
  return (
    <div className="p-2 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex items-end gap-1 h-8">
        {heights.map((height, index) => (
          <div
            key={index}
            className="w-2 bg-blue-400 rounded-t animate-pulse"
            style={{ 
              height: `${height}%`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
      <div className="ml-2 text-xs text-gray-600 dark:text-gray-400">
        Bar Chart
      </div>
    </div>
  );
} 