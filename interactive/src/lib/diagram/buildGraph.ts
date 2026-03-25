import Graph from 'graphology';
import { circular } from 'graphology-layout';
import { mergeClique, mergeCycle } from 'graphology-utils';

export type Topology = 'sparse' | 'full' | 'none';
export type Labels = string[] | 'auto' | 'none';

export interface BuildGraphOptions {
  n: number;
  topology: Topology;
  color: string;
  prefix: string;
  labels?: Labels;
  directed?: boolean;
  positions?: [number, number][];
  group?: string;
  scale?: number;
  container?: { label: string; color: string };
}

const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';

function resolveLabels(labels: Labels | undefined, n: number): string[] {
  if (!labels || labels === 'none') return Array(n).fill('');
  if (labels === 'auto') return Array.from({ length: n }, (_, i) => `v${SUBSCRIPTS[i]}`);
  return labels;
}

/**
 * Build a graph cluster: n positioned nodes with a topology and optional container.
 * Returns a standalone graphology Graph ready for composition via addLayer/import.
 */
export function buildGraph(opts: BuildGraphOptions): Graph {
  const {
    n, topology, color, prefix,
    labels: labelOpt,
    directed = false,
    positions,
    group = prefix,
    scale = 80,
    container,
  } = opts;

  const g = new Graph({ type: directed ? 'directed' : 'undirected' });
  const labels = resolveLabels(labelOpt, n);
  const keys: string[] = [];

  // 1. Add nodes (positions assigned in step 3)
  for (let i = 0; i < n; i++) {
    const key = `${prefix}_${i}`;
    keys.push(key);
    g.addNode(key, { nodeType: 'node', color, label: labels[i], group });
  }

  // 2. Add topology edges via graphology-utils
  if (topology === 'full') {
    mergeClique(g, keys);
  } else if (topology === 'sparse') {
    mergeCycle(g, keys);
    if (n > 3) g.mergeEdge(keys[0], keys[2]);
  }
  // 'none': no edges

  // 3. Position nodes
  if (positions) {
    keys.forEach((key, i) => {
      g.mergeNodeAttributes(key, { x: positions[i][0], y: positions[i][1] });
    });
  } else {
    circular.assign(g, { scale });
  }

  // 4. Tag edges with type and color
  g.forEachEdge((edge) => {
    g.mergeEdgeAttributes(edge, { type: 'structural', color });
  });

  // 5. Container node — added AFTER layout so circular doesn't position it
  if (container) {
    g.addNode(`${prefix}__container`, {
      nodeType: 'container',
      group,
      label: container.label,
      color: container.color,
    });
  }

  return g;
}
