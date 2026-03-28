<script>
  import Figure from '../../lib/FigureDefaults.svelte';
  import { Plot, Dot } from 'svelteplot';
  import { useToggleFilter } from '../../lib/useToggleFilter.svelte.js';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  const { visible, toggle, types, filtered } = useToggleFilter(
    () => isEmpty ? [] : data,
    d => d.attack_type,
  );
</script>

<Figure title="UMAP Projections of GAT Embeddings">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as t}
        <button class="toggle" class:active={visible[t]} class:inactive={!visible[t]} onclick={() => toggle(t)}>{t}</button>
      {/each}
    </div>
    <Plot
      x={{ label: 'UMAP 1' }} y={{ label: 'UMAP 2' }}
      color={{
        domain: ['Benign', 'Dos', 'Fuzzy', 'Gear', 'Rpm', 'Flooding', 'Malfunction'],
        range: ['#4E79A7', '#E15759', '#F28E2B', '#59A14F', '#76B7B2', '#B07AA1', '#9C755F'],
        legend: true,
      }}
      height={500}>
      <Dot data={filtered} x="x" y="y" fill="attack_type" r={2.5} opacity={0.6} />
    </Plot>
  {/if}
</Figure>
