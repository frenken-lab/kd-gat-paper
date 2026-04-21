<script>
  import spec from './spec.yaml';
  import { specToFlow, DiagramCanvas } from '../../lib/flow';

  const { nodes: rawNodes, edges: rawEdges } = specToFlow(spec, { direction: 'TB' });

  let nodes = $state.raw(rawNodes);
  let edges = $state.raw(rawEdges);
</script>

<div class="figure">
  <h3>GAT Classifier</h3>
  <DiagramCanvas bind:nodes bind:edges direction="TB" width="100%" height="450px" />
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
</style>
