<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode, FigureSpec } from '../../../lib/flow';
  import { DiagramCanvas, specToFlow } from '../../../lib/flow';

  const SUBSCRIPTS = '₁₂₃₄₅₆₇₈₉';
  const HEADS = ['h1', 'h2', 'h3'] as const;
  type Head = (typeof HEADS)[number];

  // Per-head attention weights: [source idx, target idx, weight 0..1]
  // Weight drives stroke width and opacity of the encoded edges in the detail view.
  const headAlphas: Record<Head, [number, number, number][]> = {
    h1: [
      [0, 1, 0.23],
      [0, 2, 0.41],
      [1, 2, 0.18],
      [2, 3, 0.55],
      [3, 4, 0.32],
      [4, 0, 0.31],
    ],
    h2: [
      [0, 1, 0.15],
      [0, 2, 0.5],
      [1, 2, 0.33],
      [2, 3, 0.28],
      [3, 4, 0.47],
      [4, 0, 0.27],
    ],
    h3: [
      [0, 1, 0.38],
      [0, 2, 0.12],
      [1, 2, 0.45],
      [2, 3, 0.19],
      [3, 4, 0.6],
      [4, 0, 0.26],
    ],
  };

  const inLabels = Array.from({ length: 5 }, (_, i) => `h${SUBSCRIPTS[i]}`);
  const attnLabels = Array.from({ length: 5 }, (_, i) => `Wh${SUBSCRIPTS[i]}`);
  const outLabels = Array.from({ length: 5 }, (_, i) => `h'${SUBSCRIPTS[i]}`);

  // Thumbnail spec — one sparse graph per head, no pipeline decoration
  const headSpec: FigureSpec = {
    figure: 'gat-layer-head',
    components: {
      c: {
        type: 'graph',
        n: 5,
        topology: 'sparse',
        color: 'gat',
        scale: 60,
        r: 14,
        labels: 'auto',
      },
    },
    layout: { type: 'hstack', children: ['c'] },
  };

  // Detail spec — three-stage pipeline: input → attention → output
  const detailSpec: FigureSpec = {
    figure: 'gat-layer-detail',
    components: {
      inp: {
        type: 'graph',
        n: 5,
        topology: 'sparse',
        color: 'gat',
        scale: 60,
        r: 14,
        labels: inLabels,
      },
      attn: {
        type: 'graph',
        n: 5,
        topology: 'none',
        color: 'attention',
        scale: 60,
        r: 14,
        labels: attnLabels,
      },
      out: {
        type: 'graph',
        n: 5,
        topology: 'sparse',
        color: 'gat',
        scale: 60,
        r: 14,
        labels: outLabels,
      },
    },
    layout: {
      type: 'pipeline',
      elements: ['inp', 'attn', 'out'],
      flowColor: 'gat',
    },
  };

  interface HeadFlow {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
  }

  // Overview: 3 small thumbnail canvases, one per head
  let headFlows = $state.raw<Record<Head, HeadFlow>>({
    h1: { nodes: [], edges: [] },
    h2: { nodes: [], edges: [] },
    h3: { nodes: [], edges: [] },
  });

  Promise.all(HEADS.map(() => specToFlow(headSpec))).then(flows => {
    headFlows = Object.fromEntries(
      HEADS.map((h, i) => [h, flows[i]]),
    ) as Record<Head, HeadFlow>;
  });

  // Detail: build per-head flows then inject encoded attention edges after layout
  let detailFlows = $state.raw<Partial<Record<Head, HeadFlow>>>({});

  Promise.all(HEADS.map(() => specToFlow(detailSpec))).then(flows => {
    let eidx = 0;
    const result: Partial<Record<Head, HeadFlow>> = {};
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

  // Interaction state — null means no head selected (detail panel hidden)
  let selectedHead = $state<Head | null>(null);
  let detailNodes = $state.raw<DiagramNode[]>([]);
  let detailEdges = $state.raw<DiagramEdge[]>([]);

  const headLabel = $derived(
    selectedHead === 'h1'
      ? 'Head 1'
      : selectedHead === 'h2'
        ? 'Head 2'
        : 'Head 3',
  );

  function selectHead(head: Head): void {
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

<Figure title="GAT Attention Layer">
  <div class="overview-row">
    {#each HEADS as head, i}
      <div class="head-thumb" class:selected={selectedHead === head}>
        <!-- Pointer events disabled on canvas so clicks land on the overlay button -->
        <div class="canvas-wrap">
          <DiagramCanvas
            nodes={headFlows[head].nodes}
            edges={headFlows[head].edges}
            width="100%"
            height="160px" />
        </div>
        <button
          class="overlay"
          onclick={() => selectHead(head)}
          aria-label="Select Head {i + 1}">
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
        <button class="toggle" onclick={() => selectHead(selectedHead!)}
          >Close</button>
      </div>
      <DiagramCanvas
        bind:nodes={detailNodes}
        bind:edges={detailEdges}
        width="100%"
        height="280px" />
    </div>
  {/if}
</Figure>

<style>
  .hint {
    font-size: 11px;
    color: #999;
    margin: 4px 0 0;
    text-align: center;
  }

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
    transition:
      border-color 0.12s,
      box-shadow 0.12s;
  }
  .head-thumb.selected {
    border-color: #555;
    box-shadow: 0 0 0 2px rgba(85, 85, 85, 0.15);
  }
  .head-thumb:hover {
    border-color: #999;
  }

  .canvas-wrap {
    pointer-events: none;
  }

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

  .detail {
    margin-top: 8px;
    border-top: 1px solid #ddd;
    padding-top: 8px;
  }
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .detail-title {
    font-size: 12px;
    font-weight: 600;
    color: #333;
  }
  .toggle {
    font-size: 11px;
    padding: 2px 8px;
    cursor: pointer;
    background: #f5f5f5;
    border: 1px solid #ccc;
    border-radius: 3px;
  }
  .toggle:hover {
    background: #eee;
  }
</style>
