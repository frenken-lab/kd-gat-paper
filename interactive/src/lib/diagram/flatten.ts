import type Graph from 'graphology';
import { resolve } from './palette.ts';

// --- Output types ---

export interface FlatNode {
  id: string;
  x: number;
  y: number;
  r?: number;
  color: string;
  fill?: string;
  stroke?: string;
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
  color: string;
  fill?: string;
  stroke?: string;
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
  color: string;
  stroke?: string;
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
  color: string;
  fill?: string;
  stroke?: string;
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
 * Extract spatial layout from a graphology graph into flat arrays.
 *
 * Returns raw role names in the `color` field (e.g., 'gat', 'vgae').
 * `stroke` and `fill` are empty strings — use `decorate()` to resolve them.
 *
 * This function:
 * - Does NOT mutate the input graph
 * - Returns edges as a single flat array (filter by `type` in your template)
 * - Computes a padded domain from all positioned elements
 */
export function extractLayout(g: Graph, padding = DOMAIN_PADDING): FlatData {
  const nodes: FlatNode[] = [];
  const boxSpecs: Array<{ id: string; group: string; label: string; color: string; attrs: Record<string, unknown> }> = [];
  const containerSpecs: Array<{ id: string; group: string; label: string; color: string; explicitBounds?: { x1: number; y1: number; x2: number; y2: number } }> = [];

  // Group position tracking for group-derived boxes/containers
  const groupPositions = new Map<string, { xs: number[]; ys: number[] }>();

  // Anchor nodes deferred until container bounds are known
  const anchorSpecs: Array<{ id: string; group: string; side: string }> = [];

  // --- Pass 1: classify nodes ---
  g.forEachNode((id, attrs) => {
    const nodeType = attrs.nodeType ?? (attrs.isBox ? 'box' : 'node');

    if (nodeType === 'container') {
      containerSpecs.push({ id, group: attrs.group, label: attrs.label ?? '', color: attrs.color ?? '', explicitBounds: attrs.explicitBounds });
      return;
    }

    if (nodeType === 'anchor') {
      anchorSpecs.push({ id, group: attrs.group, side: attrs.anchorSide });
      return;
    }

    if (nodeType === 'box') {
      boxSpecs.push({ id, group: attrs.group, label: attrs.label ?? '', color: attrs.color ?? '', attrs });
      return;
    }

    // Regular node — carry raw color, leave stroke/fill empty
    nodes.push({
      ...attrs, id,
      x: attrs.x, y: attrs.y,
      color: attrs.color ?? '',
      fill: '', stroke: '',
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

    boxes.push({
      id: spec.id, x: cx, y: cy,
      x1, y1, x2, y2,
      color: spec.color,
      fill: '', stroke: '',
      label: spec.label,
      rx: 6,
    });
  }

  for (const spec of containerSpecs) {
    const eb = spec.explicitBounds;
    if (eb) {
      // Layout-level container with pre-computed bounds
      containers.push({
        group: spec.group,
        label: spec.label,
        x1: eb.x1 - CONTAINER_PADDING,
        y1: eb.y1 - CONTAINER_PADDING,
        x2: eb.x2 + CONTAINER_PADDING,
        y2: eb.y2 + CONTAINER_PADDING,
        color: spec.color,
        stroke: '', fill: '',
      });
      continue;
    }

    const positions = groupPositions.get(spec.group);
    if (!positions || positions.xs.length === 0) {
      console.warn(`[flatten] container '${spec.id}' references group '${spec.group}' which has no positioned nodes — skipping`);
      continue;
    }

    containers.push({
      group: spec.group,
      label: spec.label,
      x1: Math.min(...positions.xs) - CONTAINER_PADDING,
      y1: Math.min(...positions.ys) - CONTAINER_PADDING,
      x2: Math.max(...positions.xs) + CONTAINER_PADDING,
      y2: Math.max(...positions.ys) + CONTAINER_PADDING,
      color: spec.color,
      stroke: '', fill: '',
    });
  }

  // --- Pass 2b: position anchor nodes at container boundaries ---
  const anchorPositions = new Map<string, { x: number; y: number }>();

  // Build group → container bounds lookup (from both group-derived and explicit containers)
  const groupBounds = new Map<string, { x1: number; y1: number; x2: number; y2: number }>();
  for (const c of containers) {
    groupBounds.set(c.group, { x1: c.x1, y1: c.y1, x2: c.x2, y2: c.y2 });
  }

  for (const anchor of anchorSpecs) {
    const b = groupBounds.get(anchor.group);
    if (!b) continue;
    const cx = (b.x1 + b.x2) / 2;
    const cy = (b.y1 + b.y2) / 2;
    let pos: { x: number; y: number };
    switch (anchor.side) {
      case 'top':    pos = { x: cx, y: b.y1 }; break;
      case 'bottom': pos = { x: cx, y: b.y2 }; break;
      case 'left':   pos = { x: b.x1, y: cy }; break;
      case 'right':  pos = { x: b.x2, y: cy }; break;
      default:       pos = { x: cx, y: cy };
    }
    anchorPositions.set(anchor.id, pos);
  }

  // --- Pass 3: edges (resolve endpoints from nodes, boxes, anchors, or raw graph) ---
  const edges: FlatEdge[] = [];

  g.forEachEdge((_edge, attrs, source, target, sourceAttrs, targetAttrs) => {
    // Resolve position: anchor > box > raw graph attrs
    const srcPos = anchorPositions.get(source) ?? boxPositions.get(source) ?? { x: sourceAttrs.x, y: sourceAttrs.y };
    const tgtPos = anchorPositions.get(target) ?? boxPositions.get(target) ?? { x: targetAttrs.x, y: targetAttrs.y };

    edges.push({
      ...attrs,
      x1: srcPos.x, y1: srcPos.y,
      x2: tgtPos.x, y2: tgtPos.y,
      type: attrs.type ?? 'structural',
      color: attrs.color ?? '',
      stroke: '',
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

/**
 * Resolve raw color role names in FlatData to {stroke, fill} via the palette.
 *
 * This is the rendering/decoration pass — call after extractLayout() to get
 * visual-ready data. Mutates in place and returns the same reference.
 */
export function decorate(data: FlatData): FlatData {
  for (const node of data.nodes) {
    const { stroke, fill } = resolve(node.color);
    node.stroke = stroke;
    node.fill = fill;
  }
  for (const box of data.boxes) {
    const { stroke, fill } = resolve(box.color);
    box.stroke = stroke;
    box.fill = fill;
  }
  for (const container of data.containers) {
    const { stroke, fill } = resolve(container.color);
    container.stroke = stroke;
    container.fill = fill;
  }
  for (const edge of data.edges) {
    const { stroke } = resolve(edge.color);
    edge.stroke = stroke;
  }
  return data;
}

/**
 * Flatten a graphology graph into arrays ready for SveltePlot marks.
 *
 * Convenience function: calls extractLayout() then decorate().
 *
 * This function:
 * - Does NOT mutate the input graph
 * - Returns edges as a single flat array (filter by `type` in your template)
 * - Computes a padded domain from all positioned elements
 * - Resolves colors via palette in one pass
 */
export function flatten(g: Graph, padding = DOMAIN_PADDING): FlatData {
  return decorate(extractLayout(g, padding));
}
