<script>
  import spec from './spec.yaml';
  import { specToFlow, DiagramCanvas } from '../../lib/flow';

  const { nodes: rawNodes, edges: rawEdges } = specToFlow(spec);

  let nodes = $state.raw(rawNodes);
  let edges = $state.raw(rawEdges);
</script>

<div class="figure">
  <h3>KD-VGAE: Knowledge Distillation</h3>
  <DiagramCanvas bind:nodes bind:edges width="100%" height="350px" />
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
</style>
