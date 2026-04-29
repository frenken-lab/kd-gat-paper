<script>
  import Figure from "../../../lib/Figure.svelte";
  import { Plot, Contour, Arrow, Dot, Text } from "svelteplot";
  import styles from "virtual:styles";

  const { blue, orange, green, grey, teal, purple } = styles.palette;
  const DARK = styles.utility["on-light"];

  // ─── Geometry ─────────────────────────────────────────────────────────────
  const DOMAIN = [-4, 4];
  const α = 0.25;              // learning rate for quadratic local-loss iterate

  const gx = -2.0, gy = -1.5; // global min θ*
  const tx =  0.8, ty =  0.6; // current iterate θ^(t) — origin of all arrows

  // Global loss: paraboloid centered at θ*.
  const loss = (x, y) => (x - gx) ** 2 + (y - gy) ** 2;

  // ─── Client local minima ──────────────────────────────────────────────────
  // Placed to span distinct quadrants so the three drift directions are visually
  // incompatible — the geometric claim the figure exists to make.
  const clients = [
    { name: "Label shift",   lx: -3.2, ly:  3.0, color: blue   },
    { name: "Feature shift", lx:  3.5, ly:  2.2, color: orange },
    { name: "Concept shift", lx:  3.2, ly: -3.5, color: green  },
  ];

  // ─── E slider ─────────────────────────────────────────────────────────────
  // Quadratic iterate (exact for quadratic local losses):
  //   θᵢ(E) = θᵢ* + (θ^(t) − θᵢ*)(1−α)^E
  // At E=1 clients barely move; at E=15 they are ~99% of the way to their minima.
  let E = $state(5);
  const decay = $derived((1 - α) ** E);

  // Per-client arrow endpoints derived from the iterate formula, not hand-placed.
  const clientArrows = $derived(
    clients.map((c) => ({
      x1: tx, y1: ty,
      x2: c.lx + (tx - c.lx) * decay,
      y2: c.ly + (ty - c.ly) * decay,
      color: c.color,
    }))
  );

  // FedAvg aggregate: unweighted mean of client endpoints (equal client sizes).
  const fedavgArrow = $derived.by(() => {
    const n = clientArrows.length;
    const x2 = clientArrows.reduce((s, a) => s + a.x2, 0) / n;
    const y2 = clientArrows.reduce((s, a) => s + a.y2, 0) / n;
    return [{ x1: tx, y1: ty, x2, y2 }];
  });

  // FedProx aggregate: proximal term pulls each client's local min toward θ^(t).
  //   local min shifts: wᵢ = (θᵢ* + μ·θ^(t)) / (1+μ)
  //   iterate:          θᵢ_prox(E) = wᵢ + (θ^(t) − wᵢ)(1 − α(1+μ))^E
  const μ = 1;
  const fedproxArrow = $derived.by(() => {
    const decayP = (1 - α * (1 + μ)) ** E;
    let sx = 0, sy = 0;
    for (const c of clients) {
      const wx = (c.lx + μ * tx) / (1 + μ);
      const wy = (c.ly + μ * ty) / (1 + μ);
      sx += wx + (tx - wx) * decayP;
      sy += wy + (ty - wy) * decayP;
    }
    const n = clients.length;
    return [{ x1: tx, y1: ty, x2: sx / n, y2: sy / n }];
  });

  // True gradient: −∇F at θ^(t) = direction from θ^(t) toward θ*, fixed length.
  const trueGradLen = 1.8;
  const dx = gx - tx, dy = gy - ty;
  const mag = Math.sqrt(dx * dx + dy * dy);
  const trueEnd = [{ x1: tx, y1: ty, x2: tx + trueGradLen * dx / mag, y2: ty + trueGradLen * dy / mag }];

  // ─── Legend ───────────────────────────────────────────────────────────────
  const legendItems = [
    ...clients.map(({ name, color }) => ({ label: name, color })),
    { label: "FedAvg aggregate",     color: grey,   thick: true },
    { label: "FedProx aggregate (μ=1)", color: purple, thick: true },
    { label: "True gradient",        color: DARK },
  ];
</script>

<style>
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 18px;
    font-size: 12px;
    color: #333;
    padding: 2px 14px 6px;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .swatch {
    width: 22px;
    height: 3px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .swatch.thick { height: 5px; }
</style>

<Figure title="FedAvg Gradient Drift Under Non-IID Client Data">
  <div class="controls sliders">
    <label>
      Local steps <strong>E = {E}</strong>
      <input type="range" min={1} max={15} bind:value={E} />
    </label>
  </div>

  <Plot
    width={500}
    height={460}
    x={{ domain: DOMAIN, label: "θ₁" }}
    y={{ domain: DOMAIN, label: "θ₂" }}
    grid={false}
    frame={true}
    marginTop={16}
    marginRight={16}
    marginBottom={32}
    marginLeft={44}
  >
    <!-- Loss landscape: concentric rings centered at θ* -->
    <Contour
      value={loss}
      thresholds={7}
      fill={teal}
      fillOpacity={0.05}
      stroke={teal}
      strokeOpacity={0.22}
      strokeWidth={0.8}
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

    <!-- Per-client drift arrows: positions from quadratic iterate formula -->
    {#each clientArrows as arrow}
      <Arrow
        data={[arrow]}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={arrow.color}
        strokeWidth={2}
        headLength={9}
        insetStart={8}
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

    <!-- Client local minima × markers: where each client is descending toward -->
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
      data={[{ x: gx, y: gy }]}
      x="x" y="y"
      fill={DARK}
      r={8}
    />

    <!-- Current iterate θ^(t): open circle -->
    <Dot
      data={[{ x: tx, y: ty }]}
      x="x" y="y"
      fill="white"
      stroke={DARK}
      strokeWidth={2.5}
      r={7}
    />

    <!-- Point labels -->
    <Text
      data={[{ x: gx + 0.18, y: gy - 0.45, t: "θ*" }]}
      x="x" y="y" text="t"
      fontSize={15} fontWeight="bold" fill={DARK} textAnchor="start"
    />
    <Text
      data={[{ x: tx + 0.22, y: ty + 0.48, t: "θ(t)" }]}
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
</Figure>
