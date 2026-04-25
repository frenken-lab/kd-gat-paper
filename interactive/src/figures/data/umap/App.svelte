<script>
  import Figure from "../../../lib/Figure.svelte";
  import {
    Plot,
    Dot,
    Density,
    Line,
    BrushX,
    HTMLTooltip,
    densityX,
    densityY,
  } from "svelteplot";
  import { useToggleFilter } from "../../../lib/useToggleFilter.svelte.js";
  import { resolve } from "../../../lib/flow/palette.ts";
  import data from "./data.json";

  // ============================================================================
  // Reactivity map
  // ----------------------------------------------------------------------------
  //   visible : { Attack: bool, Normal: bool }              ← class on/off
  //     mutated by  toggle(t) on button onclick (one occurrence below)
  //     read by     {#if visible[t]} — 3 gates wrapping 4 layers, plus the
  //                                    visiblePoints derivation feeding the
  //                                    HTMLTooltip search tree.
  //
  //   density : { bandwidth, thresholds }                   ← KDE knobs
  //     mutated by  range slider input events (bind:value below)
  //     read by     <Density bandwidth={...} thresholds={...} /> only
  //                 (densityX / densityY use Silverman's rule, not these)
  //
  //   brush : { enabled, x1, x2, y1, y2 }                   ← UMAP-1 slice
  //     mutated by  drag on main panel (bound to <BrushX bind:brush />)
  //                 OR onclick of "Reset brush" → brush.enabled = false
  //     read by     pointsBrushed (derived) → flows into <Density>,
  //                 densityX, densityY in all 3 panels. Dot is intentionally
  //                 NOT brushed (canonical "highlight + link" pattern: full
  //                 scatter stays visible so the unselected context is legible).
  //
  // Static (computed once at module init):
  //   pointsByType[t]  per-class arrays — fed to Dot (always full)
  //   colorMap[t]      per-class hex (palette role lookup, see styles.yml)
  //   {x1,y1,x2,y2}    pinned axis domains — toggling/brushing does NOT
  //                    reflow the axes because every Plot's x/y domain is fixed.
  //
  // Derived (recomputed on state change):
  //   pointsBrushed[t] pointsByType[t] ∩ brush.x-range when brush.enabled,
  //                    else pointsByType[t]. Drives Density + densityX/Y.
  //   visiblePoints    flat array across all visible classes; HTMLTooltip
  //                    builds its quadtree from this so toggled-off classes
  //                    don't show on hover.
  // ============================================================================

  // data.json shape: { points, bounds, metrics }
  // svelteplot computes 2D KDE (Density), 1D marginal KDEs (densityX/Y), and
  // marching-squares contours from `points` directly — no Python preprocessing.
  const isEmpty = !data || !data.points || data.points.length === 0;

  const { visible, toggle, types } = useToggleFilter(
    () => (isEmpty ? [] : data.points),
    (d) => d.attack_type,
  );

  const attackTypes = isEmpty
    ? []
    : [...new Set(data.points.map((d) => d.attack_type))];
  const paletteKeys = ["normal", "attack", "gat", "dqn", "data", "attention", "kd"];
  const colorMap = Object.fromEntries(
    attackTypes.map((t, i) => {
      const match = paletteKeys.find((k) => k === t.toLowerCase());
      const key = match ?? paletteKeys[i % paletteKeys.length];
      return [t, resolve(key).stroke];
    }),
  );

  const pointsByType = Object.fromEntries(
    attackTypes.map((t) => [t, isEmpty ? [] : data.points.filter((d) => d.attack_type === t)]),
  );

  const { x1, y1, x2, y2 } = isEmpty
    ? { x1: 0, y1: 0, x2: 1, y2: 1 }
    : data.bounds;

  // ─── Reactive controls ────────────────────────────────────────────────────
  let density = $state({ bandwidth: 20, thresholds: 12 });
  let brush = $state({ enabled: false });

  // pointsBrushed[t]: per-class points filtered by brush x-range. When the
  // brush is off (or the user dragged a zero-width brush), passes through to
  // pointsByType[t] unchanged. Drag direction is normalized so dragging
  // right-to-left works the same as left-to-right.
  const pointsBrushed = $derived.by(() => {
    if (!brush.enabled || brush.x1 == null || brush.x2 == null) {
      return pointsByType;
    }
    const lo = Math.min(+brush.x1, +brush.x2);
    const hi = Math.max(+brush.x1, +brush.x2);
    return Object.fromEntries(
      attackTypes.map((t) => [t, pointsByType[t].filter((d) => d.x >= lo && d.x <= hi)]),
    );
  });

  // visiblePoints: flat union across visible classes — fed to HTMLTooltip so
  // hovering a hidden class returns no match.
  const visiblePoints = $derived(
    isEmpty ? [] : data.points.filter((d) => visible[d.attack_type]),
  );
</script>

<Figure title="UMAP Projections of GAT Embeddings">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <!-- Row 1 — class toggles + (only when brushing is active) a brush reset.
         Toggle blast radius: onclick → toggle(t) flips visible[t] → 3
         {#if visible[t]} gates re-render only the t-iteration that changed. -->
    <div class="controls">
      {#each types as t}
        <button
          class="toggle"
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button
        >
      {/each}
      {#if brush.enabled}
        <button class="toggle" onclick={() => (brush.enabled = false)}
          >Reset brush</button
        >
      {/if}
    </div>

    <!-- Row 2 — density-control sliders. Bound to `density` $state object.
         Bandwidth: Gaussian σ in screen pixels (passed to <Density>).
         Thresholds: number of stacked iso-density bands.
         Marginal KDEs (densityX / densityY) deliberately use Silverman's
         rule; their bandwidth is not slider-driven for now. -->
    <div class="controls sliders">
      <label
        >Bandwidth: <strong>{density.bandwidth}px</strong>
        <input
          type="range"
          min={5}
          max={60}
          step={1}
          bind:value={density.bandwidth}
        />
      </label>
      <label
        >Thresholds: <strong>{density.thresholds}</strong>
        <input
          type="range"
          min={4}
          max={30}
          step={1}
          bind:value={density.thresholds}
        />
      </label>
    </div>

    <!-- 2×2 grid layout (CSS .plot-with-marginal):
            ┌──────────────┬─────┐
            │ top marginal │  ·  │   ← row 1: x-axis density
            ├──────────────┼─────┤
            │   main plot  │ rt  │   ← row 2: scatter + 2D density / y density
            └──────────────┴─────┘
         Each panel is its own <Plot>; their x/y domains are pinned to
         [x1,x2]/[y1,y2] so the three coordinate spaces stay aligned. -->
    <div class="plot-with-marginal">
      <!-- ── Panel 1/3: top marginal (1D KDE along UMAP 1) ──────────────────── -->
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
          marginRight={0}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              <!-- densityX is a TRANSFORM, not a mark. Spread injects x/y
                   bindings into <Line>. Uses pointsBrushed so the curve
                   re-fits to the brushed slice when the user drags the brush. -->
              <Line
                {...densityX(
                  { data: pointsBrushed[t], x: "x" },
                  { kernel: "gaussian" },
                )}
                stroke={colorMap[t]}
                strokeWidth={1.5}
              />
            {/if}
          {/each}
        </Plot>
      </div>

      <!-- ── Panel 2/3: main scatter + 2D KDE contours ──────────────────────── -->
      <div class="marginal-main">
        <Plot
          height={400}
          width={580}
          x={{ domain: [x1, x2], label: "UMAP 1" }}
          y={{ domain: [y1, y2], label: "UMAP 2" }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
          marginLeft={40}
          marginRight={0}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              <!-- 2D Gaussian KDE → marching-squares iso-density bands.
                     data         pointsBrushed[t]: per-class ∩ brush x-range.
                                  When brush off: full per-class set.
                     bandwidth    bound to slider; Gaussian σ in SCREEN PIXELS.
                     thresholds   bound to slider; number of stacked bands.
                     fill/stroke  per-class constant. ("density" is a special
                                  keyword that maps each band's value through
                                  the plot's color scale — not used here.)
                     fillOpacity  low so 12 stacked bands accumulate into a
                                  soft gradient toward the mode. -->
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
                strokeWidth={0.6}
              />
              <!-- Scatter overlay — uses pointsByType (NOT pointsBrushed) so
                   the unselected context stays visible while brushing. -->
              <Dot
                data={pointsByType[t]}
                x="x"
                y="y"
                fill={colorMap[t]}
                r={1.8}
                opacity={0.5}
              />
            {/if}
          {/each}

          <!-- BrushX: drag on the panel to define an x-range. Bindable state
               (`bind:brush`) flows into pointsBrushed (above), which re-fits
               <Density> + the marginal KDEs. limitDimension="x" disables
               y-axis dragging — selection is on UMAP 1 only. -->
          <BrushX bind:brush />

          <!-- HTMLTooltip: quadtree-based nearest-point lookup. Uses
               visiblePoints so toggled-off classes never show on hover.
               IMPORTANT: HTMLTooltip renders the snippet unconditionally
               from initial mount, passing `datum: false` until the user
               hovers. The {#if datum} guard prevents `false.x.toFixed(...)`
               from throwing and tearing down the whole panel.
               The .tooltip class is themed in src/lib/theme.css. -->
          <HTMLTooltip data={visiblePoints} x="x" y="y">
            {#snippet children({ datum })}
              {#if datum}
                <div class="tooltip">
                  <strong style="color: {colorMap[datum.attack_type]}"
                    >{datum.attack_type}</strong
                  >
                  <div>UMAP 1: {datum.x.toFixed(2)}</div>
                  <div>UMAP 2: {datum.y.toFixed(2)}</div>
                </div>
              {/if}
            {/snippet}
          </HTMLTooltip>
        </Plot>
      </div>

      <!-- ── Panel 3/3: right marginal (1D KDE along UMAP 2) ────────────────── -->
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
          marginRight={0}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              <!-- densityY: same transform as densityX but for the y axis.
                   Returns {x: density, y}-pair records — density is now the
                   horizontal channel, so the curve runs vertically. Uses
                   pointsBrushed: the y-distribution IS the brushed slice. -->
              <Line
                {...densityY(
                  { data: pointsBrushed[t], y: "y" },
                  { kernel: "gaussian" },
                )}
                stroke={colorMap[t]}
                strokeWidth={1.5}
              />
            {/if}
          {/each}
        </Plot>
      </div>
    </div>

    <!-- Separability metrics — precomputed in Python (tools/pull_data.py
         build_umap) from the full point set. NOTE: these do NOT update with
         the brush; they describe the global separability of the embedding,
         not the current selection. Three independent measures:
           wasserstein_2d   earth-mover distance, UMAP coordinate units
           energy_distance  statistical divergence (0 = identical distributions)
           overlap_integral ∫ kde_a · kde_b dx dy (≈ 0 ⇒ no spatial overlap) -->
    <div class="metrics">
      <span>Wasserstein: <strong>{data.metrics.wasserstein_2d}</strong></span>
      <span>Energy dist: <strong>{data.metrics.energy_distance}</strong></span>
      <span
        >KDE overlap: <strong
          >{data.metrics.overlap_integral.toExponential(1)}</strong
        ></span
      >
    </div>
  {/if}
</Figure>
