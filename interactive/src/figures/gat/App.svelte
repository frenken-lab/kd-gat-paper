<script>
  import Graph from 'graphology';
  import { path } from 'graphology-generators/classic';
  import { Plot, Dot, Text, Link, Arrow, Rect } from 'svelteplot';
  import { resolve } from '../../lib/diagram/palette.ts';
  import Figure from '../../lib/FigureDefaults.svelte';

  // --- Build graph data ---
  const SPARSE_5 = [[186,125],[185,25],[94,67],[38,160],[129,217]];
  const g = new Graph();

  // 3 layers stacked vertically
  for (let L = 0; L < 3; L++) {
    const yOff = L * 300;
    // Sparse ring: path + closing edge + chord
    for (let i = 0; i < 5; i++) {
      g.addNode(`L${L}_${i}`, {
        x: SPARSE_5[i][0], y: SPARSE_5[i][1] + yOff,
        color: 'gat', label: `v${'\u2081\u2082\u2083\u2084\u2085'[i]}`,
      });
    }
    for (let i = 0; i < 4; i++) g.addEdge(`L${L}_${i}`, `L${L}_${i+1}`, { type: 'structural' });
    g.addEdge(`L${L}_4`, `L${L}_0`, { type: 'structural' }); // close ring
    g.addEdge(`L${L}_0`, `L${L}_2`, { type: 'structural' }); // chord

    // Inter-layer flow: rightmost(0) → leftmost(3) of next layer
    if (L < 2) g.addEdge(`L${L}_0`, `L${L+1}_3`, { type: 'flow' });
    // Layer → JK: bottom node(4)
    g.addEdge(`L${L}_4`, 'jk', { type: 'flow' });
  }

  // Boxes
  g.addNode('jk', { x: 110, y: 910, color: 'gat', label: 'JK Concat', isBox: true });
  g.addNode('fc', { x: 110, y: 1010, color: 'gat', label: 'FC \u2192 class', isBox: true });
  g.addEdge('jk', 'fc', { type: 'flow' });

  // --- Export to flat arrays ---
  const exported = g.export();
  const nodeMap = new Map(exported.nodes.map(n => [n.key, n.attributes]));

  const nodes = exported.nodes.filter(n => !n.attributes.isBox).map(n => n.attributes);
  const boxes = exported.nodes.filter(n => n.attributes.isBox).map(n => ({
    ...n.attributes,
    x1: n.attributes.x - 45, y1: n.attributes.y - 16,
    x2: n.attributes.x + 45, y2: n.attributes.y + 16,
  }));
  const structural = exported.edges.filter(e => e.attributes.type === 'structural').map(e => ({
    x1: nodeMap.get(e.source).x, y1: nodeMap.get(e.source).y,
    x2: nodeMap.get(e.target).x, y2: nodeMap.get(e.target).y,
  }));
  const flow = exported.edges.filter(e => e.attributes.type === 'flow').map(e => ({
    x1: nodeMap.get(e.source).x, y1: nodeMap.get(e.source).y,
    x2: nodeMap.get(e.target).x, y2: nodeMap.get(e.target).y,
  }));

  const { stroke, fill } = resolve('gat');
</script>

<Figure title="GAT Classifier">
  <Plot width={280} height={1080} grid={false} axes={false} frame={false}
    x={{ domain: [-10, 240] }} y={{ domain: [-10, 1060] }} inset={20}>
    <Link data={structural} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke={stroke} strokeOpacity={0.5} strokeWidth={1.5} />
    <Arrow data={flow} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke={stroke} strokeWidth={1} strokeDasharray="4 3" />
    <Rect data={boxes} x1="x1" y1="y1" x2="x2" y2="y2"
      fill={fill} stroke={stroke} strokeWidth={1.5} rx={6} />
    <Text data={boxes} x={b => (b.x1+b.x2)/2} y={b => (b.y1+b.y2)/2}
      text="label" fontSize={9} fill="#333" textAnchor="middle" dy={1} />
    <Dot data={nodes} x="x" y="y" r={10}
      fill={fill} stroke={stroke} strokeWidth={1.5} />
    <Text data={nodes} x="x" y="y" text="label"
      fontSize={7} fill="#333" textAnchor="middle" dy={1} />
  </Plot>
</Figure>
