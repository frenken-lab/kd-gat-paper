import ELK from 'elkjs/lib/elk.bundled.js';

// Minimal ELK wrapper for component-granularity layout. We feed it a flat
// graph (one super-node per spec component, edges between super-nodes) and
// read back: (1) placed positions, (2) per-edge bend points routed around
// obstacles.
//
// We pick `layered + ORTHOGONAL` because FlowEdge uses `getSmoothStepPath`
// (orthogonal-with-rounded-corners); ORTHOGONAL bend points feed that
// aesthetic.

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

export interface ELKGroupIn {
  id: string;
  children: ELKNodeIn[];
  direction?: 'LR' | 'TB';
}

export interface ELKHierarchicalResult {
  // Group bounding boxes in root coordinate space.
  groups: Map<string, { x: number; y: number; width: number; height: number }>;
  // Child node positions relative to their parent group's top-left.
  nodes: Map<string, { x: number; y: number; width: number; height: number }>;
}

const elk = new ELK();

export async function layoutWithELK(
  inNodes: ELKNodeIn[],
  inEdges: ELKEdgeIn[],
  opts: {
    direction?: 'LR' | 'TB';
    nodeSpacing?: number;
    rankSpacing?: number;
  } = {},
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
    children: inNodes.map(n => ({
      id: n.id,
      width: n.width,
      height: n.height,
    })),
    edges: inEdges.map(e => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const result = await elk.layout(graph);

  const nodes = new Map<
    string,
    { x: number; y: number; width: number; height: number }
  >();
  for (const c of result.children ?? []) {
    nodes.set(c.id, {
      x: c.x ?? 0,
      y: c.y ?? 0,
      width: c.width ?? 0,
      height: c.height ?? 0,
    });
  }

  // elkjs types don't expose `sections` on result edges even though ELK
  // always populates it when edgeRouting is ORTHOGONAL.
  type RoutedEdge = {
    id: string;
    sections?: Array<{ bendPoints?: Array<{ x: number; y: number }> }>;
  };

  const bendPoints = new Map<string, Array<{ x: number; y: number }>>();
  for (const e of (result.edges ?? []) as RoutedEdge[]) {
    const section = e.sections?.[0];
    if (!section) continue;
    const bps = section.bendPoints ?? [];
    bendPoints.set(
      e.id,
      bps.map(p => ({ x: p.x, y: p.y })),
    );
  }

  return { nodes, bendPoints };
}

// Compound ELK layout for hierarchical (grouped) diagrams.
// Edges may cross group boundaries; elk.hierarchyHandling=INCLUDE_CHILDREN
// lets ELK route them through the hierarchy.
// Child positions in the result are parent-relative (suitable for SvelteFlow
// parentId nodes directly).
export async function layoutHierarchicalWithELK(
  groups: ELKGroupIn[],
  edges: ELKEdgeIn[],
  opts: {
    direction?: 'LR' | 'RL' | 'TB' | 'BT';
    nodeSpacing?: number;
    rankSpacing?: number;
    groupSpacing?: number;
  } = {},
): Promise<ELKHierarchicalResult> {
  const { direction = 'TB', nodeSpacing = 18, rankSpacing = 28, groupSpacing = 50 } = opts;
  const rootDir = direction === 'LR' ? 'RIGHT' : direction === 'RL' ? 'LEFT' : direction === 'BT' ? 'UP' : 'DOWN';

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': rootDir,
      'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': String(groupSpacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(groupSpacing),
      'elk.padding': '[top=20,left=20,bottom=20,right=20]',
    },
    children: groups.map(g => {
      const gDir = g.direction ? (g.direction === 'LR' ? 'RIGHT' : 'DOWN') : 'RIGHT';
      return {
        id: g.id,
        layoutOptions: {
          'elk.algorithm': 'layered',
          'elk.direction': gDir,
          'elk.spacing.nodeNode': String(nodeSpacing),
          'elk.layered.spacing.nodeNodeBetweenLayers': String(rankSpacing),
          'elk.padding': '[top=24,left=12,bottom=12,right=12]',
        },
        children: g.children.map(n => ({ id: n.id, width: n.width, height: n.height })),
      };
    }),
    edges: edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] })),
  };

  const result = await elk.layout(graph);

  type ELKChild = { id: string; x?: number; y?: number; width?: number; height?: number; children?: ELKChild[] };

  const groupsMap = new Map<string, { x: number; y: number; width: number; height: number }>();
  const nodesMap = new Map<string, { x: number; y: number; width: number; height: number }>();

  for (const g of (result.children ?? []) as ELKChild[]) {
    groupsMap.set(g.id, { x: g.x ?? 0, y: g.y ?? 0, width: g.width ?? 0, height: g.height ?? 0 });
    for (const c of (g.children ?? []) as ELKChild[]) {
      nodesMap.set(c.id, { x: c.x ?? 0, y: c.y ?? 0, width: c.width ?? 0, height: c.height ?? 0 });
    }
  }

  return { groups: groupsMap, nodes: nodesMap };
}
