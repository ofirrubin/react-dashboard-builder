import { Grid } from 'lucide-react';
import { BaseWidgetProps } from '../../types/shared';

export function BasicWidget({ id, title }: BaseWidgetProps) {
  return (
    <div className="p-6 h-full flex flex-col justify-center overflow-hidden bg-white dark:bg-gray-800">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <Grid size={28} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title || 'Basic Widget'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          This is a customizable widget area. You can drop any component here.
        </p>
        <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          ID: {id}
        </div>
      </div>
    </div>
  );
}

export function BasicWidgetPreview() {
  return (
    <div className="p-3 h-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800">
        <Grid size={18} className="text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">Basic Widget</span>
        <span className="text-[10px] text-gray-500 uppercase font-medium">Standard Slot</span>
      </div>
    </div>
  );
}
