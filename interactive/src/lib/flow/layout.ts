import dagre from '@dagrejs/dagre';
import { Position } from '@xyflow/svelte';
import type { DiagramNode, DiagramEdge } from './types.ts';

export interface LayoutOptions {
  direction?: 'LR' | 'TB';
  nodeSpacing?: number;
  rankSpacing?: number;
}

/**
 * Auto-layout SvelteFlow nodes using dagre.
 *
 * Returns a new array of nodes with updated positions.
 * Does not mutate the input arrays.
 */
export function autoLayout(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  opts: LayoutOptions = {},
): DiagramNode[] {
  const { direction = 'LR', nodeSpacing = 50, rankSpacing = 80 } = opts;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSpacing,
    ranksep: rankSpacing,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to dagre graph
  for (const node of nodes) {
    const w = getNodeWidth(node);
    const h = getNodeHeight(node);
    g.setNode(node.id, { width: w, height: h });
  }

  // Add edges to dagre graph
  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Map dagre positions back to SvelteFlow nodes
  const isHorizontal = direction === 'LR';

  return nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) return node;

    const w = getNodeWidth(node);
    const h = getNodeHeight(node);

    return {
      ...node,
      // Dagre returns center positions; SvelteFlow uses top-left
      position: {
        x: dagreNode.x - w / 2,
        y: dagreNode.y - h / 2,
      },
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
    };
  });
}

/** Estimate node width for dagre. */
function getNodeWidth(node: DiagramNode): number {
  if (node.type === 'circle') {
    const r = (node.data as { r?: number }).r ?? 14;
    return r * 2;
  }
  if (node.type === 'box') {
    return (node.data as { width?: number }).width ?? 90;
  }
  if (node.type === 'container') {
    return node.width ?? 200;
  }
  return 50;
}

/** Estimate node height for dagre. */
function getNodeHeight(node: DiagramNode): number {
  if (node.type === 'circle') {
    const r = (node.data as { r?: number }).r ?? 14;
    return r * 2;
  }
  if (node.type === 'box') {
    return (node.data as { height?: number }).height ?? 32;
  }
  if (node.type === 'container') {
    return node.height ?? 150;
  }
  return 50;
}

/**
 * Generate circular positions for n nodes around a center point.
 * Replaces graphology-layout/circular for graph clusters.
 */
export function circularPositions(
  n: number,
  cx = 0,
  cy = 0,
  radius = 40,
): Array<{ x: number; y: number }> {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + radius * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + radius * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}
