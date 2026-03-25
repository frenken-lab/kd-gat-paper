<script>
  import { getContext } from 'svelte';
  import { Rect, Text } from 'svelteplot';
  import { resolve } from './palette.ts';

  let { padding = 30 } = $props();

  const { nodes, containers } = getContext('diagram');

  // Group nodes by their group field
  const groups = new Map();
  for (const n of nodes) {
    if (n.group) {
      if (!groups.has(n.group)) groups.set(n.group, []);
      groups.get(n.group).push(n);
    }
  }

  // Compute bounding boxes from grouped node positions
  const rects = containers.map(c => {
    const groupNodes = groups.get(c.group) || [];
    const xs = groupNodes.map(n => n.x);
    const ys = groupNodes.map(n => n.y);
    const { stroke, fill } = resolve(c.color);
    return {
      ...c,
      x1: Math.min(...xs) - padding,
      y1: Math.min(...ys) - padding,
      x2: Math.max(...xs) + padding,
      y2: Math.max(...ys) + padding,
      stroke,
      fill,
    };
  });
</script>

{#each rects as r}
  <Rect data={[r]} x1="x1" y1="y1" x2="x2" y2="y2"
    fill={r.fill + '40'} stroke={r.stroke + '60'}
    strokeWidth={1} strokeDasharray="4 3" />
  <Text data={[r]} x="x1" y="y2" text="label"
    fontSize={9} fill={r.stroke + '90'}
    dx={4} dy={12} />
{/each}
