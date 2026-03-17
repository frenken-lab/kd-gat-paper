<script>
  import { Plot, RectY, RuleY, binX } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !Array.isArray(data) || data.length === 0;

  let attackTypes = isEmpty ? [] : [...new Set(data.map(d => d.attack_type))];
  let visible = Object.fromEntries(attackTypes.map(t => [t, true]));

  function toggle(type) {
    visible[type] = !visible[type];
    visible = { ...visible };
  }

  $: filtered = isEmpty ? [] : data.filter(d => visible[d.attack_type]);
</script>

<div style="font-family: system-ui, sans-serif; max-width: 740px;">
  <h3 style="margin: 0 0 8px; font-size: 14px; color: #333;">
    DQN Fusion Weight Analysis
  </h3>

  {#if isEmpty}
    <p style="color: #999; font-size: 12px;">Awaiting data export from KD-GAT</p>
  {:else}
    <!-- Attack type toggles -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
      {#each attackTypes as type}
        <button
          onclick={() => toggle(type)}
          style="
            padding: 2px 8px; border: 1px solid #ccc; border-radius: 4px;
            background: {visible[type] ? '#eef' : '#f5f5f5'};
            cursor: pointer; font-size: 12px;
            opacity: {visible[type] ? 1 : 0.4};
          ">{type}</button>
      {/each}
    </div>

    <Plot
      grid
      height={360}
      x={{ label: 'Fusion Weight \u03b1 (0 = VGAE, 1 = GAT)' }}
      y={{ label: 'Count' }}
      color={{ legend: true }}>
      <RectY
        {...binX(
          { data: filtered, x: 'alpha', fill: 'attack_type' },
          { y: 'count' }
        )} />
      <RuleY data={[0]} />
    </Plot>
  {/if}
</div>
