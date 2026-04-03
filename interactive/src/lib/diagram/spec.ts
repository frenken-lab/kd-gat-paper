import Graph from 'graphology';
import { buildGraph, boxNode, type Topology, type Labels, type EdgeSpec } from './buildGraph.ts';
import { pipeline, bridge, type BridgeSpec } from './compose.ts';
import { hstack, vstack, scaleComposite } from './transforms.ts';

// --- Spec types ---

export interface GraphComponentSpec {
  type: 'graph';
  n: number;
  topology: Topology;
  color?: string;
  labels?: Labels;
  scale?: number;
  directed?: boolean;
  edges?: EdgeSpec[];
  container?: { label: string; color?: string };
}

export interface BoxComponentSpec {
  type: 'box';
  label: string;
  color?: string;
  width?: number;
  height?: number;
}

export interface SpecComponentSpec {
  type: 'spec';
  ref: string;
  scale?: number;
}

export type ComponentSpec = GraphComponentSpec | BoxComponentSpec | SpecComponentSpec;

export interface LayoutNode {
  type: 'hstack' | 'vstack' | 'pipeline';
  children?: (string | LayoutNode)[];
  elements?: (string | LayoutNode)[];
  gap?: number;
  align?: 'left' | 'center' | 'right';
  direction?: 'horizontal' | 'vertical';
  flowColor?: string;
  flowLabels?: (string | undefined)[];
}

export interface FigureSpec {
  figure: string;
  components: Record<string, ComponentSpec>;
  layout: LayoutNode;
  bridges?: BridgeSpec[];
  assertions?: {
    prefixMap?: Record<string, string>;
    checks?: string[];
  };
}

export interface BuildOptions {
  specs?: Record<string, FigureSpec>;
}

export interface SpecResult {
  graph: Graph;
  assertions: string[];
  prefixMap: Record<string, string>;
}

// --- Internals ---

function buildComponent(
  id: string,
  spec: ComponentSpec,
  specsMap?: Record<string, FigureSpec>,
): Graph {
  if (spec.type === 'box') {
    return boxNode({ id, label: spec.label, color: spec.color, width: spec.width, height: spec.height });
  }
  if (spec.type === 'spec') {
    const subSpec = specsMap?.[spec.ref];
    if (!subSpec) throw new Error(`spec: referenced spec '${spec.ref}' not found in specs map`);
    const { graph } = buildFromSpec(subSpec, { specs: specsMap });
    if (spec.scale && spec.scale !== 1) {
      scaleComposite(graph, spec.scale);
    }
    return graph;
  }
  return buildGraph({
    n: spec.n,
    topology: spec.topology,
    color: spec.color,
    prefix: id,
    labels: spec.labels,
    scale: spec.scale,
    directed: spec.directed,
    edges: spec.edges,
    container: spec.container,
  });
}

function walkLayout(
  node: string | LayoutNode,
  components: Map<string, Graph>,
): Graph {
  if (typeof node === 'string') {
    const g = components.get(node);
    if (!g) throw new Error(`spec: component '${node}' not found`);
    return g;
  }

  const childSpecs = node.children ?? node.elements ?? [];
  if (childSpecs.length === 0) {
    throw new Error(`spec: layout node '${node.type}' has no children`);
  }
  const children = childSpecs.map(c => walkLayout(c, components));

  if (node.type === 'pipeline') {
    return pipeline(children, {
      gap: node.gap,
      direction: node.direction,
      flowColor: node.flowColor,
      flowLabels: node.flowLabels,
    });
  }

  const parent = new Graph({ multi: true, type: 'mixed' });
  if (node.type === 'hstack') {
    hstack(parent, children, { gap: node.gap });
  } else {
    vstack(parent, children, { gap: node.gap, align: node.align });
  }
  return parent;
}

// --- Public API ---

/**
 * Build a graphology graph from a declarative figure spec.
 *
 * Translation:
 * 1. Build component map (buildGraph / boxNode per entry)
 * 2. Walk layout tree recursively (hstack / vstack / pipeline)
 * 3. Apply bridges (directed cross-level edges)
 * 4. Return graph + assertions for spatial verification
 */
export function buildFromSpec(spec: FigureSpec, opts?: BuildOptions): SpecResult {
  const specsMap = opts?.specs;
  const components = new Map<string, Graph>();
  for (const [id, compSpec] of Object.entries(spec.components)) {
    components.set(id, buildComponent(id, compSpec, specsMap));
  }

  const graph = walkLayout(spec.layout, components);

  if (spec.bridges) {
    bridge(graph, spec.bridges);
  }

  return {
    graph,
    assertions: spec.assertions?.checks ?? [],
    prefixMap: spec.assertions?.prefixMap ?? {},
  };
}
