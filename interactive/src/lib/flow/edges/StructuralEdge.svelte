<script lang="ts">
  import {
    BaseEdge,
    type Edge,
    type EdgeProps,
    getStraightPath,
    useSvelteFlow,
  } from '@xyflow/svelte';

  import { getPaletteColor } from '../../palette.ts';
  import { getEdgeParams } from '../floating.ts';
  import type { StructuralEdgeData } from '../types.ts';

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

  let stroke = $derived(getPaletteColor(data?.color).stroke);
  let highlighted = $derived(data?.highlighted ?? false);
  let strokeOpacity = $derived(highlighted ? 0.85 : 0.4);
  let strokeWidth = $derived(highlighted ? 2 : 1);

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
  style="stroke: {stroke}; stroke-opacity: {strokeOpacity}; stroke-width: {strokeWidth}px;" />
