import type { DiagramEdge, DiagramBox, DiagramContainer, ModelOutput } from './types.ts';
import { createGraph, SPARSE_5, TRI_3 } from './graph.ts';

export interface GatConfig {
  layers?: number;
  nodesPerLayer?: number;
  xOffset?: number;
  yOffset?: number;
  prefix?: string;
  label?: string | null;
  yGap?: number;
}

/**
 * Create a multi-layer GAT classifier diagram.
 * Generates N sparse-graph layers stacked vertically, plus JK Concat and FC boxes.
 *
 * Wiring (from gat.yaml / kd-gat.yaml):
 *   - Inter-layer flow: rightmost node of layer i → leftmost of layer i+1
 *   - Layer outputs → JK box (dashed)
 *   - JK → FC (solid)
 */
export function createGat(config: GatConfig = {}): ModelOutput {
  const {
    layers = 3,
    nodesPerLayer = 5,
    xOffset = 0,
    yOffset = 0,
    prefix = '',
    label = 'GAT Model',
    yGap = 300,
  } = config;

  const positions = nodesPerLayer >= 5 ? SPARSE_5 : TRI_3;
  const n = nodesPerLayer;
  const p = prefix ? `${prefix}_` : '';

  // --- Graph layers ---
  const allNodes = [];
  const allEdges: DiagramEdge[] = [];

  // Track rightmost/leftmost/bottom node indices per layer for wiring
  // SPARSE_5: rightmost=0 (x=186), leftmost=3 (x=38), bottom=4 (y=217)
  // TRI_3:    rightmost=1 (x=138), leftmost=0 (x=38), bottom=0 or 1 (y=111/112)
  const rightIdx = nodesPerLayer >= 5 ? 0 : 1;
  const leftIdx = nodesPerLayer >= 5 ? 3 : 0;
  const bottomIdx = nodesPerLayer >= 5 ? 4 : 2; // highest y = bottom visually

  for (let i = 0; i < layers; i++) {
    const layerPrefix = `${p}L${i}`;
    const { nodes, edges } = createGraph({
      n,
      topology: 'sparse',
      color: 'gat',
      labels: 'auto',
      positions,
      xOffset,
      yOffset: yOffset + i * yGap,
      prefix: layerPrefix,
      directed: true,
      group: `${p}gat`,
    });
    allNodes.push(...nodes);
    allEdges.push(...edges);

    // Inter-layer flow edge: rightmost of this layer → leftmost of next
    if (i < layers - 1) {
      const nextPrefix = `${p}L${i + 1}`;
      allEdges.push({
        source: `${layerPrefix}_${rightIdx}`,
        target: `${nextPrefix}_${leftIdx}`,
        type: 'flow',
        color: 'gat',
      });
    }
  }

  // --- Boxes: JK Concat + FC → class ---
  // Position below the last layer
  const lastLayerY = yOffset + (layers - 1) * yGap;
  const centerX = xOffset + 110; // approximate center of graph area

  const boxes: DiagramBox[] = [
    {
      id: `${p}jk`,
      label: 'JK Concat',
      x: centerX,
      y: lastLayerY + yGap * 0.7,
      color: 'gat',
    },
    {
      id: `${p}fc`,
      label: 'FC \u2192 class',
      x: centerX,
      y: lastLayerY + yGap * 1.05,
      color: 'gat',
    },
  ];

  // --- Layer → JK edges (dashed flow from bottom node of each layer) ---
  for (let i = 0; i < layers; i++) {
    allEdges.push({
      source: `${p}L${i}_${bottomIdx}`,
      target: `${p}jk`,
      type: 'flow',
      color: 'gat',
    });
  }

  // --- JK → FC edge (solid flow) ---
  allEdges.push({
    source: `${p}jk`,
    target: `${p}fc`,
    type: 'flow',
    color: 'gat',
  });

  // --- Container ---
  const containers: DiagramContainer[] = label
    ? [{ group: `${p}gat`, label, color: 'gat' }]
    : [];

  return {
    nodes: allNodes,
    edges: allEdges,
    boxes,
    containers,
    kdId: `${p}fc`,
  };
}
