<script lang="ts">
  import {
    BrushX,
    Density,
    densityX,
    densityY,
    Dot,
    HTMLTooltip,
    Line,
    Plot,
  } from 'svelteplot';

  import Figure from '../../../lib/Figure.svelte';
  import { buildColorMap } from '../../../lib/usePaletteColors.svelte.ts';
  import { useToggleFilter } from '../../../lib/useToggleFilter.svelte.ts';
  import rawData from './data.json';

  type PointRecord = { x: number; y: number; label: number; attack_type: string };
  type DatasetEntry = {
    points: PointRecord[];
    bounds: { x1: number; y1: number; x2: number; y2: number };
    metrics: { overlap_integral: number; wasserstein_2d: number; energy_distance: number };
  };

  const data = rawData;
  const isEmpty = !data?.datasets || Object.keys(data.datasets).length === 0;

  const datasets = isEmpty ? [] : Object.keys(data.datasets as Record<string, unknown>).sort();
  let selectedDataset = $state(datasets[0] ?? '');

  const currentData = $derived(
    isEmpty ? null : (data.datasets as Record<string, DatasetEntry>)[selectedDataset],
  );

  // Attack types are stable across datasets (binary: Normal/Attack) — build color map once
  const attackTypes: string[] = isEmpty
    ? []
    : [
        ...new Set(
          Object.values(data.datasets as Record<string, DatasetEntry>).flatMap(d =>
            d.points.map(p => p.attack_type),
          ),
        ),
      ];
  const colorMap = buildColorMap(attackTypes);

  // Per-dataset split by type — recalculated when selectedDataset changes
  const pointsByType = $derived(
    Object.fromEntries(
      attackTypes.map(t => [
        t,
        currentData ? currentData.points.filter(p => p.attack_type === t) : [],
      ]),
    ),
  );

  const { visible, toggle, types } = useToggleFilter(
    () => currentData?.points ?? [],
    (d: PointRecord) => d.attack_type,
  );

  const bounds = $derived(currentData?.bounds ?? { x1: 0, y1: 0, x2: 1, y2: 1 });

  // Subsample per-class points for KDE only — scatter still uses full pointsByType.
  // KDE quality doesn't improve past ~400 points; this cuts marching-squares cost 4-5×.
  const DENSITY_SAMPLE = 400;
  const densityByType = $derived(
    Object.fromEntries(
      attackTypes.map(t => {
        const pts = pointsBrushed[t];
        if (pts.length <= DENSITY_SAMPLE) return [t, pts];
        const step = Math.ceil(pts.length / DENSITY_SAMPLE);
        return [t, pts.filter((_, i) => i % step === 0)];
      }),
    ),
  );

  // ─── Reactive controls ────────────────────────────────────────────────────
  let brush = $state({
    enabled: false,
    x1: null as number | null,
    x2: null as number | null,
  });

  // Reset brush on dataset switch — each projection has a different x-range
  $effect(() => {
    selectedDataset;
    brush = { enabled: false, x1: null, x2: null };
  });

  const pointsBrushed = $derived.by(() => {
    if (!brush.enabled || brush.x1 == null || brush.x2 == null) return pointsByType;
    const lo = Math.min(+brush.x1, +brush.x2);
    const hi = Math.max(+brush.x1, +brush.x2);
    return Object.fromEntries(
      attackTypes.map(t => [t, pointsByType[t].filter(d => d.x >= lo && d.x <= hi)]),
    );
  });

  const visiblePoints = $derived(
    currentData ? currentData.points.filter(d => visible[d.attack_type]) : [],
  );
</script>

<Figure title="UMAP Projections of GAT Embeddings">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <!-- Dataset selector -->
    <div class="dataset-tabs">
      {#each datasets as ds}
        <button class:active={ds === selectedDataset} onclick={() => (selectedDataset = ds)}>
          {ds}
        </button>
      {/each}
    </div>

    <!-- Class toggles + brush reset when active -->
    <div class="controls">
      {#each types as t (t)}
        <button
          class="toggle"
          style:--chip-color={colorMap[t]}
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button>
      {/each}
      {#if brush.enabled}
        <button class="toggle" onclick={() => (brush.enabled = false)}>Reset brush</button>
      {/if}
    </div>

    <!-- 2×2 marginal layout: top KDE / main scatter / right KDE -->
    <div class="plot-with-marginal">
      <!-- Panel 1/3: top marginal — 1D KDE along UMAP 1 -->
      <div class="marginal-top">
        <Plot
          width={580}
          height={80}
          x={{ domain: [bounds.x1, bounds.x2] }}
          grid={false}
          frame={false}
          axes={false}
          inset={0}
          marginTop={0}
          marginBottom={5}
          marginLeft={40}
          marginRight={0}>
          {#each attackTypes as t (t)}
            {#if visible[t]}
              <Line
                {...densityX({ data: densityByType[t], x: 'x' }, { kernel: 'gaussian' })}
                stroke={colorMap[t]}
                strokeWidth={1.5} />
            {/if}
          {/each}
        </Plot>
      </div>

      <!-- Panel 2/3: main scatter + 2D KDE contours -->
      <div class="marginal-main">
        <Plot
          height={400}
          width={580}
          x={{ domain: [bounds.x1, bounds.x2], label: 'UMAP 1' }}
          y={{ domain: [bounds.y1, bounds.y2], label: 'UMAP 2' }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
          marginLeft={40}
          marginRight={0}>
          {#each attackTypes as t (t)}
            {#if visible[t]}
              <Density
                data={densityByType[t]}
                x="x"
                y="y"
                bandwidth={20}
                thresholds={6}
                fill={colorMap[t]}
                fillOpacity={0.08}
                stroke={colorMap[t]}
                strokeOpacity={0.35}
                strokeWidth={0.6} />
              <Dot
                data={pointsByType[t]}
                x="x"
                y="y"
                fill={colorMap[t]}
                r={1.8}
                opacity={0.5} />
            {/if}
          {/each}

          <BrushX bind:brush />

          <HTMLTooltip data={visiblePoints} x="x" y="y">
            {#snippet children({ datum })}
              {#if datum}
                <div class="tooltip">
                  <strong style="color: {colorMap[datum.attack_type]}"
                    >{datum.attack_type}</strong>
                  <div>UMAP 1: {datum.x.toFixed(2)}</div>
                  <div>UMAP 2: {datum.y.toFixed(2)}</div>
                </div>
              {/if}
            {/snippet}
          </HTMLTooltip>
        </Plot>
      </div>

      <!-- Panel 3/3: right marginal — 1D KDE along UMAP 2 -->
      <div class="marginal-right">
        <Plot
          width={80}
          height={400}
          y={{ domain: [bounds.y1, bounds.y2] }}
          grid={false}
          frame={false}
          axes={false}
          inset={0}
          marginTop={0}
          marginBottom={35}
          marginLeft={10}
          marginRight={0}>
          {#each attackTypes as t (t)}
            {#if visible[t]}
              <Line
                {...densityY({ data: densityByType[t], y: 'y' }, { kernel: 'gaussian' })}
                stroke={colorMap[t]}
                strokeWidth={1.5} />
            {/if}
          {/each}
        </Plot>
      </div>
    </div>

    <!-- Separability metrics — precomputed in Python, reflect the full point set -->
    {#if currentData}
      <div class="metrics">
        <span>Wasserstein: <strong>{currentData.metrics.wasserstein_2d}</strong></span>
        <span>Energy dist: <strong>{currentData.metrics.energy_distance}</strong></span>
        <span
          >KDE overlap: <strong
            >{currentData.metrics.overlap_integral.toExponential(1)}</strong
          ></span>
      </div>
    {/if}
  {/if}
</Figure>

<style>
  .dataset-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .dataset-tabs button {
    padding: 3px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 12px;
  }
  .dataset-tabs button.active {
    background: #1a6faf;
    color: white;
    border-color: #1a6faf;
  }
</style>
