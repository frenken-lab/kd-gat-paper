<script>
  import Figure from '../lib/FigureDefaults.svelte';
  import { Plot, Arrow, Dot, Text } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;
  let selectedIdx = 0;
  let selectedLayer = 0;

  $: graph = isEmpty ? null : data[selectedIdx];
  const layers = isEmpty ? [] : Object.keys(data[0].edges?.[0] || {}).filter(k => k.match(/^layer_\d+_attention$/)).map(k => parseInt(k.split('_')[1]));
  $: attnKey = `layer_${selectedLayer}_attention`;
  $: nodes = graph?.nodes || [];
  $: edges = (graph?.edges || []).map(e => ({ ...e, attention: e[attnKey] || 0 }));
</script>

<Figure title="GAT Attention Weights">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      <label>Graph:
        <select bind:value={selectedIdx}>
          {#each data as g, i}<option value={i}>#{g.graph_idx} ({g.attack_type})</option>{/each}
        </select>
      </label>
      {#if layers.length > 1}
        {#each layers as l}
          <button class="toggle" class:selected={selectedLayer === l} onclick={() => selectedLayer = l}>L{l}</button>
        {/each}
      {/if}
      <span class="meta">{graph.attack_type} | {nodes.length} nodes</span>
    </div>

    <Plot height={450} x={{ axis: false }} y={{ axis: false }} inset={10}>
      <Arrow data={edges} x1={e => nodes[e.source]?.x ?? 0} y1={e => nodes[e.source]?.y ?? 0} x2={e => nodes[e.target]?.x ?? 0} y2={e => nodes[e.target]?.y ?? 0} stroke="#666" strokeOpacity={e => 0.15 + e.attention * 0.85} strokeWidth={e => 0.5 + e.attention * 4} />
      <Dot data={nodes} cx="x" cy="y" r={8} fill={graph.label === 1 ? '#E15759' : '#4E79A7'} stroke="white" strokeWidth={1.5} />
      <Text data={nodes} x="x" y="y" text="can_id" fontSize={8} fill="currentColor" textAnchor="middle" dy={-12} />
    </Plot>
  {/if}
</Figure>
