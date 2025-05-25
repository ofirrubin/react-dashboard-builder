# React Dashboard Builder

A flexible, drag-and-drop dashboard builder component for React applications. Create interactive dashboards with customizable widgets that can be dragged, resized, and organized automatically.

## Features

- 🎯 **Drag & Drop**: Intuitive drag-and-drop interface for moving widgets
- 📏 **Resizable**: Resize widgets with corner and edge handles
- 🎨 **Customizable**: Fully customizable widgets and styling
- 📱 **Responsive**: Responsive grid layout that adapts to container size
- 🌙 **Dark Mode**: Built-in dark mode support
- ⚡ **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🎛️ **Auto-organize**: Automatic layout optimization
- 🔧 **Edit/View Modes**: Toggle between edit and view modes

## Installation

```bash
npm install react-dashboard-builder
# or
yarn add react-dashboard-builder
# or
pnpm add react-dashboard-builder
```

## Quick Start

```tsx
import React, { useState } from 'react';
import { Dashboard, WidgetType } from 'react-dashboard-builder';

const MyDashboard = () => {
  const [items, setItems] = useState([
    { id: '1', x: 0, y: 0, w: 4, h: 4, type: 'basic', title: 'My Widget' }
  ]);

  const customWidgets: WidgetType[] = [
    {
      id: 'basic',
      type: 'basic',
      title: 'Basic Widget',
      icon: <div>📊</div>,
      defaultSize: { w: 4, h: 4 },
      description: 'A simple widget',
      component: BasicWidget,
      preview: BasicWidgetPreview
    }
  ];

  return (
    <Dashboard
      initialItems={items}
      availableWidgetTypes={customWidgets}
      onItemsChange={setItems}
      enableEditMode={true}
      defaultEditMode={true}
    />
  );
};
```

## Next.js Usage

Since this dashboard requires client-side features (drag & drop, state management), you need to add `"use client"` in your Next.js application:

```tsx
"use client";

import React, { useState } from 'react';
import { Dashboard, WidgetType } from 'react-dashboard-builder';

export default function DashboardPage() {
  const [items, setItems] = useState([
    { id: '1', x: 0, y: 0, w: 4, h: 4, type: 'basic', title: 'My Widget' }
  ]);

  return (
    <div>
      <h1>My Dashboard</h1>
      <Dashboard
        initialItems={items}
        onItemsChange={setItems}
        // ... other props
      />
    </div>
  );
}
```

Or create a separate client component:

```tsx
// components/ClientDashboard.tsx
"use client";

import { Dashboard } from 'react-dashboard-builder';
// ... component implementation

// pages/dashboard.tsx (Server Component)
import ClientDashboard from '@/components/ClientDashboard';

export default function DashboardPage() {
  return (
    <div>
      <h1>My Dashboard</h1>
      <ClientDashboard />
    </div>
  );
}
```

## Props

### Dashboard Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `availableWidgetTypes` | `WidgetType[]` | `[]` | Array of available widget types |
| `initialItems` | `Omit<GridItem, 'content'>[]` | `[]` | Initial dashboard items |
| `widgetRegistry` | `Record<string, React.ComponentType<any>>` | `{}` | Custom widget registry |
| `onItemsChange` | `(items: Omit<GridItem, 'content'>[]) => void` | - | Callback when items change |
| `className` | `string` | `""` | Additional CSS classes |
| `enableEditMode` | `boolean` | `true` | Enable/disable edit mode toggle |
| `defaultEditMode` | `boolean` | `true` | Default edit mode state |
| `gridMode` | `'elegant' \| 'dots' \| 'harsh' \| 'blank'` | `'elegant'` | Grid appearance style |
| `showDefaultToolbar` | `boolean` | `true` | Show/hide the default toolbar |
| `customToolbar` | `React.ComponentType<CustomToolbarProps> \| ((props: CustomToolbarProps) => React.ReactNode)` | - | Custom toolbar component or render function |
| `toolbarClassName` | `string` | `""` | Additional CSS classes for custom toolbar wrapper |
| `onEditModeChange` | `(isEditMode: boolean) => void` | - | Callback when edit mode changes |
| `onAddWidgetModeChange` | `(isAddWidgetMode: boolean) => void` | - | Callback when add widget mode changes |
| `onFixedHeightChange` | `(isFixedHeight: boolean) => void` | - | Callback when fixed height changes |

## Custom Toolbar

You can replace the default toolbar with your own custom implementation:

### Basic Custom Toolbar

```tsx
import React from 'react';
import { Dashboard, CustomToolbarProps } from 'react-dashboard-builder';

const CustomToolbar = ({ state, actions, availableWidgetTypes }: CustomToolbarProps) => (
  <div className="p-4 bg-white border rounded-lg mb-4 flex gap-2">
    <button 
      onClick={actions.toggleEditMode}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      {state.isEditMode ? 'Exit Edit' : 'Edit Mode'}
    </button>
    
    {state.isEditMode && (
      <>
        <button 
          onClick={actions.autoOrganize}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Auto Organize
        </button>
        
        <button 
          onClick={actions.toggleFixedHeight}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          {state.isFixedHeight ? 'Auto Height' : 'Fixed Height'}
        </button>
        
        {availableWidgetTypes.map(widget => (
          <button
            key={widget.id}
            onClick={() => actions.addWidget(widget)}
            className="px-4 py-2 bg-orange-500 text-white rounded"
          >
            Add {widget.title}
          </button>
        ))}
      </>
    )}
    
    <div className="ml-auto text-sm text-gray-500">
      Grid: {state.gridDimensions.cols}×{state.gridDimensions.rows} | 
      Items: {state.itemCount}
    </div>
  </div>
);

const MyDashboard = () => (
  <Dashboard
    customToolbar={CustomToolbar}
    // ... other props
  />
);
```

### Custom Toolbar with State Management

```tsx
const MyDashboard = () => {
  const [isEditMode, setIsEditMode] = useState(true);
  const [isAddWidgetMode, setIsAddWidgetMode] = useState(false);
  
  return (
    <Dashboard
      customToolbar={({ state, actions }) => (
        <div className="custom-toolbar">
          <h2>My Custom Dashboard</h2>
          <p>Current mode: {state.isEditMode ? 'Editing' : 'Viewing'}</p>
          <button onClick={actions.toggleEditMode}>
            Toggle Mode
          </button>
        </div>
      )}
      onEditModeChange={setIsEditMode}
      onAddWidgetModeChange={setIsAddWidgetMode}
      // ... other props
    />
  );
};
```

### Hiding the Default Toolbar

```tsx
const MyDashboard = () => (
  <Dashboard
    showDefaultToolbar={false}
    // Your custom controls elsewhere in your app
    // ... other props
  />
);
```

### CustomToolbarProps Interface

```tsx
interface CustomToolbarProps {
  state: {
    isEditMode: boolean;
    isAddWidgetMode: boolean;
    isFixedHeight: boolean;
    gridDimensions: { width: number; height: number; cols: number; rows: number };
    itemCount: number;
    items: GridItem[];
  };
  actions: {
    toggleEditMode: () => void;
    toggleAddWidgetMode: () => void;
    autoOrganize: () => void;
    toggleFixedHeight: () => void;
    addWidget: (widget: WidgetType, x?: number, y?: number) => void;
    removeItem: (id: string) => void;
  };
  availableWidgetTypes: WidgetType[];
}
```

## Grid Modes

The dashboard supports different grid appearance styles to match your design preferences:

### Available Grid Modes

```tsx
type GridMode = 'elegant' | 'dots' | 'harsh' | 'blank';
```

#### **Elegant Grid (Default)**
A subtle, faded grid with smooth gradients that provides visual guidance without being distracting.

```tsx
<Dashboard gridMode="elegant" {...props} />
```

#### **Dots Grid**
A minimal dot-based grid that's clean and modern.

```tsx
<Dashboard gridMode="dots" {...props} />
```

#### **Harsh Grid**
A traditional sharp grid with clear lines - the original grid style.

```tsx
<Dashboard gridMode="harsh" {...props} />
```

#### **Blank**
No grid at all for a completely clean canvas.

```tsx
<Dashboard gridMode="blank" {...props} />
```

### Grid Mode Examples

```tsx
import { Dashboard, GridMode } from 'react-dashboard-builder';

function GridModeDemo() {
  const [currentMode, setCurrentMode] = useState<GridMode>('elegant');
  
  const gridModes: GridMode[] = ['elegant', 'dots', 'harsh', 'blank'];
  
  return (
    <div>
      <div className="mb-4">
        {gridModes.map(mode => (
          <button
            key={mode}
            onClick={() => setCurrentMode(mode)}
            className={`px-3 py-1 mr-2 rounded ${
              currentMode === mode ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      
      <Dashboard
        gridMode={currentMode}
        {...otherProps}
      />
    </div>
  );
}
```

## Custom Widgets

Create custom widgets by implementing the required interfaces:

```tsx
import React from 'react';

// Widget Component
export function MyCustomWidget({ id, title, data }: any) {
  return (
    <div className="p-4 h-full">
      <h3>{title}</h3>
      <p>Custom content for {id}</p>
    </div>
  );
}

// Preview Component
export function MyCustomWidgetPreview() {
  return (
    <div className="p-2 h-16 flex items-center justify-center">
      <span>Custom Widget Preview</span>
    </div>
  );
}

// Widget Type Definition
const customWidgetType: WidgetType = {
  id: 'custom',
  type: 'custom',
  title: 'Custom Widget',
  icon: <MyIcon />,
  defaultSize: { w: 4, h: 3 },
  description: 'My custom widget',
  component: MyCustomWidget,
  preview: MyCustomWidgetPreview
};
```

## Styling

The component uses Tailwind CSS classes. Make sure to include Tailwind CSS in your project or override the styles as needed.

```css
/* Example custom styles */
.dashboard-container {
  @apply bg-gray-50 dark:bg-gray-900;
}

.widget-container {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700;
}
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```tsx
import type { 
  GridItem, 
  WidgetType, 
  DashboardProps,
  DashboardToolbarProps,
  CustomToolbarProps,
  DashboardActions,
  DashboardState,
  GridMode
} from 'react-dashboard-builder';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Ofir Rubin W& Claude 4 Sonnet