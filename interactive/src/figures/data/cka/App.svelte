<script lang="ts">
  import { Cell, Plot, Text } from 'svelteplot';

  import Figure from '../../../lib/Figure.svelte';
  import { getPaletteColor } from '../../../lib/palette.ts';
  import rawData from './data.json';

  type CKARecord = {
    teacher: string;
    student: string;
    value: number;
  };

  type DataMatrices = Record<string, Record<string, (number | null)[][] | null>>;

  const data = rawData;
  const isEmpty =
    !data?.matrices ||
    Object.keys(data.matrices).length === 0 ||
    !data?.variants ||
    (data.variants as string[]).length === 0;

  const datasets = isEmpty ? [] : Object.keys(data.matrices as DataMatrices).sort();
  let selectedDataset = $state(datasets[0] ?? '');

  const variants: string[] = isEmpty ? [] : (data.variants as string[]);
  let selectedVariant = $state(variants[0] ?? '');

  function getRecords(dataset: string, variant: string): CKARecord[] {
    if (isEmpty || !dataset || !variant) return [];
    const variantMap = (data.matrices as DataMatrices)[dataset];
    if (!variantMap) return [];
    const matrix = variantMap[variant];
    if (!matrix) return [];
    const out: CKARecord[] = [];
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix[r].length; c++) {
        const v = matrix[r][c];
        if (v !== null)
          out.push({
            teacher: (data.teacher_layers as string[])[r],
            student: (data.student_layers as string[])[c],
            value: v,
          });
      }
    return out;
  }

  const records = $derived(getRecords(selectedDataset, selectedVariant));

  // Square cells: aspect ratio = n_rows / n_cols so each band slot is equally sized.
  const cellAspectRatio = isEmpty
    ? 1
    : (data.teacher_layers as string[]).length / (data.student_layers as string[]).length;

  const colorScheme = [getPaletteColor('blue').fill, getPaletteColor('blue').stroke];
</script>

<Figure title="CKA Teacher–Student Layer Alignment">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="selector-row">
      <div class="tab-group">
        <span class="tab-label">Dataset</span>
        {#each datasets as ds}
          <button class:active={ds === selectedDataset} onclick={() => (selectedDataset = ds)}>
            {ds}
          </button>
        {/each}
      </div>
      <div class="tab-group">
        <span class="tab-label">Variant</span>
        {#each variants as v}
          <button class:active={v === selectedVariant} onclick={() => (selectedVariant = v)}>
            {v}
          </button>
        {/each}
      </div>
    </div>
    {#if records.length === 0}
      <p class="empty">No data for {selectedDataset} / {selectedVariant}</p>
    {:else}
      <Plot
        padding={0}
        aspectRatio={cellAspectRatio}
        marginBottom={50}
        marginLeft={90}
        x={{ type: 'band', label: 'Student Layer', axis: 'bottom' }}
        y={{ type: 'band', label: 'Teacher Layer' }}
        color={{ scheme: colorScheme, label: 'CKA', legend: true }}>
        <Cell data={records} x="student" y="teacher" fill="value" inset={1} />
        <Text
          data={records}
          x="student"
          y="teacher"
          text={(d: CKARecord) => d.value.toFixed(2)}
          fontSize={11}
          fill={(d: CKARecord) => (d.value > 0.7 ? 'white' : '#333')}
          textAnchor="middle" />
      </Plot>
    {/if}
  {/if}
</Figure>

<style>
  .selector-row {
    display: flex;
    gap: 16px;
    margin-bottom: 10px;
    flex-wrap: wrap;
    align-items: flex-start;
  }
  .tab-group {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
  }
  .tab-label {
    font-size: 11px;
    color: #666;
    margin-right: 2px;
  }
  .tab-group button {
    padding: 3px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 12px;
  }
  .tab-group button.active {
    background: #1a6faf;
    color: white;
    border-color: #1a6faf;
  }
  .empty {
    color: #888;
    font-style: italic;
    font-size: 13px;
  }
</style>
