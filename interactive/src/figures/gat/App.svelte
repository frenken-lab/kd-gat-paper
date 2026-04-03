<script>
  import { Plot, Dot, Text, Link, Arrow, Rect } from "svelteplot";
  import spec from "./spec.yaml";
  import { buildFromSpec, flatten, labelBoxCenter, labelCenter } from "../../lib/diagram";
  import Figure from "../../lib/Figure.svelte";

  const { graph } = buildFromSpec(spec);
  const { nodes, edges, boxes, containers, domain } = flatten(graph);

  const structuralEdges = edges.filter((e) => e.type === "structural");
  const flowEdges = edges.filter((e) => e.type === "flow");
</script>

<Figure title="GAT Classifier">
  <Plot
    grid={false}
    axes={false}
    frame={false}
    x={{ domain: domain.x }}
    y={{ domain: domain.y }}
    inset={10}
  >
    <Rect data={containers} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" fillOpacity={0.06} stroke="stroke" strokeWidth={1}
      strokeDasharray="4 3" rx={10} />
    <Text data={containers}
      x={d => d.x1 + 6} y={d => d.y1 + 4}
      text="label" fontSize={8} fill="stroke" fontWeight="bold"
      textAnchor="start" dominantBaseline="hanging" />
    <Link
      data={structuralEdges}
      x1="x1"
      y1="y1"
      x2="x2"
      y2="y2"
      stroke="stroke"
      strokeOpacity={0.5}
      strokeWidth={1.5}
    />
    <Arrow
      data={flowEdges}
      x1="x1"
      y1="y1"
      x2="x2"
      y2="y2"
      stroke="stroke"
      strokeWidth={1}
      strokeDasharray="4 3"
    />
    <Rect
      data={boxes}
      x1="x1"
      y1="y1"
      x2="x2"
      y2="y2"
      fill="fill"
      stroke="stroke"
      strokeWidth={1.5}
      rx={6}
    />
    <Text
      data={boxes}
      {...labelBoxCenter}
      text="label"
      fontSize={9}
      fill="#333"
    />
    <Dot data={nodes} x="x" y="y" r={10} fill="fill" stroke="stroke" strokeWidth={1.5} />
    <Text
      data={nodes}
      {...labelCenter}
      text="label"
      fontSize={7}
      fill="#333"
    />
  </Plot>
</Figure>
