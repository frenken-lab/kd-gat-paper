<script lang="ts">
  import { Handle, type NodeProps, Position } from '@xyflow/svelte';

  let { data }: NodeProps = $props();

  let w = $state(0);
  let h = $state(0);

  const shape = $derived(data.shape as string | undefined);
  const line = $derived((data.line as 'solid' | 'dashed' | undefined) ?? 'dashed');
  const padding = $derived(data.padding as string | undefined);
  const isSvgShape = $derived(
    shape === 'trapezoid-r' || shape === 'trapezoid-l' || shape === 'parallelogram'
  );
  // GSN shapes share ContainerNode: circle / stadium / oval = high border-radius;
  // parallelogram = SVG polygon (see polygon block below).
  const borderRadius = $derived(
    shape === 'rectangle'
      ? '0'
      : shape === 'circle' || shape === 'oval'
        ? '50%'
        : shape === 'stadium'
          ? '9999px'
          : '10px'
  );
  // GSN: hollow-diamond decorator on undeveloped Goals/Strategies.
  const undeveloped = $derived(Boolean(data.undeveloped));
  const skew = 0.05;
  const xskew = 0.1; // horizontal skew for parallelogram (Strategy)
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
    {@const xs = w * xskew}
    {@const svgH = h + 2 * s}
    {@const pts =
      shape === 'trapezoid-r'
        ? `0,0 ${w},${s} ${w},${h + s} 0,${svgH}`
        : shape === 'trapezoid-l'
          ? `0,${s} ${w},0 ${w},${svgH} 0,${h + s}`
          : // parallelogram (GSN Strategy): top and bottom horizontal,
            // left and right slanted at +xs (top) / 0 (bottom).
            `${xs},0 ${w},0 ${w - xs},${h} 0,${h}`}
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
  {#if undeveloped}
    <!-- GSN hollow-diamond decorator: signals "claim awaiting further support" -->
    <span class="undeveloped-mark" aria-label="undeveloped"></span>
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

  /* GSN undeveloped decorator — hollow diamond at bottom-center of node.
     Visually signals "claim awaiting further support" per SCSC GSN v3 §1:2.1.4. */
  .undeveloped-mark {
    position: absolute;
    bottom: -8px;
    left: 50%;
    width: 12px;
    height: 12px;
    transform: translateX(-50%) rotate(45deg);
    background: white;
    border: 1px solid currentColor;
    z-index: 2;
    pointer-events: none;
  }
</style>
