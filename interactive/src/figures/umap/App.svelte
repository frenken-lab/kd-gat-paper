<script>
  import Figure from "../../lib/Figure.svelte";
  import { Plot, Dot, Contour, Line, RectY, RectX } from "svelteplot";
  import { useToggleFilter } from "../../lib/useToggleFilter.svelte.js";
  import { resolve } from "../../lib/diagram/palette.ts";
  import data from "./data.json";

  // data.json shape: { points, bounds, density, hulls, marginals, metrics }
  const isEmpty = !data || !data.points || data.points.length === 0;

  // Toggle filter: tracks which attack_type classes are visible.
  // `filtered` is the subset of points with visible classes (drives the Dot mark).
  // `visible` is a reactive {[attack_type]: bool} controlling all layers.
  const { visible, toggle, types, filtered } = useToggleFilter(
    () => (isEmpty ? [] : data.points),
    (d) => d.attack_type,
  );

  // Unique attack types and their resolved palette colors.
  // colorMap is used by every layer: contour, hull, scatter, marginals.
  const attackTypes = isEmpty ? [] : [...new Set(data.points.map((d) => d.attack_type))];
  const paletteKeys = ["normal", "attack", "gat", "dqn", "data", "attention", "kd"];
  const colorMap = Object.fromEntries(
    attackTypes.map((t, i) => [t, resolve(paletteKeys[i % paletteKeys.length]).stroke]),
  );

  // Convert precomputed histogram (bin_edges + bin_density arrays) into
  // records that RectY/RectX can plot as bars: [{start, end, density}, ...]
  function binRecords(edges, density) {
    return density.map((d, i) => ({ start: edges[i], end: edges[i + 1], density: d }));
  }

  // Shared coordinate bounds (precomputed from ALL points with 5% padding).
  // Pins the Plot domain and Contour grid to the same coordinate space.
  const { x1, y1, x2, y2 } = isEmpty ? { x1: 0, y1: 0, x2: 1, y2: 1 } : data.bounds;
</script>

<Figure title="UMAP Projections of GAT Embeddings">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <!-- Class toggle buttons — control visibility of ALL layers for each class -->
    <div class="controls">
      {#each types as t}
        <button
          class="toggle"
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button>
      {/each}
    </div>

    <!-- Top marginal panel: x-axis distribution per class.
         Histogram bars (RectY) + smooth KDE curve (Line).
         Shares x domain with main plot for alignment. -->
    <h4>X Marginal</h4>
    <Plot
      height={80}
      x={{ domain: [x1, x2], axis: null }}
      y={{ axis: null }}
      grid={false}
      frame={false}
      inset={0}
      marginBottom={0}
      marginTop={5}
    >
      {#each attackTypes as t}
        {#if visible[t]}
          <!-- Histogram bars: precomputed 30 bins, density-normalized -->
          {@const bins = binRecords(data.marginals[t].x.bin_edges, data.marginals[t].x.bin_density)}
          <RectY data={bins} x1="start" x2="end" y="density"
            fill={colorMap[t]} fillOpacity={0.25} />
          <!-- KDE smooth curve: 100 points evaluated from scipy marginal -->
          <Line
            data={data.marginals[t].x.kde_values.map((v, i) => ({
              x: v, y: data.marginals[t].x.kde_density[i]
            }))}
            x="x" y="y" stroke={colorMap[t]} strokeWidth={1.5} />
        {/if}
      {/each}
    </Plot>

    <!-- Main plot + right marginal side by side (.plot-with-marginal from theme.css) -->
    <div class="plot-with-marginal">
      <div>
        <!-- Main scatter plot: contour underlay → hull outlines → scatter dots.
             All layers share the same bounds-pinned domain. -->
        <Plot
          height={400}
          x={{ domain: [x1, x2], label: "UMAP 1" }}
          y={{ domain: [y1, y2], label: "UMAP 2" }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              <!-- Density contour: 100x100 KDE grid (dense grid mode).
                   Values below 0.05 are zeroed in Python to suppress inter-cluster noise.
                   6 threshold levels, light fill + faint stroke lines. -->
              <Contour
                data={data.density[t].grid}
                width={data.density[t].width}
                height={data.density[t].height}
                x1={x1} y1={y1} x2={x2} y2={y2}
                fill={colorMap[t]} fillOpacity={0.12}
                stroke={colorMap[t]} strokeOpacity={0.2}
                strokeWidth={0.5}
                thresholds={6} blur={2} smooth={true} />
              <!-- Convex hull: dashed polygon outlining the class boundary.
                   Vertices precomputed via scipy ConvexHull, closed polygon. -->
              <Line
                data={data.hulls[t]}
                x="x" y="y"
                stroke={colorMap[t]} strokeWidth={1.5}
                strokeOpacity={0.5} strokeDasharray="6,3" />
            {/if}
          {/each}
          <!-- Scatter points: 500 sampled from 1,873 for readability.
               Color from colorMap via attack_type. Filtered by toggle state. -->
          <Dot data={filtered} x="x" y="y"
            fill={(d) => colorMap[d.attack_type]}
            r={2.5} opacity={0.6} />
        </Plot>
      </div>

      <div>
        <!-- Right marginal panel: y-axis distribution per class.
             Same structure as top marginal but rotated (RectX + horizontal Line).
             Shares y domain with main plot for alignment. -->
        <Plot
          width={80}
          height={400}
          x={{ axis: null }}
          y={{ domain: [y1, y2], axis: null }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
          marginLeft={0}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              {@const bins = binRecords(data.marginals[t].y.bin_edges, data.marginals[t].y.bin_density)}
              <RectX data={bins} y1="start" y2="end" x="density"
                fill={colorMap[t]} fillOpacity={0.25} />
              <Line
                data={data.marginals[t].y.kde_values.map((v, i) => ({
                  y: v, x: data.marginals[t].y.kde_density[i]
                }))}
                x="x" y="y" stroke={colorMap[t]} strokeWidth={1.5} />
            {/if}
          {/each}
        </Plot>
      </div>
    </div>

    <!-- Separability metrics: precomputed in Python from the full 1,873 points.
         overlap_integral: product of the two KDEs integrated (near 0 = no overlap).
         wasserstein_2d: earth-mover distance in UMAP coordinate units.
         energy_distance: statistical divergence (0 = identical distributions). -->
    <div class="metrics">
      <span>Wasserstein: <strong>{data.metrics.wasserstein_2d}</strong></span>
      <span>Energy dist: <strong>{data.metrics.energy_distance}</strong></span>
      <span>KDE overlap: <strong>{data.metrics.overlap_integral.toExponential(1)}</strong></span>
    </div>
  {/if}
</Figure>
