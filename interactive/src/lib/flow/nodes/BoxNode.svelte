<script lang="ts">
  import { Handle, Position, type Node, type NodeProps } from '@xyflow/svelte';
  import { getPaletteColor } from '../../palette.ts';
  import type { BoxNodeData } from '../types.ts';

  let { data }: NodeProps<Node<BoxNodeData>> = $props();

  let w = $derived(data.width ?? 90);
  let h = $derived(data.height ?? 32);
  let stroke = $derived(getPaletteColor(data.color).stroke);
  let fill = $derived(getPaletteColor(data.color).fill);
</script>

<Handle type="target" position={Position.Left} />
<Handle type="target" position={Position.Top} id="top" />

<div
  class="box-node"
  style:width="{w}px"
  style:height="{h}px"
  style:background={fill}
  style:border-color={stroke}>
  {#if data.label}
    <span class="label">{data.label}</span>
  {/if}
</div>

<Handle type="source" position={Position.Right} />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .box-node {
    border-radius: 6px;
    border: 1.5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    cursor: grab;
  }

  .label {
    color: #333;
    font-size: 9px;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    line-height: 1.2;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }
</style>
