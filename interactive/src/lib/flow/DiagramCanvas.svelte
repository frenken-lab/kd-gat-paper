<script lang="ts">
  import '@xyflow/svelte/dist/style.css';
  import 'virtual:theme-vars.css';

  import {
    type DefaultEdgeOptions,
    type EdgeTypes,
    MarkerType,
    type NodeTypes,
    SvelteFlow,
  } from '@xyflow/svelte';

  import EncodedEdge from './edges/EncodedEdge.svelte';
  import FlowEdge from './edges/FlowEdge.svelte';
  import StructuralEdge from './edges/StructuralEdge.svelte';
  import BoxNode from './nodes/BoxNode.svelte';
  import CircleNode from './nodes/CircleNode.svelte';
  import ContainerNode from './nodes/ContainerNode.svelte';
  import type { DiagramEdge, DiagramNode } from './types.ts';

  type DiagramCanvasProps = {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    width?: string;
    height?: string;
    fitView?: boolean;
  };

  let {
    nodes = $bindable([]),
    edges = $bindable([]),
    width = '100%',
    height = '400px',
    fitView = true,
  }: DiagramCanvasProps = $props();

  const nodeTypes: NodeTypes = {
    circle: CircleNode,
    box: BoxNode,
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
    elementsSelectable={false}
    panOnDrag={true}
    zoomOnScroll={true}
    minZoom={0.2}
    maxZoom={4}
    proOptions={{ hideAttribution: true }}>
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
</style>
