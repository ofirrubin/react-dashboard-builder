import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GRID,
  canvasHeight,
  colPitch,
  gridToPixel,
  measureGrid,
  measureRows,
  pixelToGrid,
  resolveColumns,
  resolveFrame,
  rowPitch,
  rowsForHeight,
  spanToPixels,
} from '../src/geometry';
import type { GridConfig } from '../src/types';

/** A fixed 12-column grid, so widths are exact and easy to reason about. */
const grid: GridConfig = { ...DEFAULT_GRID, columns: 12, gap: 12, padding: 12, rowHeight: 56 };

// 12 cols * 64 + 11 gaps * 12 + 2 * 12 padding = 768 + 132 + 24 = 924
const WIDTH = 924;
const frame = resolveFrame(WIDTH, grid);

describe('resolveColumns', () => {
  it('uses a plain number as-is', () => {
    expect(resolveColumns(320, 12)).toBe(12);
    expect(resolveColumns(4000, 12)).toBe(12);
  });

  it('reads a breakpoint map as minWidth -> columns', () => {
    const responsive = { 0: 1, 640: 6, 1024: 12 };
    expect(resolveColumns(320, responsive)).toBe(1);
    expect(resolveColumns(639, responsive)).toBe(1);
    expect(resolveColumns(640, responsive)).toBe(6);
    expect(resolveColumns(1023, responsive)).toBe(6);
    expect(resolveColumns(1024, responsive)).toBe(12);
    expect(resolveColumns(2560, responsive)).toBe(12);
  });

  it('never returns fewer than one column', () => {
    expect(resolveColumns(0, { 800: 12 })).toBe(1);
    expect(resolveColumns(100, 0)).toBe(1);
    expect(resolveColumns(100, -5)).toBe(1);
  });
});

describe('resolveFrame', () => {
  it('divides the container into exactly `columns` columns', () => {
    expect(frame.columns).toBe(12);
    expect(frame.colWidth).toBe(64);
  });

  it('fills the container exactly, with no leftover', () => {
    const used =
      frame.columns * frame.colWidth + (frame.columns - 1) * frame.gap + frame.padding * 2;
    expect(used).toBeCloseTo(WIDTH, 6);
  });

  it('flexes column width with the container instead of changing the count', () => {
    const narrow = resolveFrame(WIDTH / 2, grid);
    expect(narrow.columns).toBe(12);
    expect(narrow.colWidth).toBeLessThan(frame.colWidth);
  });

  it('never produces a zero or negative column width', () => {
    expect(resolveFrame(0, grid).colWidth).toBeGreaterThan(0);
    expect(resolveFrame(10, grid).colWidth).toBeGreaterThan(0);
  });
});

describe('gridToPixel / pixelToGrid', () => {
  it('round-trips every cell exactly', () => {
    // Regression test. Rendering and hit-testing previously used different cell
    // pitches (56px vs 48px), so a widget drawn in column 3 was read back as
    // column 4 and items drifted a whole column every ~3 cells. Both directions
    // now derive from the same frame.
    for (let x = 0; x < frame.columns; x++) {
      for (const y of [0, 1, 5, 17, 63]) {
        const px = gridToPixel(x, y, frame);
        expect(pixelToGrid(px.x, px.y, frame)).toEqual({ x, y });
      }
    }
  });

  it('round-trips with a fractional column width too', () => {
    // 1000px does not divide evenly into 12 columns.
    const odd = resolveFrame(1000, grid);
    expect(Number.isInteger(odd.colWidth)).toBe(false);
    for (let x = 0; x < odd.columns; x++) {
      const px = gridToPixel(x, x, odd);
      expect(pixelToGrid(px.x, px.y, odd)).toEqual({ x, y: x });
    }
  });

  it('offsets the first cell by the padding', () => {
    expect(gridToPixel(0, 0, frame)).toEqual({ x: frame.padding, y: frame.padding });
  });

  it('snaps to the nearest cell, not the floor', () => {
    const past = frame.padding + colPitch(frame) * 0.51;
    expect(pixelToGrid(past, frame.padding + rowPitch(frame) * 0.51, frame)).toEqual({ x: 1, y: 1 });
    const before = frame.padding + colPitch(frame) * 0.49;
    expect(pixelToGrid(before, frame.padding + rowPitch(frame) * 0.49, frame)).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe('spanToPixels', () => {
  it('covers n cells and the n-1 gaps between them', () => {
    expect(spanToPixels(1, 1, frame)).toEqual({ width: 64, height: 56 });
    expect(spanToPixels(2, 2, frame)).toEqual({ width: 140, height: 124 });
  });

  it('leaves exactly one gap between adjacent items for any span', () => {
    for (const span of [1, 2, 3, 6, 12]) {
      const left = gridToPixel(0, 0, frame).x;
      const width = spanToPixels(span, 1, frame).width;
      const next = gridToPixel(span, 0, frame).x;
      expect(next - (left + width)).toBeCloseTo(frame.gap, 6);
    }
  });

  it('a full-width span fills the content box exactly', () => {
    const full = spanToPixels(frame.columns, 1, frame).width;
    expect(full).toBeCloseTo(WIDTH - frame.padding * 2, 6);
  });

  it('never returns a negative size', () => {
    expect(spanToPixels(0, 0, frame)).toEqual({ width: 0, height: 0 });
    expect(spanToPixels(-3, -3, frame)).toEqual({ width: 0, height: 0 });
  });
});

describe('measureRows / canvasHeight', () => {
  it('leaves slack below the lowest item', () => {
    expect(measureRows([{ id: 'a', x: 0, y: 4, w: 2, h: 2 }], frame, { slack: 1 })).toBe(7);
  });

  it('always allocates at least one row', () => {
    expect(measureRows([], frame)).toBeGreaterThanOrEqual(1);
  });

  it('honours a minimum canvas height', () => {
    const rows = measureRows([], frame, { minHeight: 400 });
    expect(canvasHeight(rows, frame)).toBeGreaterThanOrEqual(400);
  });

  it('height for n rows leaves one gap between each', () => {
    expect(canvasHeight(1, frame)).toBe(frame.rowHeight + frame.padding * 2);
    expect(canvasHeight(3, frame)).toBe(3 * frame.rowHeight + 2 * frame.gap + frame.padding * 2);
  });
});

describe('measureGrid', () => {
  const tall = [{ id: 'a', x: 0, y: 0, w: 2, h: 40 }];

  it('grows with the content when no cap is set', () => {
    const m = measureGrid(WIDTH, tall, grid);
    expect(m.rows).toBeGreaterThan(40);
    expect(m.scrolls).toBe(false);
  });

  it('scroll mode stops at the cap and reports that it scrolls', () => {
    const m = measureGrid(WIDTH, tall, grid, { maxHeight: 400 });
    expect(m.height).toBe(400);
    expect(m.scrolls).toBe(true);
    // Rows are untouched: the items are still there, just below the fold.
    expect(m.rows).toBeGreaterThan(rowsForHeight(400, m.frame));
  });

  it('scroll mode does not pad out to the cap when content is shorter', () => {
    const m = measureGrid(WIDTH, [{ id: 'a', x: 0, y: 0, w: 2, h: 1 }], grid, {
      maxHeight: 4000,
    });
    expect(m.height).toBeLessThan(4000);
    expect(m.scrolls).toBe(false);
  });

  it('clamp mode limits the grid to the rows that fit, with no scroll', () => {
    const m = measureGrid(WIDTH, tall, grid, { maxHeight: 400, maxHeightMode: 'clamp' });
    expect(m.rows).toBe(rowsForHeight(400, m.frame));
    expect(m.height).toBeLessThanOrEqual(400);
    expect(m.scrolls).toBe(false);
  });

  it('never reports fewer rows than the content needs when under the cap', () => {
    const short = [{ id: 'a', x: 0, y: 0, w: 2, h: 2 }];
    const m = measureGrid(WIDTH, short, grid, { maxHeight: 4000, maxHeightMode: 'clamp' });
    expect(m.rows).toBeGreaterThanOrEqual(3);
  });

  it('honours minHeight even with a tiny cap', () => {
    for (const mode of ['scroll', 'clamp'] as const) {
      const m = measureGrid(WIDTH, tall, grid, { maxHeight: 10, maxHeightMode: mode });
      expect(m.height).toBeGreaterThanOrEqual(grid.minHeight);
    }
  });

  it('keeps the column count stable across widths, unlike the old cell model', () => {
    for (const width of [1024, 1440, 1920, 2560]) {
      expect(measureGrid(width, [], grid).cols).toBe(12);
    }
  });

  it('applies responsive columns from the default config', () => {
    expect(measureGrid(375, [], DEFAULT_GRID).cols).toBe(1);
    expect(measureGrid(800, [], DEFAULT_GRID).cols).toBe(6);
    expect(measureGrid(1440, [], DEFAULT_GRID).cols).toBe(12);
  });
});
