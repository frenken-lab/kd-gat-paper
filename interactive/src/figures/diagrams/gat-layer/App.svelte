<script>
  import { specToFlow, DiagramCanvas } from '../../../lib/flow';

  const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';
  const HEADS = ['h1', 'h2', 'h3'];

  // Per-head attention weights for the encoded edges in the detail view.
  // [source idx, target idx, weight in 0..1]. Weight drives stroke width and
  // opacity of the EncodedEdge.
  const headAlphas = {
    h1: [[0,1,0.23],[0,2,0.41],[1,2,0.18],[2,3,0.55],[3,4,0.32],[4,0,0.31]],
    h2: [[0,1,0.15],[0,2,0.5], [1,2,0.33],[2,3,0.28],[3,4,0.47],[4,0,0.27]],
    h3: [[0,1,0.38],[0,2,0.12],[1,2,0.45],[2,3,0.19],[3,4,0.6], [4,0,0.26]],
  };

  const inLabels   = Array.from({ length: 5 }, (_, i) => `h${SUBSCRIPTS[i]}`);
  const attnLabels = Array.from({ length: 5 }, (_, i) => `Wh${SUBSCRIPTS[i]}`);
  const outLabels  = Array.from({ length: 5 }, (_, i) => `h'${SUBSCRIPTS[i]}`);

  function headSpec() {
    return {
      figure: 'gat-layer-head',
      components: {
        c: { type: 'graph', n: 5, topology: 'sparse', color: 'gat', scale: 60, r: 14, labels: 'auto' },
      },
      layout: { type: 'hstack', children: ['c'] },
    };
  }

  function detailSpec() {
    return {
      figure: 'gat-layer-detail',
      components: {
        inp:  { type: 'graph', n: 5, topology: 'sparse', color: 'gat',       scale: 60, r: 14, labels: inLabels },
        attn: { type: 'graph', n: 5, topology: 'none',   color: 'attention', scale: 60, r: 14, labels: attnLabels },
        out:  { type: 'graph', n: 5, topology: 'sparse', color: 'gat',       scale: 60, r: 14, labels: outLabels },
      },
      layout: { type: 'pipeline', elements: ['inp', 'attn', 'out'], flowColor: 'gat' },
    };
  }

  // --- Overview: 3 small thumbnails ---
  let headFlows = $state.raw({ h1: { nodes: [], edges: [] }, h2: { nodes: [], edges: [] }, h3: { nodes: [], edges: [] } });

  Promise.all(HEADS.map(() => specToFlow(headSpec()))).then((flows) => {
    headFlows = Object.fromEntries(HEADS.map((h, i) => [h, flows[i]]));
  });

  // --- Detail: pre-build per-head flows, inject encoded edges after layout ---
  let detailFlows = $state.raw({});

  Promise.all(HEADS.map(() => specToFlow(detailSpec()))).then((flows) => {
    let eidx = 0;
    const result = {};
    for (let i = 0; i < HEADS.length; i++) {
      const head = HEADS[i];
      const flow = flows[i];
      for (const [si, ti, weight] of headAlphas[head]) {
        flow.edges.push({
          id: `enc${eidx++}`,
          source: `attn_${si}`,
          target: `attn_${ti}`,
          type: 'encoded',
          data: { color: 'attention', weight },
        });
      }
      result[head] = flow;
    }
    detailFlows = result;
  });

  // --- Interaction state ---
  let selectedHead = $state(null);
  let detailNodes = $state.raw([]);
  let detailEdges = $state.raw([]);

  let headLabel = $derived(
    selectedHead === 'h1' ? 'Head 1' : selectedHead === 'h2' ? 'Head 2' : 'Head 3',
  );

  function selectHead(head) {
    if (selectedHead === head) {
      selectedHead = null;
      detailNodes = [];
      detailEdges = [];
      return;
    }
    selectedHead = head;
    const flow = detailFlows[head];
    if (flow) {
      detailNodes = flow.nodes;
      detailEdges = flow.edges;
    }
  }
</script>

<div class="figure">
  <h3>GAT Attention Layer</h3>

  <div class="overview-row">
    {#each HEADS as head, i}
      <div class="head-thumb" class:selected={selectedHead === head}>
        <div class="canvas-wrap">
          <DiagramCanvas nodes={headFlows[head].nodes} edges={headFlows[head].edges} width="100%" height="160px" />
        </div>
        <button class="overlay" onclick={() => selectHead(head)} aria-label="Select Head {i + 1}">
          <span class="head-name">Head {i + 1}</span>
        </button>
      </div>
    {/each}
  </div>
  <p class="hint">Click a head to inspect its internal attention mechanism</p>

  {#if selectedHead}
    <div class="detail">
      <div class="controls">
        <span class="detail-title">{headLabel} — Internal Structure</span>
        <button class="toggle" onclick={() => selectHead(selectedHead)}>Close</button>
      </div>
      <DiagramCanvas bind:nodes={detailNodes} bind:edges={detailEdges} width="100%" height="280px" />
    </div>
  {/if}
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
  .hint { font-size: 11px; color: #999; margin: 4px 0 0; text-align: center; }

  .overview-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .head-thumb {
    position: relative;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: white;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  .head-thumb.selected {
    border-color: #555;
    box-shadow: 0 0 0 2px rgba(85, 85, 85, 0.15);
  }
  .head-thumb:hover { border-color: #999; }

  /* Disable pointer events on the canvas so clicks land on the overlay
     button — pan/zoom inside a thumbnail are not useful here. */
  .canvas-wrap { pointer-events: none; }

  .overlay {
    position: absolute;
    inset: 0;
    background: transparent;
    border: 0;
    cursor: pointer;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 6px;
    font-family: inherit;
  }
  .head-name {
    font-size: 11px;
    font-weight: 600;
    color: #555;
    background: rgba(255, 255, 255, 0.85);
    padding: 1px 6px;
    border-radius: 3px;
  }

  .detail { margin-top: 8px; border-top: 1px solid #ddd; padding-top: 8px; }
  .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .detail-title { font-size: 12px; font-weight: 600; color: #333; }
  .toggle {
    font-size: 11px; padding: 2px 8px; cursor: pointer;
    background: #f5f5f5; border: 1px solid #ccc; border-radius: 3px;
  }
  .toggle:hover { background: #eee; }
</style>
