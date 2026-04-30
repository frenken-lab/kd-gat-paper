<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode } from '../../../lib/flow';
  import { DiagramCanvas, loadSpec, specToFlow } from '../../../lib/flow';
  import spec from './spec.yaml';

  let nodes = $state.raw<DiagramNode[]>([]);
  let edges = $state.raw<DiagramEdge[]>([]);

  specToFlow(loadSpec(spec), { direction: 'TB' }).then(r => {
    nodes = r.nodes;
    edges = r.edges;
  });
</script>

<Figure title="GAT Classifier">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="450px" />
</Figure>
