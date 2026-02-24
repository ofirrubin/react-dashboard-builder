import { describe, it, expect } from 'vitest';
import {
    createCollisionMatrix,
    isPositionFree,
    findSafePosition,
    itemsOverlap,
    GridRect,
} from '../lib/gridMath';

// ------- helpers -------
function rect(id: string, x: number, y: number, w: number, h: number): GridRect {
    return { id, x, y, w, h };
}

const COLS = 16;

// ========================
// createCollisionMatrix
// ========================
describe('createCollisionMatrix', () => {
    it('creates an all-false matrix when no items exist', () => {
        const matrix = createCollisionMatrix([], COLS);
        // The matrix should still have rows (the padding of 100)
        expect(matrix.length).toBeGreaterThan(0);
        expect(matrix[0].length).toBe(COLS);
        expect(matrix[0].every(cell => cell === false)).toBe(true);
    });

    it('marks occupied cells as true', () => {
        const matrix = createCollisionMatrix([rect('a', 0, 0, 2, 2)], COLS);
        expect(matrix[0][0]).toBe(true);
        expect(matrix[0][1]).toBe(true);
        expect(matrix[1][0]).toBe(true);
        expect(matrix[1][1]).toBe(true);
        expect(matrix[0][2]).toBe(false);
        expect(matrix[2][0]).toBe(false);
    });

    it('handles items placed at non-zero offsets', () => {
        const matrix = createCollisionMatrix([rect('a', 5, 3, 3, 2)], COLS);
        // Rows 3–4, cols 5–7 should be occupied
        for (let row = 3; row < 5; row++) {
            for (let col = 5; col < 8; col++) {
                expect(matrix[row][col]).toBe(true);
            }
        }
        // Adjacent cells should be free
        expect(matrix[3][4]).toBe(false);
        expect(matrix[3][8]).toBe(false);
        expect(matrix[2][5]).toBe(false);
        expect(matrix[5][5]).toBe(false);
    });

    it('does not mark cells beyond maxCols', () => {
        const matrix = createCollisionMatrix([rect('a', 14, 0, 4, 1)], COLS);
        // Only cols 14–15 can be marked (maxCols = 16)
        expect(matrix[0][14]).toBe(true);
        expect(matrix[0][15]).toBe(true);
        // Col 16 doesn't exist in the array
        expect(matrix[0][16]).toBeUndefined();
    });
});

// ========================
// isPositionFree
// ========================
describe('isPositionFree', () => {
    it('returns false for out-of-bounds x', () => {
        const matrix = createCollisionMatrix([], COLS);
        expect(isPositionFree(matrix, -1, 0, 2, 2, COLS)).toBe(false);
    });

    it('returns false when item would overflow columns', () => {
        const matrix = createCollisionMatrix([], COLS);
        expect(isPositionFree(matrix, 15, 0, 2, 2, COLS)).toBe(false);
    });

    it('returns true for a completely empty grid', () => {
        const matrix = createCollisionMatrix([], COLS);
        expect(isPositionFree(matrix, 0, 0, 4, 4, COLS)).toBe(true);
    });

    it('returns false when position overlaps an existing item', () => {
        const matrix = createCollisionMatrix([rect('a', 2, 2, 3, 3)], COLS);
        expect(isPositionFree(matrix, 3, 3, 2, 2, COLS)).toBe(false);
    });

    it('returns true when position is adjacent but not overlapping', () => {
        const matrix = createCollisionMatrix([rect('a', 0, 0, 4, 4)], COLS);
        // Placing item to the right of 'a' (starts at col 4)
        expect(isPositionFree(matrix, 4, 0, 4, 4, COLS)).toBe(true);
        // Placing item below 'a' (starts at row 4)
        expect(isPositionFree(matrix, 0, 4, 4, 4, COLS)).toBe(true);
    });

    it('treats out-of-bounds rows gracefully (sparse rows are free)', () => {
        const matrix = createCollisionMatrix([rect('a', 0, 0, 2, 2)], COLS);
        // Row 200 is beyond the matrix; should be free
        expect(isPositionFree(matrix, 0, 200, 2, 2, COLS)).toBe(true);
    });
});

// ========================
// itemsOverlap
// ========================
describe('itemsOverlap', () => {
    it('returns true for clearly overlapping items', () => {
        expect(itemsOverlap(rect('a', 0, 0, 3, 3), rect('b', 1, 1, 3, 3))).toBe(true);
    });

    it('returns false for items that share only an edge', () => {
        // 'a' occupies cols 0–2, 'b' starts at col 3 → no overlap
        expect(itemsOverlap(rect('a', 0, 0, 3, 3), rect('b', 3, 0, 3, 3))).toBe(false);
    });

    it('returns false for clearly separated items', () => {
        expect(itemsOverlap(rect('a', 0, 0, 2, 2), rect('b', 5, 5, 2, 2))).toBe(false);
    });

    it('returns true when one item fully contains another', () => {
        expect(itemsOverlap(rect('a', 0, 0, 8, 8), rect('b', 2, 2, 2, 2))).toBe(true);
    });
});

// ========================
// findSafePosition
// ========================
describe('findSafePosition', () => {
    it('places an item at the requested position when the grid is empty', () => {
        const item = rect('new', 3, 3, 2, 2);
        const pos = findSafePosition(item, [], { cols: COLS });
        expect(pos.x).toBe(3);
        expect(pos.y).toBe(3);
    });

    it('moves an item down when its original position is blocked', () => {
        const blocker = rect('blocker', 0, 0, 4, 4);
        const item = rect('new', 0, 0, 2, 2);
        const pos = findSafePosition(item, [blocker], { cols: COLS, preferCurrentPosition: true });
        // Must be placed somewhere that doesn't overlap the blocker
        const overlaps = itemsOverlap({ ...item, ...pos }, blocker);
        expect(overlaps).toBe(false);
    });

    it('respects maxCols and never places an item beyond the grid width', () => {
        const pos = findSafePosition(rect('x', 14, 0, 4, 2), [], { cols: COLS });
        expect(pos.x + pos.w).toBeLessThanOrEqual(COLS);
    });

    it('finds a valid position even when the grid is densely packed', () => {
        // Fill the first 4 rows with 2x2 widgets (8 per row at 16 cols)
        const existingItems: GridRect[] = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < COLS; col += 2) {
                existingItems.push(rect(`${row}-${col}`, col, row * 2, 2, 2));
            }
        }
        const newItem = rect('new', 0, 0, 2, 2);
        const pos = findSafePosition(newItem, existingItems, { cols: COLS, preferCurrentPosition: true });
        // Verify the placed position does not overlap anything
        for (const existing of existingItems) {
            expect(itemsOverlap({ ...newItem, ...pos }, existing)).toBe(false);
        }
    });

    it('uses originalX/Y when preferCurrentPosition is false', () => {
        const item: GridRect = { ...rect('a', 0, 0, 2, 2), originalX: 5, originalY: 0 };
        const pos = findSafePosition(item, [], { cols: COLS, preferCurrentPosition: false });
        expect(pos.x).toBe(5);
        expect(pos.y).toBe(0);
    });
});
