# Setup Guide for rud-dashboard

## Quick Start

### 1. Install the package

```bash
npm install rud-dashboard
# or
bun add rud-dashboard
```

### 2. Configure Tailwind CSS

**Option A: Use the preset (Recommended)**

```javascript
// tailwind.config.js
import rudPreset from 'rud-dashboard/tailwind.preset'

export default {
  presets: [rudPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/rud-dashboard/**/*.{js,ts,jsx,tsx}",
  ],
}
```

**Option B: Manual configuration**

```javascript
// tailwind.config.js
export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/rud-dashboard/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... see tailwind.preset.js for full list
      },
    },
  },
}
```

### 3. Import CSS

Add to your main CSS file (e.g., `src/index.css` or `src/globals.css`):

```css
@import 'rud-dashboard/styles.css';
```

This includes:
- CSS variable definitions (light and dark mode)
- Base styles
- Required Tailwind directives

### 4. Use Components

**React:**
```tsx
import { Dashboard } from 'rud-dashboard'

function App() {
  return <Dashboard {...props} />
}
```

**Preact:**
```tsx
import { Dashboard } from 'rud-dashboard/preact'

export function App() {
  return <Dashboard {...props} />
}
```

## Available Exports

### Components
- `Dashboard` - Main dashboard component
- `DashboardToolbar` - Toolbar component
- `Button` - Button component
- `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` - Tooltip components

### Types
```tsx
import type { 
  DashboardProps,
  GridItem,
  WidgetType,
  DashboardController,
  // ... more types
} from 'rud-dashboard'
// or from 'rud-dashboard/preact'
```

### Utilities
```tsx
import { GRID_SIZE, CELL_SIZE, MARGIN } from 'rud-dashboard'
```

## Customization

### CSS Variables

You can override the default theme by modifying CSS variables:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... customize as needed */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides */
}
```

### Widget Types

Define custom widget types:

```tsx
const customWidgets = [
  {
    id: 'custom',
    type: 'custom',
    title: 'Custom Widget',
    icon: '🎨',
    defaultSize: { w: 2, h: 2 },
    description: 'My custom widget',
    component: MyCustomComponent,
    preview: MyCustomPreview,
  }
]

<Dashboard availableWidgetTypes={customWidgets} />
```

## Troubleshooting

### Styles not working
- Make sure you imported `rud-dashboard/styles.css`
- Check that your Tailwind config includes the library's path in `content`
- Verify CSS variables are defined in your CSS

### TypeScript errors
- Ensure you're importing from the correct path (`rud-dashboard` for React, `rud-dashboard/preact` for Preact)
- Check that `types` are properly resolved in your `tsconfig.json`

### Dark mode not working
- The preset uses `darkMode: "media"` which automatically follows system preferences
- No additional setup needed - just change your OS dark mode setting
- If you want manual toggle instead, change the preset to `darkMode: ["class"]` and add toggle logic

