import type { Node, Edge } from '@xyflow/svelte';

// --- Node data payloads ---

export interface CircleNodeData {
  label: string;
  color: string;       // role name (e.g., 'vgae', 'gat') or hex
  r?: number;          // radius in px (default 14)
  [key: string]: unknown;
}

export interface BoxNodeData {
  label: string;
  color: string;
  width?: number;      // default 90
  height?: number;     // default 32
  [key: string]: unknown;
}

export interface ContainerNodeData {
  label: string;
  color: string;
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
  // ELK-supplied interior bend points in canvas coordinates. When present,
  // the edge is rendered as a rounded polyline through these points capped
  // at the floating-edge boundary on each end. When absent, the edge falls
  // back to xyflow's getSmoothStepPath between floating endpoints.
  bendPoints?: Array<{ x: number; y: number }>;
  [key: string]: unknown;
}

export interface StructuralEdgeData {
  color: string;
  [key: string]: unknown;
}

export interface EncodedEdgeData {
  color?: string;      // defaults to 'attention'
  weight: number;      // 0-1, drives stroke width + opacity
  [key: string]: unknown;
}

// --- Diagram types ---

export type DiagramNode = Node<CircleNodeData | BoxNodeData | ContainerNodeData>;
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
  container?: { label: string; color?: string };
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
