<script>
  import Figure from '../lib/FigureDefaults.svelte';
  import { Plot, Dot } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;
  let types = isEmpty ? [] : [...new Set(data.map(d => d.attack_type))];
  let visible = Object.fromEntries(types.map(t => [t, true]));
  function toggle(t) { visible[t] = !visible[t]; visible = { ...visible }; }
  $: filtered = isEmpty ? [] : data.filter(d => visible[d.attack_type]);
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
    <Plot x={{ label: 'UMAP 1' }} y={{ label: 'UMAP 2' }} color={{ legend: true }} height={500}>
      <Dot data={filtered} x="x" y="y" fill="attack_type" r={2.5} opacity={0.6} />
    </Plot>
  {/if}
</Figure>
