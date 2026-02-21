import { BaseWidgetProps, ProgressBarWidgetProps } from '../../types/shared';
import { cn } from '../../lib/utils';

export function ProgressBarWidget({ id, title, data }: ProgressBarWidgetProps & BaseWidgetProps) {
  const percentage = data ? (data.value / data.max) * 100 : 75;
  const label = data?.label || title || 'Progress';
  const color = data?.color || 'bg-blue-600';

  return (
    <div className="p-6 h-full flex flex-col justify-center overflow-hidden bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {label}
        </h3>
        <span className="text-2xl font-black text-gray-900 dark:text-gray-100">
          {Math.round(percentage)}%
        </span>
      </div>
      
      <div className="relative w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-4 border border-gray-200/50 dark:border-gray-600/50">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-sm", color)}
          style={{ width: `${percentage}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
        <span>Current: {data?.value || 75}</span>
        <span>Target: {data?.max || 100}</span>
      </div>
    </div>
  );
}

export function ProgressBarPreview() {
  return (
    <div className="p-3 h-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
        <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1.5 truncate">Progress Tracker</span>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div className="bg-blue-600 h-full w-2/3 rounded-full" />
        </div>
      </div>
    </div>
  );
}
