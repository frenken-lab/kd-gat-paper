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

  // Guard against missing/malformed JSON
  const data = rawData;
  const isEmpty = !data?.matrix?.length;

  // Flatten the 2D matrix into a flat record array for svelteplot's Cell mark
  const records: CKARecord[] = [];
  if (!isEmpty) {
    for (let r = 0; r < data.matrix.length; r++)
      for (let c = 0; c < data.matrix[r].length; c++)
        records.push({
          teacher: data.teacher_layers[r],
          student: data.student_layers[c],
          value: data.matrix[r][c],
        });
  }

  // Two-stop color scheme from the shared palette — light fill to dark stroke
  const colorScheme = [
    getPaletteColor('blue').fill,
    getPaletteColor('blue').stroke,
  ];
</script>

<Figure title="CKA Teacher-Student Layer Similarity">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <Plot
      padding={0}
      aspectRatio={1}
      marginBottom={60}
      marginLeft={90}
      x={{
        type: 'band',
        label: 'Student Layer',
        axis: 'bottom',
        tickRotate: -45,
      }}
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
</Figure>
