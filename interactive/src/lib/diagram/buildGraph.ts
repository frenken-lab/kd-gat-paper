import Graph from 'graphology';
import { circular } from 'graphology-layout';
import { mergeClique, mergeCycle } from 'graphology-utils';

export type Topology = 'sparse' | 'full' | 'none';
export type Labels = string[] | 'auto' | 'none';

/** Custom edge: [sourceIndex, targetIndex, optional attributes]. */
export type EdgeSpec = [number, number, Record<string, unknown>?];

export interface BuildGraphOptions {
  n: number;
  topology: Topology;
  color?: string;
  prefix: string;
  labels?: Labels;
  directed?: boolean;
  positions?: [number, number][];
  edges?: EdgeSpec[];
  group?: string;
  scale?: number;
  container?: { label: string; color?: string };
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
    n, topology, color = 'grey', prefix,
    labels: labelOpt,
    directed = false,
    positions,
    edges: edgeSpecs,
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
  //    - full:   complete graph, C(n,2) edges
  //    - sparse: cycle + one chord [0→2] for n>3 (n=3 is already complete as a cycle,
  //              n≤2 produces a simple cycle which degenerates to 1 edge or 0 edges)
  //    - none:   no edges
  if (topology === 'full') {
    mergeClique(g, keys);
  } else if (topology === 'sparse') {
    mergeCycle(g, keys);
    if (n > 3) g.mergeEdge(keys[0], keys[2]);
  }

  // 2b. Add custom edges (in addition to or instead of topology)
  if (edgeSpecs) {
    for (const [i, j, attrs] of edgeSpecs) {
      const method = directed ? 'addDirectedEdge' : 'mergeEdge';
      g[method](keys[i], keys[j], { type: 'structural', color, ...attrs });
    }
  }

  // 3. Position nodes
  if (positions) {
    keys.forEach((key, i) => {
      g.mergeNodeAttributes(key, { x: positions[i][0], y: positions[i][1] });
    });
  } else {
    circular.assign(g, { scale });
  }

  // 4. Tag edges with type and color (defaults only — don't overwrite custom attrs)
  g.forEachEdge((edge, attrs) => {
    if (!attrs.type) g.setEdgeAttribute(edge, 'type', 'structural');
    if (!attrs.color) g.setEdgeAttribute(edge, 'color', color);
  });

  // 5. Container node — added AFTER layout so circular doesn't position it
  if (container) {
    g.addNode(`${prefix}__container`, {
      nodeType: 'container',
      group,
      label: container.label,
      color: container.color,
    });
    // Anchor nodes at container boundary edges (positioned during flatten)
    for (const side of ['top', 'bottom', 'left', 'right'] as const) {
      g.addNode(`${prefix}__${side}`, {
        nodeType: 'anchor',
        group,
        anchorSide: side,
      });
    }
  }

  return g;
}

// --- Box node factory ---

export interface BoxNodeOptions {
  id: string;
  label: string;
  color?: string;
  width?: number;
  height?: number;
}

/**
 * Create a Graph containing a single box node at the origin.
 * The box participates in hstack/vstack/pipeline composition like any buildGraph output.
 */
export function boxNode(opts: BoxNodeOptions): Graph {
  const { id, label, color = 'grey', width = 90, height = 32 } = opts;
  const g = new Graph({ multi: true, type: 'mixed' });
  g.addNode(id, {
    nodeType: 'box',
    x: 0,
    y: 0,
    label,
    color,
    width,
    height,
    group: id,
  });
  return g;
}
