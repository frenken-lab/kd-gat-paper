<script lang="ts">
  import '@xyflow/svelte/dist/style.css';
  import 'virtual:theme-vars.css';

  import type { Snippet } from 'svelte';
  import {
    Controls,
    type DefaultEdgeOptions,
    type EdgeTypes,
    MarkerType,
    MiniMap,
    type NodeTypes,
    SvelteFlow,
  } from '@xyflow/svelte';

  import EncodedEdge from './edges/EncodedEdge.svelte';
  import FlowEdge from './edges/FlowEdge.svelte';
  import StructuralEdge from './edges/StructuralEdge.svelte';
  import CircleNode from './nodes/CircleNode.svelte';
  import ContainerNode from './nodes/ContainerNode.svelte';
  import type { DiagramEdge, DiagramNode } from './types.ts';

  type DiagramCanvasProps = {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    width?: string;
    height?: string;
    fitView?: boolean;
    selectable?: boolean;
    children?: Snippet;
  };

  let {
    nodes = $bindable([]),
    edges = $bindable([]),
    width = '100%',
    height = '400px',
    fitView = true,
    selectable = false,
    children,
  }: DiagramCanvasProps = $props();

  const nodeTypes: NodeTypes = {
    circle: CircleNode,
    container: ContainerNode,
  };

  const edgeTypes: EdgeTypes = {
    structural: StructuralEdge,
    flow: FlowEdge,
    encoded: EncodedEdge,
  };

  const defaultEdgeOptions: DefaultEdgeOptions = {
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
  };
</script>

<div class="diagram-canvas" style:width style:height>
  <SvelteFlow
    bind:nodes
    bind:edges
    {nodeTypes}
    {edgeTypes}
    {defaultEdgeOptions}
    {fitView}
    nodesDraggable={false}
    nodesConnectable={false}
    elementsSelectable={selectable}
    panOnDrag={true}
    zoomOnScroll={true}
    minZoom={0.2}
    maxZoom={4}
    proOptions={{ hideAttribution: true }}>
    <Controls />
    <MiniMap zoomable pannable />
    {@render children?.()}
  </SvelteFlow>
</div>

<style>
  .diagram-canvas {
    border: 1px solid #eee;
    border-radius: 4px;
    overflow: hidden;
  }

  /* Hide SvelteFlow's default handle dots — they're pure visual noise on
     non-interactive figures. Handles stay in the DOM (size 0, transparent)
     so edge routing still anchors to the configured Position. */
  .diagram-canvas :global(.svelte-flow__handle) {
    width: 0;
    height: 0;
    min-width: 0;
    min-height: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  /* Style xyflow's built-in default node to match our box spec.
     --ns (node stroke) and --nf (node fill) are set as CSS vars on the
     outer .svelte-flow__node wrapper via the node's `style` prop and
     cascade into this inner element. */
  .diagram-canvas :global(.svelte-flow__node-default) {
    width: 100%;
    height: 100%;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1.5px solid var(--ns, #ccc);
    background: var(--nf, #fff);
    font-size: 9px;
    font-family: system-ui, -apple-system, sans-serif;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }
</style>
