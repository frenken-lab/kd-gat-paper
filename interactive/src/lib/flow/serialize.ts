import type { DiagramNode } from './types.ts';
import type { LayoutFile } from './types.ts';

/**
 * Extract a layout file from the current SvelteFlow state.
 * Call with the result of useSvelteFlow().toObject().
 */
export function saveLayout(flowObject: {
  nodes: Array<{ id: string; position: { x: number; y: number }; width?: number; height?: number }>;
  viewport: { x: number; y: number; zoom: number };
}): LayoutFile {
  const nodePositions: LayoutFile['nodes'] = {};

  for (const node of flowObject.nodes) {
    nodePositions[node.id] = {
      x: Math.round(node.position.x * 10) / 10,
      y: Math.round(node.position.y * 10) / 10,
      ...(node.width != null && { width: node.width }),
      ...(node.height != null && { height: node.height }),
    };
  }

  return {
    version: 1,
    viewport: {
      x: Math.round(flowObject.viewport.x * 10) / 10,
      y: Math.round(flowObject.viewport.y * 10) / 10,
      zoom: Math.round(flowObject.viewport.zoom * 100) / 100,
    },
    nodes: nodePositions,
  };
}

/**
 * Apply saved positions from a layout file to SvelteFlow nodes.
 * Nodes not present in the layout file keep their current position.
 * Returns a new array (does not mutate input).
 */
export function loadLayout(
  layout: LayoutFile,
  nodes: DiagramNode[],
): DiagramNode[] {
  return nodes.map((node) => {
    const saved = layout.nodes[node.id];
    if (!saved) return node;

    return {
      ...node,
      position: { x: saved.x, y: saved.y },
      ...(saved.width != null && { width: saved.width }),
      ...(saved.height != null && { height: saved.height }),
    };
  });
}
