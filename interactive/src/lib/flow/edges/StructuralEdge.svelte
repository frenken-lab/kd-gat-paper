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
  import type { StructuralEdgeData } from "../types.ts";

  let {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
  }: EdgeProps<Edge<StructuralEdgeData>> = $props();

  let stroke = $derived(resolve(data?.color).stroke);

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
  style="stroke: {stroke}; stroke-opacity: 0.4; stroke-width: 1px;"
/>
