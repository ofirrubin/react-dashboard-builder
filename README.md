# Rud Dashboard

Dashboard component library with TailwindCSS. Supports React and Preact.

## Installation

```bash
npm install rud-dashboard
# or
bun add rud-dashboard
```

## Setup

### 1. Import the Tailwind Preset

Update your `tailwind.config.js`:

```javascript
import rudPreset from 'rud-dashboard/tailwind.preset'

export default {
  presets: [rdbPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/rud-dashboard/**/*.{js,ts,jsx,tsx}",
  ],
}
```

### 2. Add CSS Variables

Add to your main CSS file (e.g., `globals.css` or `index.css`):

```css
@import 'rud-dashboard/styles.css';
```

Or copy the CSS variables from `node_modules/rud-dashboard/dist/styles.css` to customize them.

### 3. Use the Components

**React:**
```tsx
import { Dashboard } from 'rud-dashboard'

function App() {
  return (
    <Dashboard 
      enableEditMode={true}
      defaultEditMode={false}
      gridMode="elegant"
      showDefaultToolbar={true}
      initialItems={[
        { id: '1', type: 'basic', title: 'Widget', x: 0, y: 0, w: 2, h: 1 }
      ]}
    />
  )
}
```

**Preact:**
```tsx
import { Dashboard } from 'rud-dashboard/preact'

export function App() {
  return (
    <Dashboard 
      enableEditMode={true}
      defaultEditMode={false}
      gridMode="elegant"
      showDefaultToolbar={true}
      initialItems={[
        { id: '1', type: 'basic', title: 'Widget', x: 0, y: 0, w: 2, h: 1 }
      ]}
    />
  )
}
```

## Development

### Install Dependencies
```bash
bun install
```
### Build Library
```bash
bun run build
```
### Create Package
```bash
bun run pack:local
```

## Playground

### React Playground
```bash
# Start dev server
bun run dev
# With Node
npm run dev
```

### Preact Playground
```bash
# Start dev server
bun run test:preact
# With Node
npm run test:preact
```

## Testing Built Package

### Preact Example
```bash
cd example
bun install
bun add ../rud-dashboard-0.1.0.tgz
bun run dev
bun run build
bun run preview
```

### React Example
```bash
cd example-react
bun install
bun add ../rud-dashboard-0.1.0.tgz
bun run dev
bun run build
bun run preview
```

## TypeScript

Full TypeScript support:

```tsx
import type { DashboardProps, StatCardProps } from 'rud-dashboard'
// or
import type { DashboardProps, StatCardProps } from 'rud-dashboard/preact'
```

## License

MIT
