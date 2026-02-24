/**
 * Pure grid math utilities for the dashboard layout engine.
 * These functions are framework-agnostic and fully unit-testable.
 */
import { MIN_SIZE } from '../constants';

export interface GridRect {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    originalX?: number;
    originalY?: number;
    originalW?: number;
    originalH?: number;
}

export function itemsOverlap(a: GridRect, b: GridRect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function createCollisionMatrix(items: GridRect[], maxCols: number): boolean[][] {
    const maxH = Math.max(...items.map(it => it.y + it.h), 0) + 100;
    const matrix: boolean[][] = Array(maxH).fill(null).map(() => Array(maxCols).fill(false));

    items.forEach(item => {
        const startX = Math.max(0, item.x);
        const startY = Math.max(0, item.y);
        const endX = Math.min(maxCols, startX + item.w);
        const endY = startY + item.h;

        while (matrix.length < endY) {
            matrix.push(Array(maxCols).fill(false));
        }

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (matrix[y] && x < maxCols) {
                    matrix[y][x] = true;
                }
            }
        }
    });
    return matrix;
}

export function isPositionFree(
    matrix: boolean[][],
    testX: number,
    testY: number,
    testW: number,
    testH: number,
    maxCols: number
): boolean {
    if (testX < 0 || testY < 0 || testX + testW > maxCols) return false;

    for (let y = testY; y < testY + testH; y++) {
        for (let x = testX; x < testX + testW; x++) {
            if (y < matrix.length && matrix[y][x]) {
                return false;
            }
        }
    }
    return true;
}

export interface FindSafePositionOptions {
    cols: number;
    preferCurrentPosition?: boolean;
}

export function findSafePosition(
    item: GridRect,
    existingItems: GridRect[],
    options: FindSafePositionOptions
): { x: number; y: number; w: number; h: number } {
    const { cols, preferCurrentPosition = false } = options;

    let currentW = Math.min(item.w, cols);
    let currentH = item.h;

    let startX = item.x;
    let startY = item.y;

    if (!preferCurrentPosition && item.originalX !== undefined && item.originalY !== undefined) {
        startX = item.originalX;
        startY = item.originalY;
        if (item.originalW !== undefined) currentW = Math.min(item.originalW, cols);
        if (item.originalH !== undefined) currentH = item.originalH;
    }

    currentW = Math.max(MIN_SIZE, currentW);
    currentH = Math.max(MIN_SIZE, currentH);

    startX = Math.max(0, Math.min(startX, cols - currentW));
    startY = Math.max(0, startY);

    const matrix = createCollisionMatrix(existingItems, cols);

    if (isPositionFree(matrix, startX, startY, currentW, currentH, cols)) {
        return { x: startX, y: startY, w: currentW, h: currentH };
    }

    if (!preferCurrentPosition) {
        for (let y = startY + 1; y < startY + 50; y++) {
            if (isPositionFree(matrix, startX, y, currentW, currentH, cols)) {
                return { x: startX, y, w: currentW, h: currentH };
            }
        }
    }

    for (let y = 0; y < matrix.length + currentH; y++) {
        for (let x = 0; x <= cols - currentW; x++) {
            if (isPositionFree(matrix, x, y, currentW, currentH, cols)) {
                return { x, y, w: currentW, h: currentH };
            }
        }
    }

    return { x: 0, y: Math.max(0, matrix.length), w: currentW, h: currentH };
}
