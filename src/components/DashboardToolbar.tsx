import React from 'react';
import { Zap, Edit3, Eye, Plus, X, Grid, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { getPreviewComponent, widgetRegistry, previewRegistry } from './widgets';
import { WidgetType, DashboardToolbarProps } from '../types';

// Default widget types if none provided
const defaultWidgetTypes: WidgetType[] = [
  {
    id: 'basic',
    type: 'basic',
    title: 'Basic Widget',
    icon: <Grid size={20} />,
    defaultSize: { w: 4, h: 4 },
    description: 'A simple widget for general content',
    component: widgetRegistry.basic,
    preview: previewRegistry.basic
  },
  {
    id: 'progress',
    type: 'progress',
    title: 'Progress Bar',
    icon: <TrendingUp size={20} />,
    defaultSize: { w: 4, h: 3 },
    description: 'Display progress with visual bar',
    component: widgetRegistry.progress,
    preview: previewRegistry.progress
  }
];

export function DashboardToolbar({
  isEditMode,
  onToggleMode,
  onAutoOrganize,
  onToggleFixedHeight,
  isFixedHeight,
  gridDimensions,
  itemCount,
  isAddWidgetMode = false,
  onToggleAddWidgetMode,
  onAddWidget,
  availableWidgetTypes = defaultWidgetTypes,
}: DashboardToolbarProps) {
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    const newPosition = direction === 'left'
      ? Math.max(0, scrollPosition - scrollAmount)
      : scrollPosition + scrollAmount;

    carouselRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  return (
    <TooltipProvider>
      <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleMode}
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                className="gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              >
                {isEditMode ? (
                  <>
                    <Edit3 size={16} />
                    Edit Mode
                  </>
                ) : (
                  <>
                    <Eye size={16} />
                    View Mode
                  </>
                )}
              </Button>
              <div className="text-sm text-gray-500 dark:text-gray-200 px-2">
                Grid: {gridDimensions.cols}×{gridDimensions.rows}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditMode && (
              <>
                {isAddWidgetMode ? (
                  <Button
                    onClick={onToggleAddWidgetMode}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 bg-white dark:bg-gray-800"
                  >
                    <X size={16} />
                    Cancel
                  </Button>
                ) : (
                  <Button
                    onClick={onToggleAddWidgetMode}
                    variant="default"
                    size="sm"
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  >
                    <Plus size={16} />
                    Add Widget
                  </Button>
                )}

                <Button
                  onClick={onToggleFixedHeight}
                  variant="secondary"
                  size="sm"
                  className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  {isFixedHeight ? 'Auto Height' : 'Fix Height'}
                </Button>

                <Button
                  onClick={onAutoOrganize}
                  variant="outline"
                  size="sm"
                  disabled={itemCount === 0}
                  className="gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800"
                >
                  <Zap size={16} />
                  Auto Organize
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Widget Selection Carousel */}
        {isEditMode && isAddWidgetMode && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-medium text-gray-800 dark:text-gray-200">Select a widget to add:</h3>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('left')}
                  className="flex-shrink-0 h-12 w-8 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  disabled={scrollPosition === 0}
                >
                  <ChevronLeft size={16} />
                </Button>

                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {availableWidgetTypes.map((widget: WidgetType) => {
                    const PreviewComponent = widget.preview || getPreviewComponent(widget.type);

                    return (
                      <Tooltip key={widget.id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => onAddWidget?.(widget)}
                            className="flex-shrink-0 h-20 w-24 p-2 flex flex-col items-center gap-1 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 bg-white dark:bg-gray-800 transition-colors group border-gray-200 dark:border-gray-700"
                          >
                            <div className="text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                              {widget.icon}
                            </div>
                            <span className="text-xs font-medium text-center leading-tight text-gray-700 dark:text-gray-200">
                              {widget.title}
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="text-blue-600 dark:text-blue-400">
                                {widget.icon}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200">
                                  {widget.title}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-200">
                                  Size: {widget.defaultSize.w}×{widget.defaultSize.h}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-200 mb-3">
                              {widget.description}
                            </p>
                            <div className="h-16 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-750 overflow-hidden">
                              <PreviewComponent />
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => scroll('right')}
                  className="flex-shrink-0 h-12 w-8 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 