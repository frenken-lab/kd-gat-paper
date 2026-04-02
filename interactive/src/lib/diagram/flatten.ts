import type Graph from 'graphology';
import { resolve } from './palette.ts';

// --- Output types ---

export interface FlatNode {
  id: string;
  x: number;
  y: number;
  r?: number;
  fill: string;
  stroke: string;
  label: string;
  group?: string;
  [key: string]: unknown;
}

export interface FlatBox {
  id: string;
  x: number;
  y: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fill: string;
  stroke: string;
  label: string;
  rx: number;
  [key: string]: unknown;
}

export interface FlatEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: string;
  stroke: string;
  color?: string;
  weight?: number;
  label?: string;
  style?: string;
  [key: string]: unknown;
}

export interface FlatContainer {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fill: string;
  stroke: string;
  label: string;
  group: string;
}

export interface Domain {
  x: [number, number];
  y: [number, number];
}

export interface FlatData {
  nodes: FlatNode[];
  boxes: FlatBox[];
  edges: FlatEdge[];
  containers: FlatContainer[];
  domain: Domain;
}

const CONTAINER_PADDING = 30;
const DOMAIN_PADDING = 40;

/**
 * Flatten a graphology graph into arrays ready for SveltePlot marks.
 *
 * This function:
 * - Does NOT mutate the input graph
 * - Returns edges as a single flat array (filter by `type` in your template)
 * - Computes a padded domain from all positioned elements
 * - Resolves colors via palette in one pass
 */
export function flatten(g: Graph, padding = DOMAIN_PADDING): FlatData {
  const nodes: FlatNode[] = [];
  const boxSpecs: Array<{ id: string; group: string; label: string; color: string; attrs: Record<string, unknown> }> = [];
  const containerSpecs: Array<{ id: string; group: string; label: string; color: string }> = [];

  // Group position tracking for group-derived boxes/containers
  const groupPositions = new Map<string, { xs: number[]; ys: number[] }>();

  // --- Pass 1: classify nodes ---
  g.forEachNode((id, attrs) => {
    const nodeType = attrs.nodeType ?? (attrs.isBox ? 'box' : 'node');

    if (nodeType === 'container') {
      containerSpecs.push({ id, group: attrs.group, label: attrs.label ?? '', color: attrs.color });
      return;
    }

    if (nodeType === 'box') {
      boxSpecs.push({ id, group: attrs.group, label: attrs.label ?? '', color: attrs.color, attrs });
      return;
    }

    // Regular node
    const { stroke, fill } = resolve(attrs.color);
    nodes.push({
      ...attrs, id,
      x: attrs.x, y: attrs.y,
      fill, stroke,
      label: attrs.label ?? '',
      group: attrs.group,
      r: attrs.r,
    });

    if (attrs.group) {
      if (!groupPositions.has(attrs.group)) {
        groupPositions.set(attrs.group, { xs: [], ys: [] });
      }
      const pos = groupPositions.get(attrs.group)!;
      pos.xs.push(attrs.x);
      pos.ys.push(attrs.y);
    }
  });

  // --- Pass 2: boxes and containers (no mutation — track box centers locally) ---
  const boxes: FlatBox[] = [];
  const containers: FlatContainer[] = [];
  // Local position map for box centers (used for edge endpoint resolution)
  const boxPositions = new Map<string, { x: number; y: number }>();

  for (const spec of boxSpecs) {
    const { attrs } = spec;
    const positions = groupPositions.get(spec.group);
    const hasExplicit = attrs.x != null && attrs.y != null;

    if (!hasExplicit && (!positions || positions.xs.length === 0)) {
      console.warn(`[flatten] box '${spec.id}' references group '${spec.group}' which has no positioned nodes — skipping`);
      continue;
    }

    let cx: number, cy: number, x1: number, y1: number, x2: number, y2: number;

    if (hasExplicit) {
      cx = attrs.x as number;
      cy = attrs.y as number;
      const hw = (attrs.width as number ?? 90) / 2;
      const hh = (attrs.height as number ?? 32) / 2;
      x1 = cx - hw; y1 = cy - hh; x2 = cx + hw; y2 = cy + hh;
    } else {
      x1 = Math.min(...positions!.xs) - CONTAINER_PADDING;
      y1 = Math.min(...positions!.ys) - CONTAINER_PADDING;
      x2 = Math.max(...positions!.xs) + CONTAINER_PADDING;
      y2 = Math.max(...positions!.ys) + CONTAINER_PADDING;
      cx = (x1 + x2) / 2;
      cy = (y1 + y2) / 2;
    }

    boxPositions.set(spec.id, { x: cx, y: cy });

    const { stroke, fill } = resolve(spec.color);
    boxes.push({
      id: spec.id, x: cx, y: cy,
      x1, y1, x2, y2,
      fill, stroke,
      label: spec.label,
      rx: 6,
    });
  }

  for (const spec of containerSpecs) {
    const positions = groupPositions.get(spec.group);
    if (!positions || positions.xs.length === 0) {
      console.warn(`[flatten] container '${spec.id}' references group '${spec.group}' which has no positioned nodes — skipping`);
      continue;
    }

    const { stroke, fill } = resolve(spec.color);
    containers.push({
      group: spec.group,
      label: spec.label,
      x1: Math.min(...positions.xs) - CONTAINER_PADDING,
      y1: Math.min(...positions.ys) - CONTAINER_PADDING,
      x2: Math.max(...positions.xs) + CONTAINER_PADDING,
      y2: Math.max(...positions.ys) + CONTAINER_PADDING,
      stroke, fill,
    });
  }

  // --- Pass 3: edges (resolve endpoints from nodes, boxes, or raw graph) ---
  const edges: FlatEdge[] = [];

  g.forEachEdge((_edge, attrs, source, target, sourceAttrs, targetAttrs) => {
    // For box nodes, use our locally computed center instead of graph attrs
    const srcPos = boxPositions.get(source) ?? { x: sourceAttrs.x, y: sourceAttrs.y };
    const tgtPos = boxPositions.get(target) ?? { x: targetAttrs.x, y: targetAttrs.y };
    const { stroke } = resolve(attrs.color);

    edges.push({
      ...attrs,
      x1: srcPos.x, y1: srcPos.y,
      x2: tgtPos.x, y2: tgtPos.y,
      type: attrs.type ?? 'structural',
      stroke,
    });
  });

  // --- Domain: padded bounding box of all positioned elements ---
  const allX: number[] = [];
  const allY: number[] = [];
  for (const n of nodes) { allX.push(n.x); allY.push(n.y); }
  for (const b of boxes) { allX.push(b.x1, b.x2); allY.push(b.y1, b.y2); }
  for (const c of containers) { allX.push(c.x1, c.x2); allY.push(c.y1, c.y2); }

  const domain: Domain = allX.length > 0
    ? {
        x: [Math.min(...allX) - padding, Math.max(...allX) + padding],
        y: [Math.min(...allY) - padding, Math.max(...allY) + padding],
      }
    : { x: [0, 100], y: [0, 100] };

  return { nodes, boxes, edges, containers, domain };
}
