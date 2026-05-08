<script lang="ts">
  import type { NodeProps } from '@xyflow/svelte';

  let { data }: NodeProps = $props();

  const color = $derived(data.color as string | undefined);
  const label = $derived(data.label as string | undefined);
</script>

<div
  class="group-node"
  style:border-color={color}
  style:background={color ? `${color}0d` : undefined}
>
  {#if label}
    <span class="group-label" style:color={color}>{label}</span>
  {/if}
</div>

<style>
  .group-node {
    width: 100%;
    height: 100%;
    border: 1.5px dashed #bbb;
    border-radius: 8px;
    position: relative;
    box-sizing: border-box;
    pointer-events: none;
  }

  .group-label {
    position: absolute;
    top: 5px;
    left: 9px;
    font-size: 8px;
    font-weight: bold;
    font-family: system-ui, -apple-system, sans-serif;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    opacity: 0.6;
    pointer-events: none;
  }
</style>
