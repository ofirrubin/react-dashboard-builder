import React from 'react';

interface LineChartData {
  label: string;
  data: Array<{
    name: string;
    value: number;
  }>;
  color?: string;
}

interface LineChartWidgetProps {
  data?: LineChartData;
}

export function LineChartWidget({ data }: LineChartWidgetProps) {
  const defaultData: LineChartData = {
    label: 'Performance Trend',
    data: [
      { name: 'Jan', value: 30 },
      { name: 'Feb', value: 45 },
      { name: 'Mar', value: 35 },
      { name: 'Apr', value: 60 },
      { name: 'May', value: 55 },
      { name: 'Jun', value: 75 },
      { name: 'Jul', value: 70 }
    ],
    color: '#3B82F6'
  };

  const widgetData = data || defaultData;
  const maxValue = Math.max(...widgetData.data.map(item => item.value));
  const minValue = Math.min(...widgetData.data.map(item => item.value));
  const range = maxValue - minValue;

  // SVG dimensions
  const width = 200;
  const height = 80;
  const padding = 10;

  // Calculate points for the line
  const points = widgetData.data.map((item, index) => {
    const x = padding + (index / (widgetData.data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((item.value - minValue) / range) * (height - 2 * padding);
    return { x, y, value: item.value, name: item.name };
  });

  // Create path string
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 text-center">
        {widgetData.label}
      </h3>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <svg width={width} height={height} className="overflow-visible">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent, index) => {
              const y = height - padding - (percent / 100) * (height - 2 * padding);
              return (
                <line
                  key={index}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.5"
                  opacity="0.2"
                  className="text-gray-400"
                />
              );
            })}
            
            {/* Line path */}
            <path
              d={pathData}
              fill="none"
              stroke={widgetData.color || '#3B82F6'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={widgetData.color || '#3B82F6'}
                className="hover:r-4 transition-all"
              />
            ))}
          </svg>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
        {widgetData.data.map((item, index) => (
          <span key={index} className="text-center">
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LineChartPreview() {
  return (
    <div className="p-2 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex items-center gap-2">
        {/* Simplified line chart */}
        <svg width="32" height="20" className="overflow-visible">
          <path
            d="M 2 18 L 8 12 L 14 15 L 20 8 L 26 10 L 30 6"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="animate-pulse"
          />
          {[2, 8, 14, 20, 26, 30].map((x, index) => (
            <circle
              key={index}
              cx={x}
              cy={[18, 12, 15, 8, 10, 6][index]}
              r="1"
              fill="#3B82F6"
              className="animate-pulse"
              style={{ animationDelay: `${index * 0.1}s` }}
            />
          ))}
        </svg>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Line Chart
        </div>
      </div>
    </div>
  );
} 