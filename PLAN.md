A# React/Preact Universal Dashboard (RUD) - Project Execution Plan

This plan is structured for autonomous subagent execution. Tasks are modularized into specific bounded contexts for parallel or sequential targeted execution.

## 1. Architectural Type Safety & Build Parity 🏗️
**Goal:** Achieve 100% strict typing and successful isolated builds for both React and Preact targets using `tsup`.
- [x] Convert internal `GridItem`, `WidgetType`, and controller states to remove `any`/`unknown`.
- [x] Alias Preact explicit properties (`ComponentType`, `VNode`) against React types (`ReactNode`) using generic casting (`as any`) for UI components (`Button`, `Tooltip`).
- [x] Integrate `tailwind v4` CLI compilation generation step into `package.json` for `dist/styles.css`.
- [ ] **CURRENT BLOCKER:** Fix `tsup` Preact definition (`.d.ts`) build failures. `ReactNode` inference inside `DashboardToolbar`, `Tooltip`, and `Dashboard` continues to collide with Preact's strict `VNode` checking. Needs global declaration overrides or `.d.ts` suppression handling.
- [ ] Clean up any redundant or deprecated patchwork files across the library.

## 2. Layout & Drag-and-Drop Engine ⚙️
**Goal:** Ensure a buttery-smooth, deterministic, "push-on-drag" gravity layout collision engine.
- [x] Implemented `ResizeObserver` for exact tracking of grid container dimensions.
- [x] Refactored `Dashboard.tsx` coordinate math (touch/mouse normalization to local scoping).
- [x] Replaced chaotic spiral-search algorithms with a mathematically stable 2D Collision Matrix layout system.
- [x] Evaluated "gravity-based" fallback item repositioning (when dropping an item, it deterministically cascades overlapping widgets correctly).

## 3. Styling & Aesthetics 🎨
**Goal:** Deliver a visual "Wow" factor out-of-the-box leveraging Modern SaaS design languages.
- [ ] Apply Modern SaaS Admin aesthetic to `Dashboard.tsx` and internal UI components:
  - Colors: Electric Blue primary (`#3B82F6`), Off-white/slate backgrounds (`#F4F7FA`, dark mode alternates).
  - Shapes: Large modern radiuses (12px - 16px).
  - Depth: Soft, layered drop shadows for dragged items.
- [ ] Refactor all internal UI primitive elements (`Button`, `Tooltip`, `Card`) to cleanly apply `clsx` / `tailwind-merge` onto a `className` prop to ensure end-user styling overrides work perfectly.

## 4. State Serialization & Persistence 💾
**Goal:** Provide a strict schema contract for saving and loading dashboard layouts.
- [ ] Define the strictly typed `SerializedDashboard` JSON schema interface in `shared.ts`.
- [ ] Add explicit semantic versioning to the schema payload (e.g., `version: 1`).
- [ ] Implement robust hydration logic to gracefully upgrade or discard older schema versions.

## 5. QA, Examples & Demos 🧪
**Goal:** Ensure backward compatibility and visual proof-of-work across both primary frameworks.
- [ ] Scaffold `example/react-demo/` via Vite (React 18 + TS) to import the local `rud` package.
- [ ] Scaffold `example/preact-demo/` via Vite (Preact + TS) to import and verify the local `rud` preact aliased package.
- [ ] Create automated layout collision testing suite (via `@vitest/browser` or Playwright) to guarantee standard array inputs deterministically render identical matrices under edge cases.
