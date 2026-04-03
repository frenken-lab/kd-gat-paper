<script>
  import { Plot, Dot, Text, Link, Arrow, Rect } from 'svelteplot';
  import spec from './spec.yaml';
  import gatSpec from '../gat/spec.yaml';
  import vgaeSpec from '../vgae/spec.yaml';
  import { buildFromSpec, flatten, labelCenter, labelEdgeMid } from '../../lib/diagram';
  import Figure from '../../lib/Figure.svelte';

  const { graph } = buildFromSpec(spec, { specs: { gat: gatSpec, vgae: vgaeSpec } });
  const { nodes, edges, boxes, containers, domain } = flatten(graph);

  const flowEdges = edges.filter(e => e.type === 'flow');
  const kdEdges = edges.filter(e => e.type === 'kd');
  const structuralEdges = edges.filter(e => e.type === 'structural');
  const labeledFlow = flowEdges.filter(e => e.label);
</script>

<Figure>
  <Plot width={1100} height={550} grid={false} axes={false} frame={false}
    x={{ domain: domain.x }} y={{ domain: domain.y }} inset={10}>
    <!-- Layer 0: Containers (model/section boundaries) -->
    <Rect data={containers} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" fillOpacity={0.06} stroke="stroke" strokeWidth={1}
      strokeDasharray="4 3" rx={10} />
    <Text data={containers}
      x={d => d.x1 + 6} y={d => d.y1 + 4}
      text="label" fontSize={7} fill="stroke" fontWeight="bold"
      textAnchor="start" dominantBaseline="hanging" />
    <!-- Layer 1: Structural edges (sub-graph topologies) -->
    <Link data={structuralEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeOpacity={0.4} strokeWidth={1} />
    <!-- Layer 2: Flow edges -->
    <Arrow data={flowEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={1}
      strokeDasharray={e => e.style === 'dashed' ? '4 3' : 'none'} />
    <!-- Layer 3: Flow edge labels -->
    <Text data={labeledFlow}
      {...labelEdgeMid}
      text="label" fontSize={7} fill="#666" />
    <!-- Layer 4: KD edges -->
    <Arrow data={kdEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={2} strokeDasharray="6 4" />
    <Text data={kdEdges}
      x={e => (e.x1 + e.x2) / 2 + 14} y={e => (e.y1 + e.y2) / 2}
      text="label" fontSize={9} fill="stroke" textAnchor="start" fontWeight="bold" />
    <!-- Layer 5: Boxes -->
    <Rect data={boxes} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" stroke="stroke" strokeWidth={1.5} rx={6} />
    <Text data={boxes} {...labelCenter}
      text="label" fontSize={8} fill="#333" />
    <!-- Layer 6: Graph nodes (r per node — scaled for sub-specs) -->
    <Dot data={nodes} x="x" y="y" r={d => d.r ?? 14}
      fill="fill" stroke="stroke" strokeWidth={1.5} />
    <Text data={nodes} {...labelCenter} text="label"
      fontSize={d => d.r && d.r < 10 ? 4 : 6} fill="#333"
      fontFamily="CMU Typewriter Text, monospace" />
  </Plot>
</Figure>
