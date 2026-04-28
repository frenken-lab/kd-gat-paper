<script lang="ts">
  import {
    BaseEdge,
    getStraightPath,
    useSvelteFlow,
    type Edge,
    type EdgeProps,
  } from "@xyflow/svelte";
  import { resolve } from "../palette.ts";
  import { getEdgeParams } from "../floating.ts";
  import type { EncodedEdgeData } from "../types.ts";

  let {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
  }: EdgeProps<Edge<EncodedEdgeData>> = $props();

  let stroke = $derived(resolve(data?.color ?? "attention").stroke);
  let weight = $derived(data?.weight ?? 0.5);
  let strokeWidth = $derived(0.5 + weight * 4);
  let strokeOpacity = $derived(0.3 + weight * 0.7);

  const { getInternalNode } = useSvelteFlow();

  let edgePath = $derived.by(() => {
    const s = getInternalNode(source);
    const t = getInternalNode(target);
    if (s?.measured?.width && t?.measured?.width) {
      const p = getEdgeParams(s, t);
      return getStraightPath({
        sourceX: p.sx,
        sourceY: p.sy,
        targetX: p.tx,
        targetY: p.ty,
      })[0];
    }
    return getStraightPath({ sourceX, sourceY, targetX, targetY })[0];
  });
</script>

<BaseEdge
  {id}
  path={edgePath}
  style="stroke: {stroke}; stroke-width: {strokeWidth}px; stroke-opacity: {strokeOpacity};"
/>
