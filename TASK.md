# Task: Refactor Dashboard Component for Library

## Objective
Convert React-specific Dashboard component to work with both React and Preact, removing unnecessary dependencies.

## Status: IN PROGRESS

### ✅ Completed
1. Button component refactored
   - Removed `@radix-ui/react-slot` dependency
   - Removed `asChild` prop
   - Simplified to always render as `button`
   - Fixed className handling

2. Custom Tooltip implemented
   - Replaced `@radix-ui/react-tooltip` with custom implementation
   - Hover trigger with configurable delay
   - Positioning support (top, bottom, left, right)
   - Fade-in animations with TailwindCSS
   - Context-based state management

3. Dependencies updated
   - Added to package.json: `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`
   - Removed Radix UI dependencies

4. Entry points updated
   - `src/index.ts` exports all components with React types
   - `src/index.preact.ts` exports all components with Preact types
   - Type system simplified (react.ts and preact.ts just re-export from shared.ts)

### 🔄 Current Issues (26 linter errors)

**File: `src/Dashboard.tsx`**
- Missing React import (using UMD global)
- Trying to import non-existent types (StatCardProps, ChartCardProps, GridProps)
- These types don't exist in the new Dashboard component

**File: `src/ui/tooltip.tsx`**
- Unused variable warning (minor)

### 📋 Next Steps

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Fix Dashboard.tsx**
   - Add React import at the top
   - Remove imports of non-existent simple component types
   - The Dashboard component has its own complex types in types/shared.ts

3. **Fix tooltip warning**
   - Remove unused `delayDuration` parameter from TooltipProvider

4. **Build and test**
   ```bash
   bun run build
   bun run dev           # React playground
   bun run test:preact   # Preact playground
   ```

5. **Verify**
   - No TypeScript errors
   - Dashboard renders correctly
   - Tooltips work on hover
   - Buttons render with all variants

## Notes

The Dashboard component is complex and has its own type system. The simple component types (StatCard, ChartCard, Grid) from the original setup don't exist in this Dashboard implementation.
