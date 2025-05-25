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
  DashboardToolbarProps 
} from 'react-dashboard-builder';
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Ofir Rubin