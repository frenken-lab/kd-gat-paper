import Graph from 'graphology';
import { boxNode, type BoxNodeOptions } from './buildGraph.ts';
import { hstack, vstack } from './transforms.ts';

/**
 * Resolve the anchor node key for a graph element in a pipeline.
 * Box graph → its single node ID. Graph cluster → first non-container node.
 */
function anchorKey(g: Graph): string {
  for (const key of g.nodes()) {
    const attrs = g.getNodeAttributes(key);
    if (attrs.nodeType !== 'container') return key;
  }
  throw new Error('Cannot resolve anchor: graph has no non-container nodes');
}

// --- Pipeline ---

export interface PipelineOptions {
  gap?: number;
  direction?: 'horizontal' | 'vertical';
  flowColor?: string;
  flowLabels?: string[];
}

/**
 * Lay out elements sequentially and auto-wire directed flow edges between them.
 * This is what distinguishes pipeline from plain hstack/vstack — it always connects the chain.
 * Non-linear edges (KD, skip connections) go through bridge().
 *
 * Anchor resolution: box → its ID, graph cluster → first non-container node.
 */
export function pipeline(elements: Graph[], opts: PipelineOptions = {}): Graph {
  const { gap = 80, direction = 'horizontal', flowColor = 'grey', flowLabels } = opts;
  const parent = new Graph({ multi: true, type: 'mixed' });

  // Resolve anchors before composition (node keys survive import)
  const anchors = elements.map(anchorKey);

  if (direction === 'horizontal') {
    hstack(parent, elements, { gap });
  } else {
    vstack(parent, elements, { gap });
  }

  // Auto-wire directed flow edges between sequential anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    parent.addDirectedEdge(anchors[i], anchors[i + 1], {
      type: 'flow',
      color: flowColor,
      ...(flowLabels?.[i] != null && { label: flowLabels[i] }),
    });
  }

  return parent;
}

// --- Bridge ---

export interface BridgeSpec {
  from: string;
  to: string;
  type?: string;
  color?: string;
  label?: string;
  style?: string;
}

/**
 * Add directed edges between existing nodes in the graph.
 * Use after composition for KD edges, skip connections, cross-row bridges.
 * Throws if a referenced node doesn't exist.
 */
export function bridge(g: Graph, specs: BridgeSpec[]): void {
  for (const spec of specs) {
    if (!g.hasNode(spec.from)) {
      throw new Error(`bridge: node '${spec.from}' not found in graph`);
    }
    if (!g.hasNode(spec.to)) {
      throw new Error(`bridge: node '${spec.to}' not found in graph`);
    }
    g.addDirectedEdge(spec.from, spec.to, {
      type: spec.type ?? 'flow',
      color: spec.color ?? 'grey',
      ...(spec.label != null && { label: spec.label }),
      ...(spec.style != null && { style: spec.style }),
    });
  }
}

// --- Box Sequence ---

/**
 * Convenience: create a row/column of boxes wired as a pipeline.
 * Maps BoxNodeOptions[] through boxNode(), passes to pipeline().
 */
export function boxSequence(boxes: BoxNodeOptions[], opts?: PipelineOptions): Graph {
  return pipeline(boxes.map(boxNode), opts);
}
