<script>
  import { Arrow, Contour, Dot, Plot, Text } from "svelteplot";
  import styles from "virtual:styles";

  import Figure from "../../../lib/Figure.svelte";
  import {
    buildContourData, CLIENT_DEFS,
clientEndpointsAt,
    DOMAIN,     fedavgAt, fedproxAt, GLOBAL_MIN, ITERATE, scaffoldAt, trueGradientArrow,
  } from "./geometry";

  const { blue, orange, green, grey, teal, purple } = styles.palette;
  const DARK = styles.utility["on-light"];

  // ─── Client colors (geometry.ts holds positions, App holds colors) ───────
  const clientColors = [blue, orange, green];
  const clients = CLIENT_DEFS.map((c, i) => ({ ...c, color: clientColors[i] }));

  // ─── Static data (computed once at module load) ───────────────────────────
  const contourData = buildContourData();
  const trueEnd     = [trueGradientArrow()];

  // ─── E slider ─────────────────────────────────────────────────────────────
  let E = $state(5);

  const clientArrows = $derived(
    clientEndpointsAt(E).map((pt, i) => ({
      x1: ITERATE.x, y1: ITERATE.y,
      x2: pt.x, y2: pt.y,
      color: clientColors[i],
    }))
  );

  const fedavgArrow  = $derived([fedavgAt(E)]);
  const fedproxArrow = $derived([fedproxAt(E)]);
  const scaffoldArrow = $derived([scaffoldAt(E)]);

  // ─── Legend ───────────────────────────────────────────────────────────────
  const legendItems = [
    ...clients.map(({ name, color }) => ({ label: name, color })),
    { label: "FedAvg aggregate",          color: grey,   thick: true },
    { label: "FedProx aggregate (μ=1)",   color: purple, thick: true },
    { label: "SCAFFOLD",                  color: teal,   thick: true },
    { label: "True gradient",             color: DARK },
  ];

  // ─── Responsive sizing ────────────────────────────────────────────────────
  let containerWidth = $state(0);
  const plotWidth  = $derived(containerWidth || 500);
  const plotHeight = $derived(Math.round(plotWidth * 0.92));

  let smooth = $state(true);
  let blur   = $state(0);
</script>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
    color: #333;
    padding: 0 8px 2px;
    margin-top: 0px;
  }
  .swatch { width: 22px; height: 3px; border-radius: 1px; flex-shrink: 0; }
  .swatch.thick { height: 5px; }
  .legend-item { display: flex; align-items: center; gap: 6px; }
</style>

<Figure title="FedAvg Gradient Drift Under Non-IID Client Data">
  <div bind:clientWidth={containerWidth} style="display:flex; flex-direction:column; gap:0;">

    <div class="controls sliders" style="margin:0; padding:2px 0;">
      <label style="margin:0; line-height:1.3;">
        Local steps <strong>E = {E}</strong>
        <input type="range" min={1} max={15} bind:value={E} />
      </label>
    </div>

    <Plot
      width={plotWidth}
      height={plotHeight}
      x={{ domain: DOMAIN, label: "θ₁" }}
      y={{ domain: DOMAIN, label: "θ₂" }}
      grid={false}
      frame={true}
      marginTop={6}
      marginRight={6}
      marginBottom={28}
      marginLeft={36}
    >
      <!-- Loss landscape: concentric rings centered at θ* -->
      <Contour
        data={contourData}
        x="x"
        y="y"
        value="value"
        thresholds={7}
        fill={grey}
        fillOpacity={0.10}
        stroke={grey}
        strokeOpacity={0.5}
        strokeWidth={0.5}
        {smooth}
        {blur}
      />

      <!-- True gradient −∇F(θ^(t)): reference direction toward global min -->
      <Arrow
        data={trueEnd}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={DARK}
        strokeWidth={1.5}
        headLength={8}
        insetStart={8}
      />

      <!-- Per-client drift paths: thin dashed lines show where each client travels -->
      {#each clientArrows as arrow}
        <Arrow
          data={[arrow]}
          x1="x1" y1="y1" x2="x2" y2="y2"
          stroke={arrow.color}
          strokeWidth={1.5}
          strokeDasharray="4 3"
          headLength={5}
          insetStart={8}
        />
        <Dot
          data={[{ x: arrow.x2, y: arrow.y2 }]}
          x="x" y="y"
          fill={arrow.color}
          r={4}
        />
      {/each}

      <!-- FedAvg aggregate: unweighted mean of client endpoints -->
      <Arrow
        data={fedavgArrow}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={grey}
        strokeWidth={3.5}
        headLength={13}
        insetStart={8}
      />

      <!-- FedProx aggregate: proximal pull reduces drift vs FedAvg -->
      <Arrow
        data={fedproxArrow}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={purple}
        strokeWidth={3}
        strokeDasharray="5 3"
        headLength={12}
        insetStart={8}
      />

      <!-- SCAFFOLD aggregate: control variates eliminate drift entirely -->
      <Arrow
        data={scaffoldArrow}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={teal}
        strokeWidth={3}
        strokeDasharray="3 3"
        headLength={12}
        insetStart={8}
      />

      <!-- Client local minima × markers -->
      {#each clients as c}
        <Text
          data={[{ x: c.lx, y: c.ly, t: "×" }]}
          x="x" y="y" text="t"
          fontSize={16}
          fontWeight="bold"
          fill={c.color}
          textAnchor="middle"
        />
      {/each}

      <!-- Global min θ*: filled circle -->
      <Dot
        data={[{ x: GLOBAL_MIN.x, y: GLOBAL_MIN.y }]}
        x="x" y="y"
        fill={DARK}
        r={8}
      />

      <!-- Current iterate θ^(t): open circle -->
      <Dot
        data={[{ x: ITERATE.x, y: ITERATE.y }]}
        x="x" y="y"
        fill="white"
        stroke={DARK}
        strokeWidth={2.5}
        r={7}
      />

      <!-- Point labels -->
      <Text
        data={[{ x: GLOBAL_MIN.x + 0.18, y: GLOBAL_MIN.y - 0.45, t: "θ*" }]}
        x="x" y="y" text="t"
        fontSize={15} fontWeight="bold" fill={DARK} textAnchor="start"
      />
      <Text
        data={[{ x: ITERATE.x + 0.22, y: ITERATE.y + 0.48, t: "θ(t)" }]}
        x="x" y="y" text="t"
        fontSize={13} fill={DARK} textAnchor="start"
      />
    </Plot>

    <div class="legend">
      {#each legendItems as item}
        <span class="legend-item">
          <span class="swatch" class:thick={item.thick} style:background-color={item.color}></span>
          {item.label}
        </span>
      {/each}
    </div>
  </div>
</Figure>
