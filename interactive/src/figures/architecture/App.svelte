<script>
  import { Plot, Dot, Text, Link, Arrow, Rect } from 'svelteplot';
  import spec from './spec.yaml';
  import { buildFromSpec, flatten, labelCenter, labelEdgeMid } from '../../lib/diagram';
  import Figure from '../../lib/Figure.svelte';

  const { graph } = buildFromSpec(spec);
  const { nodes, edges, boxes, domain } = flatten(graph);

  const flowEdges = edges.filter(e => e.type === 'flow');
  const kdEdges = edges.filter(e => e.type === 'kd');
  const structuralEdges = edges.filter(e => e.type === 'structural');
  const labeledFlow = flowEdges.filter(e => e.label);
</script>

<Figure>
  <Plot width={880} height={420} grid={false} axes={false} frame={false}
    x={{ domain: domain.x }} y={{ domain: domain.y }} inset={10}>
    <!-- Layer 1: Structural edges (input graph) -->
    <Link data={structuralEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeOpacity={0.5} strokeWidth={1.5} />
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
      text="label" fontSize={9} fill="#333" />
    <!-- Layer 6: Input graph nodes -->
    <Dot data={nodes} x="x" y="y" r={14}
      fill="fill" stroke="stroke" strokeWidth={1.5} />
    <Text data={nodes} {...labelCenter} text="label"
      fontSize={6} fill="#333"
      fontFamily="CMU Typewriter Text, monospace" />
  </Plot>
</Figure>
