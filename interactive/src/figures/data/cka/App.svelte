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

  const data = rawData;
  const isEmpty = !data?.matrices || Object.keys(data.matrices).length === 0;

  const datasets = isEmpty ? [] : Object.keys(data.matrices as Record<string, unknown>).sort();
  let selectedDataset = $state(datasets[0] ?? '');

  function getRecords(dataset: string): CKARecord[] {
    if (isEmpty || !dataset) return [];
    const matrix = (data.matrices as Record<string, (number | null)[][]>)[dataset];
    if (!matrix) return [];
    const out: CKARecord[] = [];
    for (let r = 0; r < matrix.length; r++)
      for (let c = 0; c < matrix[r].length; c++) {
        const v = matrix[r][c];
        if (v !== null)
          out.push({ teacher: data.teacher_layers[r], student: data.student_layers[c], value: v });
      }
    return out;
  }

  const records = $derived(getRecords(selectedDataset));

  const colorScheme = [
    getPaletteColor('blue').fill,
    getPaletteColor('blue').stroke,
  ];
</script>

<Figure title="CKA Layer Alignment by Ablation Variant">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <div class="dataset-tabs">
      {#each datasets as ds}
        <button class:active={ds === selectedDataset} onclick={() => (selectedDataset = ds)}>
          {ds}
        </button>
      {/each}
    </div>
    <Plot
      padding={0}
      aspectRatio={1}
      marginBottom={60}
      marginLeft={90}
      x={{
        type: 'band',
        label: 'Ablation Variant',
        axis: 'bottom',
        tickRotate: -45,
      }}
      y={{ type: 'band', label: 'GAT Layer' }}
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
</Figure>

<style>
  .dataset-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .dataset-tabs button {
    padding: 3px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #f5f5f5;
    cursor: pointer;
    font-size: 12px;
  }
  .dataset-tabs button.active {
    background: #1a6faf;
    color: white;
    border-color: #1a6faf;
  }
</style>
