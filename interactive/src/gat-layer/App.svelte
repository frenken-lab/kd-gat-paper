<script>
  import { Graph, Nodes, Edges, Container, Annotation } from '../lib/diagram';
  import data from './data.json';
</script>

<div class="figure">
  <h3>GAT Attention Layer</h3>
  <Graph {data} width={900} height={320}>
    <Container />
    <Edges type="structural" strokeOpacity={0.5} />
    <Edges type="encoded" directed stroke="attention" strokeWidth={[0.5, 3.5]} strokeOpacity={[0.3, 1.0]} />
    <Annotation />
    <Nodes />
  </Graph>
</div>
