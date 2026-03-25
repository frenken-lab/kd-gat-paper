<script>
  import { Graph, Nodes, Edges } from '../lib/diagram';
  import { createGraph } from '../lib/diagram/models/index.ts';

  const HEX_LABELS = ['0x1A0', '0x2B3', '0x3C1', '0x4D5', '0x5E2'];

  const { nodes, edges } = createGraph({
    n: 5,
    topology: 'sparse',
    color: 'vgae',
    labels: HEX_LABELS,
    prefix: 'n',
  });
  const data = { nodes, edges, boxes: [], containers: [] };
</script>

<div class="figure">
  <h3>CAN Bus Graph</h3>
  <Graph {data} width={280} height={280} padding={25}>
    <Edges type="structural" strokeOpacity={0.5} />
    <Nodes r={18} fontSize={8} fontFamily="CMU Typewriter Text, monospace" />
  </Graph>
</div>
