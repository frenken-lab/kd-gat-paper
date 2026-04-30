import type { Edge,Node } from '@xyflow/svelte';

// --- Node data payloads ---

export interface CircleNodeData {
  label: string;
  color: string; // role name (e.g., 'vgae', 'gat') or hex
  r?: number; // radius in px (default 14)
  [key: string]: unknown;
}

export interface ContainerNodeData {
  label?: string;
  style: string;      // pre-computed inline style (border-color, background)
  labelStyle: string; // pre-computed inline style for the label span (color)
  borderColor?: string;
  bgColor?: string;
  // Shape: 'rounded-rectangle' (default), 'rectangle', 'trapezoid-r', 'trapezoid-l'
  shape?: string;
  // Border style: 'dashed' (default) | 'solid'
  line?: 'solid' | 'dashed';
  // CSS padding string (e.g. '8px', '4px 12px'). Defaults to '16px'. Also drives
  // layout calculations — first numeric value is extracted as the layout pad in px.
  padding?: string;
  [key: string]: unknown;
}

// --- Edge data payloads ---

export interface FlowEdgeData {
  color: string;
  label?: string;
  dashed?: boolean;
  // Width in px (default 1).
  strokeWidth?: number;
  // Override the dash pattern. Falls back to '4 3' when `dashed` is true.
  dashArray?: string;
  // Bold the label (vs. default italic light grey).
  boldLabel?: boolean;
  // Color the label with the stroke color rather than light grey.
  labelOnStroke?: boolean;
  // Horizontal label offset in px (default 0). Used by KD-preset bridges to
  // sit the label to the right of the segment instead of centered on it.
  labelOffsetX?: number;
  // Left-align the label at (labelX, labelY) rather than centering.
  labelLeftAlign?: boolean;
  // Draw a straight line with no arrowhead instead of a smoothstep arrow.
  straight?: boolean;
  // Exact canvas coordinate to use as the source/target anchor, overriding
  // floating-edge geometry. Set by corner bridge refs (e.g. "encoder__corner-ne").
  sourceAnchor?: { x: number; y: number };
  targetAnchor?: { x: number; y: number };
  // ELK-supplied interior bend points in canvas coordinates. When present,
  // the edge is rendered as a rounded polyline through these points capped
  // at the floating-edge boundary on each end. When absent, the edge falls
  // back to xyflow's getSmoothStepPath between floating endpoints.
  bendPoints?: Array<{ x: number; y: number }>;
  [key: string]: unknown;
}

export interface StructuralEdgeData {
  color: string;
  // When set, renders this edge with full-opacity heavy stroke vs. the dim default.
  highlighted?: boolean;
  [key: string]: unknown;
}

export interface EncodedEdgeData {
  color?: string;      // defaults to 'attention'
  weight: number;      // 0-1, drives stroke width + opacity
  [key: string]: unknown;
}

// --- Diagram types ---

export type DiagramNode = Node<CircleNodeData | ContainerNodeData | Record<string, unknown>>;
export type DiagramEdge = Edge<FlowEdgeData | StructuralEdgeData | EncodedEdgeData>;

export interface FlowDiagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// --- Spec types (consumed by specToFlow) ---

export interface GraphComponentSpec {
  type: 'graph';
  n: number;
  topology: 'sparse' | 'full' | 'none';
  color?: string;
  labels?: string[] | 'auto' | 'none';
  scale?: number;
  // Override circle radius. When omitted, falls back to a heuristic on `scale`
  // (small ring → 10, larger → 14).
  r?: number;
  // Highlight all edges incident to this node (1-based: variant 1 = v₁, 2 = v₂, …).
  // Other edges are dimmed. Valid values: 1–n.
  variant?: number;
  container?: { label?: string; color?: string; shape?: string; line?: 'solid' | 'dashed'; padding?: string };
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
  // Optional name for this layout node — makes the generated container
  // addressable in bridges via "id__left", "id__right", etc.
  id?: string;
  children?: (string | LayoutNode)[];
  elements?: (string | LayoutNode)[];
  gap?: number;
  align?: 'left' | 'center' | 'right';
  direction?: 'horizontal' | 'vertical';
  flowColor?: string;
  container?: { label?: string; color?: string; shape?: string; line?: 'solid' | 'dashed'; padding?: string };
}

export interface BridgeSpec {
  from: string;
  to: string;
  type?: string;
  color?: string;
  label?: string;
  style?: string;
}

export interface FigureSpec {
  figure: string;
  components: Record<string, ComponentSpec>;
  layout: LayoutNode;
  bridges?: BridgeSpec[];
}
