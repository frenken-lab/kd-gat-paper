<script>
  import { Plot, Arrow, Dot, Text } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  let selectedIdx = 0;
  let selectedLayer = 0;

  $: graph = isEmpty ? null : data[selectedIdx];

  // Detect layers from first graph's edge keys
  const layers = isEmpty ? [] :
    Object.keys(data[0].edges?.[0] || {}).filter(k => k.match(/^layer_\d+_attention$/)).map(k => parseInt(k.split('_')[1]));

  $: attnKey = `layer_${selectedLayer}_attention`;
  $: nodes = graph?.nodes || [];
  $: edges = (graph?.edges || []).map(e => ({ ...e, attention: e[attnKey] || 0 }));
</script>

<div style="font-family: system-ui, sans-serif; max-width: 740px;">
  <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">GAT Attention Weights</h3>

  {#if isEmpty}
    <p style="color: #999; font-size: 12px;">Awaiting data export from KD-GAT</p>
  {:else}
    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 8px; font-size: 12px;">
      <label>Graph:
        <select bind:value={selectedIdx} style="font-size: 12px;">
          {#each data as g, i}<option value={i}>#{g.graph_idx} ({g.attack_type})</option>{/each}
        </select>
      </label>
      {#if layers.length > 1}
        <div style="display: flex; gap: 4px;">
          {#each layers as l}
            <button onclick={() => selectedLayer = l} style="padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px; background: {selectedLayer === l ? '#4E79A7' : '#f5f5f5'}; color: {selectedLayer === l ? 'white' : '#333'}; cursor: pointer; font-size: 12px;">L{l}</button>
          {/each}
        </div>
      {/if}
      <span style="color: #666;">{graph.attack_type} | {nodes.length} nodes</span>
    </div>

    <Plot height={450} x={{ axis: false }} y={{ axis: false }} inset={10}>
      <Arrow data={edges} x1={e => nodes[e.source]?.x ?? 0} y1={e => nodes[e.source]?.y ?? 0} x2={e => nodes[e.target]?.x ?? 0} y2={e => nodes[e.target]?.y ?? 0} stroke="#666" strokeOpacity={e => 0.15 + e.attention * 0.85} strokeWidth={e => 0.5 + e.attention * 4} />
      <Dot data={nodes} cx="x" cy="y" r={8} fill={graph.label === 1 ? '#E15759' : '#4E79A7'} stroke="white" strokeWidth={1.5} />
      <Text data={nodes} x="x" y="y" text="can_id" fontSize={8} fill="currentColor" textAnchor="middle" dy={-12} />
    </Plot>
  {/if}
</div>
