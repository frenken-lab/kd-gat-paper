<script lang="ts">
  import { Handle, Position, type NodeProps } from '@xyflow/svelte';
  import { resolve } from '../palette.ts';
  import type { CircleNodeData } from '../types.ts';

  let { data }: NodeProps<CircleNodeData> = $props();

  let r = $derived(data.r ?? 14);
  let size = $derived(r * 2);
  let stroke = $derived(resolve(data.color).stroke);
  let fill = $derived(resolve(data.color).fill);
</script>

<Handle type="target" position={Position.Left} />
<Handle type="target" position={Position.Top} id="top" />

<div
  class="circle-node"
  style:width="{size}px"
  style:height="{size}px"
  style:background={fill}
  style:border-color={stroke}
  style:font-size="{r < 10 ? 4 : 6}px"
>
  {#if data.label}
    <span class="label">{data.label}</span>
  {/if}
</div>

<Handle type="source" position={Position.Right} />
<Handle type="source" position={Position.Bottom} id="bottom" />

<style>
  .circle-node {
    border-radius: 50%;
    border: 1.5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
  }

  .label {
    color: #333;
    font-family: 'CMU Typewriter Text', monospace;
    line-height: 1;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 90%;
  }
</style>
