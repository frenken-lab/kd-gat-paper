import ELK from 'elkjs/lib/elk.bundled.js';

// Minimal ELK wrapper for component-granularity layout. We feed it a flat
// graph (one super-node per spec component, edges between super-nodes) and
// read back: (1) placed positions, (2) per-edge bend points. The latter is
// the actual win over dagre — ELK routes around obstacles instead of just
// placing endpoints.
//
// We pick `layered + ORTHOGONAL` because the existing FlowEdge/KDEdge use
// `getSmoothStepPath` (orthogonal-with-rounded-corners). Orthogonal bend
// points feed the same aesthetic with the obstacle-avoidance dagre lacked.

export interface ELKNodeIn {
  id: string;
  width: number;
  height: number;
}

export interface ELKEdgeIn {
  id: string;
  source: string;
  target: string;
}

export interface ELKLayoutResult {
  nodes: Map<string, { x: number; y: number; width: number; height: number }>;
  // Bend points per edge id. Excludes start/end (those are on super-node
  // boundaries which we don't use — floating-edge geom recomputes endpoints
  // on the real leaf nodes).
  bendPoints: Map<string, Array<{ x: number; y: number }>>;
}

const elk = new ELK();

export async function layoutWithELK(
  inNodes: ELKNodeIn[],
  inEdges: ELKEdgeIn[],
  opts: { direction?: 'LR' | 'TB'; nodeSpacing?: number; rankSpacing?: number } = {},
): Promise<ELKLayoutResult> {
  const { direction = 'LR', nodeSpacing = 60, rankSpacing = 90 } = opts;

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': String(nodeSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(rankSpacing),
      'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.padding': '[top=20,left=20,bottom=20,right=20]',
    },
    children: inNodes.map((n) => ({ id: n.id, width: n.width, height: n.height })),
    edges: inEdges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };

  const result = await elk.layout(graph);

  const nodes = new Map<string, { x: number; y: number; width: number; height: number }>();
  for (const c of result.children ?? []) {
    nodes.set(c.id, {
      x: c.x ?? 0,
      y: c.y ?? 0,
      width: c.width ?? 0,
      height: c.height ?? 0,
    });
  }

  const bendPoints = new Map<string, Array<{ x: number; y: number }>>();
  for (const e of result.edges ?? []) {
    const section = e.sections?.[0];
    if (!section) continue;
    const bps = section.bendPoints ?? [];
    bendPoints.set(e.id, bps.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y })));
  }

  return { nodes, bendPoints };
}
