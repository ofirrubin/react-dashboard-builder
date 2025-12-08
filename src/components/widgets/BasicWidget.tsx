import { Grid } from 'lucide-react';

interface BasicWidgetProps {
  id?: string;
  title?: string;
}

export function BasicWidget({ id, title }: BasicWidgetProps) {
  return (
    <div className="p-4 h-full flex flex-col justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600">
          <Grid size={20} className="text-blue-600 dark:text-gray-200" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
          {title || 'Basic Widget'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Customizable content area
        </p>
        {id && (
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            ID: {id}
          </div>
        )}
      </div>
    </div>
  );
}

export function BasicWidgetPreview() {
  return (
    <div className="p-2 h-16 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
          <Grid size={14} className="text-blue-600 dark:text-gray-300" />
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Basic Widget
        </div>
      </div>
    </div>
  );
} 