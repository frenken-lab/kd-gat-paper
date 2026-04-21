<script>
  import { specToFlow, DiagramCanvas } from '../../lib/flow';

  const spec = {
    figure: 'graph-base',
    components: {
      input: { type: 'graph', n: 5, topology: 'sparse', color: 'vgae', labels: 'auto', scale: 80 },
    },
    layout: { type: 'hstack', children: ['input'] },
  };

  const { nodes: rawNodes, edges: rawEdges } = specToFlow(spec);

  let nodes = $state.raw(rawNodes);
  let edges = $state.raw(rawEdges);
</script>

<div class="figure">
  <h3>CAN Bus Graph</h3>
  <DiagramCanvas bind:nodes bind:edges width="100%" height="350px" />
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
</style>
