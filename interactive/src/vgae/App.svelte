<script>
  import { Graph, Nodes, Edges, Boxes, Container } from '../lib/diagram';
  import { createVgae } from '../lib/diagram/models/index.ts';

  const data = createVgae({ encoderSizes: [5, 3], latentDim: 3 });
</script>

<div class="figure">
  <h3>VGAE Autoencoder</h3>
  <Graph {data} width={350} height={950}>
    <Container />
    <Edges type="structural" strokeOpacity={0.5} />
    <Edges type="flow" directed strokeDasharray="4 3" />
    <Nodes r={10} />
    <Boxes />
  </Graph>
</div>
