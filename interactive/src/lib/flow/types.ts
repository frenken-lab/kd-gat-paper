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
  // ELK-supplied interior bend points in canvas coordinates. When present,
  // the edge is rendered as a rounded polyline through these points capped
  // at the floating-edge boundary on each end. When absent, the edge falls
  // back to xyflow's getSmoothStepPath between floating endpoints.
  bendPoints?: Array<{ x: number; y: number }>;
  [key: string]: unknown;
}

export interface KDEdgeData {
  color?: string;      // defaults to 'kd' role
  label?: string;      // defaults to 'KD'
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
export type DiagramEdge = Edge<FlowEdgeData | KDEdgeData | StructuralEdgeData | EncodedEdgeData>;

export interface FlowDiagram {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// --- Layout persistence ---

export interface LayoutFile {
  version: 1;
  viewport: { x: number; y: number; zoom: number };
  nodes: Record<string, { x: number; y: number; width?: number; height?: number }>;
}
