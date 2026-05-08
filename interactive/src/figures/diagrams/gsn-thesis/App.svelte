<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode } from '../../../lib/flow';
  import { DiagramCanvas } from '../../../lib/flow';
  import { layoutWithELK } from '../../../lib/flow/elk';
  import { Panel } from '@xyflow/svelte';
  import styles from 'virtual:styles';
  import flowData from './data.json';

  // Node sizes (px). Labels are now short (≤5 words) and full text lives in
  // the NodeToolbar popup, so nodes serve as map-markers: shape encodes GSN
  // type, color encodes layer. Kept small to recover zoom headroom on a
  // 39-node deep graph.
  const SIZES: Record<string, [number, number]> = {
    rectangle: [90, 34],
    parallelogram: [90, 32],
    circle: [44, 44],
    stadium: [84, 28],
    oval: [80, 34],
  };
  const sizeFor = (shape: string): [number, number] =>
    SIZES[shape] ?? [90, 34];

  // Color by GSN layer (thesis / instance / constraint). Pulls from styles.yml
  // via the virtual module so the diagram tracks the rest of the candidacy
  // palette.
  const palette = (styles as { palette: Record<string, string> }).palette ?? {};
  const LAYER_COLOR: Record<string, string> = {
    thesis: palette.blue ?? '#4e79a7',
    instance: palette.green ?? '#59a14f',
    constraint: palette.orange ?? '#f28e2b',
  };
  const colorFor = (layer: string | undefined): string =>
    (layer && LAYER_COLOR[layer]) || '#888888';

  let nodes = $state.raw<DiagramNode[]>([]);
  let edges = $state.raw<DiagramEdge[]>([]);

  const rawNodes = (flowData as { nodes: Array<Record<string, unknown>> }).nodes;
  const rawEdges = (flowData as { edges: Array<Record<string, unknown>> }).edges;

  // Run ELK layered top-down on the flat graph, then stamp positions and
  // ContainerNode-compatible style fields onto each node.
  layoutWithELK(
    rawNodes.map(n => {
      const data = n.data as { shape: string };
      const [w, h] = sizeFor(data.shape);
      return { id: n.id as string, width: w, height: h };
    }),
    rawEdges.map(e => ({
      id: e.id as string,
      source: e.source as string,
      target: e.target as string,
    })),
    { direction: 'LR', nodeSpacing: 18, rankSpacing: 32 },
  ).then(result => {
    nodes = rawNodes.map(n => {
      const data = n.data as {
        shape: string;
        layer?: string;
        [k: string]: unknown;
      };
      const pos = result.nodes.get(n.id as string);
      const [w, h] = sizeFor(data.shape);
      const color = colorFor(data.layer);
      return {
        ...n,
        position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
        style: `width: ${w}px; height: ${h}px;`,
        data: {
          ...data,
          // ContainerNode reads `style` (CSS shapes) AND `bgColor`/`borderColor`
          // (SVG shapes). Provide both so parallelogram (Strategy) and
          // rectangle/circle/stadium all render coloured.
          style: `background: ${color}26; border: 1px solid ${color};`,
          labelStyle: `color: ${color}; font-size: 7px;`,
          borderColor: color,
          bgColor: `${color}40`,
        },
      } as DiagramNode;
    });
    edges = rawEdges.map(e => ({ ...e }) as DiagramEdge);
  });
</script>

<Figure title="kd-gat thesis argument (GSN safety case)">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="420px" selectable={true}>
    <Panel position="top-left">
      <div class="gsn-key">
        <div class="gsn-key-section">
          <span class="shape-demo goal-demo"></span><span>Goal</span>
          <span class="shape-demo strategy-demo"></span><span>Strategy</span>
          <span class="shape-demo solution-demo"></span><span>Solution</span>
          <span class="shape-demo context-demo"></span><span>Context</span>
        </div>
        <hr class="gsn-key-rule" />
        <div class="gsn-key-section">
          <span class="layer-dot" style:background={LAYER_COLOR.thesis}></span><span>Thesis</span>
          <span class="layer-dot" style:background={LAYER_COLOR.instance}></span><span>Instance</span>
          <span class="layer-dot" style:background={LAYER_COLOR.constraint}></span><span>Constraint</span>
        </div>
      </div>
    </Panel>
  </DiagramCanvas>
</Figure>

<style>
  .gsn-key {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 5px 7px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 8px;
    color: #444;
    pointer-events: none;
    line-height: 1;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .gsn-key-section {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .gsn-key-rule {
    border: none;
    border-top: 1px solid #eee;
    margin: 4px 0;
  }

  .shape-demo {
    display: inline-block;
    width: 11px;
    height: 7px;
    border: 1px solid #888;
    flex-shrink: 0;
  }

  .goal-demo {
    border-radius: 0;
  }

  .strategy-demo {
    transform: skewX(-12deg);
  }

  .solution-demo {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  .context-demo {
    width: 16px;
    border-radius: 9999px;
  }

  .layer-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
    opacity: 0.8;
  }
</style>
