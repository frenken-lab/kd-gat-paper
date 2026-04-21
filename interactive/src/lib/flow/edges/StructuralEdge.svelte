<script lang="ts">
  import { BaseEdge, getStraightPath, type EdgeProps } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import type { StructuralEdgeData } from '../types.ts';

  let {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
  }: EdgeProps<StructuralEdgeData> = $props();

  let stroke = $derived(resolve(data?.color).stroke);

  let edgePath = $derived(
    getStraightPath({ sourceX, sourceY, targetX, targetY })[0]
  );
</script>

<BaseEdge
  {id}
  path={edgePath}
  style="stroke: {stroke}; stroke-opacity: 0.4; stroke-width: 1px;"
/>
