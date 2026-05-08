import { Position } from '@xyflow/svelte';

import { getPaletteColor } from '../palette.ts';
import { layoutWithELK, layoutHierarchicalWithELK } from './elk.ts';
import type { ELKHierarchicalResult, ELKNodeIn } from './elk.ts';
import { circularPositions } from './layout.ts';
import type {
  DiagramEdge,
  DiagramNode,
  FigureSpec,
  GraphComponentSpec,
  LayoutNode,
} from './types.ts';

export function loadSpec(raw: unknown): FigureSpec {
  if (
    raw == null ||
    typeof raw !== 'object' ||
    !('figure' in raw) ||
    !('components' in raw) ||
    !('layout' in raw)
  ) {
    throw new Error(
      `loadSpec: invalid FigureSpec — missing required fields (figure, components, layout)`,
    );
  }
  return raw as FigureSpec;
}

function nodeBoxW(n: DiagramNode): number {
  if (n.type === 'circle') return ((n.data as { r?: number }).r ?? 14) * 2;
  return n.width ?? (n.type === 'container' ? 200 : 90);
}
function nodeBoxH(n: DiagramNode): number {
  if (n.type === 'circle') return ((n.data as { r?: number }).r ?? 14) * 2;
  return n.height ?? (n.type === 'container' ? 150 : 32);
}

// --- specToFlow ---

const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';

// Extract the first numeric value from a CSS padding string for layout math.
// e.g. '8px' → 8, '8px 16px' → 8, '8' → 8. Falls back to `fallback`.
function parsePad(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : fallback;
}

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
 * Convert a YAML figure spec to SvelteFlow nodes and edges.
 *
 * Layout is driven entirely by the hstack/vstack/pipeline tree — no external
 * layout engine. Each component is pre-positioned based on the tree before
 * containers are sized and edge geometry is computed.
 *
 * 1. Build nodes from components (circles for graphs, boxes for boxes)
 * 2. Compute component bounding boxes from initial (origin-centered) positions
 * 3. Walk the layout tree, pre-positioning each component based on hstack/vstack
 *    stacking with gap — this handles both x and y alignment correctly
 * 4. Create bridge edges (flow, kd, etc.)
 * 5. Finalize containers (deepest first) — fit each container around its children,
 *    then convert children to parent-relative coordinates
 * 6. Topo-sort so SvelteFlow parents precede children in the nodes array
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
  // Reverse map: containerId → the bridge-addressable key (for corner anchor registration)
  const containerToKey = new Map<string, string>();
  // Corner positions registered after step 5: "compId__corner-nw" → absolute {x, y}
  const cornerPositions = new Map<string, { x: number; y: number }>();
  // Edge counter to ensure unique IDs
  let edgeIdx = 0;

  // --- Step 1: Build nodes from components ---
  for (const [id, comp] of Object.entries(spec.components)) {
    if (comp.type === 'box') {
      const { stroke, fill } = getPaletteColor(comp.color ?? 'grey');
      const w = comp.width ?? 90;
      const h = comp.height ?? 32;
      nodes.push({
        id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: comp.label },
        style: `--ns: ${stroke}; --nf: ${fill};`,
        width: w,
        height: h,
        sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
        targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      });
      componentNodes.set(id, [id]);
    } else if (comp.type === 'graph') {
      const labels = resolveLabels(comp.labels, comp.n);
      const radius = (comp.scale ?? 80) / 2;
      const positions = circularPositions(comp.n, 0, 0, radius);
      const nodeIds: string[] = [];

      const circleR = comp.r ?? (radius < 30 ? 10 : 14);
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
            r: circleR,
          },
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        });
      }

      // Structural edges from topology
      const v = comp.variant;
      const edgeData = (i: number, j: number) => ({
        color: comp.color ?? 'grey',
        ...(v !== undefined && { highlighted: i === v - 1 || j === v - 1 }),
      });
      if (comp.topology === 'full') {
        for (let i = 0; i < comp.n; i++) {
          for (let j = i + 1; j < comp.n; j++) {
            edges.push({
              id: `e${edgeIdx++}`,
              source: nodeIds[i],
              target: nodeIds[j],
              type: 'structural',
              data: edgeData(i, j),
            });
          }
        }
      } else if (comp.topology === 'sparse') {
        // Cycle
        for (let i = 0; i < comp.n; i++) {
          const j = (i + 1) % comp.n;
          edges.push({
            id: `e${edgeIdx++}`,
            source: nodeIds[i],
            target: nodeIds[j],
            type: 'structural',
            data: edgeData(i, j),
          });
        }
        // Chord for n > 3
        if (comp.n > 3) {
          edges.push({
            id: `e${edgeIdx++}`,
            source: nodeIds[0],
            target: nodeIds[2],
            type: 'structural',
            data: edgeData(0, 2),
          });
        }
      }

      componentNodes.set(id, nodeIds);

      // Container node for graph clusters
      if (comp.container) {
        const containerId = `${id}__container`;
        const { stroke: cs, fill: cf } = getPaletteColor(
          comp.container.color ?? comp.color ?? 'grey',
        );
        nodes.push({
          id: containerId,
          type: 'container',
          position: { x: 0, y: 0 },
          data: {
            label: comp.container.label,
            style: `border-color: ${cs}; background: ${cf};`,
            labelStyle: `color: ${cs};`,
            shape: comp.container.shape,
            line: comp.container.line,
            padding: comp.container.padding,
          },
          width: radius * 2 + 80,
          height: radius * 2 + 60,
          style: 'z-index: -1;',
        });
        componentContainers.set(id, containerId);
        containerToKey.set(containerId, id);
        // Set children's parentId to the container
        for (const nodeId of nodeIds) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) node.parentId = containerId;
        }
      }
    } else if (comp.type === 'spec') {
      // Recursively build sub-spec, prefix all IDs with component id
      const subSpec = specsMap?.[comp.ref];
      if (!subSpec)
        throw new Error(`specToFlow: referenced spec '${comp.ref}' not found`);

      const { nodes: subNodes, edges: subEdges } = await specToFlow(subSpec, {
        direction,
        specs: specsMap,
      });

      const subNodeIds: string[] = [];
      const scaleFactor = comp.scale ?? 1;

      for (const subNode of subNodes) {
        const prefixedId = `${id}.${subNode.id}`;
        subNodeIds.push(prefixedId);

        const scaled = { ...subNode, id: prefixedId };
        if (scaled.type === 'circle' && scaled.data && scaleFactor !== 1) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r = ((scaled.data as any).r ?? 14) * scaleFactor;
          scaled.data = { ...scaled.data, r: Math.max(6, r) };
        }
        if (scaled.type === 'default' && scaleFactor !== 1) {
          scaled.width = (scaled.width ?? 90) * scaleFactor;
          scaled.height = (scaled.height ?? 32) * scaleFactor;
        }
        if (scaled.parentId) {
          scaled.parentId = `${id}.${scaled.parentId}`;
        }
        // Track component containers from the sub-spec so __side anchors resolve
        if (
          subNode.type === 'container' &&
          subNode.id.endsWith('__container')
        ) {
          const innerCompId = subNode.id.slice(0, -'__container'.length);
          componentContainers.set(`${id}.${innerCompId}`, prefixedId);
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

  // --- Step 2: Compute component bounding boxes from initial positions ---
  // All nodes use top-left positioning (SvelteFlow convention). The derived
  // cx/cy is the visual center of the bbox, which step 4 translates to the
  // target slot center — so each container exactly spans its allocated slot.
  type CompBox = { w: number; h: number; cx: number; cy: number };
  const compBoxes = new Map<string, CompBox>();
  for (const [compId, nodeIds] of componentNodes.entries()) {
    const compNodes = nodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter((n): n is DiagramNode => !!n && n.type !== 'container');
    if (compNodes.length === 0) continue;

    let x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;
    for (const n of compNodes) {
      const w = nodeBoxW(n);
      const h = nodeBoxH(n);
      x0 = Math.min(x0, n.position.x);
      y0 = Math.min(y0, n.position.y);
      x1 = Math.max(x1, n.position.x + w);
      y1 = Math.max(y1, n.position.y + h);
    }
    compBoxes.set(compId, {
      w: x1 - x0,
      h: y1 - y0,
      cx: (x0 + x1) / 2,
      cy: (y0 + y1) / 2,
    });
  }

  // --- Layout sizing helpers ---
  const CONTAINER_PAD = 16;
  const CONTAINER_LABEL_PAD = 18;

  // Total canvas footprint of a component (including its container if any).
  function compLayoutSize(compId: string): { w: number; h: number } {
    const box = compBoxes.get(compId);
    const boxW = box?.w ?? 80;
    const boxH = box?.h ?? 40;
    if (componentContainers.has(compId)) {
      const comp = spec.components[compId];
      const pad = parsePad(
        comp?.type === 'graph' ? comp.container?.padding : undefined,
        CONTAINER_PAD,
      );
      const labelPad =
        comp?.type === 'graph' && comp.container?.label
          ? CONTAINER_LABEL_PAD
          : 0;
      return { w: boxW + 2 * pad, h: boxH + 2 * pad + labelPad };
    }
    return { w: boxW, h: boxH };
  }

  // Total canvas footprint of a layout subtree (recursive, pure — no side effects).
  function layoutSizeOf(node: string | LayoutNode): { w: number; h: number } {
    if (typeof node === 'string') return compLayoutSize(node);
    const children = node.children ?? node.elements ?? [];
    if (children.length === 0) return { w: 80, h: 40 };
    const childSizes = children.map(c => layoutSizeOf(c));
    const gap = node.gap ?? 40;
    const cPad = node.container
      ? parsePad(node.container.padding, CONTAINER_PAD)
      : 0;
    const cPadX = node.container ? 2 * cPad : 0;
    const cLabelPad = node.container?.label ? CONTAINER_LABEL_PAD : 0;
    const cPadY = node.container ? 2 * cPad + cLabelPad : 0;
    if (node.type === 'vstack') {
      return {
        w: Math.max(...childSizes.map(s => s.w)) + cPadX,
        h:
          childSizes.reduce((acc, s) => acc + s.h, 0) +
          gap * (children.length - 1) +
          cPadY,
      };
    }
    // hstack or pipeline
    return {
      w:
        childSizes.reduce((acc, s) => acc + s.w, 0) +
        gap * (children.length - 1) +
        cPadX,
      h: Math.max(...childSizes.map(s => s.h)) + cPadY,
    };
  }

  // --- Step 3: Resolve anchor references ---
  // Handles: direct IDs, "compId__side" anchors (prefers container boundary),
  // component names, and dotted sub-spec refs.
  const nodeIdSet = new Set(nodes.map(n => n.id));

  function resolveRef(ref: string): string | null {
    // Direct node reference
    if (nodeIdSet.has(ref)) return ref;

    // Corner anchor: "compId__corner-nw|ne|sw|se" — resolves to the container node.
    // Exact corner coordinates are injected into edge data as sourceAnchor/targetAnchor.
    const cornerMatch = ref.match(/^(.+)__corner-(?:nw|ne|sw|se)$/);
    if (cornerMatch) {
      const compId = cornerMatch[1];
      const ctrId = componentContainers.get(compId);
      if (ctrId) return ctrId;
    }

    // Anchor reference: "compId__side" — route to the container boundary if present,
    // so edges cap at the container wall rather than piercing through to leaf nodes.
    const anchorMatch = ref.match(/^(.+)__(?:top|bottom|left|right)$/);
    if (anchorMatch) {
      const compId = anchorMatch[1];
      const ctrId = componentContainers.get(compId);
      if (ctrId) return ctrId;
      const compNodeIds = componentNodes.get(compId);
      if (compNodeIds?.length) {
        const real = compNodeIds.find(
          id => nodeIdSet.has(id) && !id.endsWith('__container'),
        );
        if (real) return real;
        return compNodeIds[0];
      }
    }

    // Bare component reference
    const compNodeIds = componentNodes.get(ref);
    if (compNodeIds?.length) {
      const real = compNodeIds.find(
        id => nodeIdSet.has(id) && !id.endsWith('__container'),
      );
      if (real) return real;
      return compNodeIds[0];
    }

    // Bare layout-container reference (registered by node.id in walkLayout)
    const bareCtr = componentContainers.get(ref);
    if (bareCtr) return bareCtr;

    return null;
  }

  // --- Step 4: Pre-position via hstack/vstack/pipeline layout ---
  // Translates leaf nodes so each component occupies the slot computed by the
  // layout tree. Containers are NOT moved here — step 5 fits them around their
  // children after the leaf positions are settled.

  function topIdsForRef(compId: string): string[] {
    const ctr = componentContainers.get(compId);
    if (ctr) return [ctr];
    return componentNodes.get(compId) ?? [];
  }

  // Walk the layout tree, placing each child at (originX, originY).
  // Returns { leafIds, topIds } for container parenting.
  function walkLayout(
    node: string | LayoutNode,
    originX = 0,
    originY = 0,
  ): { leafIds: string[]; topIds: string[] } {
    if (typeof node === 'string') {
      const box = compBoxes.get(node);
      const ls = compLayoutSize(node);
      const hasCtr = componentContainers.has(node);

      // Target center of the component's leaf-node bbox within the allocated slot.
      const targetCx = originX + ls.w / 2;
      const compSpec = spec.components[node];
      const ctrLabelPad =
        hasCtr && compSpec?.type === 'graph' && compSpec.container?.label
          ? CONTAINER_LABEL_PAD
          : 0;
      const targetCy = hasCtr
        ? originY + CONTAINER_PAD + ctrLabelPad + (box?.h ?? 40) / 2
        : originY + ls.h / 2;

      const dx = targetCx - (box?.cx ?? 0);
      const dy = targetCy - (box?.cy ?? 0);

      const nodeIds = componentNodes.get(node) ?? [];
      for (const nid of nodeIds) {
        const n = nodes.find(nd => nd.id === nid);
        if (n && n.type !== 'container') {
          n.position = { x: n.position.x + dx, y: n.position.y + dy };
        }
      }
      return { leafIds: nodeIds, topIds: topIdsForRef(node) };
    }

    const children = node.children ?? node.elements ?? [];
    const childSizes = children.map(c => layoutSizeOf(c));
    const gap = node.gap ?? 40;
    const allLeafIds: string[] = [];
    const childTopIds: string[] = [];
    // Container padding shifts the content area inward
    const nodePad = node.container
      ? parsePad(node.container.padding, CONTAINER_PAD)
      : 0;
    const padX = nodePad;
    const layoutLabelPad = node.container?.label ? CONTAINER_LABEL_PAD : 0;
    const padY = node.container ? nodePad + layoutLabelPad : 0;

    if (node.type === 'vstack') {
      const contentW =
        childSizes.length > 0 ? Math.max(...childSizes.map(s => s.w)) : 0;
      let curY = originY + padY;
      for (let i = 0; i < children.length; i++) {
        const cs = childSizes[i];
        // Center each child horizontally within the vstack
        const childX = originX + padX + (contentW - cs.w) / 2;
        const result = walkLayout(children[i], childX, curY);
        allLeafIds.push(...result.leafIds);
        childTopIds.push(...result.topIds);
        curY += cs.h + gap;
      }
    } else {
      // hstack or pipeline — lay out left to right, centered vertically
      const contentH =
        childSizes.length > 0 ? Math.max(...childSizes.map(s => s.h)) : 0;
      let curX = originX + padX;
      const childAnchors: string[] = [];
      for (let i = 0; i < children.length; i++) {
        const cs = childSizes[i];
        const childY = originY + padY + (contentH - cs.h) / 2;
        const result = walkLayout(children[i], curX, childY);
        allLeafIds.push(...result.leafIds);
        childTopIds.push(...result.topIds);
        if (node.type === 'pipeline' && result.leafIds.length > 0) {
          childAnchors.push(result.leafIds[0]);
        }
        curX += cs.w + gap;
      }
      if (node.type === 'pipeline') {
        for (let i = 0; i < childAnchors.length - 1; i++) {
          edges.push({
            id: `e${edgeIdx++}`,
            source: childAnchors[i],
            target: childAnchors[i + 1],
            type: 'flow',
            data: { color: node.flowColor ?? 'grey' },
          });
        }
      }
    }

    if (node.container) {
      const { w, h } = layoutSizeOf(node);
      const containerId = `__layout_container_${edgeIdx++}`;
      const { stroke: cs, fill: cf } = getPaletteColor(
        node.container.color ?? 'grey',
      );
      nodes.push({
        id: containerId,
        type: 'container',
        position: { x: originX, y: originY },
        data: {
          label: node.container.label,
          style: `border-color: ${cs}; background: ${cf};`,
          labelStyle: `color: ${cs};`,
          borderColor: cs,
          bgColor: cf,
          shape: node.container.shape,
          line: node.container.line,
          padding: node.container.padding,
        },
        width: w,
        height: h,
        style: 'z-index: -1;',
      });
      for (const topId of childTopIds) {
        const child = nodes.find(n => n.id === topId);
        if (child) child.parentId = containerId;
      }
      // Register the container under the layout node's id so bridges can
      // reference it as "id__left", "id__right", etc.
      if (node.id) {
        componentContainers.set(node.id, containerId);
        containerToKey.set(containerId, node.id);
      }
      return { leafIds: allLeafIds, topIds: [containerId] };
    }

    return { leafIds: allLeafIds, topIds: childTopIds };
  }

  walkLayout(spec.layout);

  // --- Step 5: Finalize containers (deepest first) ---
  // After pre-positioning, leaf nodes hold absolute (canvas) positions. For each
  // container, fit its bbox around its children with padding, then convert the
  // children's positions from absolute to parent-relative.
  //
  // Processing deepest first ensures that when a layout container is sized, its
  // child component containers have already been finalized at absolute positions
  // (and their own grandchildren are already relative to them).
  const CONTAINER_PAD_STEP6 = CONTAINER_PAD;
  const LABEL_PAD_STEP6 = CONTAINER_LABEL_PAD;

  const byId = new Map(nodes.map(n => [n.id, n] as const));
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

  const containerNodes = nodes.filter(n => n.type === 'container');
  containerNodes.sort((a, b) => depthOf(b) - depthOf(a));

  for (const container of containerNodes) {
    const children = nodes.filter(n => n.parentId === container.id);
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

    const cPad = parsePad(
      container.data?.padding as string | undefined,
      CONTAINER_PAD_STEP6,
    );
    const labelPad = container.data?.label ? LABEL_PAD_STEP6 : 0;
    container.position = {
      x: x0 - cPad,
      y: y0 - cPad - labelPad,
    };
    container.width = x1 - x0 + 2 * cPad;
    container.height = y1 - y0 + 2 * cPad + labelPad;

    for (const c of children) {
      c.position = {
        x: c.position.x - container.position.x,
        y: c.position.y - container.position.y,
      };
    }

    // Register corner positions for containers that have a bridge-addressable key.
    // These are used by step 6 to inject sourceAnchor/targetAnchor into bridge edges.
    const key = containerToKey.get(container.id);
    if (key) {
      const cw = container.width ?? 0;
      const ch = container.height ?? 0;
      const cx = container.position.x;
      const cy = container.position.y;
      cornerPositions.set(`${key}__corner-nw`, { x: cx, y: cy });
      cornerPositions.set(`${key}__corner-ne`, { x: cx + cw, y: cy });
      cornerPositions.set(`${key}__corner-sw`, { x: cx, y: cy + ch });
      cornerPositions.set(`${key}__corner-se`, { x: cx + cw, y: cy + ch });
    }
  }

  // --- Step 6: Bridge edges ---
  // Bridges are resolved after step 5 so that cornerPositions is fully populated.
  // Corner refs resolve to the container node for SvelteFlow routing, with exact
  // corner coordinates injected into edge data as sourceAnchor/targetAnchor.
  // bridge `type: 'kd'` is a preset on the unified flow edge: thicker dashed
  // stroke with a bold colored label offset to the right of the segment.
  if (spec.bridges) {
    for (const b of spec.bridges) {
      const source = resolveRef(b.from);
      const target = resolveRef(b.to);
      if (!source || !target) {
        console.warn(
          `[specToFlow] bridge: cannot resolve ${b.from} -> ${b.to}`,
        );
        continue;
      }

      const isKd = b.type === 'kd';
      const isLine = b.type === 'line';
      const data: Record<string, unknown> = {
        color: b.color ?? (isKd ? 'kd' : 'grey'),
        label: b.label ?? (isKd ? 'KD' : undefined),
        dashed: b.style === 'dashed' || isKd,
      };
      if (isKd) {
        data.strokeWidth = 2;
        data.dashArray = '6 4';
        data.boldLabel = true;
        data.labelOnStroke = true;
        data.labelOffsetX = 10;
        data.labelLeftAlign = true;
      }
      if (isLine) {
        data.straight = true;
      }
      const sourceAnchor = cornerPositions.get(b.from);
      const targetAnchor = cornerPositions.get(b.to);
      if (sourceAnchor) data.sourceAnchor = sourceAnchor;
      if (targetAnchor) data.targetAnchor = targetAnchor;

      edges.push({
        id: `e${edgeIdx++}`,
        source,
        target,
        type:
          b.type === 'flow' || b.type === undefined || isKd || isLine
            ? 'flow'
            : b.type,
        data: data as DiagramEdge['data'],
      });
    }
  }

  // SvelteFlow requires parents to appear before their children in the nodes
  // array, otherwise parent-relative positioning is silently dropped.
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

// ─────────────────────────────────────────────────────────────────────────────
// specToFlowELK — same spec format as specToFlow but uses ELK for layout
// instead of the custom hstack/vstack/pipeline engine.
//
// Supports: box and graph components; hstack / vstack / pipeline layout nodes;
// layout nodes with container: become ELK groups.
// Does NOT support: spec component type, corner-anchor bridges.
// ─────────────────────────────────────────────────────────────────────────────
export async function specToFlowELK(
  spec: FigureSpec,
  opts?: { direction?: 'LR' | 'TB' },
): Promise<{ nodes: DiagramNode[]; edges: DiagramEdge[] }> {
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  const direction = opts?.direction ?? 'LR';

  const componentNodes = new Map<string, string[]>();
  const componentContainers = new Map<string, string>();
  let edgeIdx = 0;

  // ── Step 1: build component nodes (box + graph) ──────────────────────────

  for (const [id, comp] of Object.entries(spec.components)) {
    if (comp.type === 'box') {
      const { stroke, fill } = getPaletteColor(comp.color ?? 'grey');
      const w = comp.width ?? 90;
      const h = comp.height ?? 32;
      nodes.push({
        id,
        type: 'default',
        position: { x: 0, y: 0 },
        data: { label: comp.label },
        style: `--ns: ${stroke}; --nf: ${fill};`,
        width: w,
        height: h,
        sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
        targetPosition: direction === 'LR' ? Position.Left : Position.Top,
      });
      componentNodes.set(id, [id]);
    } else if (comp.type === 'graph') {
      const labels = resolveLabels(comp.labels, comp.n);
      const radius = (comp.scale ?? 80) / 2;
      const positions = circularPositions(comp.n, 0, 0, radius);
      const nodeIds: string[] = [];
      const circleR = comp.r ?? (radius < 30 ? 10 : 14);

      for (let i = 0; i < comp.n; i++) {
        const nodeId = `${id}_${i}`;
        nodeIds.push(nodeId);
        nodes.push({
          id: nodeId,
          type: 'circle',
          position: { x: positions[i].x, y: positions[i].y },
          data: { label: labels[i], color: comp.color ?? 'grey', r: circleR },
          sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
          targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        });
      }

      const v = comp.variant;
      const edgeData = (i: number, j: number) => ({
        color: comp.color ?? 'grey',
        ...(v !== undefined && { highlighted: i === v - 1 || j === v - 1 }),
      });
      if (comp.topology === 'full') {
        for (let i = 0; i < comp.n; i++)
          for (let j = i + 1; j < comp.n; j++)
            edges.push({ id: `e${edgeIdx++}`, source: nodeIds[i], target: nodeIds[j], type: 'structural', data: edgeData(i, j) });
      } else if (comp.topology === 'sparse') {
        for (let i = 0; i < comp.n; i++) {
          const j = (i + 1) % comp.n;
          edges.push({ id: `e${edgeIdx++}`, source: nodeIds[i], target: nodeIds[j], type: 'structural', data: edgeData(i, j) });
        }
        if (comp.n > 3)
          edges.push({ id: `e${edgeIdx++}`, source: nodeIds[0], target: nodeIds[2], type: 'structural', data: edgeData(0, 2) });
      }

      componentNodes.set(id, nodeIds);

      if (comp.container) {
        const containerId = `${id}__container`;
        const { stroke: cs, fill: cf } = getPaletteColor(comp.container.color ?? comp.color ?? 'grey');
        nodes.push({
          id: containerId,
          type: 'container',
          position: { x: 0, y: 0 },
          data: {
            label: comp.container.label,
            style: `border-color: ${cs}; background: ${cf};`,
            labelStyle: `color: ${cs};`,
            shape: comp.container.shape,
            line: comp.container.line,
            padding: comp.container.padding,
          },
          width: radius * 2 + 80,
          height: radius * 2 + 60,
          style: 'z-index: -1;',
        });
        componentContainers.set(id, containerId);
        for (const nodeId of nodeIds) {
          const node = nodes.find(n => n.id === nodeId);
          if (node) node.parentId = containerId;
        }
      }
    }
  }

  // ── Step 2: bboxes for graph components (with x0/y0 for parent-rel math) ─

  type CompBox = { w: number; h: number; cx: number; cy: number; x0: number; y0: number };
  const compBoxes = new Map<string, CompBox>();
  for (const [compId, nodeIds] of componentNodes.entries()) {
    const compNodes = nodeIds
      .map(id => nodes.find(n => n.id === id))
      .filter((n): n is DiagramNode => !!n && n.type !== 'container');
    if (compNodes.length === 0) continue;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of compNodes) {
      const w = nodeBoxW(n);
      const h = nodeBoxH(n);
      x0 = Math.min(x0, n.position.x);
      y0 = Math.min(y0, n.position.y);
      x1 = Math.max(x1, n.position.x + w);
      y1 = Math.max(y1, n.position.y + h);
    }
    compBoxes.set(compId, { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, x0, y0 });
  }

  // ── Step 3: walk layout tree → ELK structure ────────────────────────────

  const ELK_COMP_PAD = 16;
  const ELK_LABEL_PAD = 18;

  function compELKSize(compId: string): { width: number; height: number } {
    const box = compBoxes.get(compId);
    const comp = spec.components[compId];
    if (comp?.type === 'graph' && comp.container) {
      const lp = (comp as GraphComponentSpec).container?.label ? ELK_LABEL_PAD : 0;
      return { width: (box?.w ?? 80) + 2 * ELK_COMP_PAD, height: (box?.h ?? 40) + 2 * ELK_COMP_PAD + lp };
    }
    const n = nodes.find(nd => nd.id === compId);
    return { width: n?.width ?? 90, height: n?.height ?? 32 };
  }

  function elkIdFor(compId: string): string {
    return componentContainers.get(compId) ?? componentNodes.get(compId)?.[0] ?? compId;
  }

  type ELKFlatNode = { id: string; width: number; height: number };
  type ELKGroupSpec = {
    id: string;
    direction: 'LR' | 'TB';
    children: ELKFlatNode[];
    containerSpec: LayoutNode['container'];
  };

  const elkGroupSpecs: ELKGroupSpec[] = [];
  let groupIdx = 0;

  interface WalkResult {
    elkNodes: ELKFlatNode[];
    pipelineEdges: Array<{ id: string; source: string; target: string }>;
    repId: string | null; // representative ELK ID for pipeline chaining
  }

  function walkForELK(layout: string | LayoutNode): WalkResult {
    if (typeof layout === 'string') {
      const size = compELKSize(layout);
      const elkId = elkIdFor(layout);
      return { elkNodes: [{ id: elkId, ...size }], pipelineEdges: [], repId: elkId };
    }

    const children = layout.children ?? layout.elements ?? [];
    const childResults = children.map(c => walkForELK(c));
    const allPipelineEdges = childResults.flatMap(r => r.pipelineEdges);

    if (layout.type === 'pipeline') {
      const repIds = childResults.map(r => r.repId).filter((id): id is string => id !== null);
      for (let i = 0; i < repIds.length - 1; i++)
        allPipelineEdges.push({ id: `pe${edgeIdx++}`, source: repIds[i], target: repIds[i + 1] });
    }

    const allChildNodes = childResults.flatMap(r => r.elkNodes);
    // pipeline → repId = last child; hstack/vstack → repId = first child
    const repId =
      layout.type === 'pipeline'
        ? (childResults[childResults.length - 1]?.repId ?? null)
        : (childResults[0]?.repId ?? null);

    if (layout.container) {
      const groupId = layout.id ? `__layout_${layout.id}` : `__layout_group_${groupIdx++}`;
      const groupDir: 'LR' | 'TB' = layout.type === 'vstack' ? 'TB' : 'LR';
      elkGroupSpecs.push({ id: groupId, direction: groupDir, children: allChildNodes, containerSpec: layout.container });
      return { elkNodes: [{ id: groupId, width: 0, height: 0 }], pipelineEdges: allPipelineEdges, repId: groupId };
    }

    return { elkNodes: allChildNodes, pipelineEdges: allPipelineEdges, repId };
  }

  const { elkNodes: rootELKNodes, pipelineEdges } = walkForELK(spec.layout);

  // ── Step 4: ELK edges from pipelines + bridges ────────────────────────────

  function resolveToELKId(ref: string): string | null {
    const sideMatch = ref.match(/^(.+)__(?:top|bottom|left|right)$/);
    const baseId = sideMatch ? sideMatch[1] : ref;
    const ctr = componentContainers.get(baseId);
    if (ctr) return ctr;
    const ids = componentNodes.get(baseId);
    if (ids?.length) return ids[0];
    const gid = `__layout_${baseId}`;
    if (elkGroupSpecs.some(g => g.id === gid)) return gid;
    if (nodes.some(n => n.id === baseId)) return baseId;
    return null;
  }

  const allELKEdges: Array<{ id: string; source: string; target: string }> = [...pipelineEdges];
  if (spec.bridges) {
    for (const b of spec.bridges) {
      const src = resolveToELKId(b.from);
      const tgt = resolveToELKId(b.to);
      if (src && tgt && src !== tgt)
        allELKEdges.push({ id: `be${edgeIdx++}`, source: src, target: tgt });
    }
  }

  // ── Step 5: run ELK ──────────────────────────────────────────────────────

  let elkResult: ELKHierarchicalResult;

  if (elkGroupSpecs.length > 0) {
    const groupIds = new Set(elkGroupSpecs.map(g => g.id));
    elkResult = await layoutHierarchicalWithELK(
      elkGroupSpecs.map(g => ({ id: g.id, direction: g.direction, children: g.children })),
      allELKEdges,
      {
        direction,
        nodeSpacing: 18,
        rankSpacing: 60,
        groupSpacing: 60,
        flatNodes: rootELKNodes.filter(n => !groupIds.has(n.id)),
      },
    );
  } else {
    const flat = await layoutWithELK(rootELKNodes, allELKEdges, {
      direction,
      nodeSpacing: 50,
      rankSpacing: 80,
    });
    elkResult = { groups: new Map(), nodes: flat.nodes };
  }

  // ── Step 6: apply ELK positions ──────────────────────────────────────────

  const byId = new Map(nodes.map(n => [n.id, n]));

  // Component containers: ELK placed the container node; set children parent-relative.
  for (const [compId, containerId] of componentContainers.entries()) {
    const container = byId.get(containerId);
    if (!container) continue;
    const elkPos = elkResult.nodes.get(containerId);
    if (!elkPos) continue;

    container.position = { x: elkPos.x, y: elkPos.y };
    container.width = elkPos.width;
    container.height = elkPos.height;

    const box = compBoxes.get(compId);
    const gComp = spec.components[compId] as GraphComponentSpec | undefined;
    const lp = gComp?.container?.label ? ELK_LABEL_PAD : 0;

    for (const nid of componentNodes.get(compId) ?? []) {
      const circleNode = byId.get(nid);
      if (!circleNode) continue;
      const orig = circleNode.position;
      circleNode.position = {
        x: orig.x - (box?.x0 ?? 0) + ELK_COMP_PAD,
        y: orig.y - (box?.y0 ?? 0) + ELK_COMP_PAD + lp,
      };
    }
  }

  // Flat box nodes: apply root-relative ELK position.
  for (const [compId, nodeIds] of componentNodes.entries()) {
    if (componentContainers.has(compId)) continue;
    for (const nid of nodeIds) {
      const n = byId.get(nid);
      if (!n) continue;
      const elkPos = elkResult.nodes.get(nid);
      if (elkPos) n.position = { x: elkPos.x, y: elkPos.y };
    }
  }

  // Layout groups: create SvelteFlow container nodes; set children parent-relative.
  for (const groupSpec of elkGroupSpecs) {
    const groupPos = elkResult.groups.get(groupSpec.id);
    if (!groupPos) continue;

    const { stroke: cs, fill: cf } = getPaletteColor(groupSpec.containerSpec?.color ?? 'grey');
    const containerNode: DiagramNode = {
      id: groupSpec.id,
      type: 'container',
      position: { x: groupPos.x, y: groupPos.y },
      data: {
        label: groupSpec.containerSpec?.label,
        style: `border-color: ${cs}; background: ${cf};`,
        labelStyle: `color: ${cs};`,
        shape: groupSpec.containerSpec?.shape,
        line: groupSpec.containerSpec?.line,
      },
      width: groupPos.width,
      height: groupPos.height,
      style: 'z-index: -1;',
    };
    nodes.push(containerNode);
    byId.set(groupSpec.id, containerNode);

    for (const child of groupSpec.children) {
      const childNode = byId.get(child.id);
      if (!childNode) continue;
      const childPos = elkResult.nodes.get(child.id);
      if (childPos) {
        childNode.position = { x: childPos.x, y: childPos.y };
        childNode.parentId = groupSpec.id;
      }
    }
  }

  // ── Step 7: bridge edges (SvelteFlow rendering) ───────────────────────────

  const nodeIdSet = new Set(nodes.map(n => n.id));

  function resolveRef(ref: string): string | null {
    if (nodeIdSet.has(ref)) return ref;
    const sideMatch = ref.match(/^(.+)__(?:top|bottom|left|right)$/);
    if (sideMatch) {
      const baseId = sideMatch[1];
      const ctr = componentContainers.get(baseId);
      if (ctr) return ctr;
      const ids = componentNodes.get(baseId);
      if (ids?.length) return ids.find(id => nodeIdSet.has(id)) ?? null;
      const gid = `__layout_${baseId}`;
      if (nodeIdSet.has(gid)) return gid;
    }
    const ctr = componentContainers.get(ref);
    if (ctr) return ctr;
    const ids = componentNodes.get(ref);
    if (ids?.length) return ids.find(id => nodeIdSet.has(id)) ?? null;
    return null;
  }

  if (spec.bridges) {
    for (const b of spec.bridges) {
      const source = resolveRef(b.from);
      const target = resolveRef(b.to);
      if (!source || !target) {
        console.warn(`[specToFlowELK] unresolved bridge: ${b.from} -> ${b.to}`);
        continue;
      }
      const isKd = b.type === 'kd';
      const isLine = b.type === 'line';
      const data: Record<string, unknown> = {
        color: b.color ?? (isKd ? 'kd' : 'grey'),
        label: b.label ?? (isKd ? 'KD' : undefined),
        dashed: b.style === 'dashed' || isKd,
      };
      if (isKd) {
        data.strokeWidth = 2;
        data.dashArray = '6 4';
        data.boldLabel = true;
        data.labelOnStroke = true;
        data.labelOffsetX = 10;
        data.labelLeftAlign = true;
      }
      if (isLine) data.straight = true;
      edges.push({
        id: `e${edgeIdx++}`,
        source,
        target,
        type: b.type === 'flow' || b.type === undefined || isKd || isLine ? 'flow' : b.type,
        data: data as DiagramEdge['data'],
      });
    }
  }

  // ── Step 8: topo-sort (SvelteFlow requires parents before children) ───────

  const visited = new Set<string>();
  const sorted: DiagramNode[] = [];
  const byId2 = new Map(nodes.map(n => [n.id, n]));
  function emit(n: DiagramNode): void {
    if (visited.has(n.id)) return;
    visited.add(n.id);
    if (n.parentId) { const p = byId2.get(n.parentId); if (p) emit(p); }
    sorted.push(n);
  }
  for (const n of nodes) emit(n);
  nodes.length = 0;
  nodes.push(...sorted);

  return { nodes, edges };
}
