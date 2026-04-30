<script lang="ts">
  import { Dot, HTMLTooltip, Plot } from 'svelteplot';

  import Figure from '../../../lib/Figure.svelte';
  import { buildColorMap } from '../../../lib/usePaletteColors.svelte.ts';
  import { useToggleFilter } from '../../../lib/useToggleFilter.svelte.ts';
  import rawData from './data.json';

  interface Model {
    model: string;
    model_type: string;
    f1: number;
    accuracy: number;
    params: number;
  }

  // Guard against missing/malformed JSON — renders empty state instead of crashing
  const data: Model[] = Array.isArray(rawData) ? (rawData as Model[]) : [];
  const isEmpty = data.length === 0;

  // Stable insertion-order list of unique model types, used to key both the
  // color map and the per-type Dot layers so each type gets a consistent color
  const modelTypes = [...new Set(data.map(d => d.model_type))];
  const colorMap = buildColorMap(modelTypes);

  // Toggle filter tracks which model types are visible
  const { visible, toggle, types, filtered } = useToggleFilter<Model>(
    () => data,
    d => d.model_type,
  );

  // Radius uses √(params) so bubble *area* (∝ r²) is proportional to param count.
  const maxParams = isEmpty ? 1 : Math.max(...data.map(d => d.params));
  const rScale = (params: number): number =>
    4 + 18 * Math.sqrt(params / maxParams);

  // Converts raw param count to a human-readable "XM" string for the tooltip
  const formatParams = (params: number): string =>
    `${(params / 1e6).toFixed(2)}M`;
</script>

<Figure title="Model Performance vs. Parameter Count">
  {#if isEmpty}
    <p class="empty">No data available</p>
  {:else}
    <div class="controls">
      {#each types as t (t)}
        <button
          class="toggle"
          style:--chip-color={colorMap[t]}
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button>
      {/each}
    </div>

    <Plot
      x={{ label: 'F1 Score', domain: [0.7, 1.0] }}
      y={{ label: 'Accuracy', domain: [0.75, 1.0] }}
      grid={true}>
      {#each modelTypes as t (t)}
        {#if visible[t]}
          <Dot
            data={filtered.filter((d: Model) => d.model_type === t)}
            x="f1"
            y="accuracy"
            r={(d: Model) => rScale(d.params)}
            fill={colorMap[t]}
            fillOpacity={0.65}
            stroke={colorMap[t]}
            strokeWidth={1.5} />
        {/if}
      {/each}

      {#snippet overlay()}
        <HTMLTooltip data={filtered} x="f1" y="accuracy">
          {#snippet children({ datum }: { datum: Model | null })}
            {#if datum}
              <div class="tooltip">
                <strong style="color: {colorMap[datum.model_type]}"
                  >{datum.model}</strong>
                <div>Type: {datum.model_type}</div>
                <div>F1: {datum.f1.toFixed(3)}</div>
                <div>Accuracy: {datum.accuracy.toFixed(3)}</div>
                <div>Params: {formatParams(datum.params)}</div>
              </div>
            {/if}
          {/snippet}
        </HTMLTooltip>
      {/snippet}
    </Plot>

    <div class="meta" style="font-size:11px; margin-top:4px;">
      Bubble size ∝ √(parameter count)
    </div>
  {/if}
</Figure>
