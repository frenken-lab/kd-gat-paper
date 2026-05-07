<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode } from '../../../lib/flow';
  import { DiagramCanvas } from '../../../lib/flow';
  import { layoutWithELK } from '../../../lib/flow/elk';
  import styles from 'virtual:styles';
  import flowData from './data.json';

  // Per-GSN-shape bounding-box sizes (px). Goals are wide for prose; Solutions
  // square for circle aspect; parallelogram and stadium between. Both ELK and
  // the SvelteFlow node `style` consume these values, so they drive layout
  // spacing and visual size together.
  const SIZES: Record<string, [number, number]> = {
    rectangle: [220, 80],
    parallelogram: [220, 70],
    circle: [90, 90],
    stadium: [200, 70],
    oval: [160, 80],
  };
  const sizeFor = (shape: string): [number, number] =>
    SIZES[shape] ?? [200, 80];

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
    (layer && LAYER_COLOR[layer]) || '#888';

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
    { direction: 'TB', nodeSpacing: 40, rankSpacing: 70 },
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
          labelStyle: `color: ${color}; font-size: 8px;`,
          borderColor: color,
          bgColor: `${color}40`,
        },
      } as DiagramNode;
    });
    edges = rawEdges.map(e => ({ ...e }) as DiagramEdge);
  });
</script>

<Figure title="kd-gat thesis argument (GSN safety case)">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="900px" />
</Figure>
