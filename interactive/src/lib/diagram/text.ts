/**
 * Text positioning utilities for SveltePlot <Text> marks.
 *
 * Each function returns a plain object suitable for spreading onto a <Text> mark,
 * or for use as accessor functions on data arrays. Two forms:
 *
 * 1. **Data accessor** (default) — returns an object with accessor functions (x, y)
 *    that can be spread directly onto a <Text> mark rendering an array of items:
 *      <Text data={containers} {...labelAbove} />
 *
 * 2. **Single-item** — call with a specific element to get concrete {x, y} values:
 *      const pos = labelAboveOf(container);
 */

// --- Types ---

/** Position object returned by single-item helpers. */
export interface TextPosition {
  x: number;
  y: number;
  textAnchor: string;
  dy: number;
}

/** Accessor object for spreading onto SveltePlot <Text> marks rendering arrays. */
export interface TextAccessors {
  x: ((d: Record<string, unknown>) => number) | string;
  y: ((d: Record<string, unknown>) => number) | string;
  textAnchor: string;
  dy: number;
}

// --- Bounded elements (have x1, y1, x2, y2) ---

interface Bounded {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// --- Edge-like elements (have x1, y1, x2, y2 as endpoints) ---

interface EdgeLike {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// --- Centered elements (have x, y) ---

interface Centered {
  x: number;
  y: number;
}

// === Data accessor forms (for <Text data={array} {...accessor} />) ===

/**
 * Label above a bounded element (container, box).
 * Centered horizontally at the top edge, offset upward by `dy` (default -8).
 */
export const labelAbove: TextAccessors = {
  x: (d: Record<string, unknown>) => ((d.x1 as number) + (d.x2 as number)) / 2,
  y: 'y1',
  textAnchor: 'middle',
  dy: -8,
};

/**
 * Label centered inside a bounded element (box).
 * Uses the midpoint of the bounding box.
 */
export const labelBoxCenter: TextAccessors = {
  x: (d: Record<string, unknown>) => ((d.x1 as number) + (d.x2 as number)) / 2,
  y: (d: Record<string, unknown>) => ((d.y1 as number) + (d.y2 as number)) / 2,
  textAnchor: 'middle',
  dy: 1,
};

/**
 * Label centered on a positioned element (node, explicit-position box).
 * Uses the element's x, y coordinates.
 */
export const labelCenter: TextAccessors = {
  x: 'x',
  y: 'y',
  textAnchor: 'middle',
  dy: 1,
};

/**
 * Label at the midpoint of an edge, offset above by `dy` (default -8).
 */
export const labelEdgeMid: TextAccessors = {
  x: (d: Record<string, unknown>) => ((d.x1 as number) + (d.x2 as number)) / 2,
  y: (d: Record<string, unknown>) => ((d.y1 as number) + (d.y2 as number)) / 2,
  textAnchor: 'middle',
  dy: -8,
};

// === Single-item forms (for computing concrete positions) ===

/** Label above a single bounded element. */
export function labelAboveOf(el: Bounded, dy = -8): TextPosition {
  return {
    x: (el.x1 + el.x2) / 2,
    y: el.y1,
    textAnchor: 'middle',
    dy,
  };
}

/** Label centered inside a single bounded element (box). */
export function labelBoxCenterOf(el: Bounded, dy = 1): TextPosition {
  return {
    x: (el.x1 + el.x2) / 2,
    y: (el.y1 + el.y2) / 2,
    textAnchor: 'middle',
    dy,
  };
}

/** Label centered on a single positioned element (node). */
export function labelCenterOf(el: Centered, dy = 1): TextPosition {
  return {
    x: el.x,
    y: el.y,
    textAnchor: 'middle',
    dy,
  };
}

/** Label at the midpoint of a single edge. */
export function labelEdgeMidOf(
  edge: EdgeLike,
  offset: { dx?: number; dy?: number } = {},
): TextPosition {
  const { dx = 0, dy = -8 } = offset;
  return {
    x: (edge.x1 + edge.x2) / 2 + dx,
    y: (edge.y1 + edge.y2) / 2,
    textAnchor: 'middle',
    dy,
  };
}
