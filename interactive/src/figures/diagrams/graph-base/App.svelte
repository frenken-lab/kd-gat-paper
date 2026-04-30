<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import type { DiagramEdge, DiagramNode, FigureSpec } from '../../../lib/flow';
  import { DiagramCanvas, specToFlow } from '../../../lib/flow';

  // Inline spec — no yaml file for this simple single-component diagram
  const spec: FigureSpec = {
    figure: 'graph-base',
    components: {
      input: {
        type: 'graph',
        n: 5,
        topology: 'sparse',
        color: 'vgae',
        labels: 'auto',
        scale: 80,
      },
    },
    layout: { type: 'hstack', children: ['input'] },
  };

  let nodes = $state.raw<DiagramNode[]>([]);
  let edges = $state.raw<DiagramEdge[]>([]);

  specToFlow(spec).then(r => {
    nodes = r.nodes;
    edges = r.edges;
  });
</script>

<Figure title="CAN Bus Graph">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="350px" />
</Figure>
