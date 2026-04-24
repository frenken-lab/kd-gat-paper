<script>
  import { autoLayout, circularPositions, DiagramCanvas } from '../../../lib/flow';

  const n = 5;
  const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';

  // --- Helper: build a graph cluster as SvelteFlow nodes + edges ---
  function buildCluster(prefix, opts = {}) {
    const { color = 'gat', topology = 'sparse', labels, scale = 50, r } = opts;
    const positions = circularPositions(n, 0, 0, scale / 2);
    const nodeLabels = labels ?? Array.from({ length: n }, (_, i) => `v${SUBSCRIPTS[i]}`);
    const nodes = [];
    const edges = [];

    for (let i = 0; i < n; i++) {
      nodes.push({
        id: `${prefix}_${i}`,
        type: 'circle',
        position: { x: positions[i].x, y: positions[i].y },
        data: { label: nodeLabels[i], color, r: r ?? 14 },
      });
    }

    if (topology === 'sparse') {
      for (let i = 0; i < n; i++) {
        edges.push({
          id: `${prefix}_s${i}`,
          source: `${prefix}_${i}`,
          target: `${prefix}_${(i + 1) % n}`,
          type: 'structural',
          data: { color },
        });
      }
      if (n > 3) {
        edges.push({
          id: `${prefix}_chord`,
          source: `${prefix}_0`,
          target: `${prefix}_2`,
          type: 'structural',
          data: { color },
        });
      }
    }

    return { nodes, edges };
  }

  // --- Overview: 3 attention heads ---
  let overviewNodes = [];
  let overviewEdges = [];

  for (const head of ['h1', 'h2', 'h3']) {
    const { nodes, edges } = buildCluster(head, { color: 'gat', scale: 50 });
    overviewNodes.push(...nodes);
    overviewEdges.push(...edges);
  }

  const laidOutOverview = autoLayout(overviewNodes, overviewEdges, { direction: 'LR', nodeSpacing: 80 });
  let ovNodes = $state.raw(laidOutOverview);
  let ovEdges = $state.raw(overviewEdges);

  // --- Detail: pre-build all 3 head internals ---
  const headAlphas = {
    h1: [[0,1,0.23],[0,2,0.41],[1,2,0.18],[2,3,0.55],[3,4,0.32],[4,0,0.31]],
    h2: [[0,1,0.15],[0,2,0.5],[1,2,0.33],[2,3,0.28],[3,4,0.47],[4,0,0.27]],
    h3: [[0,1,0.38],[0,2,0.12],[1,2,0.45],[2,3,0.19],[3,4,0.6],[4,0,0.26]],
  };

  const detailFlows = {};
  let eidx = 0;

  for (const head of ['h1', 'h2', 'h3']) {
    const allNodes = [];
    const allEdges = [];

    // Input cluster
    const inp = buildCluster(`${head}_in`, {
      color: 'gat', scale: 50,
      labels: Array.from({ length: 5 }, (_, i) => `h${SUBSCRIPTS[i]}`),
    });
    allNodes.push(...inp.nodes);
    allEdges.push(...inp.edges);

    // Attention cluster (no topology, custom weighted edges)
    const attnPos = circularPositions(5, 0, 0, 25);
    for (let i = 0; i < 5; i++) {
      allNodes.push({
        id: `${head}_attn_${i}`,
        type: 'circle',
        position: { x: attnPos[i].x, y: attnPos[i].y },
        data: { label: `Wh${SUBSCRIPTS[i]}`, color: 'attention', r: 14 },
      });
    }
    for (const [si, ti, weight] of headAlphas[head]) {
      allEdges.push({
        id: `e${eidx++}`,
        source: `${head}_attn_${si}`,
        target: `${head}_attn_${ti}`,
        type: 'encoded',
        data: { color: 'attention', weight },
      });
    }

    // Output cluster
    const out = buildCluster(`${head}_out`, {
      color: 'gat', scale: 50,
      labels: Array.from({ length: 5 }, (_, i) => `h'${SUBSCRIPTS[i]}`),
    });
    allNodes.push(...out.nodes);
    allEdges.push(...out.edges);

    const laidOut = autoLayout(allNodes, allEdges, { direction: 'LR', nodeSpacing: 60 });
    detailFlows[head] = { nodes: laidOut, edges: allEdges };
  }

  // --- Interaction state ---
  let selectedHead = $state(null);
  let detailNodes = $state.raw([]);
  let detailEdges = $state.raw([]);

  let headLabel = $derived(
    selectedHead === 'h1' ? 'Head 1' : selectedHead === 'h2' ? 'Head 2' : 'Head 3'
  );

  function selectHead(head) {
    if (selectedHead === head) {
      selectedHead = null;
      detailNodes = [];
      detailEdges = [];
    } else {
      selectedHead = head;
      detailNodes = detailFlows[head].nodes;
      detailEdges = detailFlows[head].edges;
    }
  }
</script>

<div class="figure">
  <h3>GAT Attention Layer</h3>

  <DiagramCanvas bind:nodes={ovNodes} bind:edges={ovEdges} width="100%" height="280px" />
  <p class="hint">Click a head to inspect its internal attention mechanism</p>

  {#if selectedHead}
    <div class="detail">
      <div class="controls">
        <span class="detail-title">{headLabel} — Internal Structure</span>
        <button class="toggle" onclick={() => selectHead(selectedHead)}>Close</button>
      </div>
      <DiagramCanvas bind:nodes={detailNodes} bind:edges={detailEdges} width="100%" height="260px" />
    </div>
  {/if}
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
  .hint { font-size: 11px; color: #999; margin: 2px 0 0; text-align: center; }
  .detail { margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px; }
  .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .detail-title { font-size: 12px; font-weight: 600; color: #333; }
  .toggle {
    font-size: 11px; padding: 2px 8px; cursor: pointer;
    background: #f5f5f5; border: 1px solid #ccc; border-radius: 3px;
  }
  .toggle:hover { background: #eee; }
</style>
