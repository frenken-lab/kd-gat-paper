<script lang="ts">
  import {
    AxisX,
    AxisY,
    binX,
    Cell,
    Line,
    Plot,
    Pointer,
    RectY,
    RuleX,
    RuleY,
  } from 'svelteplot';
  import { type DataRecord } from 'svelteplot/types/data.js';

  import Figure from '../../../lib/Figure.svelte';
  import { getPaletteColor } from '../../../lib/palette.ts';
  import { buildColorMap } from '../../../lib/usePaletteColors.svelte.ts';
  import { useToggleFilter } from '../../../lib/useToggleFilter.svelte.ts';
  import rawData from './data.json';

  interface KDEPoint extends DataRecord {
    component: string;
    value: number;
    class: string;
  }

  interface ROCPoint extends DataRecord {
    component: string;
    fpr: number;
    tpr: number;
  }

  interface HeatmapCell extends DataRecord {
    component: string;
    row: string;
    value: number;
  }

  interface ReconstructionData {
    kde: KDEPoint[];
    roc: ROCPoint[];
    heatmap: HeatmapCell[];
  }

  // Guard against missing/malformed JSON — renders empty state instead of crashing
  const data = rawData as ReconstructionData;
  const isEmpty = !data?.kde;

  // Toggle filter drives the component on/off buttons and filters the KDE series
  const {
    visible,
    toggle,
    types,
    filtered: filteredKde,
  } = useToggleFilter<KDEPoint>(
    () => (isEmpty ? [] : data.kde),
    d => d.component,
  );

  // ROC filter mirrors the same KDE visible state — no separate toggle needed
  const filteredRoc = $derived(
    isEmpty ? [] : data.roc.filter(d => visible[d.component]),
  );

  // Stable insertion-order component list, used to key both color map and plot layers
  const components: string[] = isEmpty
    ? []
    : [...new Set(data.kde.map(d => d.component))];

  // Palette colors for the four reconstruction components
  const componentColorMap = buildColorMap(components, [
    'blue',
    'orange',
    'green',
    'red',
  ]);
</script>

<Figure title="VGAE Reconstruction Error Decomposition">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as c (c)}
        <button
          class="toggle"
          style:--chip-color={componentColorMap[c]}
          class:active={visible[c]}
          class:inactive={!visible[c]}
          onclick={() => toggle(c)}>{c}</button>
      {/each}
    </div>

    <h4>Component Distributions</h4>
    <Plot height={280} x={{ label: 'Error Value' }} y={{ label: 'Count' }}>
      {#each components as c (c)}
        {#if visible[c]}
          <RectY
            {...binX(
              {
                data: filteredKde.filter((d: KDEPoint) => d.component === c),
                x: 'value',
                fy: 'class',
              },
              { y: 'count' },
            )}
            fill={componentColorMap[c]}
            opacity={0.7} />
        {/if}
      {/each}
      <RuleY data={[0]} />
    </Plot>

    <h4>Error Heatmap</h4>
    <Plot
      padding={0}
      height={160}
      marginLeft={12}
      x={{ type: 'band', label: 'Component' }}
      y={{ type: 'band', axis: false }}
      color={{
        type: 'linear',
        scheme: [
          getPaletteColor('yellow').stroke,
          getPaletteColor('red').stroke,
        ],
        label: 'Error',
        legend: true,
      }}>
      <Cell
        data={data.heatmap}
        x="component"
        y="row"
        fill="value"
        inset={0.5} />
    </Plot>

    <h4>Per-Component ROC</h4>
    <Plot
      height={300}
      marginLeft={30}
      x={{ label: 'FPR', domain: [0, 1] }}
      y={{ label: 'TPR', domain: [0, 1] }}>
      <AxisX />
      <AxisY />
      {#each components as c (c)}
        {#if visible[c]}
          <Line
            data={filteredRoc.filter((d: ROCPoint) => d.component === c)}
            x="fpr"
            y="tpr"
            stroke={componentColorMap[c]}
            strokeWidth={2} />
        {/if}
      {/each}
      <Pointer data={filteredRoc} x="fpr" y="tpr" maxDistance={30}>
        {#snippet children({ data: pts })}
          <RuleX data={pts} x="fpr" opacity="0.3" />
          <RuleY data={pts} y="tpr" opacity="0.3" />
          <AxisX
            data={pts.map((d: ROCPoint) => d.fpr)}
            tickFormat={d => d?.toString() || ''} />
          <AxisY
            data={pts.map((d: ROCPoint) => d.tpr)}
            tickFormat={d => d?.toString() || ''} />
        {/snippet}
      </Pointer>
    </Plot>
  {/if}
</Figure>
