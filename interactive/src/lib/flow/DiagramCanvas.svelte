<script lang="ts">
  import {
    SvelteFlow,
    Background,
    Controls,
    MiniMap,
    MarkerType,
    type NodeTypes,
    type EdgeTypes,
    type DefaultEdgeOptions,
  } from '@xyflow/svelte';
  import '@xyflow/svelte/dist/style.css';
  import 'virtual:theme-vars.css';

  import CircleNode from './nodes/CircleNode.svelte';
  import BoxNode from './nodes/BoxNode.svelte';
  import ContainerNode from './nodes/ContainerNode.svelte';

  import StructuralEdge from './edges/StructuralEdge.svelte';
  import FlowEdge from './edges/FlowEdge.svelte';
  import KDEdge from './edges/KDEdge.svelte';
  import EncodedEdge from './edges/EncodedEdge.svelte';

  import DesignPanel from './DesignPanel.svelte';
  import type { DiagramNode, DiagramEdge } from './types.ts';

  let {
    nodes = $bindable([]),
    edges = $bindable([]),
    interactive = false,
    direction = 'LR',
    width = '100%',
    height = '400px',
    fitView = true,
  }: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    interactive?: boolean;
    direction?: 'LR' | 'TB';
    width?: string;
    height?: string;
    fitView?: boolean;
  } = $props();

  const nodeTypes: NodeTypes = {
    circle: CircleNode,
    box: BoxNode,
    container: ContainerNode,
  };

  const edgeTypes: EdgeTypes = {
    structural: StructuralEdge,
    flow: FlowEdge,
    kd: KDEdge,
    encoded: EncodedEdge,
  };

  const defaultEdgeOptions: DefaultEdgeOptions = {
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
  };

  const isDev = import.meta.env.DEV;
</script>

<div class="diagram-canvas" style:width style:height>
  <SvelteFlow
    bind:nodes
    bind:edges
    {nodeTypes}
    {edgeTypes}
    {defaultEdgeOptions}
    {fitView}
    nodesDraggable={interactive || isDev}
    nodesConnectable={interactive}
    elementsSelectable={interactive || isDev}
    panOnDrag={true}
    zoomOnScroll={true}
    minZoom={0.2}
    maxZoom={4}
    proOptions={{ hideAttribution: true }}
  >
    {#if isDev}
      <Background />
      <Controls />
      <MiniMap />
      <DesignPanel bind:nodes bind:edges {direction} />
    {/if}
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
