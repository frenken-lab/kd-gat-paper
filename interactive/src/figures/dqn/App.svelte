<script>
  import { Plot, Dot, Text, Link, Arrow, Rect } from 'svelteplot';
  import spec from './spec.yaml';
  import { buildFromSpec, flatten, labelCenter, labelEdgeMid } from '../../lib/diagram';
  import Figure from '../../lib/Figure.svelte';

  const { graph } = buildFromSpec(spec);
  const { nodes, edges, boxes, containers, domain } = flatten(graph);

  const flowEdges = edges.filter(e => e.type === 'flow');
  const kdEdges = edges.filter(e => e.type === 'kd');
  const solidFlow = flowEdges.filter(e => e.style !== 'dashed');
  const dashedFlow = flowEdges.filter(e => e.style === 'dashed');
  const labeledFlow = flowEdges.filter(e => e.label);
</script>

<Figure title="DQN Fusion Agent">
  <Plot width={950} height={350} grid={false} axes={false} frame={false}
    x={{ domain: domain.x }} y={{ domain: domain.y }} inset={10}>
    <!-- Containers (Q-network boundary) -->
    <Rect data={containers} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" fillOpacity={0.06} stroke="stroke" strokeWidth={1}
      strokeDasharray="4 3" rx={10} />
    <Text data={containers}
      x={d => d.x1 + 6} y={d => d.y1 + 4}
      text="label" fontSize={8} fill="stroke" fontWeight="bold"
      textAnchor="start" dominantBaseline="hanging" />
    <!-- Solid flow edges -->
    <Arrow data={solidFlow} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={1} />
    <!-- Dashed flow edges (replay, reward loop) -->
    <Arrow data={dashedFlow} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={1} strokeDasharray="4 3" />
    <!-- Flow labels -->
    <Text data={labeledFlow}
      {...labelEdgeMid}
      text="label" fontSize={7} fill="#666" fontStyle="italic" />
    <!-- KD edges (target net sync) -->
    <Arrow data={kdEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={2} strokeDasharray="6 4" />
    <Text data={kdEdges}
      x={e => (e.x1 + e.x2) / 2 + 10} y={e => (e.y1 + e.y2) / 2}
      text="label" fontSize={8} fill="stroke" textAnchor="start" fontWeight="bold" />
    <!-- Boxes -->
    <Rect data={boxes} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" stroke="stroke" strokeWidth={1.5} rx={6} />
    <Text data={boxes} {...labelCenter}
      text="label" fontSize={8} fill="#333" />
  </Plot>
</Figure>
