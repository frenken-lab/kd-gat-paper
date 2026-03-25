<script>
  import { setContext } from 'svelte';
  import { Plot } from 'svelteplot';

  let {
    data,
    width = 800,
    height = 350,
    inset = 20,
    padding = 40,
    xDomain = undefined,
    yDomain = undefined,
    children,
  } = $props();

  const nodes = $derived(data.nodes || []);
  const boxes = $derived(data.boxes || []);
  const edges = $derived(data.edges || []);
  const containers = $derived(data.containers || []);

  // Build position lookup: id → node/box object
  const lookup = $derived.by(() => {
    const m = new Map();
    for (const n of nodes) m.set(n.id, n);
    for (const b of boxes) m.set(b.id, b);
    return m;
  });

  // Auto-compute domain from all positioned elements
  const positions = $derived([...nodes, ...boxes]);
  const hasContent = $derived(positions.length > 0);
  const autoX = $derived(hasContent
    ? [Math.min(...positions.map(p => p.x)) - padding, Math.max(...positions.map(p => p.x)) + padding]
    : [0, width]);
  const autoY = $derived(hasContent
    ? [Math.min(...positions.map(p => p.y)) - padding, Math.max(...positions.map(p => p.y)) + padding]
    : [0, height]);

  // Context with getters so children read current derived values
  setContext('diagram', {
    get lookup() { return lookup; },
    get nodes() { return nodes; },
    get boxes() { return boxes; },
    get edges() { return edges; },
    get containers() { return containers; },
  });
</script>

{#if !hasContent}
  <p class="empty">Awaiting data export</p>
{:else}
  <Plot {width} {height} grid={false} axes={false} frame={false}
    x={{ domain: xDomain || autoX }} y={{ domain: yDomain || autoY }} {inset}>
    {@render children()}
  </Plot>
{/if}
