// @ts-nocheck
"use client";
import React, { useState } from 'react';
import {
  LayoutGrid,
  Plus,
  Settings,
  Maximize2,
  Minimize2,
  Zap,
  Check,
  MousePointer2
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { DashboardToolbarProps, WidgetType } from '../types/index';
import { cn } from '../lib/utils';

export function DashboardToolbar({
  isEditMode,
  onToggleMode,
  onAutoOrganize,
  onToggleFixedHeight,
  isFixedHeight,
  gridDimensions,
  itemCount,
  isAddWidgetMode = false,
  onToggleAddWidgetMode = () => { },
  onAddWidget = () => { },
  availableWidgetTypes = [],
  gridMode = 'elegant',
  onGridModeChange = () => { },
  customActions,
}: DashboardToolbarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
            <LayoutGrid className="text-blue-600 dark:text-blue-400" size={20} />
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">Dashboard</h2>
              <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium uppercase tracking-wider mt-1">
                {itemCount} Widgets • {gridDimensions.cols}x{gridDimensions.rows} Grid
              </p>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-gray-100 dark:bg-gray-700 mx-2 hidden sm:block" />

          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    onClick={onToggleMode}
                    className={cn(
                      "rounded-xl gap-2 transition-all duration-300 pointer-events-auto",
                      isEditMode
                        ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {isEditMode ? <Check size={16} /> : <MousePointer2 size={16} />}
                    <span className="font-semibold leading-none">{isEditMode ? 'Finish Editing' : 'Edit Layout'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isEditMode ? 'Save and lock layout' : 'Enable drag and drop'}</p>
                </TooltipContent>
              </Tooltip>

              {isEditMode && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isAddWidgetMode ? "secondary" : "outline"}
                        onClick={onToggleAddWidgetMode}
                        className={cn(
                          "rounded-xl gap-2",
                          isAddWidgetMode
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <Plus size={16} />
                        <span className="font-semibold leading-none">Add Widget</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Browse available widgets</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={onAutoOrganize}
                        className="rounded-xl gap-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <Zap size={16} className="text-amber-500" />
                        <span className="font-semibold leading-none">Magic Layout</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Optimize widget positions</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onToggleFixedHeight}
                    aria-label={isFixedHeight ? 'Auto height' : 'Fixed viewport'}
                    className={cn(
                      "rounded-xl border-gray-200 dark:border-gray-700",
                      isFixedHeight
                        ? "text-blue-600 bg-blue-50 border-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800"
                        : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                  >
                    {isFixedHeight ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFixedHeight ? 'Auto height' : 'Fixed viewport'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div className="relative flex items-center gap-2">
          {customActions && (
            <div className="flex items-center gap-2 pr-2 mr-2 border-r border-gray-100 dark:border-gray-700">
              {customActions as any}
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Grid Settings"
            className="rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings size={20} />
          </Button>

          {isSettingsOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2 pt-1 uppercase tracking-wider">Grid Mode</div>
              {(['elegant', 'dots', 'harsh', 'blank'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    onGridModeChange(mode);
                    setIsSettingsOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors capitalize",
                    gridMode === mode
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isEditMode && isAddWidgetMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 bg-white dark:bg-gray-800 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
          {availableWidgetTypes.map((widget: WidgetType) => (
            <div
              key={widget.id}
              className="group flex flex-col p-4 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all duration-300 cursor-pointer"
              onClick={() => onAddWidget(widget)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-700 rounded-xl shadow-sm group-hover:shadow-md transition-all text-blue-600 dark:text-blue-400">
                  {widget.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{widget.title}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-tight">{widget.defaultSize.w}x{widget.defaultSize.h} Units</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                {widget.description}
              </p>
              <Button
                size="sm"
                className="w-full rounded-xl bg-gray-900 dark:bg-gray-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white border-none h-9 font-semibold"
              >
                Add to Dashboard
              </Button>
            </div>
          ))}
          {availableWidgetTypes.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400">
              No additional widgets available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
