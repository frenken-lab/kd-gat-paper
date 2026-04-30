<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  let { data }: NodeProps = $props();

  let w = $state(0);
  let h = $state(0);

  const shape = $derived(data.shape as string | undefined);
  const line = $derived((data.line as 'solid' | 'dashed' | undefined) ?? 'dashed');
  const padding = $derived(data.padding as string | undefined);
  const isSvgShape = $derived(shape === 'trapezoid-r' || shape === 'trapezoid-l');
  const borderRadius = $derived(shape === 'rectangle' ? '0' : '10px');
  const skew = 0.05;
</script>

<Handle type="target" position={Position.Left} />
<Handle type="target" position={Position.Top} id="top" />
<Handle type="source" position={Position.Right} />
<Handle type="source" position={Position.Bottom} id="bottom" />

<div
  class="container-node"
  class:svg-shape={isSvgShape}
  style={isSvgShape ? '' : (data.style as string)}
  style:border-style={isSvgShape ? undefined : line}
  style:border-radius={isSvgShape ? undefined : borderRadius}
  style:padding={padding}
  bind:clientWidth={w}
  bind:clientHeight={h}
>
  {#if isSvgShape && w && h}
    {@const s = h * skew}
    {@const svgH = h + 2 * s}
    {@const pts =
      shape === 'trapezoid-r'
        ? `0,0 ${w},${s} ${w},${h + s} 0,${svgH}`
        : `0,${s} ${w},0 ${w},${svgH} 0,${h + s}`}
    <svg
      class="shape-svg"
      width={w}
      height={svgH}
      style={`top: ${-s}px;`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon
        points={pts}
        fill={data.bgColor as string}
        stroke={data.borderColor as string}
        stroke-width="1"
        stroke-dasharray={line === 'solid' ? undefined : '4 3'}
      />
    </svg>
  {/if}
  {#if data.label}
    <span class="label" style={data.labelStyle as string}>{data.label as string}</span>
  {/if}
</div>

<style>
  .container-node {
    width: 100%;
    height: 100%;
    border: 1px;
    position: relative;
    box-sizing: border-box;
  }

  .container-node.svg-shape {
    border: none;
    border-radius: 0;
  }

  /* Translucency comes from the palette: resolve().fill returns a hex color
     with "+40" alpha suffix (~25%), so the inline background is already see-through. */

  .shape-svg {
    position: absolute;
    left: 0;
    pointer-events: none;
  }

  .label {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 7px;
    font-weight: bold;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    z-index: 1;
  }
</style>
