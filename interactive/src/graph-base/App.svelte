<script>
  import Figure from '../lib/FigureDefaults.svelte';
  import { Plot, Link, Dot, Text } from 'svelteplot';
  import data from "./data.json";

  const isEmpty = !data.nodes?.length;

  // styles.yaml: vgae → blue → #4E79A7, fill → #DAE3EF
  const stroke = "#4E79A7";
  const fill = "#DAE3EF";

  const { nodes, edges } = data;
</script>

<Figure title="CAN Bus Graph">
  {#if isEmpty}
    <p class="empty">Awaiting data export</p>
  {:else}
    <Plot height={280} width={280} grid={false} axes={false} x={{ domain: [0, 230] }} y={{ domain: [0, 250] }} inset={20}>
      <!-- Layer 1: edges (undirected) -->
      <Link data={edges}
        x1={e => nodes[e.source].x} y1={e => nodes[e.source].y}
        x2={e => nodes[e.target].x} y2={e => nodes[e.target].y}
        stroke={stroke + "80"} strokeWidth={1.5} />
      <!-- Layer 2: nodes -->
      <Dot data={nodes} x="x" y="y" r={18} fill={fill} stroke={stroke} strokeWidth={1.5} />
      <!-- Layer 3: labels -->
      <Text data={nodes} x="x" y="y" text="label" fontSize={8} fill="#333" textAnchor="middle" dy={1} fontFamily="CMU Typewriter Text, monospace" />
    </Plot>
  {/if}
</Figure>
