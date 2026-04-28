<script>
  import Figure from "../../../lib/Figure.svelte";
  import { Plot, Dot, HTMLTooltip } from "svelteplot";
  import { useToggleFilter } from "../../../lib/useToggleFilter.svelte.js";
  import { buildColorMap } from "../../../lib/usePaletteColors.js";
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  const { visible, toggle, types, filtered } = useToggleFilter(
    () => (isEmpty ? [] : data),
    (d) => d.model_type,
  );

  const modelTypes = isEmpty ? [] : [...new Set(data.map((d) => d.model_type))];
  const colorMap = buildColorMap(modelTypes);

  // Scale param count to a reasonable dot radius (px): sqrt scaling keeps area proportional
  const maxParams = isEmpty ? 1 : Math.max(...data.map((d) => d.params));
  const rScale = (params) => 4 + 18 * Math.sqrt(params / maxParams);
</script>

<Figure title="Model Performance vs. Parameter Count">
  {#if isEmpty}
    <p class="empty">No data available</p>
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
      x={{ label: "F1 Score", domain: [0.7, 1.0] }}
      y={{ label: "Accuracy", domain: [0.75, 1.0] }}
      grid={true}
    >
      {#each modelTypes as t}
        {#if visible[t]}
          <Dot
            data={filtered.filter((d) => d.model_type === t)}
            x="f1"
            y="accuracy"
            r={(d) => rScale(d.params)}
            fill={colorMap[t]}
            fillOpacity={0.65}
            stroke={colorMap[t]}
            strokeWidth={1.5}
          />
        {/if}
      {/each}

      <HTMLTooltip data={filtered} x="f1" y="accuracy">
        {#snippet children({ datum })}
          {#if datum}
            <div class="tooltip">
              <strong style="color: {colorMap[datum.model_type]}"
                >{datum.model}</strong
              >
              <div>Type: {datum.model_type}</div>
              <div>F1: {datum.f1.toFixed(3)}</div>
              <div>Accuracy: {datum.accuracy.toFixed(3)}</div>
              <div>Params: {(datum.params / 1e6).toFixed(2)}M</div>
            </div>
          {/if}
        {/snippet}
      </HTMLTooltip>
    </Plot>

    <div class="meta" style="font-size:11px; margin-top:4px;">
      Bubble size ∝ √(parameter count)
    </div>
  {/if}
</Figure>
