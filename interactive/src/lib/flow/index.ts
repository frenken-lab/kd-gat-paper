// Node components
export { default as CircleNode } from "./nodes/CircleNode.svelte";
export { default as BoxNode } from "./nodes/BoxNode.svelte";
export { default as ContainerNode } from "./nodes/ContainerNode.svelte";

// Edge components
export { default as StructuralEdge } from "./edges/StructuralEdge.svelte";
export { default as FlowEdge } from "./edges/FlowEdge.svelte";
export { default as EncodedEdge } from "./edges/EncodedEdge.svelte";

// Canvas wrapper
export { default as DiagramCanvas } from "./DiagramCanvas.svelte";

// Types
export type * from "./types.ts";

// Utilities
export { specToFlow, loadSpec } from "./convert.ts";
export { circularPositions } from "./layout.ts";
export { getEdgeParams } from "./floating.ts";
export type { FloatingEdgeParams } from "./floating.ts";
