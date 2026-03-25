<script>
  import { getContext } from 'svelte';
  import { Dot, Text } from 'svelteplot';
  import { resolve } from './palette.ts';

  let { r = 12, fontSize = 7, fontFamily = undefined } = $props();

  const { nodes } = getContext('diagram');
</script>

<Dot data={nodes} x="x" y="y" {r}
  fill={n => resolve(n.color).fill}
  stroke={n => resolve(n.color).stroke}
  strokeWidth={1.5} />
<Text data={nodes} x="x" y="y" text="label"
  {fontSize} fill="#333"
  textAnchor="middle" dy={1} {fontFamily} />
