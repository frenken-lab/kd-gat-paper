<script>
  import Figure from "../../../lib/Figure.svelte";
  import { Plot, RectY, RuleY, binX } from "svelteplot";
  import { useToggleFilter } from "../../../lib/useToggleFilter.svelte.js";
  import { buildColorMap } from "../../../lib/usePaletteColors.js";
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  const { visible, toggle, types, filtered } = useToggleFilter(
    () => (isEmpty ? [] : data),
    (d) => d.attack_type,
  );

  // Derive color domain from data so it adapts to both binary and multi-class exports
  const attackTypes = isEmpty
    ? []
    : [...new Set(data.map((d) => d.attack_type))];
  const colorMap = buildColorMap(attackTypes);
</script>

<Figure title="Bandit Fusion Weight Analysis">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as t}
        <button
          class="toggle"
          style:--chip-color={colorMap[t]}
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button
        >
      {/each}
    </div>
    <Plot
      x={{ label: "Fusion Weight α (0 = VGAE, 1 = GAT)" }}
      y={{ label: "Count" }}
    >
      {#each attackTypes as t}
        {#if visible[t]}
          <RectY
            {...binX(
              { data: filtered.filter((d) => d.attack_type === t), x: "alpha" },
              { y: "count" },
            )}
            fill={colorMap[t]}
          />
        {/if}
      {/each}
      <RuleY data={[0]} />
    </Plot>
  {/if}
</Figure>
