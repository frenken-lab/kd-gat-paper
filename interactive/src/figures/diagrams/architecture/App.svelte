<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode } from '../../../lib/flow';
  import { DiagramCanvas, loadSpec, specToFlow } from '../../../lib/flow';
  import gatSpec from '../gat/spec.yaml';
  import vgaeSpec from '../vgae/spec.yaml';
  import spec from './spec.yaml';

  let nodes = $state.raw<DiagramNode[]>([]);
  let edges = $state.raw<DiagramEdge[]>([]);

  // Compose the architecture diagram from sub-specs for GAT and VGAE
  specToFlow(loadSpec(spec), {
    specs: { gat: loadSpec(gatSpec), vgae: loadSpec(vgaeSpec) },
  }).then(r => {
    nodes = r.nodes;
    edges = r.edges;
  });
</script>

<Figure title="KD-GAT Architecture">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="550px" />
</Figure>
