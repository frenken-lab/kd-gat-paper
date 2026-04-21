<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getSmoothStepPath,
    type EdgeProps,
  } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import type { KDEdgeData } from '../types.ts';

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
  }: EdgeProps<KDEdgeData> = $props();

  let stroke = $derived(resolve(data?.color ?? 'kd').stroke);
  let label = $derived(data?.label ?? 'KD');

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
  style="stroke: {stroke}; stroke-width: 2px; stroke-dasharray: 6 4;"
/>

<EdgeLabel x={labelX + 10} y={labelY}>
  <div class="kd-label" style:color={stroke}>
    {label}
  </div>
</EdgeLabel>

<style>
  .kd-label {
    position: absolute;
    transform: translate(0, -50%);
    font-size: 9px;
    font-weight: bold;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
  }
</style>
