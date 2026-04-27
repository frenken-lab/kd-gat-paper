<script lang="ts">
  import {
    BaseEdge,
    EdgeLabel,
    getSmoothStepPath,
    useSvelteFlow,
    type EdgeProps,
  } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import { boundaryToward, getEdgeParams, roundedPolylinePath } from '../floating.ts';
  import type { KDEdgeData } from '../types.ts';

  let {
    id,
    source,
    target,
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

  const { getInternalNode } = useSvelteFlow();

  let routed = $derived.by(() => {
    const s = getInternalNode(source);
    const t = getInternalNode(target);
    if (!s?.measured?.width || !t?.measured?.width) return null;

    const bps = data?.bendPoints;
    if (bps && bps.length > 0) {
      const sCap = boundaryToward(s, bps[0]);
      const tCap = boundaryToward(t, bps[bps.length - 1]);
      const points = [sCap, ...bps, tCap];
      const mid = points[Math.floor(points.length / 2)];
      return { path: roundedPolylinePath(points, 6), labelX: mid.x, labelY: mid.y };
    }

    const params = getEdgeParams(s, t);
    const [path, lx, ly] = getSmoothStepPath({
      sourceX: params.sx,
      sourceY: params.sy,
      sourcePosition: params.sourcePos,
      targetX: params.tx,
      targetY: params.ty,
      targetPosition: params.targetPos,
    });
    return { path, labelX: lx, labelY: ly };
  });

  let fallback = $derived.by(() => {
    const [path, lx, ly] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
    });
    return { path, labelX: lx, labelY: ly };
  });

  let edgePath = $derived((routed ?? fallback).path);
  let labelX = $derived((routed ?? fallback).labelX);
  let labelY = $derived((routed ?? fallback).labelY);
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
