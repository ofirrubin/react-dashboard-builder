# rud-dashboard

A draggable, resizable dashboard grid for React and Preact that looks like **your** app on arrival.

The UI is distributed as source through a [shadcn registry](https://ui.shadcn.com/docs/registry), so it uses your `Button`, your `Card`, your theme tokens, and your `cn()`. Nothing ships CSS. There is no Tailwind preset, no `content` glob pointing into `node_modules`, and no stylesheet to import.

```bash
npx shadcn@latest registry add @rud=https://ofirrubin.github.io/react-dashboard-builder/r/{name}.json
npx shadcn@latest add @rud/dashboard-demo
```

That is the whole setup. You now have a working dashboard page you can edit.

---

## What you get

| Item | What it installs |
| --- | --- |
| `@rud/dashboard` | The grid: `Dashboard`, `DashboardItem`, `DashboardToolbar`, `useDashboard` |
| `@rud/dashboard-widgets` | Four widget bodies: stat, progress, chart, and Typeset-styled prose |
| `@rud/dashboard-theme` | Optional polish — layered depth, drag feedback, prose rhythm |
| `@rud/dashboard-demo` | A complete working page wiring all of the above together |

Install only what you want:

```bash
npx shadcn@latest add @rud/dashboard              # just the grid
npx shadcn@latest add @rud/dashboard-widgets      # + ready-made widget bodies
```

Each item pulls the shadcn primitives it needs (`card`, `button`, `popover`, `empty`, …) through `registryDependencies`, so a fresh project gets everything in one command.

## Usage

One object describes every widget. `type` is the key stored in the saved layout.

```tsx
import { Dashboard } from "@/components/dashboard/dashboard"
import type { WidgetCatalog } from "@/components/dashboard/dashboard"

const widgets: WidgetCatalog = {
  revenue: {
    title: "Revenue",
    description: "Monthly recurring revenue",
    icon: DollarSignIcon,
    defaultSize: { w: 3, h: 2 },
    render: () => <RevenueCard />,
  },
}

<Dashboard widgets={widgets} defaultLayout={layout} onLayoutChange={save} />
```

`layout` is plain JSON — persist it in `localStorage`, a database, or wherever you like:

```json
[{ "id": "1", "type": "revenue", "title": "Revenue", "x": 0, "y": 0, "w": 3, "h": 2 }]
```

`Dashboard` is controlled or uncontrolled, like a native input: pass `layout` + `onLayoutChange`, or just `defaultLayout`. Same for `editing` / `defaultEditing`.

### A 12-column grid

Spans are grid cells on a **fixed 12-column grid with fluid column width**, so `w: 6` is always half the dashboard, on every screen. Columns are responsive by default — `{ 0: 1, 640: 6, 1024: 12 }` — and you can override the geometry:

```tsx
<Dashboard widgets={widgets} grid={{ columns: 24, rowHeight: 48, gap: 8 }} />
```

### Keyboard

Widgets are focusable in edit mode. Arrows move; `shift` + arrows resize.

## The engine

The layout math lives in a separate, headless npm package — pure TypeScript, **zero dependencies**, no React, no DOM, no CSS:

```bash
npm install rud-dashboard
```

```ts
import { packItems, resolveCollisions, measureGrid, parseLayout } from "rud-dashboard"
```

It handles grid geometry, deterministic collision resolution, repacking, reflow across column counts, and layout (de)serialisation with validation. The registry components install it automatically. Use it directly if you want to build your own renderer.

## Preact

The same registry sources run on Preact unchanged — no separate entry point, no `/preact` import path, no build flags. Alias `react` to `preact/compat` the standard way:

```ts
// vite.config.ts
import preact from "@preact/preset-vite"
export default defineConfig({ plugins: [preact(), tailwindcss()] })
```

```jsonc
// tsconfig.app.json — mirror the bundler alias so types match the runtime
"paths": {
  "@/*": ["./src/*"],
  "react": ["./node_modules/preact/compat/"],
  "react-dom": ["./node_modules/preact/compat/"],
  "react-dom/client": ["./node_modules/preact/compat/client"],
  "react/jsx-runtime": ["./node_modules/preact/jsx-runtime"]
}
```

Two small notes, both already handled in `examples/preact-vite`:

- shadcn's `ui/button.tsx` needs `as React.ElementType` on the `Slot.Root` / `"button"` union, because `preact/compat` treats refs as invariant.
- shadcn's `ui/chart.tsx` needs `color?: string` declared explicitly on `ChartTooltipContent`.

Both are one-line edits in files you own. The dashboard components themselves need nothing.

## Examples

```bash
npm install
npm run build           # engine + registry JSON

npm run example:react   # examples/react-vite   — React 19
npm run example:preact  # examples/preact-vite  — Preact via preact/compat
```

Both examples are byte-identical apart from their Vite/TS config and the two shadcn tweaks above.

To test the registry install path locally:

```bash
npm run registry:serve  # serves public/r on :4499
# then, inside an example:
npx shadcn@latest registry add @rud=http://localhost:4499/r/{name}.json
npx shadcn@latest add @rud/dashboard-demo
```

## Repository layout

```
packages/core/      rud-dashboard — headless engine (published to npm)
registry/rud/       source distributed via the shadcn registry
registry.json       registry manifest
public/r/           built registry JSON (shadcn build)
examples/           react-vite, preact-vite
```

## Upgrading from 0.1.x

0.1.x shipped a compiled component library that injected its own full Tailwind build (including preflight, plus rules targeting the host's `body` and `#root`), vendored private copies of `Button` and `Tooltip`, and hardcoded blue/grey colours that ignored its own tokens. Theming it was not really possible, and setup meant a Tailwind preset, a `node_modules` content glob, a `@config` back-reference, and a stylesheet import.

That approach is gone:

- **`rud-dashboard` on npm is now the headless engine only.** If you imported `Dashboard` from it, get the component from the registry instead.
- **`rud-dashboard/preact`, `rud-dashboard/tailwind.preset`, and `rud-dashboard/styles.css` no longer exist.** None of them have a replacement, because none of them are needed.
- **Saved layouts need remapping.** 0.1.x spans were fixed 40px cells with a column count derived from container width; 0.2 spans are cells on a fixed 12-column grid. `original{X,Y,W,H}` is now `anchor{X,Y,W,H}`. Run stored payloads through `parseLayout` — it drops malformed items and reports what it changed rather than throwing.

Some concrete bugs fixed along the way:

- Rendering placed cells at a 56px pitch while pointer hit-testing used 48px, so a widget drawn in column 3 was read back as column 4 and items drifted a full column every ~3 cells.
- Touch drag never worked: `onTouchStart` began a gesture but only `mousemove`/`mouseup` were ever listened for, so it started and then neither moved nor committed. It is one pointer-event pipeline now, covering mouse, touch, and pen.
- `DashboardToolbar` was entirely `// @ts-nocheck`, and `src/global.preact.d.ts` declared `namespace React { type ReactNode = any }` globally — which could ship in the published `.d.ts` and silently turn `ReactNode` into `any` across a consumer's whole project.
- `Button` accepted `asChild` and ignored it (no Radix Slot), so every `<TooltipTrigger asChild>` in the toolbar was a no-op.
- The tested `gridMath.ts` was dead code; `Dashboard.tsx` redefined the same collision functions inline.
- There was no keyboard path to move or resize a widget at all.

## License

MIT
