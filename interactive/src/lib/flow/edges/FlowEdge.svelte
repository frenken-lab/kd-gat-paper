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
  import type { FlowEdgeData } from '../types.ts';

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
  }: EdgeProps<FlowEdgeData> = $props();

  let stroke = $derived(resolve(data?.color).stroke);
  let strokeWidth = $derived(data?.strokeWidth ?? 1);
  let dashArr = $derived(
    data?.dashArray ?? (data?.dashed ? '4 3' : 'none'),
  );

  let labelColor = $derived(data?.labelOnStroke ? stroke : '#666');
  let labelOffsetX = $derived(data?.labelOffsetX ?? 0);
  let labelBold = $derived(data?.boldLabel ?? false);
  let labelLeftAlign = $derived(data?.labelLeftAlign ?? false);

  const { getInternalNode } = useSvelteFlow();

  // Path construction has two regimes:
  //   - bendPoints present (ELK routed this edge around obstacles): cap each
  //     end with a floating-edge intersection toward the first/last bend
  //     point, then render a rounded polyline through all of them.
  //   - no bendPoints (straight inter- or intra-component): fall back to the
  //     floating + getSmoothStepPath path.
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
  style="stroke: {stroke}; stroke-width: {strokeWidth}px; stroke-dasharray: {dashArr};"
/>

{#if data?.label}
  <EdgeLabel x={labelX + labelOffsetX} y={labelY}>
    <div
      class="flow-label"
      class:bold={labelBold}
      class:left-align={labelLeftAlign}
      style:color={labelColor}
    >
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

  .flow-label.bold {
    font-weight: bold;
    font-style: normal;
    font-size: 9px;
    background: transparent;
    padding: 0;
  }

  .flow-label.left-align {
    transform: translate(0, -50%);
  }
</style>
