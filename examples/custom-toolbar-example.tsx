import React, { useState } from 'react';
import Dashboard from '../src/components/Dashboard';
import { CustomToolbarProps, GridMode, WidgetType } from '../src/types';
import { Edit3, Eye, Plus, Zap, Grid, TrendingUp } from 'lucide-react';

// Example custom toolbar component
const CustomToolbar = ({ state, actions, availableWidgetTypes }: CustomToolbarProps) => (
  <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 shadow-sm">
    <div className="flex items-center justify-between">
      {/* Left side - Mode toggle */}
      <div className="flex items-center gap-4">
        <button 
          onClick={actions.toggleEditMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            state.isEditMode 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          {state.isEditMode ? <Edit3 size={16} /> : <Eye size={16} />}
          {state.isEditMode ? 'Edit Mode' : 'View Mode'}
        </button>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Grid: {state.gridDimensions.cols}×{state.gridDimensions.rows} | Items: {state.itemCount}
        </div>
      </div>
      
      {/* Right side - Edit controls */}
      {state.isEditMode && (
        <div className="flex items-center gap-2">
          <button 
            onClick={actions.autoOrganize}
            disabled={state.itemCount === 0}
            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap size={16} />
            Auto Organize
          </button>
          
          <button 
            onClick={actions.toggleFixedHeight}
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            {state.isFixedHeight ? 'Auto Height' : 'Fixed Height'}
          </button>
          
          <div className="flex gap-1">
            {availableWidgetTypes.map(widget => (
              <button
                key={widget.id}
                onClick={() => actions.addWidget(widget)}
                className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
                title={`Add ${widget.title}`}
              >
                <Plus size={14} />
                {widget.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    
    {/* Add widget mode indicator */}
    {state.isAddWidgetMode && (
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          🎯 Click on any widget type above to add it to your dashboard
        </p>
      </div>
    )}
  </div>
);

// Minimal custom toolbar
const MinimalToolbar = ({ state, actions }: CustomToolbarProps) => (
  <div className="flex justify-center mb-4">
    <button 
      onClick={actions.toggleEditMode}
      className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
    >
      {state.isEditMode ? '👁️ View' : '✏️ Edit'}
    </button>
  </div>
);

// Example using custom toolbar
export function CustomToolbarExample() {
  const [items, setItems] = useState([
    { id: '1', x: 0, y: 0, w: 4, h: 4, type: 'basic', title: 'Basic Widget' },
    { id: '2', x: 4, y: 0, w: 4, h: 3, type: 'progress', title: 'Progress Widget' }
  ]);

  const [editMode, setEditMode] = useState(true);
  const [addWidgetMode, setAddWidgetMode] = useState(false);
  const [fixedHeight, setFixedHeight] = useState(false);

  const availableWidgets: WidgetType[] = [
    {
      id: 'basic',
      type: 'basic',
      title: 'Basic',
      icon: <Grid size={20} />,
      defaultSize: { w: 4, h: 4 },
      description: 'A simple widget',
      component: () => <div>Basic Widget</div>,
      preview: () => <div>Preview</div>
    },
    {
      id: 'progress',
      type: 'progress',
      title: 'Progress',
      icon: <TrendingUp size={20} />,
      defaultSize: { w: 4, h: 3 },
      description: 'Progress bar widget',
      component: () => <div>Progress Widget</div>,
      preview: () => <div>Progress Preview</div>
    }
  ];

  return (
    <div className="space-y-8">
      {/* Full featured custom toolbar */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Custom Toolbar Example</h2>
        <Dashboard
          initialItems={items}
          availableWidgetTypes={availableWidgets}
          onItemsChange={setItems}
          customToolbar={CustomToolbar}
          onEditModeChange={setEditMode}
          onAddWidgetModeChange={setAddWidgetMode}
          onFixedHeightChange={setFixedHeight}
        />
      </div>
      
      {/* Minimal custom toolbar */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Minimal Custom Toolbar</h2>
        <Dashboard
          initialItems={items}
          availableWidgetTypes={availableWidgets}
          onItemsChange={setItems}
          customToolbar={MinimalToolbar}
        />
      </div>
      
      {/* No toolbar */}
      <div>
        <h2 className="text-2xl font-bold mb-4">No Toolbar (External Controls)</h2>
        <div className="mb-4 flex gap-2">
          <button 
            onClick={() => {/* handle externally */}}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            External Edit Toggle
          </button>
        </div>
        <Dashboard
          initialItems={items}
          availableWidgetTypes={availableWidgets}
          onItemsChange={setItems}
          showDefaultToolbar={false}
        />
      </div>
      
      {/* Render function toolbar */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Render Function Toolbar</h2>
        <Dashboard
          initialItems={items}
          availableWidgetTypes={availableWidgets}
          onItemsChange={setItems}
          customToolbar={({ state, actions }) => (
            <div className="text-center p-4 bg-gradient-to-r from-purple-400 to-pink-400 text-white rounded-lg mb-4">
              <h3 className="text-lg font-bold">My Dashboard</h3>
              <p>Status: {state.isEditMode ? 'Editing' : 'Viewing'}</p>
              <button 
                onClick={actions.toggleEditMode}
                className="mt-2 px-4 py-2 bg-white text-purple-600 rounded hover:bg-gray-100"
              >
                Switch Mode
              </button>
            </div>
          )}
        />
      </div>
      
      {/* Grid Modes Demo */}
      <GridModeDemo items={items} availableWidgets={availableWidgets} onItemsChange={setItems} />
    </div>
  );
}

// Grid Mode Demo Component
function GridModeDemo({ 
  items, 
  availableWidgets, 
  onItemsChange 
}: { 
  items: any[], 
  availableWidgets: WidgetType[], 
  onItemsChange: (items: any[]) => void 
}) {
  const [currentMode, setCurrentMode] = useState<GridMode>('elegant');
  
  const gridModes: { mode: GridMode; name: string; description: string }[] = [
    { mode: 'elegant', name: 'Elegant', description: 'Subtle fade with smooth gradients (default)' },
    { mode: 'dots', name: 'Dots', description: 'Clean dot-based grid pattern' },
    { mode: 'harsh', name: 'Harsh', description: 'Traditional sharp grid lines' },
    { mode: 'blank', name: 'Blank', description: 'No grid for clean canvas' }
  ];
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Grid Modes Demo</h2>
      
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">Choose Grid Style:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {gridModes.map(({ mode, name, description }) => (
            <button
              key={mode}
              onClick={() => setCurrentMode(mode)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                currentMode === mode 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`font-medium ${currentMode === mode ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'}`}>
                {name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Current mode: <span className="font-semibold text-blue-600 dark:text-blue-400">{currentMode}</span>
        </div>
      </div>
      
      <Dashboard
        initialItems={items}
        availableWidgetTypes={availableWidgets}
        onItemsChange={onItemsChange}
        gridMode={currentMode}
        showDefaultToolbar={true}
      />
    </div>
  );
}

export default CustomToolbarExample; 