<script>
  import { getContext } from 'svelte';
  import { Link, Arrow } from 'svelteplot';
  import { resolve } from './palette.ts';

  let {
    type,
    directed = false,
    stroke = undefined,
    strokeWidth = 1.5,
    strokeOpacity = undefined,
    strokeDasharray = undefined,
  } = $props();

  const { lookup, edges } = getContext('diagram');

  // Filter by type and resolve endpoint positions from node lookup
  const filtered = edges
    .filter(e => e.type === type)
    .map(e => ({
      ...e,
      x1: lookup.get(e.source).x,
      y1: lookup.get(e.source).y,
      x2: lookup.get(e.target).x,
      y2: lookup.get(e.target).y,
    }));

  // Resolve stroke: explicit role/hex → constant, or per-edge from color field
  const strokeVal = $derived(stroke != null
    ? resolve(stroke).stroke
    : (e => resolve(e.color).stroke));

  // Weight-based scaling: [min, max] tuple → accessor function
  const weights = filtered.map(e => e.weight).filter(w => w != null);
  const wMin = weights.length ? Math.min(...weights) : 0;
  const wMax = weights.length ? Math.max(...weights) : 1;
  const wRange = wMax - wMin || 1;

  function scaled(val) {
    if (!Array.isArray(val)) return val;
    const [lo, hi] = val;
    return e => lo + (hi - lo) * (e.weight - wMin) / wRange;
  }
</script>

{#if directed}
  <Arrow data={filtered} x1="x1" y1="y1" x2="x2" y2="y2"
    stroke={strokeVal}
    strokeWidth={scaled(strokeWidth)}
    strokeOpacity={scaled(strokeOpacity)}
    {strokeDasharray} />
{:else}
  <Link data={filtered} x1="x1" y1="y1" x2="x2" y2="y2"
    stroke={strokeVal}
    strokeWidth={scaled(strokeWidth)}
    strokeOpacity={scaled(strokeOpacity)}
    {strokeDasharray} />
{/if}
