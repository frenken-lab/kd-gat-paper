import { Position } from '@xyflow/svelte';
import type { DiagramNode, DiagramEdge } from './types.ts';
import { circularPositions } from './layout.ts';
import { layoutWithELK } from './elk.ts';

// Local node-size helpers — match the ones in layout.ts. Kept private here so
// the component-level ELK layout below is self-contained.
function nodeBoxW(n: DiagramNode): number {
  if (n.type === 'circle') return ((n.data as { r?: number }).r ?? 14) * 2;
  if (n.type === 'box') return (n.data as { width?: number }).width ?? 90;
  if (n.type === 'container') return n.width ?? 200;
  return 50;
}
function nodeBoxH(n: DiagramNode): number {
  if (n.type === 'circle') return ((n.data as { r?: number }).r ?? 14) * 2;
  if (n.type === 'box') return (n.data as { height?: number }).height ?? 32;
  if (n.type === 'container') return n.height ?? 150;
  return 50;
}

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
 * 3. Walks `layout` to establish layout edge hints for ordering
 * 4. Creates bridge edges (flow, kd, etc.)
 * 5. Runs ELK auto-layout (orthogonal routing) for component positions
 *    and inter-component bend points
 */
export async function specToFlow(
  spec: FigureSpec,
  opts?: { direction?: 'LR' | 'TB'; specs?: Record<string, FigureSpec> },
): Promise<{ nodes: DiagramNode[]; edges: DiagramEdge[] }> {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const direction = opts?.direction ?? 'LR';
  const specsMap = opts?.specs;

  // Track which node IDs belong to each component (for anchor resolution)
  const componentNodes = new Map<string, string[]>();
  // Track which components have an associated container node
  const componentContainers = new Map<string, string>();
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
        componentContainers.set(id, containerId);
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

      const { nodes: subNodes, edges: subEdges } = await specToFlow(subSpec, { direction, specs: specsMap });

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

  // --- Step 3: Pipeline flow edges + layout container parenting ---
  // Returns:
  //   leafIds — every leaf (circle/box) covered by this subtree, used for
  //             pipeline edge anchors.
  //   topIds  — the immediate top-level entities at this layout level. For a
  //             string ref this is the component-container ID if present,
  //             otherwise the leaf node IDs. For a sub-layout with its own
  //             container, this is the layout-container ID. Otherwise it's
  //             the union of children's topIds (transparent pass-through).
  function topIdsForRef(compId: string): string[] {
    const ctr = componentContainers.get(compId);
    if (ctr) return [ctr];
    return componentNodes.get(compId) ?? [];
  }

  function walkLayout(node: string | LayoutNode): {
    leafIds: string[];
    topIds: string[];
  } {
    if (typeof node === 'string') {
      return { leafIds: componentNodes.get(node) ?? [], topIds: topIdsForRef(node) };
    }

    const childSpecs = node.children ?? node.elements ?? [];
    const allLeafIds: string[] = [];
    const childTopIds: string[] = [];

    if (node.type === 'pipeline') {
      const childAnchors: string[] = [];
      for (const child of childSpecs) {
        const { leafIds, topIds } = walkLayout(child);
        allLeafIds.push(...leafIds);
        childTopIds.push(...topIds);
        if (leafIds.length > 0) childAnchors.push(leafIds[0]);
      }
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
      for (const child of childSpecs) {
        const { leafIds, topIds } = walkLayout(child);
        allLeafIds.push(...leafIds);
        childTopIds.push(...topIds);
      }
    }

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
        width: 300, // placeholder; finalized in step 6
        height: 200,
        style: 'z-index: -1;',
      });
      // Parent each top-level child entity to this layout container.
      for (const topId of childTopIds) {
        const child = nodes.find((n) => n.id === topId);
        if (child) child.parentId = containerId;
      }
      return { leafIds: allLeafIds, topIds: [containerId] };
    }

    return { leafIds: allLeafIds, topIds: childTopIds };
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

  // --- Step 5: Component-level auto-layout with ELK ---
  // Each spec component (graph cluster, box, sub-spec) becomes a single
  // super-node for ELK. This preserves the per-component internal layout
  // (rings, sub-spec sub-layouts) while still letting ELK arrange the
  // components left-to-right or top-to-bottom AND route inter-component
  // edges with bend points around obstacles. Intra-component edges (the
  // structural cycle of a graph cluster) are skipped — they would force
  // the algorithm to flatten the cluster into a DAG.

  // 5a. Compute each component's bbox in current (pre-translate) coords.
  type CompBox = { w: number; h: number; cx: number; cy: number };
  const compBoxes = new Map<string, CompBox>();
  for (const [compId, nodeIds] of componentNodes.entries()) {
    const compNodes = nodeIds
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is DiagramNode => !!n && n.type !== 'container');
    if (compNodes.length === 0) continue;

    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of compNodes) {
      const w = nodeBoxW(n);
      const h = nodeBoxH(n);
      x0 = Math.min(x0, n.position.x - w / 2);
      y0 = Math.min(y0, n.position.y - h / 2);
      x1 = Math.max(x1, n.position.x + w / 2);
      y1 = Math.max(y1, n.position.y + h / 2);
    }
    compBoxes.set(compId, {
      w: x1 - x0,
      h: y1 - y0,
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
    });
  }

  // 5b. Map each (non-container) node to its owning component.
  const nodeToComp = new Map<string, string>();
  for (const [compId, nodeIds] of componentNodes.entries()) {
    for (const nid of nodeIds) nodeToComp.set(nid, compId);
  }

  // 5c. Build flat super-node graph for ELK.
  const COMP_PAD = 20;
  const elkNodes = Array.from(compBoxes.entries()).map(([compId, box]) => ({
    id: compId,
    width: box.w + COMP_PAD,
    height: box.h + COMP_PAD,
  }));

  // Map each cross-component edge to a unique super-edge id; remember the
  // representative real-edge id so we can later attach bend points.
  const seenSuperEdges = new Map<string, string>(); // "sComp->tComp" -> real edge id
  const elkEdges: Array<{ id: string; source: string; target: string }> = [];
  for (const e of edges) {
    const sComp = nodeToComp.get(e.source);
    const tComp = nodeToComp.get(e.target);
    if (!sComp || !tComp || sComp === tComp) continue;
    const key = `${sComp}->${tComp}`;
    if (seenSuperEdges.has(key)) continue;
    seenSuperEdges.set(key, e.id);
    elkEdges.push({ id: e.id, source: sComp, target: tComp });
  }

  const layoutResult = await layoutWithELK(elkNodes, elkEdges, { direction });

  // 5d. Translate each component's nodes so its top-left sits at ELK's
  // returned (x, y). ELK reports rect top-left; we want centroid alignment
  // with the laid-out super-node's center.
  for (const [compId, box] of compBoxes.entries()) {
    const laid = layoutResult.nodes.get(compId);
    if (!laid) continue;
    const dx = (laid.x + laid.width / 2) - box.cx;
    const dy = (laid.y + laid.height / 2) - box.cy;
    const compNodeIds = componentNodes.get(compId) ?? [];
    for (const nid of compNodeIds) {
      const node = nodes.find((n) => n.id === nid);
      if (!node || node.type === 'container') continue;
      node.position = { x: node.position.x + dx, y: node.position.y + dy };
      node.targetPosition = direction === 'LR' ? Position.Left : Position.Top;
      node.sourcePosition = direction === 'LR' ? Position.Right : Position.Bottom;
    }
  }

  // 5e. Attach ELK bend points to every real edge that maps to a routed
  // super-edge. All edges sharing a (sComp, tComp) pair share the same
  // routed bend points — fine, since they connect leaves at slightly
  // different positions and floating-edge geometry caps them individually.
  for (const e of edges) {
    const sComp = nodeToComp.get(e.source);
    const tComp = nodeToComp.get(e.target);
    if (!sComp || !tComp || sComp === tComp) continue;
    const repId = seenSuperEdges.get(`${sComp}->${tComp}`);
    if (!repId) continue;
    const bps = layoutResult.bendPoints.get(repId);
    if (!bps || bps.length === 0) continue;
    // Only flow + kd edges consume bend points; stash on data either way.
    e.data = { ...(e.data ?? {}), bendPoints: bps };
  }

  // --- Step 6: Finalize containers (deepest first) ---
  // After ELK, leaf nodes hold absolute (canvas) positions. For each
  // container, fit its bbox around its children with padding, then convert
  // the children's positions from absolute to parent-relative.
  //
  // Process deepest containers first so when a layout container is sized,
  // its child component containers have already been finalized at absolute
  // positions (and their own grandchildren are already relative to them).
  const CONTAINER_PAD = 16;
  const CONTAINER_LABEL_PAD = 18; // extra top space reserved for the label

  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  function depthOf(n: DiagramNode): number {
    let d = 0;
    let cursor: DiagramNode | undefined = n;
    while (cursor?.parentId) {
      cursor = byId.get(cursor.parentId);
      if (!cursor) break;
      d++;
    }
    return d;
  }

  const containerNodes = nodes.filter((n) => n.type === 'container');
  containerNodes.sort((a, b) => depthOf(b) - depthOf(a));

  for (const container of containerNodes) {
    const children = nodes.filter((n) => n.parentId === container.id);
    if (children.length === 0) continue;

    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const c of children) {
      const w = nodeBoxW(c);
      const h = nodeBoxH(c);
      x0 = Math.min(x0, c.position.x);
      y0 = Math.min(y0, c.position.y);
      x1 = Math.max(x1, c.position.x + w);
      y1 = Math.max(y1, c.position.y + h);
    }

    container.position = {
      x: x0 - CONTAINER_PAD,
      y: y0 - CONTAINER_PAD - CONTAINER_LABEL_PAD,
    };
    container.width = x1 - x0 + 2 * CONTAINER_PAD;
    container.height = y1 - y0 + 2 * CONTAINER_PAD + CONTAINER_LABEL_PAD;

    for (const c of children) {
      c.position = {
        x: c.position.x - container.position.x,
        y: c.position.y - container.position.y,
      };
    }
  }

  // SvelteFlow requires parents to appear before their children in the nodes
  // array, otherwise parent-relative positioning is silently dropped.
  // Topo-sort by walking parentId chains; each node is emitted only after
  // its ancestors have been emitted.
  const visited = new Set<string>();
  const sorted: DiagramNode[] = [];
  function emit(n: DiagramNode): void {
    if (visited.has(n.id)) return;
    visited.add(n.id);
    if (n.parentId) {
      const parent = byId.get(n.parentId);
      if (parent) emit(parent);
    }
    sorted.push(n);
  }
  for (const n of nodes) emit(n);
  nodes.length = 0;
  nodes.push(...sorted);

  return { nodes, edges };
}

