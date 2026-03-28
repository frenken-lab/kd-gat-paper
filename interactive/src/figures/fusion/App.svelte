<script>
  import Figure from '../../lib/FigureDefaults.svelte';
  import { Plot, RectY, RuleY, binX } from 'svelteplot';
  import { useToggleFilter } from '../../lib/useToggleFilter.svelte.js';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  const { visible, toggle, types, filtered } = useToggleFilter(
    () => isEmpty ? [] : data,
    d => d.attack_type,
  );
</script>

<Figure title="Bandit Fusion Weight Analysis">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as t}
        <button class="toggle" class:active={visible[t]} class:inactive={!visible[t]} onclick={() => toggle(t)}>{t}</button>
      {/each}
    </div>
    <Plot
      x={{ label: 'Fusion Weight α (0 = VGAE, 1 = GAT)' }}
      y={{ label: 'Count' }}
      color={{ domain: ['Normal', 'Attack'], range: ['#4E79A7', '#E15759'], legend: true }}>
      <RectY {...binX({ data: filtered, x: 'alpha', fill: 'attack_type' }, { y: 'count' })} />
      <RuleY data={[0]} />
    </Plot>
  {/if}
</Figure>
