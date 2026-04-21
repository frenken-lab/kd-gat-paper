<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getSmoothStepPath,
    type EdgeProps,
  } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import type { FlowEdgeData } from '../types.ts';

  let {
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    data,
    markerEnd,
  }: EdgeProps<FlowEdgeData> = $props();

  let stroke = $derived(resolve(data?.color).stroke);
  let dashed = $derived(data?.dashed ? '4 3' : 'none');

  let [edgePath, labelX, labelY] = $derived(
    getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
  );
</script>

<BaseEdge
  {id}
  path={edgePath}
  {markerEnd}
  style="stroke: {stroke}; stroke-width: 1px; stroke-dasharray: {dashed};"
/>

{#if data?.label}
  <EdgeLabel x={labelX} y={labelY}>
    <div class="flow-label">
      {data.label}
    </div>
  </EdgeLabel>
{/if}

<style>
  .flow-label {
    position: absolute;
    transform: translate(-50%, -50%);
    font-size: 7px;
    color: #666;
    font-style: italic;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    background: white;
    padding: 1px 3px;
    border-radius: 2px;
  }
</style>
