<script lang="ts">
  import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import type { EncodedEdgeData } from '../types.ts';

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
  }: EdgeProps<EncodedEdgeData> = $props();

  let stroke = $derived(resolve(data?.color ?? 'attention').stroke);
  let weight = $derived(data?.weight ?? 0.5);
  let strokeWidth = $derived(0.5 + weight * 4);
  let strokeOpacity = $derived(0.3 + weight * 0.7);

  let edgePath = $derived(
    getStraightPath({ sourceX, sourceY, targetX, targetY })[0]
  );
</script>

<BaseEdge
  {id}
  path={edgePath}
  style="stroke: {stroke}; stroke-width: {strokeWidth}px; stroke-opacity: {strokeOpacity};"
/>
