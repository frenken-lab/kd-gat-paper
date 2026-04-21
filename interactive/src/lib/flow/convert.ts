import { Position } from '@xyflow/svelte';
import type { DiagramNode, DiagramEdge } from './types.ts';
import { autoLayout, circularPositions } from './layout.ts';

// --- Spec types (mirrored from diagram/spec.ts to avoid import dependency) ---

interface GraphComponentSpec {
  type: 'graph';
  n: number;
  topology: 'sparse' | 'full' | 'none';
  color?: string;
  labels?: string[] | 'auto' | 'none';
  scale?: number;
  container?: { label: string; color?: string };
}

interface BoxComponentSpec {
  type: 'box';
  label: string;
  color?: string;
  width?: number;
  height?: number;
}

interface SpecComponentSpec {
  type: 'spec';
  ref: string;
  scale?: number;
}

type ComponentSpec = GraphComponentSpec | BoxComponentSpec | SpecComponentSpec;

interface LayoutNode {
  type: 'hstack' | 'vstack' | 'pipeline';
  children?: (string | LayoutNode)[];
  elements?: (string | LayoutNode)[];
  gap?: number;
  align?: 'left' | 'center' | 'right';
  direction?: 'horizontal' | 'vertical';
  flowColor?: string;
  container?: { label: string; color?: string };
}

interface BridgeSpec {
  from: string;
  to: string;
  type?: string;
  color?: string;
  label?: string;
  style?: string;
}

interface FigureSpec {
  figure: string;
  components: Record<string, ComponentSpec>;
  layout: LayoutNode;
  bridges?: BridgeSpec[];
}

// --- specToFlow ---

const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';

function resolveLabels(
  labels: string[] | 'auto' | 'none' | undefined,
  n: number,
): string[] {
  if (!labels || labels === 'none') return Array(n).fill('');
  if (labels === 'auto')
    return Array.from({ length: n }, (_, i) => `v${SUBSCRIPTS[i] ?? i + 1}`);
  return labels;
}

/**
 * Convert a YAML figure spec directly to SvelteFlow nodes and edges.
 * Replaces the entire buildFromSpec() + flatten() pipeline.
 *
 * 1. Walks `components` to create nodes (circles for graphs, boxes for boxes)
 * 2. Creates structural edges from graph topologies
 * 3. Walks `layout` to establish dagre edge hints for ordering
 * 4. Creates bridge edges (flow, kd, etc.)
 * 5. Runs dagre auto-layout for positioning
 */
export function specToFlow(
  spec: FigureSpec,
  opts?: { direction?: 'LR' | 'TB'; specs?: Record<string, FigureSpec> },
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const direction = opts?.direction ?? 'LR';
  const specsMap = opts?.specs;

  // Track which node IDs belong to each component (for anchor resolution)
  const componentNodes = new Map<string, string[]>();
  // Edge counter to ensure unique IDs
  let edgeIdx = 0;

  // --- Step 1: Build nodes from components ---
  for (const [id, comp] of Object.entries(spec.components)) {
    if (comp.type === 'box') {
      nodes.push({
        id,
        type: 'box',
        position: { x: 0, y: 0 },
        data: {
          label: comp.label,
          color: comp.color ?? 'grey',
          width: comp.width ?? 90,
          height: comp.height ?? 32,
        },
        sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
        targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      });
      componentNodes.set(id, [id]);
    } else if (comp.type === 'graph') {
      const labels = resolveLabels(comp.labels, comp.n);
      const radius = (comp.scale ?? 80) / 2;
      const positions = circularPositions(comp.n, 0, 0, radius);
      const nodeIds: string[] = [];

      for (let i = 0; i < comp.n; i++) {
        const nodeId = `${id}_${i}`;
        nodeIds.push(nodeId);
        nodes.push({
          id: nodeId,
          type: 'circle',
          position: { x: positions[i].x, y: positions[i].y },
          data: {
            label: labels[i],
            color: comp.color ?? 'grey',
            r: radius < 30 ? 10 : 14,
          },
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        });
      }

      // Structural edges from topology
      if (comp.topology === 'full') {
        for (let i = 0; i < comp.n; i++) {
          for (let j = i + 1; j < comp.n; j++) {
            edges.push({
              id: `e${edgeIdx++}`,
              source: nodeIds[i],
              target: nodeIds[j],
              type: 'structural',
              data: { color: comp.color ?? 'grey' },
            });
          }
        }
      } else if (comp.topology === 'sparse') {
        // Cycle
        for (let i = 0; i < comp.n; i++) {
          edges.push({
            id: `e${edgeIdx++}`,
            source: nodeIds[i],
            target: nodeIds[(i + 1) % comp.n],
            type: 'structural',
            data: { color: comp.color ?? 'grey' },
          });
        }
        // Chord for n > 3
        if (comp.n > 3) {
          edges.push({
            id: `e${edgeIdx++}`,
            source: nodeIds[0],
            target: nodeIds[2],
            type: 'structural',
            data: { color: comp.color ?? 'grey' },
          });
        }
      }

      componentNodes.set(id, nodeIds);

      // Container node for graph clusters
      if (comp.container) {
        const containerId = `${id}__container`;
        nodes.push({
          id: containerId,
          type: 'container',
          position: { x: 0, y: 0 },
          data: {
            label: comp.container.label,
            color: comp.container.color ?? comp.color ?? 'grey',
          },
          width: radius * 2 + 80,
          height: radius * 2 + 60,
          style: 'z-index: -1;',
        });
        // Set children's parentId to the container
        for (const nodeId of nodeIds) {
          const node = nodes.find((n) => n.id === nodeId);
          if (node) node.parentId = containerId;
        }
      }
    } else if (comp.type === 'spec') {
      // Recursively build sub-spec, prefix all IDs with component id
      const subSpec = specsMap?.[comp.ref];
      if (!subSpec) throw new Error(`specToFlow: referenced spec '${comp.ref}' not found`);

      const { nodes: subNodes, edges: subEdges } = specToFlow(subSpec, { direction, specs: specsMap });

      // Prefix all sub-spec node/edge IDs and remap edge source/target
      const subNodeIds: string[] = [];
      const scaleFactor = comp.scale ?? 1;

      for (const subNode of subNodes) {
        const prefixedId = `${id}.${subNode.id}`;
        subNodeIds.push(prefixedId);

        const scaled = { ...subNode, id: prefixedId };
        // Scale dimensions for circle and box nodes
        if (scaled.type === 'circle' && scaled.data && scaleFactor !== 1) {
          const r = ((scaled.data as any).r ?? 14) * scaleFactor;
          scaled.data = { ...scaled.data, r: Math.max(6, r) };
        }
        if (scaled.type === 'box' && scaled.data && scaleFactor !== 1) {
          scaled.data = {
            ...scaled.data,
            width: ((scaled.data as any).width ?? 90) * scaleFactor,
            height: ((scaled.data as any).height ?? 32) * scaleFactor,
          };
        }
        // Remap parentId
        if (scaled.parentId) {
          scaled.parentId = `${id}.${scaled.parentId}`;
        }
        nodes.push(scaled);
      }

      for (const subEdge of subEdges) {
        edges.push({
          ...subEdge,
          id: `${id}.${subEdge.id}`,
          source: `${id}.${subEdge.source}`,
          target: `${id}.${subEdge.target}`,
        });
      }

      componentNodes.set(id, subNodeIds);
    }
  }

  // --- Step 2: Resolve anchor references ---
  // Handles: direct IDs, "compId__side" anchors, component names, and
  // dotted sub-spec refs like "vgae_t.input_0" or "vgae_t.enc1__bottom"
  const nodeIdSet = new Set(nodes.map((n) => n.id));

  function resolveRef(ref: string): string | null {
    // Direct node reference (includes dotted sub-spec IDs like "vgae_t.input_0")
    if (nodeIdSet.has(ref)) return ref;

    // Anchor reference: "compId__side" or "prefix.compId__side"
    const anchorMatch = ref.match(/^(.+)__(?:top|bottom|left|right)$/);
    if (anchorMatch) {
      const compId = anchorMatch[1];
      // Try direct component lookup
      const compNodeIds = componentNodes.get(compId);
      if (compNodeIds?.length) {
        // Find first non-container node
        const real = compNodeIds.find((id) => nodeIdSet.has(id) && !id.endsWith('__container'));
        if (real) return real;
        return compNodeIds[0];
      }
    }

    // Component reference without index (e.g., "gat_t" for a box)
    const compNodeIds = componentNodes.get(ref);
    if (compNodeIds?.length) {
      const real = compNodeIds.find((id) => nodeIdSet.has(id) && !id.endsWith('__container'));
      if (real) return real;
      return compNodeIds[0];
    }

    return null;
  }

  // --- Step 3: Pipeline flow edges from layout ---
  function walkLayout(node: string | LayoutNode): string[] {
    if (typeof node === 'string') {
      const ids = componentNodes.get(node);
      return ids ?? [];
    }

    const childSpecs = node.children ?? node.elements ?? [];
    const allIds: string[] = [];

    if (node.type === 'pipeline') {
      // Pipeline auto-wires sequential flow edges
      const childAnchors: string[] = [];
      for (const child of childSpecs) {
        const ids = walkLayout(child);
        allIds.push(...ids);
        if (ids.length > 0) childAnchors.push(ids[0]);
      }
      // Wire flow edges between sequential elements
      for (let i = 0; i < childAnchors.length - 1; i++) {
        edges.push({
          id: `e${edgeIdx++}`,
          source: childAnchors[i],
          target: childAnchors[i + 1],
          type: 'flow',
          data: { color: node.flowColor ?? 'grey' },
        });
      }
    } else {
      // hstack / vstack — just collect children, no auto-wiring
      for (const child of childSpecs) {
        allIds.push(...walkLayout(child));
      }
    }

    // Layout-level container
    if (node.container) {
      const containerId = `__layout_container_${edgeIdx++}`;
      nodes.push({
        id: containerId,
        type: 'container',
        position: { x: 0, y: 0 },
        data: {
          label: node.container.label,
          color: node.container.color ?? 'grey',
        },
        width: 300,
        height: 200,
        style: 'z-index: -1;',
      });
    }

    return allIds;
  }

  walkLayout(spec.layout);

  // --- Step 4: Bridge edges ---
  if (spec.bridges) {
    for (const b of spec.bridges) {
      const source = resolveRef(b.from);
      const target = resolveRef(b.to);
      if (!source || !target) {
        console.warn(`[specToFlow] bridge: cannot resolve ${b.from} -> ${b.to}`);
        continue;
      }

      edges.push({
        id: `e${edgeIdx++}`,
        source,
        target,
        type: b.type ?? 'flow',
        data: {
          color: b.color ?? 'grey',
          label: b.label,
          dashed: b.style === 'dashed',
        },
      });
    }
  }

  // --- Step 5: Auto-layout with dagre ---
  // Filter out container nodes for layout (they don't participate in dagre)
  const layoutNodes = nodes.filter((n) => n.type !== 'container');
  const laidOut = autoLayout(layoutNodes, edges, { direction });

  // Merge positions back
  const posMap = new Map(laidOut.map((n) => [n.id, n]));
  const finalNodes = nodes.map((n) => {
    const laid = posMap.get(n.id);
    return laid ?? n;
  });

  return { nodes: finalNodes, edges };
}

