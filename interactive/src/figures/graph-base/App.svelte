<script>
  import { buildGraph, flatten, labelCenter } from "../../lib/diagram";
  import { Plot, Dot, Text, Link, HTMLTooltip } from "svelteplot";
  import Figure from "../../lib/Figure.svelte";

  const g = buildGraph({
    n: 5,
    topology: "sparse",
    color: "vgae",
    labels: "auto",
    prefix: "n",
  });

  const { nodes, edges, domain } = flatten(g);
</script>

<Figure title="CAN Bus Graph">
  <Plot
    grid={false}
    axes={false}
    frame={false}
    x={{ domain: domain.x }}
    y={{ domain: domain.y }}
    inset={10}
  >
    <Link
      data={edges}
      x1="x1"
      y1="y1"
      x2="x2"
      y2="y2"
      stroke="stroke"
      strokeOpacity={0.5}
      strokeWidth={1.5}
    />
    <Dot
      data={nodes}
      x="x"
      y="y"
      r={18}
      fill="fill"
      stroke="stroke"
      strokeWidth={1.5}
    />
    <Text
      data={nodes}
      {...labelCenter}
      text="label"
      fontSize={8}
      fill="#333"
      fontFamily="CMU Typewriter Text, monospace"
    />
    {#snippet overlay()}
      <HTMLTooltip data={nodes} x="x" y="y">
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
