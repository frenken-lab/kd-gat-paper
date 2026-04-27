<script lang="ts">
  import { type NodeProps } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import type { ContainerNodeData } from '../types.ts';

  let { data }: NodeProps<ContainerNodeData> = $props();

  let stroke = $derived(resolve(data.color).stroke);
  let fill = $derived(resolve(data.color).fill);
</script>

<div
  class="container-node"
  style:border-color={stroke}
  style:background={fill}
>
  {#if data.label}
    <span class="label" style:color={stroke}>{data.label}</span>
  {/if}
</div>

<style>
  .container-node {
    width: 100%;
    height: 100%;
    border: 1px dashed;
    border-radius: 10px;
    position: relative;
  }

  /* Translucency comes from the palette: resolve().fill returns a hex color
     with "+40" alpha suffix (~25%), so the inline `background={fill}` is
     already see-through. No opacity rule needed here. */

  .label {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 7px;
    font-weight: bold;
    font-family: system-ui, -apple-system, sans-serif;
  }
</style>
