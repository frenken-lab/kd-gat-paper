<script lang="ts">
  import Figure from '../../../lib/Figure.svelte';
  import rawData from './data.json';

  interface ResultRow {
    model: string;
    group?: string;
    citation_key?: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1: number;
    auc: number;
    [key: string]: string | number | undefined;
  }

  type MetricKey = 'accuracy' | 'precision' | 'recall' | 'f1' | 'auc';

  // Guard against missing/malformed JSON — renders empty state instead of crashing
  const data: ResultRow[] = Array.isArray(rawData)
    ? (rawData as ResultRow[])
    : [];
  const isEmpty = data.length === 0;

  const metrics: MetricKey[] = ['accuracy', 'precision', 'recall', 'f1', 'auc'];
  const metricLabels: Record<MetricKey, string> = {
    accuracy: 'Accuracy',
    precision: 'Precision',
    recall: 'Recall',
    f1: 'F1',
    auc: 'AUC',
  };

  // Column-wise best values — pre-computed once, not reactive (data is static)
  const colBest: Record<string, number> = {};
  if (!isEmpty) {
    for (const m of metrics) {
      colBest[m] = Math.max(...data.map(d => d[m] as number));
    }
  }

  let sortKey = $state<string>('f1');
  let sortAsc = $state(false);
  let filterText = $state('');

  const rows = $derived.by(() => {
    if (isEmpty) return [];
    const filtered = data.filter(d =>
      d.model.toLowerCase().includes(filterText.toLowerCase()),
    );
    return filtered.toSorted((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  });

  function toggleSort(key: string): void {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = false;
    }
  }

  // Green highlight for best, blue for within 1% of best, transparent otherwise
  function cellBg(value: number, metric: string): string {
    if (value === colBest[metric]) return '#D7E8D3';
    if (value >= colBest[metric] * 0.99) return '#DAE3EF';
    return 'transparent';
  }

  function sortIndicator(key: string): string {
    if (sortKey !== key) return '';
    return sortAsc ? ' ▲' : ' ▼';
  }

  interface TooltipState {
    show: boolean;
    x: number;
    y: number;
    text: string;
  }

  let tooltip = $state<TooltipState>({show: false, x: 0, y: 0, text: ''});

  function showTooltip(e: MouseEvent, row: ResultRow, metric: MetricKey): void {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    tooltip = {
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 4,
      text: `${row.model} ${metricLabels[metric]}: ${row[metric]}`,
    };
  }

  function hideTooltip(): void {
    tooltip = {...tooltip, show: false};
  }
</script>

<Figure title="Test Performance Comparison">
  {#if isEmpty}
    <p class="empty">Awaiting data export</p>
  {:else}
    <div class="controls">
      <input
        type="text"
        placeholder="Filter models…"
        bind:value={filterText}
        class="filter-input" />
      <span class="hint">Click headers to sort</span>
    </div>

    <table class="results-table">
      <thead>
        <tr>
          <th class="model-col" onclick={() => toggleSort('model')}>
            Model{sortIndicator('model')}
          </th>
          {#each metrics as m}
            <th onclick={() => toggleSort(m)}>
              {metricLabels[m]}{sortIndicator(m)}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.model)}
          <tr class:ours={row.group === 'ours'}>
            <td class="model-col">
              {row.model}
              {#if row.citation_key}
                <span class="cite">[{row.citation_key}]</span>
              {/if}
            </td>
            {#each metrics as m}
              <td
                style:background={cellBg(row[m] as number, m)}
                onmouseenter={e => showTooltip(e, row, m)}
                onmouseleave={hideTooltip}>
                {(row[m] as number).toFixed(4)}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>

    {#if tooltip.show}
      <div class="tooltip" style:left="{tooltip.x}px" style:top="{tooltip.y}px">
        {tooltip.text}
      </div>
    {/if}
  {/if}
</Figure>

<style>
  .controls {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }
  .filter-input {
    font-size: 12px;
    padding: 4px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 160px;
  }
  .hint {
    font-size: 11px;
    color: #999;
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
  .results-table td {
    padding: 6px 10px;
    text-align: right;
    font-variant-numeric: tabular-nums;
    transition: background 0.15s;
  }
  .results-table tbody tr:last-child {
    border-bottom: 2px solid #333;
  }
  .results-table tr.ours {
    font-weight: 700;
    border-left: 3px solid #4e79a7;
  }
  .results-table .cite {
    font-size: 10px;
    color: #888;
    font-weight: 400;
    margin-left: 4px;
  }
  .tooltip {
    position: fixed;
    transform: translate(-50%, -100%);
    background: #333;
    color: #fff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 100;
  }
</style>
