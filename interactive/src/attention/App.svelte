<script>
  import { Plot, Arrow, Dot, Text } from 'svelteplot';
  import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  // Graph + layer selection
  let selectedIdx = 0;
  let selectedLayer = 0;

  $: graph = isEmpty ? null : data[selectedIdx];

  // Detect available layers from first graph's edge keys
  const layerKeys = isEmpty ? [] :
    Object.keys(data[0].edges?.[0] || {}).filter(k => k.startsWith('layer_') && k.endsWith('_attention'));
  const layers = layerKeys.map(k => parseInt(k.split('_')[1]));

  // Run force simulation whenever graph changes
  let nodes = $state([]);
  let links = $state([]);

  $: if (graph) {
    const n = graph.nodes.map(d => ({ ...d, x: 0, y: 0 }));
    const attnKey = `layer_${selectedLayer}_attention`;
    const e = graph.edges.map(d => ({
      source: d.source,
      target: d.target,
      attention: d[attnKey] || 0,
    }));

    forceSimulation(n)
      .force('link', forceLink(e).id(d => d.id).distance(60))
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(0, 0))
      .force('collide', forceCollide(15))
      .stop()
      .tick(120);

    nodes = n;
    links = e;
  }
</script>

<div style="font-family: system-ui, sans-serif; max-width: 740px;">
  <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">
    GAT Attention Weights
  </h3>

  {#if isEmpty}
    <p style="color: #999; font-size: 12px;">Awaiting data export from KD-GAT</p>
  {:else}
    <!-- Controls -->
    <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 8px; font-size: 12px;">
      <label>
        Graph:
        <select bind:value={selectedIdx} style="font-size: 12px;">
          {#each data as g, i}
            <option value={i}>#{g.graph_idx} ({g.attack_type})</option>
          {/each}
        </select>
      </label>
      {#if layers.length > 1}
        <div style="display: flex; gap: 4px;">
          {#each layers as l}
            <button
              onclick={() => selectedLayer = l}
              style="
                padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px;
                background: {selectedLayer === l ? '#4E79A7' : '#f5f5f5'};
                color: {selectedLayer === l ? 'white' : '#333'};
                cursor: pointer; font-size: 12px;
              ">L{l}</button>
          {/each}
        </div>
      {/if}
      <span style="color: #666;">
        {graph.attack_type} | {graph.nodes.length} nodes, {graph.edges.length} edges
      </span>
    </div>

    <Plot
      height={450}
      x={{ axis: false, domain: [-200, 200] }}
      y={{ axis: false, domain: [-200, 200] }}
      inset={10}>
      <!-- Edges: width + opacity scaled by attention -->
      <Arrow
        data={links}
        x1={d => nodes[d.source.index ?? d.source]?.x ?? 0}
        y1={d => nodes[d.source.index ?? d.source]?.y ?? 0}
        x2={d => nodes[d.target.index ?? d.target]?.x ?? 0}
        y2={d => nodes[d.target.index ?? d.target]?.y ?? 0}
        stroke="#666"
        strokeOpacity={d => 0.15 + d.attention * 0.85}
        strokeWidth={d => 0.5 + d.attention * 4} />
      <!-- Nodes -->
      <Dot
        data={nodes}
        cx="x"
        cy="y"
        r={8}
        fill={graph.label === 1 ? '#E15759' : '#4E79A7'}
        stroke="white"
        strokeWidth={1.5} />
      <!-- Labels -->
      <Text
        data={nodes}
        x="x"
        y="y"
        text="can_id"
        fontSize={8}
        fill="currentColor"
        textAnchor="middle"
        dy={-12} />
    </Plot>
  {/if}
</div>
