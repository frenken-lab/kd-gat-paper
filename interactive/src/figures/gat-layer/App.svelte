<script>
  import Graph from "graphology";
  import { Plot, Dot, Text, Link, Arrow, Rect } from "svelteplot";
  import {
    buildGraph,
    flatten,
    hstack,
    connectContainers,
    boundingBox,
    labelAbove,
    labelCenter,
  } from "../../lib/diagram";
  import Figure from "../../lib/Figure.svelte";

  const n = 5;

  // --- Overview: 3 attention heads ---
  const h1 = buildGraph({
    n, topology: "sparse", color: "gat", prefix: "h1",
    labels: "auto", scale: 50,
    container: { label: "Head 1", color: "gat" },
  });
  const h2 = buildGraph({
    n, topology: "sparse", color: "gat", prefix: "h2",
    labels: "auto", scale: 50,
    container: { label: "Head 2", color: "gat" },
  });
  const h3 = buildGraph({
    n, topology: "sparse", color: "gat", prefix: "h3",
    labels: "auto", scale: 50,
    container: { label: "Head 3", color: "gat" },
  });

  const g = new Graph({ multi: true });
  hstack(g, [h1, h2, h3], { gap: 120 });
  const data = flatten(g);

  const flowArrows = connectContainers(data.containers);
  const outer = boundingBox(data.containers);

  // --- Detail: pre-build all 3 head internals ---
  const SUBSCRIPTS = "₁₂₃₄₅₆₇₈₉";
  const headAlphas = {
    h1: [
      [0, 1, { weight: 0.23 }], [0, 2, { weight: 0.41 }],
      [1, 2, { weight: 0.18 }], [2, 3, { weight: 0.55 }],
      [3, 4, { weight: 0.32 }], [4, 0, { weight: 0.31 }],
    ],
    h2: [
      [0, 1, { weight: 0.15 }], [0, 2, { weight: 0.5 }],
      [1, 2, { weight: 0.33 }], [2, 3, { weight: 0.28 }],
      [3, 4, { weight: 0.47 }], [4, 0, { weight: 0.27 }],
    ],
    h3: [
      [0, 1, { weight: 0.38 }], [0, 2, { weight: 0.12 }],
      [1, 2, { weight: 0.45 }], [2, 3, { weight: 0.19 }],
      [3, 4, { weight: 0.6 }],  [4, 0, { weight: 0.26 }],
    ],
  };

  const detailMap = {};
  for (const head of ["h1", "h2", "h3"]) {
    const input = buildGraph({
      n: 5, topology: "sparse", color: "gat", prefix: `${head}_in`, scale: 50,
      labels: Array.from({ length: 5 }, (_, i) => `h${SUBSCRIPTS[i]}`),
      container: { label: "Input: hᵥ", color: "gat" },
    });
    const attn = buildGraph({
      n: 5, topology: "none", color: "attention", prefix: `${head}_attn`, scale: 50,
      labels: Array.from({ length: 5 }, (_, i) => `Wh${SUBSCRIPTS[i]}`),
      directed: true,
      edges: headAlphas[head].map(([i, j, a]) => [
        i, j, { ...a, type: "encoded", color: "attention" },
      ]),
      container: { label: "Attention: αᵢⱼ", color: "attention" },
    });
    const output = buildGraph({
      n: 5, topology: "sparse", color: "gat", prefix: `${head}_out`, scale: 50,
      labels: Array.from({ length: 5 }, (_, i) => `h'${SUBSCRIPTS[i]}`),
      container: { label: "Output: h'ᵥ", color: "gat" },
    });

    const dg = new Graph({ multi: true, type: "mixed" });
    hstack(dg, [input, attn, output], { gap: 120 });
    const flat = flatten(dg);

    detailMap[head] = {
      ...flat,
      structuralEdges: flat.edges.filter((e) => e.type === "structural"),
      encodedEdges: flat.edges.filter((e) => e.type === "encoded"),
      flowArrows: connectContainers(flat.containers, {
        labels: ["W, a", "σ(Σα·Wh)"],
      }),
    };
  }

  // --- Interaction state ---
  let selectedHead = null;
  function selectHead(group) {
    selectedHead = selectedHead === group ? null : group;
  }
  $: detailData = selectedHead ? detailMap[selectedHead] : null;
  $: headLabel =
    selectedHead === "h1"
      ? "Head 1"
      : selectedHead === "h2"
        ? "Head 2"
        : "Head 3";
</script>

<Figure title="GAT Attention Layer">
  <!-- Overview: 3 attention heads -->
  <Plot
    width={700} height={280} grid={false} axes={false} frame={false}
    x={{ domain: data.domain.x }} y={{ domain: data.domain.y }} inset={10}
  >
    <!-- Outer GAT layer box -->
    <Rect
      data={[outer]} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="none" stroke="#999" strokeWidth={1} strokeDasharray="4 3" rx={8}
    />
    <!-- Head containers (clickable) -->
    <Rect
      data={data.containers} x1="x1" y1="y1" x2="x2" y2="y2"
      fill={(c) => (c.group === selectedHead ? c.stroke + "30" : c.fill)}
      stroke="stroke"
      strokeWidth={(c) => (c.group === selectedHead ? 2.5 : 1)}
      rx={6}
      onclick={(event, datum) => selectHead(datum.group)}
    />
    <Text
      data={data.containers}
      {...labelAbove}
      text="label" fontSize={9} fill="#333"
    />
    <!-- Flow arrows between heads -->
    <Arrow
      data={flowArrows} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={1.5}
    />
    <!-- Structural edges -->
    <Link
      data={data.edges.filter((e) => e.type === "structural")}
      x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeOpacity={0.4} strokeWidth={1.5}
    />
    <!-- Nodes -->
    <Dot
      data={data.nodes} x="x" y="y" r={14}
      fill="fill" stroke="stroke" strokeWidth={1.5}
    />
    <Text
      data={data.nodes} {...labelCenter}
      text="label" fontSize={8} fill="#333"
    />
  </Plot>
  <p style="font-size: 11px; color: #999; margin: 2px 0 0; text-align: center;">
    Click a head to inspect its internal attention mechanism
  </p>

  <!-- Detail panel -->
  {#if detailData}
    <div style="margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px;">
      <div class="controls">
        <span style="font-size: 12px; font-weight: 600; color: #333;"
          >{headLabel} — Internal Structure</span
        >
        <button
          class="toggle"
          on:click={() => { selectedHead = null; }}>Close</button
        >
      </div>
      <Plot
        width={700} height={260} grid={false} axes={false} frame={false}
        x={{ domain: detailData.domain.x }} y={{ domain: detailData.domain.y }} inset={10}
      >
        <!-- Stage containers -->
        <Rect
          data={detailData.containers} x1="x1" y1="y1" x2="x2" y2="y2"
          fill="fill" stroke="stroke" strokeWidth={1} rx={6}
        />
        <Text
          data={detailData.containers}
          {...labelAbove}
          text="label" fontSize={9} fill="#333"
        />
        <!-- Flow arrows between stages -->
        <Arrow
          data={detailData.flowArrows} x1="x1" y1="y1" x2="x2" y2="y2"
          stroke="stroke" strokeWidth={1.5}
        />
        <Text
          data={detailData.flowArrows}
          x={(e) => (e.x1 + e.x2) / 2} y={(e) => e.y1 - 10}
          text="label" fontSize={8} fill="#666" textAnchor="middle" fontStyle="italic"
        />
        <!-- Structural edges -->
        <Link
          data={detailData.structuralEdges} x1="x1" y1="y1" x2="x2" y2="y2"
          stroke="stroke" strokeOpacity={0.4} strokeWidth={1.5}
        />
        <!-- Encoded edges (attention — weight drives width + opacity) -->
        <Arrow
          data={detailData.encodedEdges} x1="x1" y1="y1" x2="x2" y2="y2"
          stroke="stroke"
          strokeWidth={(e) => 0.5 + (e.weight || 0) * 4}
          strokeOpacity={(e) => 0.3 + (e.weight || 0) * 0.7}
        />
        <!-- Nodes -->
        <Dot
          data={detailData.nodes} x="x" y="y" r={14}
          fill="fill" stroke="stroke" strokeWidth={1.5}
        />
        <Text
          data={detailData.nodes} {...labelCenter}
          text="label" fontSize={8} fill="#333"
        />
      </Plot>
    </div>
  {/if}
</Figure>
