/**
 * Plain, framework-agnostic types for the dashboard layout engine.
 *
 * Deliberately NOT generic over a node/component type. The previous design
 * parameterised every type over `<TNode, TComponent>` so that React and Preact
 * could share them, which forced four parallel type files, a global ambient
 * `declare namespace React` override, and dozens of `as any` casts. Preact's
 * own `preact/compat` already reconciles the two type systems, so none of that
 * complexity buys anything.
 */

/** A positioned, sized rectangle on the grid. Units are grid cells, not pixels. */
export interface GridRect {
  id: string;
  /** Column index of the left edge. */
  x: number;
  /** Row index of the top edge. */
  y: number;
  /** Width in columns. */
  w: number;
  /** Height in rows. */
  h: number;
  /**
   * The position/size the user last explicitly chose. The engine re-anchors to
   * these when a container grows back, so shrinking the window and widening it
   * again restores the intended layout instead of leaving items compacted.
   */
  anchorX?: number;
  anchorY?: number;
  anchorW?: number;
  anchorH?: number;
}

/** A grid rectangle plus the identity needed to render something in it. */
export interface DashboardItem extends GridRect {
  /** Key into the consumer's widget registry. */
  type: string;
  title: string;
}

/**
 * A fixed column count, or a responsive `{ minWidthPx: columns }` map such as
 * `{ 0: 1, 640: 6, 1024: 12 }`.
 */
export type ResponsiveColumns = number | Record<number, number>;

/** Grid configuration. The column count is fixed; column width is fluid. */
export interface GridConfig {
  /** How many columns the grid has, optionally per breakpoint. */
  columns: ResponsiveColumns;
  /** Height of a single row, in px. */
  rowHeight: number;
  /** Space between adjacent cells, in px. */
  gap: number;
  /** Inset between the canvas edge and the first cell, in px. */
  padding: number;
  /** Smallest allowed item span, in cells. */
  minSpan: number;
  /** Largest allowed item span, in cells. */
  maxSpan: number;
  /** Floor for the canvas height, in px. */
  minHeight: number;
}

/**
 * A `GridConfig` resolved against a concrete container width. Rendering and
 * hit-testing both read geometry from here, so they cannot drift apart.
 */
export interface GridFrame {
  /** Resolved column count for this width. */
  columns: number;
  /** Width of one column, in px. Fractional. */
  colWidth: number;
  rowHeight: number;
  gap: number;
  padding: number;
}

/** Pixel coordinate pair. */
export interface Point {
  x: number;
  y: number;
}

/** Pixel dimensions. */
export interface Size {
  width: number;
  height: number;
}

/** The measured state of the canvas. */
export interface GridMetrics {
  /** Resolved geometry for the current container width. */
  frame: GridFrame;
  /** Container width in px. */
  width: number;
  /** Canvas height in px. */
  height: number;
  /** Resolved column count. Mirrors `frame.columns`. */
  cols: number;
  /** Rows currently allocated. */
  rows: number;
}

/** Which corner or edge a resize gesture is pulling. */
export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

/** Background treatment for the canvas. */
export type GridStyle = 'lines' | 'dots' | 'bold' | 'none';

/** Serialised form of a single item. Only structural data — never functions. */
export interface SerializedItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  title: string;
  anchorX?: number;
  anchorY?: number;
  anchorW?: number;
  anchorH?: number;
}

/** Versioned, persistable layout payload. */
export interface SerializedLayout {
  version: number;
  items: SerializedItem[];
}
