<script>
  import Figure from "../../lib/Figure.svelte";
  import { Plot, Dot } from "svelteplot";
  import { useToggleFilter } from "../../lib/useToggleFilter.svelte.js";
  import { resolve } from "../../lib/diagram/palette.ts";
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  const { visible, toggle, types, filtered } = useToggleFilter(
    () => (isEmpty ? [] : data),
    (d) => d.attack_type,
  );

  // Derive color domain and range from the data itself
  const attackTypes = isEmpty ? [] : [...new Set(data.map((d) => d.attack_type))];
  const paletteKeys = ["normal", "attack", "gat", "dqn", "data", "attention", "kd"];
  const attackTypeColors = attackTypes.map(
    (_, i) => resolve(paletteKeys[i % paletteKeys.length]).stroke,
  );
</script>

<Figure title="UMAP Projections of GAT Embeddings">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as t}
        <button
          class="toggle"
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button
        >
      {/each}
    </div>
    <Plot
      x={{ label: "UMAP 1" }}
      y={{ label: "UMAP 2" }}
      color={{
        domain: attackTypes,
        range: attackTypeColors,
        legend: true,
      }}
      height={500}
    >
      <Dot
        data={filtered}
        x="x"
        y="y"
        fill="attack_type"
        r={2.5}
        opacity={0.6}
      />
    </Plot>
  {/if}
</Figure>
