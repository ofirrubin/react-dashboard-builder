import type { GridConfig, GridFrame, GridMetrics, Point, ResponsiveColumns, Size, GridRect } from './types';

/**
 * Default grid geometry: a 12-column grid with fluid column width.
 *
 * The column COUNT is fixed and the column WIDTH flexes with the container.
 * This is the model every practical dashboard grid uses, and it is the opposite
 * of what this library used to do — it had a fixed 40px cell and derived the
 * column count from the container width. That meant the same saved layout
 * described a different arrangement on every screen size, items were re-packed
 * on any resize, and a "3 wide" widget was 136px whether it held a sparkline or
 * a paragraph. Fixing the count instead makes a layout mean one thing
 * everywhere: `w: 6` is always half the dashboard.
 */
export const DEFAULT_GRID: GridConfig = {
  columns: { 0: 1, 640: 6, 1024: 12 },
  rowHeight: 56,
  gap: 12,
  padding: 12,
  minSpan: 1,
  maxSpan: 24,
  minHeight: 200,
};

/**
 * Pick a column count for a container width.
 *
 * A plain number is used as-is. A map is read as `{ minWidthPx: columns }`, so
 * `{ 0: 1, 640: 6, 1024: 12 }` means one column on phones, six on tablets, and
 * twelve from a small laptop up.
 */
export function resolveColumns(containerWidth: number, columns: ResponsiveColumns): number {
  if (typeof columns === 'number') return Math.max(1, Math.floor(columns));

  const breakpoints = Object.keys(columns)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  let resolved = 1;
  for (const breakpoint of breakpoints) {
    if (containerWidth >= breakpoint) resolved = columns[breakpoint];
  }
  return Math.max(1, Math.floor(resolved));
}

/**
 * Resolve the grid for a concrete container width.
 *
 * Everything downstream — rendering and hit-testing alike — reads its geometry
 * from the frame, so the two can never disagree.
 */
export function resolveFrame(containerWidth: number, grid: GridConfig): GridFrame {
  const columns = resolveColumns(containerWidth, grid.columns);
  const inner = Math.max(0, containerWidth - grid.padding * 2);
  // n columns occupy n*colWidth + (n-1)*gap.
  const colWidth = Math.max(1, (inner - grid.gap * (columns - 1)) / columns);

  return {
    columns,
    colWidth,
    rowHeight: grid.rowHeight,
    gap: grid.gap,
    padding: grid.padding,
  };
}

/** Distance from the start of one column to the start of the next, in px. */
export function colPitch(frame: GridFrame): number {
  return frame.colWidth + frame.gap;
}

/** Distance from the start of one row to the start of the next, in px. */
export function rowPitch(frame: GridFrame): number {
  return frame.rowHeight + frame.gap;
}

/** Top-left pixel offset of a cell, relative to the canvas box. */
export function gridToPixel(x: number, y: number, frame: GridFrame): Point {
  return {
    x: frame.padding + x * colPitch(frame),
    y: frame.padding + y * rowPitch(frame),
  };
}

/**
 * Nearest cell for a pixel offset relative to the canvas box.
 * Exactly inverts `gridToPixel`.
 */
export function pixelToGrid(px: number, py: number, frame: GridFrame): Point {
  return {
    x: Math.round((px - frame.padding) / colPitch(frame)),
    y: Math.round((py - frame.padding) / rowPitch(frame)),
  };
}

/**
 * Pixel size of a span. A span of n covers n cells and the n-1 gaps between
 * them, which keeps the visible gutter equal to `gap` for every span.
 */
export function spanToPixels(w: number, h: number, frame: GridFrame): Size {
  return {
    width: Math.max(0, w * frame.colWidth + Math.max(0, w - 1) * frame.gap),
    height: Math.max(0, h * frame.rowHeight + Math.max(0, h - 1) * frame.gap),
  };
}

/** Rows needed to contain `items`, plus room to drop something new. */
export function measureRows(
  items: readonly GridRect[],
  frame: GridFrame,
  { slack = 1, minHeight = 0 }: { slack?: number; minHeight?: number } = {}
): number {
  const contentRows = items.reduce((max, it) => Math.max(max, it.y + it.h), 0);
  const rowsForMinHeight = Math.ceil(
    (minHeight - frame.padding * 2 + frame.gap) / rowPitch(frame)
  );
  return Math.max(1, rowsForMinHeight, contentRows + slack);
}

/** Canvas height in px for a given row count. */
export function canvasHeight(rows: number, frame: GridFrame): number {
  return rows * rowPitch(frame) - frame.gap + frame.padding * 2;
}

/** Measure everything the renderer needs from a container width. */
export function measureGrid(
  containerWidth: number,
  items: readonly GridRect[],
  grid: GridConfig,
  opts: { fixedHeight?: number | null; slack?: number } = {}
): GridMetrics {
  const frame = resolveFrame(containerWidth, grid);
  const rows = measureRows(items, frame, { slack: opts.slack, minHeight: grid.minHeight });
  return {
    frame,
    width: containerWidth,
    cols: frame.columns,
    rows,
    height: opts.fixedHeight ?? Math.max(grid.minHeight, canvasHeight(rows, frame)),
  };
}

/** Clamp a value into `[min, max]`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
