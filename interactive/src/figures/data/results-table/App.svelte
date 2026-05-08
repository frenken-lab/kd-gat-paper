<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import rawData from './data.json';

  type MetricKey = 'f1_macro' | 'auroc_macro' | 'accuracy';

  interface DataRow {
    variant: string;
    group: string;
    dataset: string;
    split: string;
    f1_macro: number | null;
    auroc_macro: number | null;
    accuracy: number | null;
    n_seeds: number;
  }

  interface ResultsData {
    datasets: string[];
    splits_by_dataset: Record<string, string[]>;
    split_labels: Record<string, string>;
    metrics: MetricKey[];
    metric_labels: Record<string, string>;
    variant_labels: Record<string, string>;
    rows: DataRow[];
  }

  const isLegacy = Array.isArray(rawData);
  const data = isLegacy ? null : (rawData as unknown as ResultsData);

  const datasets: string[] = data?.datasets ?? [];
  const splitsByDataset: Record<string, string[]> = data?.splits_by_dataset ?? {};
  const splitLabels: Record<string, string> = data?.split_labels ?? {};
  const metricLabels: Record<string, string> = data?.metric_labels ?? {};
  const variantLabels: Record<string, string> = data?.variant_labels ?? {};
  const allRows: DataRow[] = data?.rows ?? [];
  const metrics: MetricKey[] = data?.metrics ?? ['f1_macro', 'auroc_macro', 'accuracy'];

  const MAIN_GROUPS = new Set(['fusion', 'student', 'student_kd']);
  const ABLATION_GROUPS = new Set(['gat_loss', 'gat_sampling', 'id_encoding']);

  let activeDataset = $state(datasets[0] ?? '');
  let activeSplit = $state('pooled');
  let activeView = $state<'main' | 'ablation'>('main');
  let sortKey = $state<string>('f1_macro');
  let sortAsc = $state(false);

  const availableSplits = $derived(splitsByDataset[activeDataset] ?? []);

  $effect(() => {
    const avail = splitsByDataset[activeDataset] ?? [];
    if (avail.length > 0 && !avail.includes(activeSplit)) {
      activeSplit = avail[0];
    }
  });

  const filteredRows = $derived(
    allRows.filter(r => {
      if (r.dataset !== activeDataset || r.split !== activeSplit) return false;
      return activeView === 'main' ? MAIN_GROUPS.has(r.group) : ABLATION_GROUPS.has(r.group);
    }),
  );

  const colBest = $derived.by(() => {
    const best: Record<string, number> = {};
    for (const m of metrics) {
      const vals = filteredRows
        .map(r => r[m])
        .filter((v): v is number => v != null && !Number.isNaN(v));
      if (vals.length > 0) best[m] = Math.max(...vals);
    }
    return best;
  });

  const sortedRows = $derived.by(() =>
    filteredRows.toSorted((a, b) => {
      const va = ((a as Record<string, unknown>)[sortKey] ?? -Infinity) as number;
      const vb = ((b as Record<string, unknown>)[sortKey] ?? -Infinity) as number;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    }),
  );

  function toggleSort(key: string): void {
    if (sortKey === key) sortAsc = !sortAsc;
    else {
      sortKey = key;
      sortAsc = false;
    }
  }

  function cellBg(value: number | null, metric: string): string {
    if (value == null) return 'transparent';
    const best = colBest[metric];
    if (best == null) return 'transparent';
    if (value === best) return '#D7E8D3';
    if (value >= best * 0.99) return '#DAE3EF';
    return 'transparent';
  }

  function sortIndicator(key: string): string {
    if (sortKey !== key) return '';
    return sortAsc ? ' ▲' : ' ▼';
  }

  function variantLabel(v: string): string {
    return variantLabels[v] ?? v;
  }

  function fmtVal(v: number | null): string {
    return v == null ? '—' : v.toFixed(4);
  }
</script>

<Figure title="Results by Dataset and Evaluation Scenario">
  {#if isLegacy || datasets.length === 0}
    <p class="empty">Awaiting data export</p>
  {:else}
    <div class="toolbar">
      <div class="tabs">
        {#each datasets as ds}
          <button
            class="tab"
            class:active={ds === activeDataset}
            onclick={() => {
              activeDataset = ds;
            }}>
            {ds.replace(/_/g, ' ')}
          </button>
        {/each}
      </div>
      <div class="view-toggle">
        <button
          class="view-btn"
          class:active={activeView === 'main'}
          onclick={() => {
            activeView = 'main';
          }}>Main Results</button>
        <button
          class="view-btn"
          class:active={activeView === 'ablation'}
          onclick={() => {
            activeView = 'ablation';
          }}>Ablation</button>
      </div>
    </div>

    {#if availableSplits.length > 1}
      <div class="controls">
        <label for="split-select" class="split-label">Scenario:</label>
        <select id="split-select" bind:value={activeSplit} class="split-select">
          {#each availableSplits as s}
            <option value={s}>{splitLabels[s] ?? s}</option>
          {/each}
        </select>
      </div>
    {/if}

    <table class="results-table">
      <thead>
        <tr>
          <th class="model-col" onclick={() => toggleSort('variant')}>
            Model{sortIndicator('variant')}
          </th>
          <th class="group-col" onclick={() => toggleSort('group')}>
            Group{sortIndicator('group')}
          </th>
          {#each metrics as m}
            <th onclick={() => toggleSort(m)}>
              {metricLabels[m] ?? m}{sortIndicator(m)}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedRows as row (row.variant + ':' + row.group)}
          <tr class:fusion={row.group === 'fusion'}>
            <td class="model-col">{variantLabel(row.variant)}</td>
            <td class="group-col">{row.group}</td>
            {#each metrics as m}
              <td
                style:background={cellBg(row[m], m)}
                title="{variantLabel(row.variant)} {metricLabels[m] ?? m}: {fmtVal(row[m])}">
                {fmtVal(row[m])}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>

    {#if sortedRows.length === 0}
      <p class="empty">No data for this combination</p>
    {/if}
  {/if}
</Figure>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .view-toggle {
    display: flex;
    border: 1px solid #ccc;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .view-btn {
    font-size: 12px;
    padding: 4px 10px;
    border: none;
    background: #f5f5f5;
    cursor: pointer;
    color: #555;
    transition:
      background 0.1s,
      color 0.1s;
  }
  .view-btn + .view-btn {
    border-left: 1px solid #ccc;
  }
  .view-btn.active {
    background: #4e79a7;
    color: #fff;
    font-weight: 600;
  }
  .view-btn:hover:not(.active) {
    background: #e8e8e8;
  }
  .tab {
    font-size: 12px;
    padding: 4px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    cursor: pointer;
    color: #555;
    transition:
      background 0.1s,
      color 0.1s;
  }
  .tab.active {
    background: #4e79a7;
    border-color: #4e79a7;
    color: #fff;
    font-weight: 600;
  }
  .tab:hover:not(.active) {
    background: #e8e8e8;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .split-label {
    font-size: 12px;
    color: #555;
  }
  .split-select {
    font-size: 12px;
    padding: 3px 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
  }
  .results-table {
    border-collapse: collapse;
    width: 100%;
    font-size: 13px;
  }
  .results-table thead tr {
    border-top: 2px solid #333;
    border-bottom: 2px solid #333;
  }
  .results-table th {
    cursor: pointer;
    padding: 6px 10px;
    text-align: right;
    user-select: none;
    font-weight: 600;
    white-space: nowrap;
  }
  .results-table th:hover {
    background: #f0f0f0;
  }
  .model-col {
    text-align: left !important;
  }
  .group-col {
    text-align: left !important;
    color: #777;
    font-size: 11px;
  }
  .results-table td {
    padding: 6px 10px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    transition: background 0.15s;
  }
  .results-table tbody tr:last-child {
    border-bottom: 2px solid #333;
  }
  .results-table tr.fusion {
    font-weight: 700;
    border-left: 3px solid #4e79a7;
  }
  .empty {
    font-size: 13px;
    color: #999;
    text-align: center;
    padding: 24px 0;
  }
</style>
