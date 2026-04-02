<script>
  import Graph from 'graphology';
  import { Plot, Dot, Text, Link, Arrow, Rect } from 'svelteplot';
  import { buildGraph, flatten, translate } from '../../lib/diagram';
  import Figure from '../../lib/Figure.svelte';

  // --- Input CAN bus graph ---
  const input = buildGraph({
    n: 5, topology: 'sparse', color: 'data', prefix: 'in',
    labels: ['0x1A0', '0x2B3', '0x3C1', '0x4D5', '0x5E2'],
    scale: 50,
  });

  // --- Compose diagram ---
  const g = new Graph({ multi: true });

  // Import input graph, translated to (80, 150)
  {
    const c = input.copy();
    translate(c, 80, 150);
    g.import(c);
  }

  // Teacher pipeline boxes (y = 150)
  g.addNode('vgae_t', { nodeType: 'box', x: 270, y: 150, label: 'VGAE Teacher', color: 'vgae', width: 120 });
  g.addNode('gat_t',  { nodeType: 'box', x: 440, y: 150, label: 'GAT Teacher',  color: 'gat',  width: 110 });
  g.addNode('dqn',    { nodeType: 'box', x: 610, y: 150, label: 'DQN Fusion',   color: 'dqn',  width: 100 });
  g.addNode('output', { nodeType: 'box', x: 760, y: 150, label: 'Anomaly Score', color: 'data', width: 120 });

  // Student boxes (y = 310)
  g.addNode('vgae_s', { nodeType: 'box', x: 270, y: 310, label: 'VGAE Student', color: 'vgae', width: 120 });
  g.addNode('gat_s',  { nodeType: 'box', x: 440, y: 310, label: 'GAT Student',  color: 'gat',  width: 110 });

  // --- Pipeline flow edges ---
  g.addDirectedEdge('in_0', 'vgae_t',  { type: 'flow', color: 'grey' });
  g.addDirectedEdge('vgae_t', 'gat_t',  { type: 'flow', color: 'grey', label: 'hard samples' });
  g.addDirectedEdge('vgae_t', 'dqn',    { type: 'flow', color: 'grey', label: 'recon error' });
  g.addDirectedEdge('gat_t', 'dqn',     { type: 'flow', color: 'grey', label: 'classification' });
  g.addDirectedEdge('dqn', 'output',    { type: 'flow', color: 'grey' });

  // Student → DQN (dashed)
  g.addDirectedEdge('vgae_s', 'dqn', { type: 'flow', color: 'grey', style: 'dashed' });
  g.addDirectedEdge('gat_s', 'dqn',  { type: 'flow', color: 'grey', style: 'dashed' });

  // --- KD edges ---
  g.addDirectedEdge('vgae_t', 'vgae_s', { type: 'kd', color: 'kd', label: 'KD' });
  g.addDirectedEdge('gat_t', 'gat_s',   { type: 'kd', color: 'kd', label: 'KD' });

  const { nodes, edges, boxes, domain } = flatten(g);

  const flowEdges = edges.filter(e => e.type === 'flow');
  const kdEdges = edges.filter(e => e.type === 'kd');
  const structuralEdges = edges.filter(e => e.type === 'structural');
  const labeledFlow = flowEdges.filter(e => e.label);
</script>

<Figure>
  <Plot width={880} height={420} grid={false} axes={false} frame={false}
    x={{ domain: domain.x }} y={{ domain: domain.y }} inset={10}>
    <!-- Layer 1: Structural edges (input graph) -->
    <Link data={structuralEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeOpacity={0.5} strokeWidth={1.5} />
    <!-- Layer 2: Flow edges -->
    <Arrow data={flowEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={1}
      strokeDasharray={e => e.style === 'dashed' ? '4 3' : 'none'} />
    <!-- Layer 3: Flow edge labels -->
    <Text data={labeledFlow}
      x={e => (e.x1 + e.x2) / 2} y={e => (e.y1 + e.y2) / 2 - 8}
      text="label" fontSize={7} fill="#666" textAnchor="middle" />
    <!-- Layer 4: KD edges -->
    <Arrow data={kdEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={2} strokeDasharray="6 4" />
    <Text data={kdEdges}
      x={e => (e.x1 + e.x2) / 2 + 14} y={e => (e.y1 + e.y2) / 2}
      text="label" fontSize={9} fill="stroke" textAnchor="start" fontWeight="bold" />
    <!-- Layer 5: Boxes -->
    <Rect data={boxes} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" stroke="stroke" strokeWidth={1.5} rx={6} />
    <Text data={boxes} x="x" y="y"
      text="label" fontSize={9} fill="#333" textAnchor="middle" dy={1} />
    <!-- Layer 6: Input graph nodes -->
    <Dot data={nodes} x="x" y="y" r={14}
      fill="fill" stroke="stroke" strokeWidth={1.5} />
    <Text data={nodes} x="x" y="y" text="label"
      fontSize={6} fill="#333" textAnchor="middle" dy={1}
      fontFamily="CMU Typewriter Text, monospace" />
  </Plot>
</Figure>
