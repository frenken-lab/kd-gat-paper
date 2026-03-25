<script>
  import { getContext } from 'svelte';
  import { Arrow, Text } from 'svelteplot';

  let { stroke = '#BAB0AC', strokeWidth = 1, fontSize = 8 } = $props();

  const { lookup, edges } = getContext('diagram');

  // Annotation edges: dashed arrows with text labels at midpoint
  const annotations = edges
    .filter(e => e.type === 'annotation')
    .map(e => ({
      ...e,
      x1: lookup.get(e.source).x,
      y1: lookup.get(e.source).y,
      x2: lookup.get(e.target).x,
      y2: lookup.get(e.target).y,
    }));
</script>

<Arrow data={annotations} x1="x1" y1="y1" x2="x2" y2="y2"
  {stroke} {strokeWidth} strokeDasharray="4 3" />
<Text data={annotations}
  x={a => (a.x1 + a.x2) / 2} y={a => (a.y1 + a.y2) / 2}
  text="label" {fontSize} fill="#999"
  dy={-8} textAnchor="middle" fontStyle="italic" />
