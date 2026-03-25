<script>
  import { Graph, Nodes, Edges, Boxes, Container } from '../lib/diagram';
  import { createVgae, mergeModels } from '../lib/diagram/models/index.ts';

  const teacher = createVgae({ encoderSizes: [5, 3], latentDim: 3, prefix: 't', label: 'Teacher' });
  const student = createVgae({ encoderSizes: [3, 2], latentDim: 2, prefix: 's', xOffset: 800, label: 'Student' });
  const data = mergeModels(teacher, student);
</script>

<div class="figure">
  <h3>KD-VGAE: Knowledge Distillation</h3>
  <Graph {data} width={1100} height={950}>
    <Container />
    <Edges type="structural" strokeOpacity={0.5} />
    <Edges type="flow" directed strokeDasharray="4 3" />
    <Edges type="kd" directed stroke="kd" strokeWidth={2} strokeDasharray="6 4" />
    <Nodes r={10} />
    <Boxes />
  </Graph>
</div>
