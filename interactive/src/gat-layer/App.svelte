<script>
  import { Plot, Link, Arrow, Dot, Text, Rect } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !data.stages?.length;

  // styles.yaml roles
  const palette = {
    gat:       { stroke: "#F28E2B", fill: "#FDE8D0" },
    attention: { stroke: "#B07AA1", fill: "#E6D9E1" },
  };

  // Flatten all nodes with stage reference for global Plot coordinates
  const allNodes = data.stages.flatMap(s =>
    s.nodes.map(n => ({ ...n, stage: s.id, color: s.color }))
  );

  // Structural edges (undirected — input & output stages)
  const structuralEdges = data.stages
    .filter(s => s.id !== "attn")
    .flatMap(s => s.edges.map(e => ({
      x1: s.nodes[e.source].x, y1: s.nodes[e.source].y,
      x2: s.nodes[e.target].x, y2: s.nodes[e.target].y,
      color: s.color,
    })));

  // Attention edges (directed — data-driven width & opacity)
  const attnStage = data.stages.find(s => s.id === "attn");
  const attnEdges = attnStage.edges.map(e => ({
    x1: attnStage.nodes[e.source].x, y1: attnStage.nodes[e.source].y,
    x2: attnStage.nodes[e.target].x, y2: attnStage.nodes[e.target].y,
    weight: e.weight,
  }));
  const wMin = Math.min(...attnEdges.map(e => e.weight));
  const wMax = Math.max(...attnEdges.map(e => e.weight));

  // Container bounding boxes from node positions (with padding)
  const pad = 30;
  const containers = data.stages.map(s => {
    const xs = s.nodes.map(n => n.x), ys = s.nodes.map(n => n.y);
    return {
      label: s.label, color: s.color,
      x1: Math.min(...xs) - pad, y1: Math.min(...ys) - pad,
      x2: Math.max(...xs) + pad, y2: Math.max(...ys) + pad,
    };
  });
</script>

<div class="figure">
  <h3>GAT Attention Layer</h3>
  {#if isEmpty}
    <p class="empty">Awaiting data export</p>
  {:else}
    <Plot height={320} width={900} grid={false} axes={false} frame={false}
      x={{ domain: [-20, 860] }}
      y={{ domain: [-20, 275] }}
      inset={20}>

      <!-- Layer 1: containers (dashed bounding boxes) -->
      {#each containers as c}
        <Rect data={[c]}
          x1="x1" y1="y1" x2="x2" y2="y2"
          fill={palette[c.color].fill + "40"}
          stroke={palette[c.color].stroke + "60"}
          strokeWidth={1} strokeDasharray="4 3" />
        <Text data={[c]}
          x="x1" y="y2"
          text="label" fontSize={9}
          fill={palette[c.color].stroke + "90"}
          dx={4} dy={12} />
      {/each}

      <!-- Layer 2: structural edges (undirected) -->
      <Link data={structuralEdges}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={e => palette[e.color].stroke + "80"}
        strokeWidth={1.5} />

      <!-- Layer 3: attention edges (directed, weight → width + opacity) -->
      <Arrow data={attnEdges}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke={palette.attention.stroke}
        strokeOpacity={e => 0.3 + 0.7 * (e.weight - wMin) / (wMax - wMin)}
        strokeWidth={e => 0.5 + (e.weight - wMin) / (wMax - wMin) * 3} />

      <!-- Layer 4: annotation arrows (inter-stage flow) -->
      <Arrow data={data.annotations}
        x1="x1" y1="y1" x2="x2" y2="y2"
        stroke="#BAB0AC" strokeWidth={1} strokeDasharray="4 3" />
      <Text data={data.annotations}
        x={a => (a.x1 + a.x2) / 2} y={a => (a.y1 + a.y2) / 2}
        text="label" fontSize={8} fill="#999"
        dy={-8} textAnchor="middle"
        fontStyle="italic" />

      <!-- Layer 5: nodes -->
      <Dot data={allNodes}
        x="x" y="y" r={12}
        fill={n => palette[n.color].fill}
        stroke={n => palette[n.color].stroke}
        strokeWidth={1.5} />

      <!-- Layer 6: node labels -->
      <Text data={allNodes}
        x="x" y="y" text="label"
        fontSize={7} fill="#333"
        textAnchor="middle" dy={1} />
    </Plot>
  {/if}
</div>
