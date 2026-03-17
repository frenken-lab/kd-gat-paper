<script>
  import { Plot, RectY, Line, Cell, Text, RuleY, binX } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  const components = [
    { key: 'node_error', label: 'Node Recon' },
    { key: 'canid_error', label: 'CAN ID' },
    { key: 'neighbor_error', label: 'Neighbor' },
    { key: 'kl_error', label: 'KL' },
  ];

  // Check if per-component data exists
  const hasComponents = !isEmpty && data[0].node_error !== undefined;

  // For KDE panel: flatten into {value, component, class} records
  let kdeData = [];
  if (hasComponents) {
    for (const d of data) {
      const cls = d.label === 0 ? 'Normal' : 'Attack';
      for (const c of components) {
        kdeData.push({ value: d[c.key], component: c.label, class: cls });
      }
    }
  }

  // For heatmap panel: sort by composite error, sample to 200
  let heatData = [];
  if (hasComponents) {
    const sorted = [...data].sort((a, b) => a.composite_error - b.composite_error);
    const step = Math.max(1, Math.floor(sorted.length / 200));
    for (let i = 0; i < sorted.length; i += step) {
      const d = sorted[i];
      const row = String(Math.floor(i / step));
      for (const c of components) {
        heatData.push({ row, component: c.label, value: d[c.key], label: d.label });
      }
    }
  }

  // For ROC panel: compute ROC per component
  let rocData = [];
  if (hasComponents) {
    for (const c of components) {
      const scored = data.map(d => ({ score: d[c.key], label: d.label }))
        .sort((a, b) => b.score - a.score);
      const nPos = scored.filter(d => d.label === 1).length;
      const nNeg = scored.length - nPos;
      if (nPos === 0 || nNeg === 0) continue;
      let tp = 0, fp = 0;
      // Sample ~100 points for the curve
      const step = Math.max(1, Math.floor(scored.length / 100));
      for (let i = 0; i < scored.length; i += step) {
        for (let j = (i === 0 ? 0 : i - step + 1); j <= i && j < scored.length; j++) {
          if (scored[j].label === 1) tp++; else fp++;
        }
        rocData.push({ fpr: fp / nNeg, tpr: tp / nPos, component: c.label });
      }
      // Ensure endpoint
      rocData.push({ fpr: 1, tpr: 1, component: c.label });
    }
  }

  // Toggle state for component visibility
  let visibleComponents = Object.fromEntries(components.map(c => [c.label, true]));
  function toggle(label) {
    visibleComponents[label] = !visibleComponents[label];
    visibleComponents = { ...visibleComponents };
  }

  $: filteredKde = kdeData.filter(d => visibleComponents[d.component]);
  $: filteredRoc = rocData.filter(d => visibleComponents[d.component]);
</script>

<div style="font-family: system-ui, sans-serif; max-width: 760px;">
  <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">
    VGAE Reconstruction Error Decomposition
  </h3>

  {#if isEmpty}
    <p style="color: #999; font-size: 12px;">Awaiting data export from KD-GAT</p>
  {:else if !hasComponents}
    <p style="color: #999; font-size: 12px;">
      Per-component errors not available. Re-run evaluation with updated pipeline.
    </p>
  {:else}
    <!-- Component toggles -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
      {#each components as c}
        <button
          onclick={() => toggle(c.label)}
          style="
            padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px;
            background: {visibleComponents[c.label] ? '#eef' : '#f5f5f5'};
            cursor: pointer; font-size: 12px;
            opacity: {visibleComponents[c.label] ? 1 : 0.4};
          ">{c.label}</button>
      {/each}
    </div>

    <!-- Panel 1: Error distributions -->
    <h4 style="margin: 0 0 4px; font-size: 12px; color: #666;">Component Distributions (Normal vs Attack)</h4>
    <Plot
      grid
      height={280}
      x={{ label: 'Error Value' }}
      y={{ label: 'Count' }}
      color={{ legend: true }}
      fy={{ label: '' }}>
      <RectY
        {...binX(
          { data: filteredKde, x: 'value', fill: 'component', fy: 'class' },
          { y: 'count' }
        )}
        opacity={0.7} />
      <RuleY data={[0]} />
    </Plot>

    <!-- Panel 2: Error heatmap -->
    <h4 style="margin: 16px 0 4px; font-size: 12px; color: #666;">Error Heatmap (samples sorted by composite error)</h4>
    <Plot
      padding={0}
      height={160}
      marginLeft={80}
      x={{ type: 'band', label: 'Component' }}
      y={{ type: 'band', axis: false }}
      color={{ scheme: 'YlOrRd', label: 'Error', legend: true }}>
      <Cell
        data={heatData}
        x="component"
        y="row"
        fill="value"
        inset={0.5} />
    </Plot>

    <!-- Panel 3: Per-component ROC curves -->
    <h4 style="margin: 16px 0 4px; font-size: 12px; color: #666;">Per-Component ROC Curves</h4>
    <Plot
      grid
      height={300}
      x={{ label: 'False Positive Rate', domain: [0, 1] }}
      y={{ label: 'True Positive Rate', domain: [0, 1] }}
      color={{ legend: true }}>
      <Line
        data={filteredRoc}
        x="fpr"
        y="tpr"
        stroke="component"
        strokeWidth={2} />
      <!-- Diagonal reference -->
      <Line
        data={[{ fpr: 0, tpr: 0, component: 'Random' }, { fpr: 1, tpr: 1, component: 'Random' }]}
        x="fpr"
        y="tpr"
        strokeDasharray="4 4"
        stroke="#999"
        strokeWidth={1} />
    </Plot>
  {/if}
</div>
