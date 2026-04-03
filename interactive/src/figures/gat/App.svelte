<script>
  import Graph from "graphology";
  import { Plot, Dot, Text, Link, Arrow, Rect } from "svelteplot";
  import { flatten, labelBoxCenter, labelCenter } from "../../lib/diagram";
  import Figure from "../../lib/Figure.svelte";

  // --- Build graph data ---
  const SPARSE_5 = [
    [186, 125],
    [185, 25],
    [94, 67],
    [38, 160],
    [129, 217],
  ];
  const g = new Graph();

  // 3 layers stacked vertically
  for (let L = 0; L < 3; L++) {
    const yOff = L * 300;
    for (let i = 0; i < 5; i++) {
      g.addNode(`L${L}_${i}`, {
        x: SPARSE_5[i][0],
        y: SPARSE_5[i][1] + yOff,
        color: "gat",
        label: `v${"\u2081\u2082\u2083\u2084\u2085"[i]}`,
      });
    }
    for (let i = 0; i < 4; i++)
      g.addEdge(`L${L}_${i}`, `L${L}_${i + 1}`, { type: "structural", color: "gat" });
    g.addEdge(`L${L}_4`, `L${L}_0`, { type: "structural", color: "gat" });
    g.addEdge(`L${L}_0`, `L${L}_2`, { type: "structural", color: "gat" });
  }

  // Inter-layer flow
  for (let L = 0; L < 2; L++) {
    g.addEdge(`L${L}_0`, `L${L + 1}_3`, { type: "flow", color: "gat" });
  }

  // Boxes
  g.addNode("jk", { nodeType: "box", x: 110, y: 910, color: "gat", label: "JK Concat" });
  g.addNode("fc", { nodeType: "box", x: 110, y: 1010, color: "gat", label: "FC → class" });
  g.addEdge("jk", "fc", { type: "flow", color: "gat" });

  for (let L = 0; L < 3; L++) {
    g.addEdge(`L${L}_4`, "jk", { type: "flow", color: "gat" });
  }

  const { nodes, edges, boxes, domain } = flatten(g);

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
