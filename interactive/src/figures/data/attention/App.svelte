<script lang="ts">
  import { Arrow, Dot, HTMLTooltip, Plot, Text } from 'svelteplot';

  import Figure from '../../../lib/Figure.svelte';
  import { getPaletteColor } from '../../../lib/palette.ts';
  import rawData from './data.json';

  // Guard against missing/malformed JSON — renders empty state instead of crashing
  const data = Array.isArray(rawData) ? rawData : [];
  const isEmpty = !Array.isArray(data) || data.length === 0;

  // States
  let selectedIdx = $state(0);
  let selectedLayer = $state(0);

  // Derive available attention layers from the first graph's edge keys
  const layers: number[] = isEmpty
    ? []
    : Object.keys(data[0].edges[0])
        .filter(k => k.match(/^layer_\d+_attention$/))
        .map(k => parseInt(k.split('_')[1]));

  // Other derived values
  const graph = $derived(isEmpty ? null : data[selectedIdx]);
  const attnKey = $derived(`layer_${selectedLayer}_attention`);
  const nodes = $derived(graph?.nodes || []);
  const edges = $derived(
    (graph?.edges || []).map(e => ({
      ...e,
      attention: e[attnKey as keyof typeof e] ?? 0,
    })),
  );

  // Palette colors
  const attackColor = getPaletteColor('attack').stroke;
  const normalColor = getPaletteColor('normal').stroke;
</script>

<Figure title="GAT Attention Weights">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      <label>
        Graph:
        <select bind:value={selectedIdx}>
          {#each data as g, i}
            <option value={i}>#{g.graph_idx} ({g.attack_type})</option>
          {/each}
        </select>
      </label>
      {#if layers.length > 1}
        {#each layers as l}
          <button
            class="toggle"
            class:selected={selectedLayer === l}
            onclick={() => (selectedLayer = l)}>L{l}</button>
        {/each}
      {/if}
      <span class="meta">{graph!.attack_type} | {nodes.length} nodes</span>
    </div>

    <Plot height={450} x={{ axis: false }} y={{ axis: false }} inset={10}>
      <Arrow
        data={edges}
        x1={e => nodes[e.source]?.x ?? 0}
        y1={e => nodes[e.source]?.y ?? 0}
        x2={e => nodes[e.target]?.x ?? 0}
        y2={e => nodes[e.target]?.y ?? 0}
        stroke="#666"
        strokeOpacity={e => 0.15 + e.attention * 0.85}
        strokeWidth={e => 0.5 + e.attention * 4} />
      <Dot
        data={nodes}
        x="x"
        y="y"
        r={8}
        fill={graph!.label === 1 ? attackColor : normalColor}
        stroke="white"
        strokeWidth={1.5} />
      <Text
        data={nodes}
        x="x"
        y="y"
        text="can_id"
        fontSize={8}
        fill="currentColor"
        textAnchor="middle"
        dy={-12} />
      {#snippet overlay()}
        <HTMLTooltip data={nodes} x="x" y="y">
          {#snippet children({ datum })}
            {#if datum}
              <div class="tooltip">
                <div>X: {datum.x}</div>
                <div>Y: {datum.y}</div>
              </div>
            {/if}
          {/snippet}
        </HTMLTooltip>
      {/snippet}
    </Plot>
  {/if}
</Figure>
