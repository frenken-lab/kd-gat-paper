<script>
  import Figure from '../../../lib/Figure.svelte';
  import { Plot, Cell, Text } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !data?.matrix?.length;
  const records = [];
  if (!isEmpty) {
    for (let r = 0; r < data.matrix.length; r++)
      for (let c = 0; c < data.matrix[r].length; c++)
        records.push({ teacher: data.teacher_layers[r], student: data.student_layers[c], value: data.matrix[r][c] });
  }
</script>

<Figure title="CKA Teacher-Student Layer Similarity">
  {#if isEmpty}
    <p class="empty">Awaiting data export from KD-GAT</p>
  {:else}
    <Plot
      padding={0} aspectRatio={1} marginBottom={60} marginLeft={90}
      x={{ type: 'band', label: 'Student Layer', axis: 'bottom', tickRotate: -45 }}
      y={{ type: 'band', label: 'Teacher Layer' }}
      color={{ scheme: 'blues', label: 'CKA', legend: true }}>
      <Cell data={records} x="student" y="teacher" fill="value" inset={1} />
      <Text data={records} x="student" y="teacher" text={d => d.value.toFixed(2)} fontSize={11} fill={d => d.value > 0.7 ? 'white' : '#333'} textAnchor="middle" />
    </Plot>
  {/if}
</Figure>
