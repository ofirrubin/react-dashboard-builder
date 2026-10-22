# rud-dashboard

A draggable, resizable dashboard grid for React and Preact that looks like **your** app on arrival.

The UI is distributed as source through a [shadcn registry](https://ui.shadcn.com/docs/registry), so it uses your `Button`, your `Card`, your theme tokens, and your `cn()`. Nothing ships CSS. There is no Tailwind preset, no `content` glob pointing into `node_modules`, and no stylesheet to import.

![The dashboard running in a Vite + React app](docs/media/dashboard-light.jpg)

## Install

Two commands, from any project that already has [shadcn](https://ui.shadcn.com) set up:

```bash
npx shadcn@latest registry add @rud=https://raw.githubusercontent.com/ofirrubin/react-dashboard-builder/main/public/r/{name}.json
npx shadcn@latest add @rud/dashboard-demo
```

That installs 23 files: the grid, four widget bodies, the optional theme, and a
complete demo page. Then render it:

```tsx
import { DashboardDemo } from "@/components/dashboard-demo"

export default function Page() {
  return <div className="p-6"><DashboardDemo /></div>
}
```

<details>
<summary>Starting from nothing?</summary>

```bash
npx shadcn@latest init --name my-app --template vite --base radix --defaults
cd my-app
npx shadcn@latest registry add @rud=https://raw.githubusercontent.com/ofirrubin/react-dashboard-builder/main/public/r/{name}.json
npx shadcn@latest add @rud/dashboard-demo
```
</details>

The registry pulls the shadcn primitives each item needs (`card`, `button`,
`popover`, `empty`, `chart`, …) through `registryDependencies`, and npm-installs
the headless engine. Nothing else to wire up.

> `raw.githubusercontent.com` is served from a CDN with a short cache, so a
> freshly pushed registry change can take a few minutes to appear.

### What each item installs

| Item | Contents |
| --- | --- |
| `@rud/dashboard` | The grid: `Dashboard`, `DashboardItem`, `DashboardToolbar`, `DashboardWidgetBar`, `useDashboard` |
| `@rud/dashboard-widgets` | Four widget bodies + their palette miniatures: stat, progress, chart, Typeset prose |
| `@rud/dashboard-theme` | Optional polish — layered depth, drag feedback, prose rhythm. Merged into your CSS automatically |
| `@rud/dashboard-demo` | A complete working page wiring all of the above together |

Install only what you want:

```bash
npx shadcn@latest add @rud/dashboard            # just the grid
npx shadcn@latest add @rud/dashboard-widgets    # + ready-made widget bodies
```

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
    preview: () => <StatWidgetPreview />,   // miniature in the add-widget bar
    render: () => <RevenueCard />,
  },
}

<Dashboard widgets={widgets} defaultLayout={layout} onLayoutChange={save} />
```

`layout` is plain JSON — persist it in `localStorage`, a database, or wherever
you like:

```json
[{ "id": "1", "type": "revenue", "title": "Revenue", "x": 0, "y": 0, "w": 3, "h": 2 }]
```

`Dashboard` is controlled or uncontrolled, like a native input: pass `layout` +
`onLayoutChange`, or just `defaultLayout`. Same for `editing` / `defaultEditing`.

### A 12-column grid

Spans are grid cells on a **fixed 12-column grid with fluid column width**, so
`w: 6` is always half the dashboard, on every screen. Columns are responsive by
default — `{ 0: 1, 640: 6, 1024: 12 }` — and the geometry is overridable:

```tsx
<Dashboard widgets={widgets} grid={{ columns: 24, rowHeight: 48, gap: 8 }} />
```

### Adding widgets

`Add widget` expands a bar in place rather than opening a popover, so the
dashboard stays visible while you choose. Each entry shows a live miniature from
`WidgetDefinition.preview`, which animates in as the bar opens and then rests at
its real values.

![The add-widget bar, with a live miniature for each widget](docs/media/widget-bar.jpg)

### Drag feel

A dragged card lifts and follows the pointer exactly while you are moving it —
no transition to lag behind, no stepping between cells. The moment the pointer
slows or stops, it eases into the slot the drop indicator is showing. Snapping on
every pointer move is what makes a grid feel like it is catching on something.
Tune with `FREE_MOVE_SPEED` and `SETTLE_DELAY_MS` in `use-dashboard.ts`.

Gestures use pointer events, so mouse, touch, and pen all work from one path.

### On phones

Below 640px the grid stacks to a single column, and the dashboard is built to be
edited there too, not just viewed:

- **The page still scrolls in edit mode.** A finger on a card's body scrolls;
  drags start from the card's header (the grip). With a mouse the whole card is
  still a handle.
- **Resize dots are always visible** on touch screens, with fingertip-sized hit
  areas. In the stacked layout only the bottom edge and corner are offered —
  width is fixed there.
- **Dragging near the top or bottom edge scrolls**, so a card can travel the
  whole column, not just the part that fits on screen.
- **Phone edits never overwrite the desktop layout.** Rearranging or resizing a
  card that is shown narrower than its real width changes only the stacked view;
  widening back restores the arrangement you built on desktop. The same holds for
  a saved layout with no anchors, which used to collapse permanently to one
  column once it had been shown on a phone and saved.
- The toolbar fits one row, and the add-widget bar becomes a row you swipe.

### Building mobile-friendly widgets

A grid cell means something different at every breakpoint — on a phone `w: 1` is
the whole screen — so widgets should respond to **the card's size**, not the
viewport's or the span. Three tools, from lightest to heaviest:

**1. Container queries (CSS only).** Every widget body is a CSS size container,
so Tailwind's `@`-variants answer to the card itself:

```tsx
<span className="text-xl @3xs:text-2xl @xs:text-3xl">{value}</span>
<span className="text-muted-foreground @max-3xs:hidden">vs. last month</span>
```

**2. The render context.** `render` receives the card's measurements, for things
CSS cannot change — chart axes, how many rows to show:

```tsx
render: ({ compact, stacked, pixelSize, columns }) => (
  <ChartWidget data={data} compact={compact} />
)
```

| Field       | Meaning                                                        |
| ----------- | -------------------------------------------------------------- |
| `compact`   | The card is narrower than `COMPACT_WIDTH` (280px)               |
| `stacked`   | The grid is one column — the phone layout                       |
| `pixelSize` | The card's outer `{ width, height }` in px                      |
| `columns`   | Columns the grid currently has                                 |
| `size`      | The span in cells (prefer the fields above for layout choices) |

**3. `stackedHeight`.** Full width on a phone, a widget often wants a different
height than its desktop tile — three progress bars need far less room once they
are not squeezed into three columns:

```tsx
quotas: {
  title: "Quotas",
  defaultSize: { w: 3, h: 4 },
  stackedHeight: 3, // rows, used only in the single-column layout
  render: () => <ProgressWidget rows={rows} />,
},
```

It changes only the stacked view; the saved desktop height is untouched. The
bundled widgets use all three — read them as examples.

### Limiting the height

By default the canvas grows with its content. Cap it with `maxHeight`, and pick
what the cap means:

```tsx
// Stop at 600px and scroll. Widgets may sit below the fold.
<Dashboard widgets={w} maxHeight={600} />

// Stop at 600px and limit the grid to the rows that fit, so nothing can be
// placed out of sight. Drag, the drop indicator, and keyboard nudges all obey it.
<Dashboard widgets={w} maxHeight={600} maxHeightMode="clamp" />
```

The toolbar's "Fixed height" switch turns the cap on and off; without `maxHeight`
it falls back to 2.5x the minimum height. `useDashboard` also returns `scrolls`,
true only when content actually exceeds the cap — a capped canvas that happens to
fit shows no scrollbar.

### Custom toolbar

```tsx
<Dashboard widgets={w} toolbarActions={<Button size="sm">Export</Button>} />  // append
<Dashboard widgets={w} toolbar={false} />                                     // none
<Dashboard widgets={w} toolbar={(api) => (                                    // replace
  <MyBar
    editing={api.isEditing} onEditingChange={api.setEditing}
    onAdd={api.addWidget}   onTidy={api.tidy}
    count={api.items.length} save={api.save} load={api.load}
  />
)} />
```

`api` is the full `useDashboard` return, so a custom bar loses nothing. Replace
the empty state with `emptyState`.

### Keyboard

Widgets are focusable in edit mode. Arrows move; `shift` + arrows resize.

### Dark mode

Every colour is a theme token, so light and dark both follow the host app with
no `dark:` overrides in any component.

![The same dashboard in dark mode](docs/media/dashboard-dark.jpg)

## The engine

The layout math lives in a separate, headless npm package — pure TypeScript,
**zero dependencies**, no React, no DOM, no CSS:

```bash
npm install rud-dashboard
```

```ts
import { packItems, resolveCollisions, measureGrid, parseLayout } from "rud-dashboard"
```

Grid geometry, deterministic collision resolution, repacking, reflow across
column counts, and layout (de)serialisation with validation. The registry
components install it automatically. Use it directly to build your own renderer.

## Preact

The same registry sources run on Preact unchanged — no separate entry point, no
`/preact` import path, no build flags. Alias `react` to `preact/compat`:

```ts
// vite.config.ts
import preact from "@preact/preset-vite"
export default defineConfig({ plugins: [preact(), tailwindcss()] })
```

```jsonc
// tsconfig.app.json — mirror the bundler alias so types match the runtime.
// Both candidate paths are listed because a package manager may hoist `preact`
// to the workspace root; if the mapping resolves to nothing, TS silently falls
// back to a hoisted @types/react and every component fails with a confusing
// "Element is not assignable to ReactNode".
"paths": {
  "@/*": ["./src/*"],
  "react": ["./node_modules/preact/compat/", "../../node_modules/preact/compat/"],
  "react-dom": ["./node_modules/preact/compat/", "../../node_modules/preact/compat/"],
  "react-dom/client": ["./node_modules/preact/compat/client", "../../node_modules/preact/compat/client"],
  "react/jsx-runtime": ["./node_modules/preact/jsx-runtime", "../../node_modules/preact/jsx-runtime"]
}
```

### Three shadcn tweaks Preact needs

All three are in `ui/` files you own, and all three are already applied in
`examples/preact-vite`. **The dashboard components themselves need nothing** —
their sources are byte-identical to the React example's.

**1. `ui/button.tsx` must forward its ref.** This one is not cosmetic: without
it, every `asChild` trigger in your app is quietly broken.

```tsx
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, asChild = false, ...props }, ref) {
    const Comp = (asChild ? Slot.Root : "button") as React.ElementType
    return <Comp ref={ref} data-slot="button" {...props} />
  }
)
```

React 19 passes `ref` as an ordinary prop, so upstream's plain function component
carries it to the DOM node through `{...props}`. `preact/compat` still extracts
`ref` specially, so it never appears in props and never reaches the node. Radix's
`Slot` then hands the trigger ref to a component that drops it, Popper has no
anchor to measure, and **popovers and tooltips render at 0,0 minus their own
height — off screen above the viewport.** They are in the DOM and look "open" to
a test; they are simply not where you can see them. Forwarding the ref restores
anchoring, and popover/tooltip positions then match React exactly.

**2. `ui/button.tsx` needs `as React.ElementType`** on the `Slot.Root` / `"button"`
union (shown above), because `preact/compat` treats `Ref<T>` as invariant where
`@types/react` does not.

**3. `ui/chart.tsx` needs `color?: string`** declared explicitly on
`ChartTooltipContent`. recharts surfaces it through its Tooltip props, but that
does not survive the `preact/compat` intersection.

## Development

```bash
npm install
npm run build           # engine + registry JSON
npm test                # engine tests, component tests (jsdom), example sync check

npm run example:react   # examples/react-vite   — React 19
npm run example:preact  # examples/preact-vite  — Preact via preact/compat
```

The two examples share byte-identical component sources; only their Vite/TS
config and the two shadcn tweaks above differ. `npm run examples:check` fails if a
copy drifts from `registry/`, and the component tests in
`examples/react-vite/src/test` run against that copy — so after editing a
registry file, copy it into both examples.

To exercise the registry install path against local changes:

```bash
npm run registry:serve  # builds, then serves public/r on :4499
# then, in a scratch project:
npx shadcn@latest registry add @rud=http://localhost:4499/r/{name}.json
npx shadcn@latest add @rud/dashboard-demo
```

## Repository layout

```
packages/core/      rud-dashboard — headless engine (published to npm)
registry/rud/       source distributed via the shadcn registry
registry.json       registry manifest
public/r/           built registry JSON (shadcn build) — committed, it is what the URL serves
examples/           react-vite, preact-vite
docs/media/         screenshots used above
```

`public/r/*.json` is generated by `npm run build` and **must be committed** — it
is what the install URL serves.

## Upgrading from 0.2.x

- `reflow` now records anchors for any item that lacks them whenever it is not
  widening, so a layout that passes through a phone always comes back. Before,
  an anchorless layout narrowed to one column and saved stayed one column
  everywhere. Already-collapsed saved layouts are not repaired — reset them.
- New `fitLayout(items, { cols })`: fit a saved layout on first render, before
  there is a previous column count. Items the grid can show at full width return
  to their anchors, so a layout saved on a phone opens on desktop as the desktop
  arrangement. Do not use `reflow` with equal counts for this — it keeps the
  phone positions.
- New `commitPlacement(item, rect, cols)`: apply a user's drop or resize and
  update the anchors only when the grid is wide enough to show the item at its
  intended width. Renderers that wrote anchors directly on every commit should
  switch to it, or phone edits will overwrite the desktop layout.
- New `heightAt` option on `reflow`, for per-column-count heights.
- Registry: `WidgetDefinition.stackedHeight`, and `compact`, `stacked`,
  `pixelSize`, `columns` on the render context. See *Building mobile-friendly
  widgets*.

## Upgrading from 0.1.x

0.1.x shipped a compiled component library that injected its own full Tailwind
build (including preflight, plus rules targeting the host's `body` and `#root`),
vendored private copies of `Button` and `Tooltip`, and hardcoded blue/grey
colours that ignored its own tokens. Theming it was not really possible, and
setup meant a Tailwind preset, a `node_modules` content glob, a `@config`
back-reference, and a stylesheet import.

That approach is gone:

- **`rud-dashboard` on npm is now the headless engine only.** If you imported
  `Dashboard` from it, get the component from the registry instead.
- **`rud-dashboard/preact`, `rud-dashboard/tailwind.preset`, and
  `rud-dashboard/styles.css` no longer exist.** None of them have a replacement,
  because none of them are needed.
- **Saved layouts need remapping.** 0.1.x spans were fixed 40px cells with a
  column count derived from container width; 0.2 spans are cells on a fixed
  12-column grid. `original{X,Y,W,H}` is now `anchor{X,Y,W,H}`. Run stored
  payloads through `parseLayout` — it drops malformed items and reports what it
  changed rather than throwing.

Some concrete bugs fixed along the way:

- Rendering placed cells at a 56px pitch while pointer hit-testing used 48px, so
  a widget drawn in column 3 was read back as column 4 and items drifted a full
  column every ~3 cells.
- Touch drag never worked: `onTouchStart` began a gesture but only
  `mousemove`/`mouseup` were listened for, so it started and then neither moved
  nor committed.
- `DashboardToolbar` was entirely `// @ts-nocheck`, and `src/global.preact.d.ts`
  declared `namespace React { type ReactNode = any }` globally — which could ship
  in the published `.d.ts` and silently turn `ReactNode` into `any` across a
  consumer's whole project.
- `Button` accepted `asChild` and ignored it (no Radix Slot), so every
  `<TooltipTrigger asChild>` in the toolbar was a no-op.
- The tested `gridMath.ts` was dead code; `Dashboard.tsx` redefined the same
  collision functions inline.
- There was no keyboard path to move or resize a widget at all.

## License

MIT
