import type Graph from 'graphology';
import { resolve } from './palette.ts';

// --- Output types ---

export interface UnpackedNode {
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

export interface UnpackedBox {
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

export interface UnpackedEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  color?: string;
  weight?: number;
  label?: string;
  style?: string;
  [key: string]: unknown;
}

export interface UnpackedContainer {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fill: string;
  stroke: string;
  label: string;
  group: string;
}

type EdgeType = 'structural' | 'flow' | 'kd' | 'encoded' | 'annotation';

export interface UnpackedData {
  nodes: UnpackedNode[];
  boxes: UnpackedBox[];
  edges: {
    structural: UnpackedEdge[];
    flow: UnpackedEdge[];
    kd: UnpackedEdge[];
    encoded: UnpackedEdge[];
    annotation: UnpackedEdge[];
  };
  containers: UnpackedContainer[];
}

const CONTAINER_PADDING = 30;

/**
 * Unpack a graphology graph into flat arrays ready for SveltePlot marks.
 *
 * Three-pass ordering:
 *   1. Collect nodes, compute group bounding boxes for containers/boxes
 *   2. Assign box positions (center of group bounds) back into the graph
 *   3. Process edges (all endpoints now have resolved coordinates)
 *
 * Node attribute conventions:
 *   nodeType: 'node' (default) | 'container' | 'box'
 *   All: { color, label, group }
 *   Nodes: { x, y, r? }
 *   Edges: { type, color?, weight?, label?, style? }
 */
export function unpack(g: Graph): UnpackedData {
  // --- Pass 1: collect nodes by type, build group position map ---
  const nodes: UnpackedNode[] = [];
  const containerSpecs: Array<{ id: string; group: string; label: string; color: string }> = [];
  const boxSpecs: Array<{ id: string; group: string; label: string; color: string }> = [];

  const groupPositions = new Map<string, { xs: number[]; ys: number[] }>();

  g.forEachNode((id, attrs) => {
    const nodeType = attrs.nodeType ?? 'node';

    if (nodeType === 'container') {
      containerSpecs.push({ id, group: attrs.group, label: attrs.label, color: attrs.color });
      return;
    }

    if (nodeType === 'box') {
      boxSpecs.push({ id, group: attrs.group, label: attrs.label, color: attrs.color });
      return;
    }

    // Regular node — collect position for group bounds
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

  // --- Pass 2: compute bounds, assign box positions, build containers ---
  const boxes: UnpackedBox[] = [];
  const containers: UnpackedContainer[] = [];

  for (const spec of boxSpecs) {
    const positions = groupPositions.get(spec.group);
    if (!positions || positions.xs.length === 0) continue;

    const x1 = Math.min(...positions.xs) - CONTAINER_PADDING;
    const y1 = Math.min(...positions.ys) - CONTAINER_PADDING;
    const x2 = Math.max(...positions.xs) + CONTAINER_PADDING;
    const y2 = Math.max(...positions.ys) + CONTAINER_PADDING;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    // Write position back into the graph so edges can resolve to this node
    g.mergeNodeAttributes(spec.id, { x: cx, y: cy });

    const { stroke, fill } = resolve(spec.color);
    boxes.push({
      id: spec.id, x: cx, y: cy,
      x1, y1, x2, y2,
      fill, stroke,
      label: spec.label ?? '',
      rx: 6,
    });
  }

  for (const spec of containerSpecs) {
    const positions = groupPositions.get(spec.group);
    if (!positions || positions.xs.length === 0) continue;

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

  // --- Pass 3: edges (all endpoints now have x/y, including boxes) ---
  const edgeBuckets: UnpackedData['edges'] = {
    structural: [], flow: [], kd: [], encoded: [], annotation: [],
  };

  g.forEachEdge((_edge, attrs, _source, _target, sourceAttrs, targetAttrs) => {
    const edgeType: EdgeType = attrs.type ?? 'structural';
    const { stroke } = resolve(attrs.color);

    const entry: UnpackedEdge = {
      ...attrs,
      x1: sourceAttrs.x, y1: sourceAttrs.y,
      x2: targetAttrs.x, y2: targetAttrs.y,
      stroke,
    };

    if (edgeType in edgeBuckets) {
      edgeBuckets[edgeType].push(entry);
    }
  });

  return { nodes, boxes, edges: edgeBuckets, containers };
}
