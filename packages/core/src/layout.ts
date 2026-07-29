import { clamp } from './geometry';
import type { GridRect, ResizeHandle } from './types';

/** Do two rectangles share any cell? */
export function overlaps(a: GridRect, b: GridRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * Occupancy grid, indexed `[row][col]`.
 *
 * Rows grow on demand, so an item placed far down the canvas does not need the
 * matrix to have been pre-sized for it.
 */
export function createOccupancyMatrix(items: readonly GridRect[], cols: number): boolean[][] {
  const matrix: boolean[][] = [];
  const ensureRows = (count: number) => {
    while (matrix.length < count) matrix.push(new Array(cols).fill(false));
  };

  for (const item of items) {
    const startX = Math.max(0, item.x);
    const startY = Math.max(0, item.y);
    const endX = Math.min(cols, startX + item.w);
    const endY = startY + item.h;
    ensureRows(endY);
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) matrix[y][x] = true;
    }
  }
  return matrix;
}

/** Is the `w`x`h` box at (`x`,`y`) fully inside the grid and unoccupied? */
export function isFree(
  matrix: readonly boolean[][],
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number
): boolean {
  if (x < 0 || y < 0 || x + w > cols) return false;
  for (let row = y; row < y + h; row++) {
    const cells = matrix[row];
    if (!cells) continue; // beyond the occupied region: free by definition
    for (let col = x; col < x + w; col++) {
      if (cells[col]) return false;
    }
  }
  return true;
}

export interface PlacementOptions {
  cols: number;
  minSpan?: number;
  /**
   * When true, keep the item's current x/y as the starting guess. When false,
   * prefer its stored anchor, so an item returns to where the user put it once
   * there is room again.
   */
  ignoreAnchor?: boolean;
  /**
   * How to search once the preferred position is taken.
   *
   * `slide-down` (default) walks straight down the preferred column first. That
   * is what a drop gesture should do — the item stays in the column the user
   * aimed at and just settles lower.
   *
   * `compact` goes straight to reading order, which finds the tightest fit. Use
   * it when repacking, where sliding down would leave a hole to the right and
   * strand items far down the canvas.
   */
  strategy?: 'slide-down' | 'compact';
}

/**
 * Find the first free slot for `item`, scanning from its preferred position and
 * then according to `strategy`.
 */
export function findFreeSlot(
  item: GridRect,
  existing: readonly GridRect[],
  { cols, minSpan = 1, ignoreAnchor = false, strategy = 'slide-down' }: PlacementOptions
): Pick<GridRect, 'x' | 'y' | 'w' | 'h'> {
  let w = item.w;
  let h = item.h;
  let x = item.x;
  let y = item.y;

  if (!ignoreAnchor && item.anchorX !== undefined && item.anchorY !== undefined) {
    x = item.anchorX;
    y = item.anchorY;
    if (item.anchorW !== undefined) w = item.anchorW;
    if (item.anchorH !== undefined) h = item.anchorH;
  }

  w = clamp(Math.max(minSpan, w), minSpan, cols);
  h = Math.max(minSpan, h);
  x = clamp(x, 0, Math.max(0, cols - w));
  y = Math.max(0, y);

  const matrix = createOccupancyMatrix(existing, cols);

  if (isFree(matrix, x, y, w, h, cols)) return { x, y, w, h };

  const maxRow = matrix.length + h;

  if (strategy === 'slide-down') {
    // Keeps the column stable, which reads as "it stayed where I put it, just lower".
    for (let row = y + 1; row <= maxRow; row++) {
      if (isFree(matrix, x, row, w, h, cols)) return { x, y: row, w, h };
    }
  }

  // Otherwise take the first free slot in reading order.
  for (let row = 0; row <= maxRow; row++) {
    for (let col = 0; col <= cols - w; col++) {
      if (isFree(matrix, col, row, w, h, cols)) return { x: col, y: row, w, h };
    }
  }

  return { x: 0, y: matrix.length, w, h };
}

export interface ResolveOptions {
  cols: number;
  minSpan?: number;
  /** This item keeps its exact position; everything else yields to it. */
  pinnedId?: string;
  /** Try to restore each item's anchor before falling back to its current spot. */
  reAnchor?: boolean;
}

/**
 * Remove all overlaps by letting items fall downward, top-to-bottom then
 * left-to-right. Deterministic: same input always yields the same output.
 */
export function resolveCollisions(
  items: readonly GridRect[],
  { cols, minSpan = 1, pinnedId, reAnchor = false }: ResolveOptions
): GridRect[] {
  const ordered = [...items].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  const placed: GridRect[] = [];

  const pinned = pinnedId ? ordered.find((i) => i.id === pinnedId) : undefined;
  if (pinned) placed.push(pinned);

  let matrix = createOccupancyMatrix(placed, cols);

  for (const item of ordered) {
    if (pinned && item.id === pinned.id) continue;

    const w = clamp(Math.max(minSpan, item.w), minSpan, cols);
    const h = Math.max(minSpan, item.h);

    let x = clamp(item.x, 0, Math.max(0, cols - w));
    let y = Math.max(0, item.y);

    if (reAnchor && item.anchorX !== undefined && item.anchorY !== undefined) {
      x = clamp(item.anchorX, 0, Math.max(0, cols - w));
      y = Math.max(0, item.anchorY);
    }

    while (!isFree(matrix, x, y, w, h, cols)) y++;

    const next: GridRect = { ...item, x, y, w, h };
    placed.push(next);
    matrix = createOccupancyMatrix(placed, cols);
  }

  return placed;
}

/**
 * Repack every item, largest first, into the tightest arrangement that fits
 * `cols`. Ties break by previous visual position so the result feels like a
 * tidy-up rather than a shuffle.
 */
export function packItems(
  items: readonly GridRect[],
  { cols, minSpan = 1 }: { cols: number; minSpan?: number }
): GridRect[] {
  const byArea = [...items].sort((a, b) => {
    const areaA = (a.anchorW ?? a.w) * (a.anchorH ?? a.h);
    const areaB = (b.anchorW ?? b.w) * (b.anchorH ?? b.h);
    if (areaB !== areaA) return areaB - areaA;
    const ay = a.anchorY ?? a.y;
    const by = b.anchorY ?? b.y;
    if (ay !== by) return ay - by;
    const ax = a.anchorX ?? a.x;
    const bx = b.anchorX ?? b.x;
    if (ax !== bx) return ax - bx;
    return a.id.localeCompare(b.id);
  });

  const packed: GridRect[] = [];
  for (const item of byArea) {
    const w = clamp(Math.max(minSpan, item.anchorW ?? item.w), minSpan, cols);
    const h = Math.max(minSpan, item.anchorH ?? item.h);
    const slot = findFreeSlot({ ...item, x: 0, y: 0, w, h }, packed, {
      cols,
      minSpan,
      ignoreAnchor: true,
      strategy: 'compact',
    });
    packed.push({
      ...item,
      ...slot,
      anchorX: slot.x,
      anchorY: slot.y,
      anchorW: slot.w,
      anchorH: slot.h,
    });
  }
  return packed;
}

/**
 * Re-fit items after the column count changes. Widening restores anchors where
 * possible; narrowing clamps spans and lets items reflow downward.
 */
export function reflow(
  items: readonly GridRect[],
  { fromCols, toCols, minSpan = 1 }: { fromCols: number; toCols: number; minSpan?: number }
): GridRect[] {
  const widening = toCols > fromCols;

  const resized = items.map((item) => {
    const targetW = item.anchorW ?? item.w;
    const targetH = item.anchorH ?? item.h;
    return {
      ...item,
      w: clamp(Math.max(minSpan, targetW), minSpan, toCols),
      h: Math.max(minSpan, targetH),
    };
  });

  return resolveCollisions(resized, { cols: toCols, minSpan, reAnchor: widening });
}

/** Apply a resize gesture to a rectangle, in grid units. */
export function applyResize(
  origin: GridRect,
  handle: ResizeHandle,
  deltaCols: number,
  deltaRows: number,
  { cols, rows, minSpan, maxSpan }: { cols: number; rows: number; minSpan: number; maxSpan: number }
): Pick<GridRect, 'x' | 'y' | 'w' | 'h'> {
  let { x, y, w, h } = origin;

  if (handle.includes('e')) {
    w = clamp(origin.w + deltaCols, minSpan, maxSpan);
  }
  if (handle.includes('w')) {
    const next = clamp(origin.w - deltaCols, minSpan, maxSpan);
    x = origin.x + (origin.w - next);
    w = next;
  }
  if (handle.includes('s')) {
    h = clamp(origin.h + deltaRows, minSpan, maxSpan);
  }
  if (handle.includes('n')) {
    const next = clamp(origin.h - deltaRows, minSpan, maxSpan);
    y = origin.y + (origin.h - next);
    h = next;
  }

  x = Math.max(0, x);
  y = Math.max(0, y);
  w = clamp(w, minSpan, Math.max(minSpan, cols - x));
  h = clamp(h, minSpan, Math.max(minSpan, rows - y));

  return { x, y, w, h };
}
