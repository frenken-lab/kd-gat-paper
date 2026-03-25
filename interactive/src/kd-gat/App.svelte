<script>
  import { Graph, Nodes, Edges, Boxes, Container } from '../lib/diagram';
  import { createGat, mergeModels } from '../lib/diagram/models/index.ts';

  const teacher = createGat({ layers: 3, nodesPerLayer: 5, prefix: 't', label: 'Teacher' });
  const student = createGat({ layers: 2, nodesPerLayer: 3, prefix: 's', xOffset: 800, label: 'Student' });
  const data = mergeModels(teacher, student);
</script>

<div class="figure">
  <h3>KD-GAT: Knowledge Distillation</h3>
  <Graph {data} width={1100} height={850}>
    <Container />
    <Edges type="structural" strokeOpacity={0.5} />
    <Edges type="flow" directed strokeDasharray="4 3" />
    <Edges type="kd" directed stroke="kd" strokeWidth={2} strokeDasharray="6 4" />
    <Nodes r={10} />
    <Boxes />
  </Graph>
</div>
