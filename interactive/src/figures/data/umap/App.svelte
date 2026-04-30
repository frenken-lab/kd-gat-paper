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
  import { type DataRecord } from 'svelteplot/types/data.js';

  import Figure from '../../../lib/Figure.svelte';
  import { buildColorMap } from '../../../lib/usePaletteColors.svelte.ts';
  import { useToggleFilter } from '../../../lib/useToggleFilter.svelte.ts';
  import rawData from './data.json';

  interface UMAPPoint extends DataRecord {
    attack_type: string;
    x: number;
    y: number;
  }

  interface UMAPBounds {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }

  interface UMAPMetrics {
    wasserstein_2d: number;
    energy_distance: number;
    overlap_integral: number;
  }

  interface UMAPData {
    points: UMAPPoint[];
    bounds: UMAPBounds;
    metrics: UMAPMetrics;
  }

  // ============================================================================
  // Reactivity map
  // ----------------------------------------------------------------------------
  //   visible : { Attack: bool, Normal: bool }              ← class on/off
  //     mutated by  toggle(t) on button onclick
  //     read by     {#if visible[t]} gates + visiblePoints derivation
  //
  //   density : { bandwidth, thresholds }                   ← KDE knobs
  //     mutated by  range slider bind:value
  //     read by     <Density bandwidth={...} thresholds={...} /> only
  //
  //   brush : { enabled, x1, x2 }                          ← UMAP-1 slice
  //     mutated by  drag on main panel (BrushX) or "Reset brush" button
  //     read by     pointsBrushed → <Density> + marginal KDEs
  //                 Dot intentionally NOT brushed (highlight+link pattern)
  //
  // Static (computed once at module init):
  //   pointsByType[t]  per-class arrays — fed to Dot (always full)
  //   colorMap[t]      per-class hex from shared palette
  //   {x1,y1,x2,y2}   pinned axis domains — toggling/brushing does NOT reflow
  //
  // Derived (recomputed on state change):
  //   pointsBrushed[t] pointsByType[t] ∩ brush.x-range; drives Density + KDEs
  //   visiblePoints    flat union across visible classes; feeds HTMLTooltip
  // ============================================================================

  // Guard against missing/malformed JSON — renders empty state instead of crashing
  const data = rawData as UMAPData;
  const isEmpty = !data?.points?.length;

  const { visible, toggle, types } = useToggleFilter<UMAPPoint>(
    () => (isEmpty ? [] : data.points),
    d => d.attack_type,
  );

  // Stable insertion-order list of unique attack types for consistent color assignment
  const attackTypes: string[] = isEmpty
    ? []
    : [...new Set(data.points.map(d => d.attack_type))];
  const colorMap = buildColorMap(attackTypes);

  // Pre-split by type so Dot layers never re-filter on every render
  const pointsByType: Record<string, UMAPPoint[]> = Object.fromEntries(
    attackTypes.map(t => [
      t,
      isEmpty ? [] : data.points.filter(d => d.attack_type === t),
    ]),
  );

  const { x1, y1, x2, y2 } = isEmpty
    ? { x1: 0, y1: 0, x2: 1, y2: 1 }
    : data.bounds;

  // ─── Reactive controls ────────────────────────────────────────────────────
  let density = $state({ bandwidth: 20, thresholds: 12 });
  let brush = $state({
    enabled: false,
    x1: null as number | null,
    x2: null as number | null,
  });

  // pointsBrushed[t]: per-class points filtered by brush x-range. Drag direction
  // is normalized so right-to-left works the same as left-to-right.
  const pointsBrushed = $derived.by(() => {
    if (!brush.enabled || brush.x1 == null || brush.x2 == null)
      return pointsByType;
    const lo = Math.min(+brush.x1, +brush.x2);
    const hi = Math.max(+brush.x1, +brush.x2);
    return Object.fromEntries(
      attackTypes.map(t => [
        t,
        pointsByType[t].filter(d => d.x >= lo && d.x <= hi),
      ]),
    );
  });

  // visiblePoints: flat union across visible classes — HTMLTooltip quadtree source
  const visiblePoints = $derived(
    isEmpty ? [] : data.points.filter(d => visible[d.attack_type]),
  );
</script>

<Figure title="UMAP Projections of GAT Embeddings">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
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
        <button class="toggle" onclick={() => (brush.enabled = false)}
          >Reset brush</button>
      {/if}
    </div>

    <!-- KDE control sliders — bandwidth (Gaussian σ) and iso-density band count -->
    <div class="controls sliders">
      <label>
        Bandwidth: <strong>{density.bandwidth}px</strong>
        <input
          type="range"
          min={5}
          max={60}
          step={1}
          bind:value={density.bandwidth} />
      </label>
      <label>
        Thresholds: <strong>{density.thresholds}</strong>
        <input
          type="range"
          min={4}
          max={30}
          step={1}
          bind:value={density.thresholds} />
      </label>
    </div>

    <!-- 2×2 marginal layout: top KDE / main scatter / right KDE
         All three panels share pinned [x1,x2]/[y1,y2] domains so axes stay aligned. -->
    <div class="plot-with-marginal">
      <!-- Panel 1/3: top marginal — 1D KDE along UMAP 1 -->
      <div class="marginal-top">
        <Plot
          width={580}
          height={80}
          x={{ domain: [x1, x2] }}
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
              <!-- densityX is a transform, not a mark — spread injects x/y into Line.
                   Uses pointsBrushed so the curve re-fits to the brushed slice. -->
              <Line
                {...densityX(
                  { data: pointsBrushed[t], x: 'x' },
                  { kernel: 'gaussian' },
                )}
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
          x={{ domain: [x1, x2], label: 'UMAP 1' }}
          y={{ domain: [y1, y2], label: 'UMAP 2' }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
          marginLeft={40}
          marginRight={0}>
          {#each attackTypes as t (t)}
            {#if visible[t]}
              <!-- 2D Gaussian KDE → marching-squares iso-density bands.
                   fillOpacity low so stacked bands accumulate into a soft gradient. -->
              <Density
                data={pointsBrushed[t]}
                x="x"
                y="y"
                bandwidth={density.bandwidth}
                thresholds={density.thresholds}
                fill={colorMap[t]}
                fillOpacity={0.08}
                stroke={colorMap[t]}
                strokeOpacity={0.35}
                strokeWidth={0.6} />
              <!-- Scatter uses pointsByType (NOT pointsBrushed) so unselected
                   context stays visible while brushing — highlight+link pattern. -->
              <Dot
                data={pointsByType[t]}
                x="x"
                y="y"
                fill={colorMap[t]}
                r={1.8}
                opacity={0.5} />
            {/if}
          {/each}

          <!-- BrushX: drag to define an x-range; flows into pointsBrushed -->
          <BrushX bind:brush />

          <!-- HTMLTooltip: quadtree nearest-point lookup over visible classes only.
               {#if datum} guard prevents datum=false from throwing on initial mount. -->
          <HTMLTooltip data={visiblePoints} x="x" y="y">
            {#snippet children({ datum }: { datum: UMAPPoint | null })}
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
          y={{ domain: [y1, y2] }}
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
              <!-- densityY: same as densityX but vertical — density becomes the x channel -->
              <Line
                {...densityY(
                  { data: pointsBrushed[t], y: 'y' },
                  { kernel: 'gaussian' },
                )}
                stroke={colorMap[t]}
                strokeWidth={1.5} />
            {/if}
          {/each}
        </Plot>
      </div>
    </div>

    <!-- Separability metrics — precomputed in Python, describe global embedding quality.
         These do NOT update with the brush; they reflect the full point set. -->
    <div class="metrics">
      <span>Wasserstein: <strong>{data.metrics.wasserstein_2d}</strong></span>
      <span>Energy dist: <strong>{data.metrics.energy_distance}</strong></span>
      <span
        >KDE overlap: <strong
          >{data.metrics.overlap_integral.toExponential(1)}</strong
        ></span>
    </div>
  {/if}
</Figure>
