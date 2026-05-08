<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode } from '../../../lib/flow';
  import { DiagramCanvas } from '../../../lib/flow';
  import { layoutHierarchicalWithELK } from '../../../lib/flow/elk';
  import { Panel } from '@xyflow/svelte';
  import styles from 'virtual:styles';
  import flowData from './data.json';

  // Node sizes (px). Labels are short (≤5 words); full text lives in the
  // NodeToolbar popup. Kept small so ELK can fit 39 nodes in a reasonable area.
  const SIZES: Record<string, [number, number]> = {
    rectangle: [90, 34],
    parallelogram: [90, 32],
    circle: [44, 44],
    stadium: [84, 28],
    oval: [80, 34],
  };
  const sizeFor = (shape: string): [number, number] => SIZES[shape] ?? [90, 34];

  const palette = (styles as { palette: Record<string, string> }).palette ?? {};
  const LAYER_COLOR: Record<string, string> = {
    thesis: palette.blue ?? '#4e79a7',
    instance: palette.green ?? '#59a14f',
    constraint: palette.orange ?? '#f28e2b',
  };
  const colorFor = (layer: string | undefined): string =>
    (layer && LAYER_COLOR[layer]) || '#888888';

  const GROUP_IDS = ['group_thesis', 'group_instance', 'group_constraint'] as const;
  const GROUP_LABELS: Record<string, string> = {
    group_thesis: 'Abstract claim',
    group_instance: 'This system',
    group_constraint: 'Context',
  };
  const GROUP_LAYER: Record<string, string> = {
    group_thesis: 'thesis',
    group_instance: 'instance',
    group_constraint: 'constraint',
  };

  let nodes = $state.raw<DiagramNode[]>([]);
  let edges = $state.raw<DiagramEdge[]>([]);

  const rawNodes = (flowData as { nodes: Array<Record<string, unknown>> }).nodes;
  const rawEdges = (flowData as { edges: Array<Record<string, unknown>> }).edges;

  // Map node id → group id; group rank (lower = visually higher on canvas).
  const nodeGroupMap = new Map(rawNodes.map(n => [n.id as string, n.parentId as string]));
  const GROUP_RANK: Record<string, number> = {
    group_thesis: 0,
    group_instance: 1,
    group_constraint: 2,
  };

  layoutHierarchicalWithELK(
    GROUP_IDS.map(gid => ({
      id: gid,
      direction: 'LR' as const,
      children: rawNodes
        .filter(n => (n.parentId as string) === gid)
        .map(n => {
          const data = n.data as { shape: string };
          const [w, h] = sizeFor(data.shape);
          return { id: n.id as string, width: w, height: h };
        }),
    })),
    rawEdges.map(e => {
      // For ELK group-level ordering only: flip cross-group edges that point
      // from a "lower" group to a "higher" group so ELK's DOWN layout places
      // thesis at top, instance in the middle, constraints at the bottom.
      // Intra-group edges and correctly-directed cross-group edges are unchanged.
      // Visual SvelteFlow arrows keep the original source/target from data.json.
      const srcGroup = nodeGroupMap.get(e.source as string) ?? '';
      const tgtGroup = nodeGroupMap.get(e.target as string) ?? '';
      const flip =
        srcGroup !== tgtGroup &&
        (GROUP_RANK[srcGroup] ?? 0) > (GROUP_RANK[tgtGroup] ?? 0);
      return {
        id: e.id as string,
        source: (flip ? e.target : e.source) as string,
        target: (flip ? e.source : e.target) as string,
      };
    }),
    { direction: 'TB', nodeSpacing: 18, rankSpacing: 28, groupSpacing: 50 },
  ).then(result => {
    // Group nodes must come first in the array so SvelteFlow registers parents
    // before their children.
    const groupNodes: DiagramNode[] = GROUP_IDS.map(gid => {
      const pos = result.groups.get(gid) ?? { x: 0, y: 0, width: 200, height: 100 };
      const layer = GROUP_LAYER[gid];
      const color = colorFor(layer);
      return {
        id: gid,
        type: 'group',
        position: { x: pos.x, y: pos.y },
        style: `width: ${pos.width}px; height: ${pos.height}px;`,
        selectable: false,
        data: { label: GROUP_LABELS[gid], color, layer },
      } as DiagramNode;
    });

    const childNodes: DiagramNode[] = rawNodes.map(n => {
      const data = n.data as { shape: string; layer?: string; [k: string]: unknown };
      const pos = result.nodes.get(n.id as string);
      const [w, h] = sizeFor(data.shape);
      const color = colorFor(data.layer);
      return {
        ...n,
        position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
        style: `width: ${w}px; height: ${h}px;`,
        extent: 'parent' as const,
        data: {
          ...data,
          style: `background: ${color}26; border: 1px solid ${color};`,
          labelStyle: `color: ${color}; font-size: 7px;`,
          borderColor: color,
          bgColor: `${color}40`,
        },
      } as DiagramNode;
    });

    nodes = [...groupNodes, ...childNodes];
    edges = rawEdges.map(e => ({ ...e }) as DiagramEdge);
  });
</script>

<Figure title="kd-gat thesis argument (GSN safety case)">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="560px" selectable={true}>
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
