<script>
  import spec from './spec.yaml';
  import gatSpec from '../gat/spec.yaml';
  import vgaeSpec from '../vgae/spec.yaml';
  import { specToFlow, DiagramCanvas } from '../../../lib/flow';

  let nodes = $state.raw([]);
  let edges = $state.raw([]);

  specToFlow(spec, { specs: { gat: gatSpec, vgae: vgaeSpec } }).then((r) => {
    nodes = r.nodes;
    edges = r.edges;
  });
</script>

<div class="figure">
  <h3>KD-GAT Architecture</h3>
  <DiagramCanvas bind:nodes bind:edges width="100%" height="550px" />
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
</style>
