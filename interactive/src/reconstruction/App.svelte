<script>
  import { Plot, RectY, Line, Cell, RuleY, binX } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !data?.kde;

  const components = ['Node Recon', 'CAN ID', 'Neighbor', 'KL'];
  let visible = Object.fromEntries(components.map(c => [c, true]));
  function toggle(c) { visible[c] = !visible[c]; visible = { ...visible }; }

  $: kde = isEmpty ? [] : data.kde.filter(d => visible[d.component]);
  $: roc = isEmpty ? [] : data.roc.filter(d => visible[d.component]);
</script>

<div style="font-family: system-ui, sans-serif; max-width: 760px;">
  <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">VGAE Reconstruction Error Decomposition</h3>

  {#if isEmpty}
    <p style="color: #999; font-size: 12px;">Awaiting data export from KD-GAT</p>
  {:else}
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
      {#each components as c}
        <button onclick={() => toggle(c)} style="padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px; background: {visible[c] ? '#eef' : '#f5f5f5'}; cursor: pointer; font-size: 12px; opacity: {visible[c] ? 1 : 0.4};">{c}</button>
      {/each}
    </div>

    <h4 style="margin: 0 0 4px; font-size: 12px; color: #666;">Component Distributions</h4>
    <Plot grid height={280} x={{ label: 'Error Value' }} y={{ label: 'Count' }} color={{ legend: true }} fy={{ label: '' }}>
      <RectY {...binX({ data: kde, x: 'value', fill: 'component', fy: 'class' }, { y: 'count' })} opacity={0.7} />
      <RuleY data={[0]} />
    </Plot>

    <h4 style="margin: 16px 0 4px; font-size: 12px; color: #666;">Error Heatmap</h4>
    <Plot padding={0} height={160} marginLeft={80} x={{ type: 'band', label: 'Component' }} y={{ type: 'band', axis: false }} color={{ scheme: 'YlOrRd', label: 'Error', legend: true }}>
      <Cell data={data.heatmap} x="component" y="row" fill="value" inset={0.5} />
    </Plot>

    <h4 style="margin: 16px 0 4px; font-size: 12px; color: #666;">Per-Component ROC</h4>
    <Plot grid height={300} x={{ label: 'FPR', domain: [0, 1] }} y={{ label: 'TPR', domain: [0, 1] }} color={{ legend: true }}>
      <Line data={roc} x="fpr" y="tpr" stroke="component" strokeWidth={2} />
    </Plot>
  {/if}
</div>
