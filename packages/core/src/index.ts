/**
 * rud-dashboard — headless dashboard layout engine.
 *
 * Pure TypeScript: no React, no Preact, no DOM, no CSS, no dependencies. The
 * visual layer is distributed separately as editable source through a shadcn
 * registry, so components use your own design tokens and UI primitives.
 *
 * @see https://github.com/ofirrubin/react-dashboard-builder
 */

export type {
  GridRect,
  DashboardItem,
  GridConfig,
  GridFrame,
  GridMetrics,
  GridStyle,
  Point,
  ResizeHandle,
  ResponsiveColumns,
  SerializedItem,
  SerializedLayout,
  Size,
} from './types';

export {
  DEFAULT_GRID,
  canvasHeight,
  clamp,
  colPitch,
  gridToPixel,
  measureGrid,
  measureRows,
  pixelToGrid,
  resolveColumns,
  resolveFrame,
  rowPitch,
  spanToPixels,
} from './geometry';

export {
  applyResize,
  createOccupancyMatrix,
  findFreeSlot,
  isFree,
  overlaps,
  packItems,
  reflow,
  resolveCollisions,
} from './layout';
export type { PlacementOptions, ResolveOptions } from './layout';

export { SCHEMA_VERSION, nextItemId, parseLayout, serializeLayout } from './serialize';
export type { ParseResult } from './serialize';
