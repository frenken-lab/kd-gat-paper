<script>
  import { setContext } from 'svelte';
  import './theme.css';
  import 'virtual:theme-vars.css';

  // Global SveltePlot defaults — all figures inherit these.
  // Override per-figure by passing props to <Plot> where needed.
  setContext('svelteplot/defaults', {
    height: 350,
    categoricalColorScheme: 'observable10',
    grid: { implicit: true },
    axis: { tickSize: 0, tickPadding: 5 },
  });

  let { title = '', children } = $props();
</script>

<figure class="figure">
  {#if title}<h3>{title}</h3>{/if}
  {@render children()}
</figure>
