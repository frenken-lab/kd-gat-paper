<script>
  import { setPlotDefaults } from "svelteplot/hooks/plotDefaults.js";
  import "./theme.css";
  import "virtual:theme-vars.css";

  setPlotDefaults({
    height: 350,
    categoricalColorScheme: "observable10",
    grid: { implicit: true },
    axis: { tickSize: 0, tickPadding: 5 },
  });

  let { title = "", children } = $props();
</script>

<div class="figure">
  {#if title}<h3>{title}</h3>{/if}
  {@render children()}
</div>

<style>
  .figure {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .figure h3 {
    margin: 0;
  }

  .figure :global(figure) {
    margin: 0;
  }
</style>