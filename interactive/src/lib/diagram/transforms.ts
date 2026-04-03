import type Graph from 'graphology';
import { rotation } from 'graphology-layout';

/** Nodes that carry spatial positions (excludes containers and boxes). */
function isPositioned(attrs: Record<string, unknown>): boolean {
  return attrs.nodeType !== 'container' && attrs.nodeType !== 'box' && !attrs.isBox;
}

/** Bounding box of all positioned nodes in the graph. */
export function bounds(g: Graph): { x1: number; y1: number; x2: number; y2: number } {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  g.forEachNode((_, a) => {
    if (!isPositioned(a)) return;
    if (a.x < x1) x1 = a.x;
    if (a.x > x2) x2 = a.x;
    if (a.y < y1) y1 = a.y;
    if (a.y > y2) y2 = a.y;
  });
  return { x1, y1, x2, y2 };
}

/** Translate all nodes with explicit positions by (dx, dy). Mutates in place. */
export function translate(g: Graph, dx: number, dy: number): void {
  g.forEachNode((k, a) => {
    if (a.nodeType === 'container') return;
    if (a.x == null || a.y == null) return;
    g.mergeNodeAttributes(k, { x: a.x + dx, y: a.y + dy });
  });
}

/** Scale all positioned nodes around their centroid. Mutates in place. */
export function scale(g: Graph, factor: number): void {
  if (factor === 1) return;
  let cx = 0, cy = 0, count = 0;
  g.forEachNode((_, a) => {
    if (!isPositioned(a)) return;
    cx += a.x; cy += a.y; count++;
  });
  if (count === 0) return;
  cx /= count; cy /= count;
  g.forEachNode((k, a) => {
    if (!isPositioned(a)) return;
    g.mergeNodeAttributes(k, {
      x: cx + (a.x - cx) * factor,
      y: cy + (a.y - cy) * factor,
    });
  });
}

/**
 * Bounding box of all spatially relevant nodes: positioned nodes + explicit-position boxes.
 * For boxes, incorporates width/height extents (defaults: 90x32).
 * Use instead of `bounds` when composing heterogeneous graphs (node clusters + boxes).
 */
export function compositeBounds(g: Graph): { x1: number; y1: number; x2: number; y2: number } {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  g.forEachNode((_, a) => {
    if (a.nodeType === 'container') return;
    if (a.nodeType === 'box') {
      if (a.x == null || a.y == null) return;
      const hw = ((a.width as number) ?? 90) / 2;
      const hh = ((a.height as number) ?? 32) / 2;
      if (a.x - hw < x1) x1 = a.x - hw;
      if (a.x + hw > x2) x2 = a.x + hw;
      if (a.y - hh < y1) y1 = a.y - hh;
      if (a.y + hh > y2) y2 = a.y + hh;
      return;
    }
    // Regular positioned node
    if (a.x < x1) x1 = a.x;
    if (a.x > x2) x2 = a.x;
    if (a.y < y1) y1 = a.y;
    if (a.y > y2) y2 = a.y;
  });
  return { x1, y1, x2, y2 };
}

/** Rotate all positioned nodes by degrees. Mutates in place. */
export function rotate(g: Graph, degrees: number): void {
  if (!degrees) return;
  const positions = rotation(g, degrees, { degrees: true });
  g.forEachNode((k, a) => {
    if (isPositioned(a) && positions[k]) {
      g.mergeNodeAttributes(k, positions[k]);
    }
  });
}

/**
 * Lay out child graphs horizontally with a gap, importing each into the parent.
 * Copies children to avoid mutation. A convenience for the common pattern:
 *
 *   let cursor = x;
 *   for (const child of children) {
 *     const c = child.copy();
 *     const b = bounds(c);
 *     translate(c, cursor - b.x1, y - b.y1);
 *     cursor = b.x2 + (cursor - b.x1) + gap;
 *     parent.import(c);
 *   }
 */
export function hstack(
  parent: Graph,
  children: Graph[],
  opts: { x?: number; y?: number; gap?: number } = {},
): void {
  const { x = 0, y = 0, gap = 50 } = opts;
  let cursor = x;
  for (const child of children) {
    const c = child.copy();
    const b = compositeBounds(c);
    translate(c, cursor - b.x1, y - b.y1);
    cursor = b.x2 + (cursor - b.x1) + gap;
    parent.import(c);
  }
}

/**
 * Lay out child graphs vertically with a gap, importing each into the parent.
 * Copies children to avoid mutation. Mirror of hstack but top-to-bottom.
 */
export function vstack(
  parent: Graph,
  children: Graph[],
  opts: { x?: number; y?: number; gap?: number; align?: 'left' | 'center' | 'right' } = {},
): void {
  const { x = 0, y = 0, gap = 50, align = 'left' } = opts;
  let cursor = y;
  for (const child of children) {
    const c = child.copy();
    const b = compositeBounds(c);
    let dx: number;
    if (align === 'center') {
      dx = x - (b.x1 + b.x2) / 2;
    } else if (align === 'right') {
      dx = x - b.x2;
    } else {
      dx = x - b.x1;
    }
    translate(c, dx, cursor - b.y1);
    cursor = b.y2 + (cursor - b.y1) + gap;
    parent.import(c);
  }
}
