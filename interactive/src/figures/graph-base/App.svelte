<script>
  import { buildGraph, unpack } from "../../lib/diagram";
  import { Plot, Dot, Text, Link, HTMLTooltip } from "svelteplot";
  import Figure from "../../lib/Figure.svelte";

  const n = 5;

  const g = buildGraph({
    n,
    topology: "sparse",
    color: "vgae",
    labels: "auto",
    prefix: "n",
  });

  const data = unpack(g);

  // Auto domain from node positions + padding
  const pad = 40;
  const xs = data.nodes.map((n) => n.x);
  const ys = data.nodes.map((n) => n.y);
  const xDomain = [Math.min(...xs) - pad, Math.max(...xs) + pad];
  const yDomain = [Math.min(...ys) - pad, Math.max(...ys) + pad];
</script>

<Figure title="CAN Bus Graph">
  <Plot
    grid={false}
    axes={false}
    frame={false}
    x={{ domain: xDomain }}
    y={{ domain: yDomain }}
    inset={10}
  >
    <Link
      data={data.edges.structural}
      x1="x1"
      y1="y1"
      x2="x2"
      y2="y2"
      stroke="stroke"
      strokeOpacity={0.5}
      strokeWidth={1.5}
    />
    <Dot
      data={data.nodes}
      x="x"
      y="y"
      r={18}
      fill="fill"
      stroke="stroke"
      strokeWidth={1.5}
    />
    <Text
      data={data.nodes}
      x="x"
      y="y"
      text="label"
      fontSize={8}
      fill="#333"
      textAnchor="middle"
      dy={1}
      fontFamily="CMU Typewriter Text, monospace"
    />
    {#snippet overlay()}
      <HTMLTooltip data={data.nodes} x="x" y="y">
        {#snippet children({ datum })}
          <div class="tooltip">
            <div>X: {datum.x}</div>
            <div>Y: {datum.y}</div>
          </div>
        {/snippet}
      </HTMLTooltip>
    {/snippet}
  </Plot>
</Figure>
