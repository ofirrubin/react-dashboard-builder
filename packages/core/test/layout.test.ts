import { describe, expect, it } from 'vitest';
import {
  applyResize,
  commitPlacement,
  createOccupancyMatrix,
  findFreeSlot,
  isFree,
  overlaps,
  packItems,
  reflow,
  resolveCollisions,
} from '../src/layout';
import type { GridRect } from '../src/types';

const COLS = 16;

function rect(id: string, x: number, y: number, w: number, h: number): GridRect {
  return { id, x, y, w, h };
}

/** Assert that no two rectangles in `items` share a cell. */
function expectNoOverlaps(items: readonly GridRect[]) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      expect(
        overlaps(items[i], items[j]),
        `${items[i].id} overlaps ${items[j].id}`
      ).toBe(false);
    }
  }
}

describe('overlaps', () => {
  it('detects intersection', () => {
    expect(overlaps(rect('a', 0, 0, 2, 2), rect('b', 1, 1, 2, 2))).toBe(true);
  });

  it('treats touching edges as not overlapping', () => {
    expect(overlaps(rect('a', 0, 0, 2, 2), rect('b', 2, 0, 2, 2))).toBe(false);
    expect(overlaps(rect('a', 0, 0, 2, 2), rect('b', 0, 2, 2, 2))).toBe(false);
  });
});

describe('createOccupancyMatrix / isFree', () => {
  it('marks exactly the occupied cells', () => {
    const m = createOccupancyMatrix([rect('a', 5, 3, 3, 2)], COLS);
    expect(m[3][5]).toBe(true);
    expect(m[4][7]).toBe(true);
    expect(m[3][4]).toBe(false);
    // The matrix stops at the last occupied row; anything below is free.
    expect(m.length).toBe(5);
    expect(isFree(m, 5, 5, 1, 1, COLS)).toBe(true);
  });

  it('grows rows on demand for items far down the canvas', () => {
    const m = createOccupancyMatrix([rect('a', 0, 400, 2, 2)], COLS);
    expect(m.length).toBe(402);
    expect(m[400][0]).toBe(true);
  });

  it('rejects positions that leave the grid horizontally', () => {
    const m = createOccupancyMatrix([], COLS);
    expect(isFree(m, 15, 0, 2, 2, COLS)).toBe(false);
    expect(isFree(m, -1, 0, 2, 2, COLS)).toBe(false);
    expect(isFree(m, 14, 0, 2, 2, COLS)).toBe(true);
  });

  it('treats rows beyond the occupied region as free', () => {
    const m = createOccupancyMatrix([rect('a', 0, 0, 2, 2)], COLS);
    expect(isFree(m, 0, 999, 2, 2, COLS)).toBe(true);
  });
});

describe('findFreeSlot', () => {
  it('keeps the requested position when it is already free', () => {
    const slot = findFreeSlot(rect('new', 4, 4, 2, 2), [rect('a', 0, 0, 2, 2)], { cols: COLS });
    expect(slot).toEqual({ x: 4, y: 4, w: 2, h: 2 });
  });

  it('slides straight down before moving sideways', () => {
    const existing = [rect('a', 4, 0, 2, 2)];
    const slot = findFreeSlot(rect('new', 4, 0, 2, 2), existing, { cols: COLS });
    expect(slot).toEqual({ x: 4, y: 2, w: 2, h: 2 });
  });

  it('clamps a span wider than the grid', () => {
    const slot = findFreeSlot(rect('wide', 0, 0, 99, 2), [], { cols: COLS });
    expect(slot.w).toBe(COLS);
  });

  it('prefers the stored anchor over the current position', () => {
    const item: GridRect = { ...rect('a', 0, 9, 2, 2), anchorX: 6, anchorY: 1 };
    expect(findFreeSlot(item, [], { cols: COLS })).toEqual({ x: 6, y: 1, w: 2, h: 2 });
  });

  it('ignores the anchor when asked to', () => {
    const item: GridRect = { ...rect('a', 0, 9, 2, 2), anchorX: 6, anchorY: 1 };
    expect(findFreeSlot(item, [], { cols: COLS, ignoreAnchor: true })).toEqual({
      x: 0,
      y: 9,
      w: 2,
      h: 2,
    });
  });

  it('always returns a non-overlapping slot on a crowded grid', () => {
    // Fill the top-left 16x4 region completely.
    const existing: GridRect[] = [];
    for (let y = 0; y < 4; y += 2) {
      for (let x = 0; x < COLS; x += 2) existing.push(rect(`f${x}-${y}`, x, y, 2, 2));
    }
    const slot = findFreeSlot(rect('new', 0, 0, 2, 2), existing, { cols: COLS });
    expectNoOverlaps([...existing, { id: 'new', ...slot }]);
  });
});

describe('resolveCollisions', () => {
  it('separates overlapping items', () => {
    const resolved = resolveCollisions([rect('a', 0, 0, 4, 2), rect('b', 1, 1, 4, 2)], {
      cols: COLS,
    });
    expect(resolved).toHaveLength(2);
    expectNoOverlaps(resolved);
  });

  it('leaves an already-valid layout untouched', () => {
    const input = [rect('a', 0, 0, 2, 2), rect('b', 2, 0, 2, 2), rect('c', 0, 2, 4, 2)];
    const resolved = resolveCollisions(input, { cols: COLS });
    for (const original of input) {
      const found = resolved.find((r) => r.id === original.id)!;
      expect({ x: found.x, y: found.y, w: found.w, h: found.h }).toEqual({
        x: original.x,
        y: original.y,
        w: original.w,
        h: original.h,
      });
    }
  });

  it('holds the pinned item still and moves everything else', () => {
    const dragged = rect('dragged', 2, 0, 4, 2);
    const resolved = resolveCollisions([rect('a', 0, 0, 6, 2), dragged], {
      cols: COLS,
      pinnedId: 'dragged',
    });
    const pinned = resolved.find((r) => r.id === 'dragged')!;
    expect({ x: pinned.x, y: pinned.y }).toEqual({ x: 2, y: 0 });
    expectNoOverlaps(resolved);
  });

  it('is deterministic', () => {
    const input = [rect('a', 1, 1, 4, 3), rect('b', 2, 0, 3, 4), rect('c', 0, 2, 5, 2)];
    const first = resolveCollisions(input, { cols: COLS });
    const second = resolveCollisions(input, { cols: COLS });
    expect(first).toEqual(second);
  });

  it('never loses an item', () => {
    const input = Array.from({ length: 25 }, (_, i) => rect(`i${i}`, i % 5, i % 7, 3, 2));
    const resolved = resolveCollisions(input, { cols: COLS });
    expect(resolved.map((r) => r.id).sort()).toEqual(input.map((r) => r.id).sort());
    expectNoOverlaps(resolved);
  });

  it('enforces minSpan', () => {
    const resolved = resolveCollisions([rect('a', 0, 0, 1, 1)], { cols: COLS, minSpan: 2 });
    expect(resolved[0].w).toBe(2);
    expect(resolved[0].h).toBe(2);
  });
});

describe('packItems', () => {
  it('places the largest item first and removes gaps', () => {
    const packed = packItems(
      [rect('small', 10, 10, 2, 2), rect('big', 0, 6, 8, 4), rect('mid', 4, 20, 4, 2)],
      { cols: COLS }
    );
    expect(packed[0].id).toBe('big');
    expect({ x: packed[0].x, y: packed[0].y }).toEqual({ x: 0, y: 0 });
    expectNoOverlaps(packed);
    // Nothing should be left stranded far down the canvas.
    expect(Math.max(...packed.map((p) => p.y + p.h))).toBeLessThanOrEqual(6);
  });

  it('records the packed position as the new anchor', () => {
    const packed = packItems([rect('a', 9, 9, 2, 2)], { cols: COLS });
    expect(packed[0].anchorX).toBe(packed[0].x);
    expect(packed[0].anchorY).toBe(packed[0].y);
  });

  it('keeps every item and never overlaps', () => {
    const input = Array.from({ length: 20 }, (_, i) => rect(`i${i}`, 0, 0, 2 + (i % 5), 2));
    const packed = packItems(input, { cols: COLS });
    expect(packed).toHaveLength(input.length);
    expectNoOverlaps(packed);
  });
});

describe('reflow', () => {
  it('clamps spans when narrowing', () => {
    const reflowed = reflow([rect('a', 0, 0, 12, 2)], { fromCols: 16, toCols: 6 });
    expect(reflowed[0].w).toBe(6);
    expect(reflowed[0].x).toBe(0);
  });

  it('restores anchors when widening back out', () => {
    const narrowed: GridRect[] = [
      { ...rect('a', 0, 0, 4, 2), anchorX: 8, anchorY: 0, anchorW: 4, anchorH: 2 },
    ];
    const widened = reflow(narrowed, { fromCols: 6, toCols: 16 });
    expect({ x: widened[0].x, y: widened[0].y }).toEqual({ x: 8, y: 0 });
  });

  it('keeps every item inside the new grid', () => {
    const input = Array.from({ length: 12 }, (_, i) => rect(`i${i}`, i, i, 4, 2));
    const reflowed = reflow(input, { fromCols: 16, toCols: 5 });
    expect(reflowed).toHaveLength(input.length);
    for (const item of reflowed) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x + item.w).toBeLessThanOrEqual(5);
    }
    expectNoOverlaps(reflowed);
  });

  // A desktop layout with no anchors at all — the shape of a hand-written
  // default layout, or one saved before anchors existed.
  const desktop = (): GridRect[] => [
    rect('revenue', 0, 0, 3, 1),
    rect('orders', 3, 0, 3, 1),
    rect('customers', 6, 0, 3, 1),
    rect('aov', 9, 0, 3, 1),
    rect('chart', 0, 1, 8, 3),
    rect('top', 8, 1, 4, 3),
  ];
  const positions = (items: readonly GridRect[]) =>
    Object.fromEntries(items.map((i) => [i.id, { x: i.x, y: i.y, w: i.w, h: i.h }]));

  it('round-trips an anchorless layout through a phone and back', () => {
    // The real failure: narrowing clamped every w to 1 and recorded nothing to
    // restore, so once that state was saved the desktop layout was gone for good.
    const phone = reflow(desktop(), { fromCols: 12, toCols: 1 });
    expect(phone.every((i) => i.w === 1 && i.x === 0)).toBe(true);
    expectNoOverlaps(phone);

    const back = reflow(phone, { fromCols: 1, toCols: 12 });
    expect(positions(back)).toEqual(positions(desktop()));
  });

  it('stacks a narrowed layout in reading order', () => {
    const phone = reflow(desktop(), { fromCols: 12, toCols: 1 });
    const order = [...phone].sort((a, b) => a.y - b.y).map((i) => i.id);
    expect(order).toEqual(['revenue', 'orders', 'customers', 'aov', 'chart', 'top']);
  });

  it('fits a layout on first load when the column count did not change', () => {
    // On a phone the first measure resolves 1 column, the same as the
    // pre-measure placeholder, so there is no "change" to trigger a reflow.
    const fitted = reflow(desktop(), { fromCols: 1, toCols: 1 });
    for (const item of fitted) {
      expect(item.x + item.w).toBeLessThanOrEqual(1);
    }
    expectNoOverlaps(fitted);
    const back = reflow(fitted, { fromCols: 1, toCols: 12 });
    expect(positions(back)).toEqual(positions(desktop()));
  });

  it('keeps existing anchors rather than overwriting them on narrowing', () => {
    const anchored = [{ ...rect('a', 0, 0, 4, 2), anchorX: 8, anchorY: 0, anchorW: 4, anchorH: 2 }];
    const phone = reflow(anchored, { fromCols: 6, toCols: 1 });
    expect(phone[0]).toMatchObject({ anchorX: 8, anchorY: 0, anchorW: 4, anchorH: 2 });
  });

  it('applies a per-item height override only at the target column count', () => {
    const heightAt = (item: GridRect, cols: number) =>
      item.id === 'chart' && cols === 1 ? 5 : undefined;
    const phone = reflow(desktop(), { fromCols: 12, toCols: 1, heightAt });
    expect(phone.find((i) => i.id === 'chart')?.h).toBe(5);
    expectNoOverlaps(phone);

    const back = reflow(phone, { fromCols: 1, toCols: 12, heightAt });
    expect(back.find((i) => i.id === 'chart')?.h).toBe(3);
  });
});

describe('commitPlacement', () => {
  it('records the placement as the new anchor on a full-width grid', () => {
    const item = { ...rect('a', 0, 0, 4, 2), anchorX: 0, anchorY: 0, anchorW: 4, anchorH: 2 };
    expect(commitPlacement(item, { x: 2, y: 3, w: 5, h: 2 }, 12)).toMatchObject({
      x: 2,
      y: 3,
      w: 5,
      h: 2,
      anchorX: 2,
      anchorY: 3,
      anchorW: 5,
      anchorH: 2,
    });
  });

  it('leaves the wide-layout anchor alone when the item is shown narrowed', () => {
    // Dragging on a phone must not turn an 8-wide desktop chart into a 1-wide one.
    const item = { ...rect('chart', 0, 4, 1, 3), anchorX: 0, anchorY: 1, anchorW: 8, anchorH: 3 };
    const moved = commitPlacement(item, { x: 0, y: 0, w: 1, h: 4 }, 1);
    expect(moved).toMatchObject({ x: 0, y: 0, w: 1, h: 4 });
    expect(moved).toMatchObject({ anchorX: 0, anchorY: 1, anchorW: 8, anchorH: 3 });
  });

  it('survives a phone edit followed by widening back to desktop', () => {
    const desktopItems = [
      rect('a', 0, 0, 6, 2),
      rect('b', 6, 0, 6, 2),
    ];
    const phone = reflow(desktopItems, { fromCols: 12, toCols: 1 });
    // Swap the order on the phone: drag `b` to the top.
    const b = phone.find((i) => i.id === 'b')!;
    const edited = resolveCollisions(
      phone.map((i) => (i.id === 'b' ? commitPlacement(i, { x: 0, y: 0, w: 1, h: 2 }, 1) : i)),
      { cols: 1, pinnedId: b.id }
    );
    expect(edited.find((i) => i.id === 'b')?.y).toBe(0);

    const back = reflow(edited, { fromCols: 1, toCols: 12 });
    expect(back.find((i) => i.id === 'a')).toMatchObject({ x: 0, y: 0, w: 6, h: 2 });
    expect(back.find((i) => i.id === 'b')).toMatchObject({ x: 6, y: 0, w: 6, h: 2 });
  });
});

describe('applyResize', () => {
  const bounds = { cols: COLS, rows: 20, minSpan: 2, maxSpan: 24 };

  it('grows east without moving the origin', () => {
    expect(applyResize(rect('a', 2, 2, 4, 4), 'e', 2, 0, bounds)).toEqual({
      x: 2,
      y: 2,
      w: 6,
      h: 4,
    });
  });

  it('moves the origin when pulling west', () => {
    expect(applyResize(rect('a', 4, 2, 4, 4), 'w', -2, 0, bounds)).toEqual({
      x: 2,
      y: 2,
      w: 6,
      h: 4,
    });
  });

  it('handles corner handles on both axes', () => {
    expect(applyResize(rect('a', 4, 4, 4, 4), 'nw', -2, -2, bounds)).toEqual({
      x: 2,
      y: 2,
      w: 6,
      h: 6,
    });
  });

  it('clamps to minSpan instead of collapsing', () => {
    const resized = applyResize(rect('a', 0, 0, 4, 4), 'e', -99, 0, bounds);
    expect(resized.w).toBe(bounds.minSpan);
  });

  it('never extends past the grid edge', () => {
    const resized = applyResize(rect('a', 12, 0, 4, 4), 'e', 99, 0, bounds);
    expect(resized.x + resized.w).toBeLessThanOrEqual(bounds.cols);
  });

  it('never produces a negative origin', () => {
    const resized = applyResize(rect('a', 0, 0, 4, 4), 'nw', -99, -99, bounds);
    expect(resized.x).toBeGreaterThanOrEqual(0);
    expect(resized.y).toBeGreaterThanOrEqual(0);
  });
});
