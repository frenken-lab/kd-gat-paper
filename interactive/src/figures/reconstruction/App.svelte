<script>
  import Figure from '../../lib/Figure.svelte';
  import { Plot, RectY, Line, Cell, RuleY, binX } from 'svelteplot';
  import { useToggleFilter } from '../../lib/useToggleFilter.svelte.js';
  import { resolve } from '../../lib/diagram/palette.ts';
  import data from "./data.json";

  const isEmpty = !data?.kde;

  const { visible, toggle, types, filtered: filteredKde } = useToggleFilter(
    () => isEmpty ? [] : data.kde,
    d => d.component,
  );
  const filteredRoc = $derived(isEmpty ? [] : data.roc.filter(d => visible[d.component]));

  const componentColors = [
    resolve('vgae').stroke,     // Node Recon
    resolve('gat').stroke,      // CAN ID
    resolve('dqn').stroke,      // Neighbor
    resolve('kd').stroke,       // KL
  ];
</script>

<Figure title="VGAE Reconstruction Error Decomposition">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as c}
        <button class="toggle" class:active={visible[c]} class:inactive={!visible[c]} onclick={() => toggle(c)}>{c}</button>
      {/each}
    </div>

    <h4>Component Distributions</h4>
    <Plot height={280}
      x={{ label: 'Error Value' }} y={{ label: 'Count' }}
      color={{
        domain: ['Node Recon', 'CAN ID', 'Neighbor', 'KL'],
        range: componentColors,
        legend: true,
      }}
      fy={{ label: '' }}>
      <RectY {...binX({ data: filteredKde, x: 'value', fill: 'component', fy: 'class' }, { y: 'count' })} opacity={0.7} />
      <RuleY data={[0]} />
    </Plot>

    <h4>Error Heatmap</h4>
    <Plot padding={0} height={160} marginLeft={80}
      x={{ type: 'band', label: 'Component' }}
      y={{ type: 'band', axis: false }}
      color={{ scheme: 'YlOrRd', label: 'Error', legend: true }}>
      <Cell data={data.heatmap} x="component" y="row" fill="value" inset={0.5} />
    </Plot>

    <h4>Per-Component ROC</h4>
    <Plot height={300}
      x={{ label: 'FPR', domain: [0, 1] }} y={{ label: 'TPR', domain: [0, 1] }}
      color={{
        domain: ['Node Recon', 'CAN ID', 'Neighbor', 'KL'],
        range: componentColors,
        legend: true,
      }}>
      <Line data={filteredRoc} x="fpr" y="tpr" stroke="component" strokeWidth={2} />
    </Plot>
  {/if}
</Figure>
