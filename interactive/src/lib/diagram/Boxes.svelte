<script>
  import { getContext } from 'svelte';
  import { Rect, Text } from 'svelteplot';
  import { resolve } from './palette.ts';

  let { rx = 6, fontSize = 9 } = $props();

  const { boxes } = getContext('diagram');

  // Convert center (x, y) + dimensions to x1/y1/x2/y2 for Rect mark
  const rects = boxes.map(b => {
    const w = b.width || 80;
    const h = b.height || 30;
    return {
      ...b,
      x1: b.x - w / 2,
      y1: b.y - h / 2,
      x2: b.x + w / 2,
      y2: b.y + h / 2,
    };
  });
</script>

<Rect data={rects} x1="x1" y1="y1" x2="x2" y2="y2"
  fill={b => resolve(b.color).fill}
  stroke={b => resolve(b.color).stroke}
  strokeWidth={1.5} {rx} />
<Text data={rects}
  x={b => (b.x1 + b.x2) / 2} y={b => (b.y1 + b.y2) / 2}
  text="label" {fontSize} fill="#333"
  textAnchor="middle" dy={1} />
