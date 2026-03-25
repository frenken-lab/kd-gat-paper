import type { DiagramNode, DiagramEdge, Topology, Labels, Position } from './types.ts';

// Built-in position templates (pixels, from YAML specs × 100)
export const SPARSE_5: Position[] = [[186, 125], [185, 25], [94, 67], [38, 160], [129, 217]];
export const FULL_5: Position[] = [[38, 73], [154, 62], [92, 25], [66, 139], [138, 132]];
export const TRI_3: Position[] = [[38, 111], [138, 112], [88, 25]];
export const PAIR_2: Position[] = [[58, 50], [118, 50]];

// Subscript digits for auto labels
const SUB = ['₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];

export interface GraphConfig {
  n: number;
  topology: Topology;
  color: string;
  labels?: Labels;
  positions?: Position[];
  xOffset?: number;
  yOffset?: number;
  prefix: string;
  directed?: boolean;
  group?: string;
  edgeColor?: string;
}

/** Select the default position template for a given node count. */
function defaultPositions(n: number): Position[] {
  if (n === 2) return PAIR_2;
  if (n === 3) return TRI_3;
  if (n === 5) return SPARSE_5;
  // Fallback: horizontal row
  return Array.from({ length: n }, (_, i) => [i * 100, 0] as Position);
}

/** Generate edge index pairs for a given topology and node count. */
function generateEdges(topology: Topology, n: number): [number, number][] {
  if (topology === 'none') return [];
  if (topology === 'full') {
    const edges: [number, number][] = [];
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++)
        edges.push([i, j]);
    return edges;
  }
  // sparse: ring + one chord (0→2)
  if (n <= 3) return generateEdges('full', n);
  const edges: [number, number][] = [];
  for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]);
  edges.push([0, 2]);
  return edges;
}

/** Resolve label array from config. */
function resolveLabels(labels: Labels | undefined, n: number, prefix: string): string[] {
  if (!labels || labels === 'none') return Array.from({ length: n }, () => '');
  if (labels === 'auto') return Array.from({ length: n }, (_, i) => `v${SUB[i]}`);
  return labels;
}

/**
 * Create a single graph instance with positioned nodes and typed edges.
 * All node IDs are `${prefix}_${index}`.
 */
export function createGraph(config: GraphConfig): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const {
    n,
    topology,
    color,
    labels: labelsConfig,
    positions: posConfig,
    xOffset = 0,
    yOffset = 0,
    prefix,
    directed = false,
    group = prefix,
    edgeColor = color,
  } = config;

  const positions = posConfig || defaultPositions(n);
  const labels = resolveLabels(labelsConfig, n, prefix);

  const nodes: DiagramNode[] = positions.slice(0, n).map((pos, i) => ({
    id: `${prefix}_${i}`,
    label: labels[i],
    x: pos[0] + xOffset,
    y: pos[1] + yOffset,
    color,
    group,
  }));

  const edgePairs = generateEdges(topology, n);
  const edgeType = directed ? 'structural' as const : 'structural' as const;
  const edges: DiagramEdge[] = edgePairs.map(([i, j]) => ({
    source: `${prefix}_${i}`,
    target: `${prefix}_${j}`,
    type: edgeType,
    color: edgeColor,
  }));

  return { nodes, edges };
}
