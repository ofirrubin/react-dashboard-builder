import { BaseWidgetProps, LineChartWidgetProps } from '../../types/shared';

export function LineChartWidget({ id, title, data }: LineChartWidgetProps & BaseWidgetProps) {
  const defaultData: LineChartWidgetProps['data'] = {
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
  const range = maxValue - minValue || 1;

  const width = 300;
  const height = 120;
  const padding = 20;

  const points = widgetData.data.map((item, index) => {
    const x = padding + (index / (widgetData.data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((item.value - minValue) / range) * (height - 2 * padding);
    return { x, y, value: item.value, name: item.name };
  });

  // Create smooth cubic bezier curve
  const pathData = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    
    // Control points for smoothness
    const p0 = a[i - 1];
    const p1 = point;
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    
    return `${acc} C ${cp1x},${p0.y} ${cp2x},${p1.y} ${p1.x},${p1.y}`;
  }, '');

  // For the area fill
  const areaPath = `${pathData} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`;

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden bg-white dark:bg-gray-800">
      <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        {widgetData.label || title}
      </h3>
      
      <div className="flex-1 flex items-center justify-center min-h-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={widgetData.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={widgetData.color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.5, 1].map((v, i) => {
            const y = padding + v * (height - 2 * padding);
            return (
              <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" className="text-gray-100 dark:text-gray-700" strokeDasharray="4 4" />
            );
          })}
          
          {/* Area under the line */}
          <path d={areaPath} fill={`url(#grad-${id})`} />
          
          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={widgetData.color || '#3B82F6'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
          
          {/* Interaction points */}
          {points.map((point, index) => (
            <g key={index} className="group/point">
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="white"
                stroke={widgetData.color || '#3B82F6'}
                strokeWidth="2.5"
                className="transition-all duration-300 group-hover/point:r-6 cursor-pointer"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="flex justify-between mt-4">
        {widgetData.data.map((item, index) => (
          index % 2 === 0 && (
            <span key={index} className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
              {item.name}
            </span>
          )
        ))}
      </div>
    </div>
  );
}

export function LineChartPreview() {
  return (
    <div className="p-3 h-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
        <svg width="24" height="16" viewBox="0 0 24 16" className="overflow-visible">
          <path
            d="M 2 14 Q 6 4 10 10 T 18 2 T 22 6"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">Growth Curve</span>
        <span className="text-[10px] text-gray-500 uppercase font-medium">Trend Analysis</span>
      </div>
    </div>
  );
}
