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
  const { visible, toggle, types } = useToggleFilter(
    () => (isEmpty ? [] : data.points),
    (d) => d.attack_type,
  );

  // Unique attack types and their resolved palette colors.
  // colorMap is used by every layer: contour, hull, scatter, marginals.
  const attackTypes = isEmpty
    ? []
    : [...new Set(data.points.map((d) => d.attack_type))];
  // Map each attack type to a palette key by name (case-insensitive), falling
  // back to positional assignment for any unrecognised types.
  const paletteKeys = [
    "normal",
    "attack",
    "gat",
    "dqn",
    "data",
    "attention",
    "kd",
  ];
  const colorMap = Object.fromEntries(
    attackTypes.map((t, i) => {
      const match = paletteKeys.find((k) => k === t.toLowerCase());
      const key = match ?? paletteKeys[i % paletteKeys.length];
      return [t, resolve(key).stroke];
    }),
  );

  // Convert precomputed histogram (bin_edges + bin_density arrays) into
  // records that RectY/RectX can plot as bars: [{start, end, density}, ...]
  function binRecords(edges, density) {
    return density.map((d, i) => ({
      start: edges[i],
      end: edges[i + 1],
      density: d,
    }));
  }

  // Shared coordinate bounds (precomputed from ALL points with 5% padding).
  // Pins the Plot domain and Contour grid to the same coordinate space.
  const { x1, y1, x2, y2 } = isEmpty
    ? { x1: 0, y1: 0, x2: 1, y2: 1 }
    : data.bounds;

  // Build N evenly-spaced threshold levels and a matching opacity ramp.
  // Each level gets progressively more opaque, mimicking a fillOpacity map.
  const N_LEVELS = 6;
  const levels = Array.from({ length: N_LEVELS }, (_, i) => i / (N_LEVELS - 1));

  // opacity ramp: lowest band 0, highest ~0.35
  function levelOpacity(i) {
    return (i / (N_LEVELS - 1)) * 0.35;
  }
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
          onclick={() => toggle(t)}>{t}</button
        >
      {/each}
    </div>

    <!-- Top marginal panel: x-axis distribution per class.
         Histogram bars (RectY) + smooth KDE curve (Line).
         Shares x domain with main plot for alignment. -->
    <Plot
      width={729}
      height={80}
      x={{ domain: [x1, x2], axis: false }}
      y={{ axis: false }}
      grid={false}
      frame={false}
      inset={0}
      marginBottom={0}
      marginRight={0}
      marginLeft={24}
    >
      {#each attackTypes as t}
        {#if visible[t]}
          <!-- Histogram bars: precomputed 30 bins, density-normalized -->
          {@const bins = binRecords(
            data.marginals[t].x.bin_edges,
            data.marginals[t].x.bin_density,
          )}
          <RectY
            data={bins}
            x1="start"
            x2="end"
            y="density"
            fill={colorMap[t]}
            fillOpacity={0.25}
          />
          <!-- KDE smooth curve: 100 points evaluated from scipy marginal -->
          <Line
            data={data.marginals[t].x.kde_values.map((v, i) => ({
              x: v,
              y: data.marginals[t].x.kde_density[i],
            }))}
            x="x"
            y="y"
            stroke={colorMap[t]}
            strokeWidth={1.5}
          />
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
          width={700}
          x={{ domain: [x1, x2], label: "UMAP 1" }}
          y={{ domain: [y1, y2], label: "UMAP 2" }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
          marginRight={0}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              <!-- Density contour: 100x100 KDE grid (dense grid mode).
                   Values below 0.05 are zeroed in Python to suppress inter-cluster noise.
                   6 threshold levels, opacity ramps from faint (outer) to solid (inner). -->
              {#each levels as level, i}
                <Contour
                  data={data.density[t].grid}
                  width={data.density[t].width}
                  height={data.density[t].height}
                  {x1}
                  {y1}
                  {x2}
                  {y2}
                  fill={colorMap[t]}
                  fillOpacity={levelOpacity(i)}
                  stroke={colorMap[t]}
                  strokeOpacity={levelOpacity(i)}
                  strokeWidth={0.5}
                  thresholds={[level]}
                  blur={0.5}
                  smooth={true}
                />
              {/each}
              <!-- Convex hull: dashed polygon outlining the class boundary.
                   Vertices precomputed via scipy ConvexHull, closed polygon. -->
              <Line
                data={data.hulls[t]}
                x="x"
                y="y"
                stroke={colorMap[t]}
                strokeWidth={1.5}
                strokeOpacity={0.5}
                strokeDasharray="6,3"
              />
              <!-- Scatter points for this class, gated by the same visible check -->
              <Dot
                data={data.points.filter((d) => d.attack_type === t)}
                x="x"
                y="y"
                fill={colorMap[t]}
                r={2.5}
                opacity={0.6}
              />
            {/if}
          {/each}
        </Plot>
      </div>

      <div>
        <!-- Right marginal panel: y-axis distribution per class.
             Same structure as top marginal but rotated (RectX + horizontal Line).
             Shares y domain with main plot for alignment. -->
        <Plot
          width={80}
          height={400}
          x={{ axis: false }}
          y={{ domain: [y1, y2], axis: false }}
          grid={false}
          frame={false}
          inset={0}
          marginTop={0}
          marginBottom={35}
          marginLeft={10}
        >
          {#each attackTypes as t}
            {#if visible[t]}
              {@const bins = binRecords(
                data.marginals[t].y.bin_edges,
                data.marginals[t].y.bin_density,
              )}
              <RectX
                data={bins}
                y1="start"
                y2="end"
                x="density"
                fill={colorMap[t]}
                fillOpacity={0.25}
              />
              <Line
                data={data.marginals[t].y.kde_values.map((v, i) => ({
                  y: v,
                  x: data.marginals[t].y.kde_density[i],
                }))}
                x="x"
                y="y"
                stroke={colorMap[t]}
                strokeWidth={1.5}
              />
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
      <span
        >KDE overlap: <strong
          >{data.metrics.overlap_integral.toExponential(1)}</strong
        ></span
      >
    </div>
  {/if}
</Figure>
