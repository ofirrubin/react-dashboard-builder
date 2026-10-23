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
export function resolveCollisions<T extends GridRect>(
  items: readonly T[],
  { cols, minSpan = 1, pinnedId, reAnchor = false }: ResolveOptions
): T[] {
  const ordered = [...items].sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
  const placed: T[] = [];

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

    placed.push({ ...item, x, y, w, h });
    matrix = createOccupancyMatrix(placed, cols);
  }

  return placed;
}

/**
 * Repack every item, largest first, into the tightest arrangement that fits
 * `cols`. Ties break by previous visual position so the result feels like a
 * tidy-up rather than a shuffle.
 */
export function packItems<T extends GridRect>(
  items: readonly T[],
  { cols, minSpan = 1 }: { cols: number; minSpan?: number }
): T[] {
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

  const packed: T[] = [];
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

export interface ReflowOptions<T extends GridRect> {
  fromCols: number;
  toCols: number;
  minSpan?: number;
  /**
   * Height to use at a given column count, overriding the item's own. Return
   * `undefined` to keep it. This is how a widget can be taller when the grid
   * stacks to a single column on a phone, without touching its desktop height.
   */
  heightAt?: (item: T, cols: number) => number | undefined;
}

/**
 * Fill in any missing anchor from the item's current rectangle.
 *
 * An item with no anchors has nothing to return to, so narrowing it used to be
 * a one-way trip: every span clamped to the phone's single column, and once that
 * state was saved, widening had no record of the desktop layout to restore.
 */
function withAnchors<T extends GridRect>(item: T): T {
  return {
    ...item,
    anchorX: item.anchorX ?? item.x,
    anchorY: item.anchorY ?? item.y,
    anchorW: item.anchorW ?? item.w,
    anchorH: item.anchorH ?? item.h,
  };
}

/**
 * Re-fit items after the column count changes. Widening restores anchors where
 * possible; narrowing clamps spans and lets items reflow downward.
 *
 * Anything that is not widening records anchors first, so a round trip through
 * a phone always comes back to the original arrangement. For a first load, where
 * there is no previous column count, use `fitLayout` instead.
 */
export function reflow<T extends GridRect>(
  items: readonly T[],
  { fromCols, toCols, minSpan = 1, heightAt }: ReflowOptions<T>
): T[] {
  const widening = toCols > fromCols;

  const resized = items.map((original) => {
    const item = widening ? original : withAnchors(original);
    const targetW = item.anchorW ?? item.w;
    const targetH = heightAt?.(original, toCols) ?? item.anchorH ?? item.h;
    return {
      ...item,
      w: clamp(Math.max(minSpan, targetW), minSpan, toCols),
      h: Math.max(minSpan, targetH),
    };
  });

  return resolveCollisions(resized, { cols: toCols, minSpan, reAnchor: widening });
}

/**
 * Fit a saved layout to the grid it is being shown on — the first render, before
 * there is any previous column count to reflow from.
 *
 * A saved layout may have been made on any screen, so each item is judged on its
 * own, by the same rule as `commitPlacement`: one the grid can show at its
 * intended width goes back to its anchor, and one it cannot (a desktop widget on
 * a phone) keeps its current spot and is clamped. So a layout saved on a phone
 * opens on desktop as the desktop arrangement, and opens on a phone in the order
 * it was left in. Missing anchors are recorded first, as in `reflow`.
 */
export function fitLayout<T extends GridRect>(
  items: readonly T[],
  { cols, minSpan = 1, heightAt }: { cols: number; minSpan?: number; heightAt?: ReflowOptions<T>['heightAt'] }
): T[] {
  const fitted = items.map((original) => {
    const item = withAnchors(original);
    const intendedW = item.anchorW ?? item.w;
    const fits = intendedW <= cols;
    return {
      ...item,
      x: fits ? (item.anchorX ?? item.x) : item.x,
      y: fits ? (item.anchorY ?? item.y) : item.y,
      w: clamp(Math.max(minSpan, intendedW), minSpan, cols),
      h: Math.max(minSpan, heightAt?.(original, cols) ?? item.anchorH ?? item.h),
    };
  });
  return resolveCollisions(fitted, { cols, minSpan });
}

/**
 * Apply a placement the user chose — the end of a drag, a resize, a keyboard
 * nudge — and decide whether it becomes the anchor to return to.
 *
 * On a grid wide enough to show the item at its intended width, it does. On a
 * narrower one (a phone, where everything is one column wide) the user is only
 * rearranging a reduced view: recording it would overwrite the desktop layout
 * with one-column spans, so the anchors are left alone.
 */
export function commitPlacement<T extends GridRect>(
  item: T,
  rect: Pick<GridRect, 'x' | 'y' | 'w' | 'h'>,
  cols: number
): T {
  const narrowed = (item.anchorW ?? item.w) > cols;
  const placed = { ...item, x: rect.x, y: rect.y, w: rect.w, h: rect.h };
  if (narrowed) return placed;
  return { ...placed, anchorX: rect.x, anchorY: rect.y, anchorW: rect.w, anchorH: rect.h };
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
