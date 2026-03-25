<script>
  import Figure from '../lib/FigureDefaults.svelte';
  import { Plot, RectY, Line, Cell, RuleY, binX } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !data?.kde;
  const components = ['Node Recon', 'CAN ID', 'Neighbor', 'KL'];
  let visible = Object.fromEntries(components.map(c => [c, true]));
  function toggle(c) { visible[c] = !visible[c]; visible = { ...visible }; }
  $: kde = isEmpty ? [] : data.kde.filter(d => visible[d.component]);
  $: roc = isEmpty ? [] : data.roc.filter(d => visible[d.component]);
</script>

<Figure title="VGAE Reconstruction Error Decomposition">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each components as c}
        <button class="toggle" class:active={visible[c]} class:inactive={!visible[c]} onclick={() => toggle(c)}>{c}</button>
      {/each}
    </div>

    <h4>Component Distributions</h4>
    <Plot height={280} x={{ label: 'Error Value' }} y={{ label: 'Count' }} color={{ domain: ['Node Recon', 'CAN ID', 'Neighbor', 'KL'], range: ['#4E79A7', '#F28E2B', '#59A14F', '#E15759'], legend: true }} fy={{ label: '' }}>
      <RectY {...binX({ data: kde, x: 'value', fill: 'component', fy: 'class' }, { y: 'count' })} opacity={0.7} />
      <RuleY data={[0]} />
    </Plot>

    <h4>Error Heatmap</h4>
    <Plot padding={0} height={160} marginLeft={80} x={{ type: 'band', label: 'Component' }} y={{ type: 'band', axis: false }} color={{ scheme: 'YlOrRd', label: 'Error', legend: true }}>
      <Cell data={data.heatmap} x="component" y="row" fill="value" inset={0.5} />
    </Plot>

    <h4>Per-Component ROC</h4>
    <Plot height={300} x={{ label: 'FPR', domain: [0, 1] }} y={{ label: 'TPR', domain: [0, 1] }} color={{ domain: ['Node Recon', 'CAN ID', 'Neighbor', 'KL'], range: ['#4E79A7', '#F28E2B', '#59A14F', '#E15759'], legend: true }}>
      <Line data={roc} x="fpr" y="tpr" stroke="component" strokeWidth={2} />
    </Plot>
  {/if}
</Figure>
