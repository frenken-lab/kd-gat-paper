<script lang="ts">
  import { binX, Plot, RectY, RuleY } from 'svelteplot';

  import Figure from '../../../lib/Figure.svelte';
  import { buildColorMap } from '../../../lib/usePaletteColors.svelte.ts';
  import { useToggleFilter } from '../../../lib/useToggleFilter.svelte.ts';
  import rawData from './data.json';

  // Guard against missing/malformed JSON
  const data = Array.isArray(rawData) ? rawData : [];
  const isEmpty = data.length === 0;

  // Toggle filters control visibility of each attack type
  const { visible, toggle, types, filtered } = useToggleFilter(
    () => (isEmpty ? [] : data),
    d => d.attack_type,
  );

  // Derive color domain from data so it adapts to both binary and multi-class exports
  const attackTypes = isEmpty ? [] : [...new Set(data.map(d => d.attack_type))];
  const colorMap = buildColorMap(attackTypes);
</script>

<Figure title="Bandit Fusion Weight Analysis">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="controls">
      {#each types as t}
        <button
          class="toggle"
          style:--chip-color={colorMap[t]}
          class:active={visible[t]}
          class:inactive={!visible[t]}
          onclick={() => toggle(t)}>{t}</button>
      {/each}
    </div>
    <Plot
      x={{ label: 'Fusion Weight α (0 = VGAE, 1 = GAT)' }}
      y={{ label: 'Count' }}>
      {#each attackTypes as t}
        {#if visible[t]}
          <RectY
            {...binX(
              { data: filtered.filter(d => d.attack_type === t), x: 'alpha' },
              { y: 'count' },
            )}
            fill={colorMap[t]} />
        {/if}
      {/each}
      <RuleY data={[0]} />
    </Plot>
  {/if}
</Figure>
