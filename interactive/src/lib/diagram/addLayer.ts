import type Graph from 'graphology';
import { rotation } from 'graphology-layout';

export interface AddLayerOptions {
  x?: number;
  y?: number;
  gap?: number;
  scale?: number;
  rotate?: number;  // degrees
}

/**
 * Position one or more child graphs horizontally and import them into a parent graph.
 * Each child is treated as a rigid body — internal node positions are preserved,
 * only translated (and optionally scaled/rotated) as a group.
 *
 * Does NOT namespace keys — children must already have unique keys
 * (via buildGraph prefix or updateGraphKeys).
 */
export function addLayer(
  graph: Graph,
  children: Graph[],
  opts: AddLayerOptions = {},
): void {
  const { x = 0, y = 0, gap = 50, scale, rotate } = opts;
  let cursor = x;

  for (const child of children) {
    // Copy to avoid mutating the original
    const g = child.copy();

    // Optional scale (relative to group center)
    if (scale !== undefined && scale !== 1) {
      let cx = 0, cy = 0, count = 0;
      g.forEachNode((_, a) => {
        if (a.nodeType === 'container' || a.nodeType === 'box') return;
        cx += a.x; cy += a.y; count++;
      });
      cx /= count; cy /= count;
      g.forEachNode((k, a) => {
        if (a.nodeType === 'container' || a.nodeType === 'box') return;
        g.mergeNodeAttributes(k, {
          x: cx + (a.x - cx) * scale,
          y: cy + (a.y - cy) * scale,
        });
      });
    }

    // Optional rotation via graphology-layout
    if (rotate) {
      const positions = rotation(g, rotate, { degrees: true });
      g.forEachNode((k, a) => {
        if (!a.nodeType === 'container' || a.nodeType === 'box' && positions[k]) {
          g.mergeNodeAttributes(k, positions[k]);
        }
      });
    }

    // Compute bounds (excluding container nodes)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    g.forEachNode((_, a) => {
      if (a.nodeType === 'container' || a.nodeType === 'box') return;
      if (a.x < minX) minX = a.x;
      if (a.x > maxX) maxX = a.x;
      if (a.y < minY) minY = a.y;
      if (a.y > maxY) maxY = a.y;
    });

    // Translate group to slot
    const dx = cursor - minX;
    const dy = y - minY;
    g.forEachNode((k, a) => {
      if (a.nodeType === 'container' || a.nodeType === 'box') return;
      g.mergeNodeAttributes(k, { x: a.x + dx, y: a.y + dy });
    });

    // Advance cursor past this group
    cursor = maxX + dx + gap;

    // Import into diagram (nodes, edges, container nodes all come through)
    diagram.import(g);
  }
}
