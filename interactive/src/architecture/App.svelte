<script>
  import { Graph, Nodes, Edges, Boxes } from '../lib/diagram';
  import { createGraph } from '../lib/diagram/models/index.ts';

  // Input CAN bus graph (left side)
  const input = createGraph({
    n: 5,
    topology: 'sparse',
    color: 'data',
    labels: ['0x1A0', '0x2B3', '0x3C1', '0x4D5', '0x5E2'],
    prefix: 'input',
    xOffset: 0,
    yOffset: 100,
  });

  // Pipeline boxes — teachers in top row, students below
  const boxes = [
    { id: 'vgae_t', label: 'VGAE Teacher', x: 350, y: 180, color: 'vgae', width: 110, height: 35 },
    { id: 'gat_t',  label: 'GAT Teacher',  x: 530, y: 180, color: 'gat',  width: 100, height: 35 },
    { id: 'dqn',    label: 'DQN Fusion',   x: 710, y: 270, color: 'dqn',  width: 100, height: 35 },
    { id: 'output', label: 'Anomaly Score', x: 890, y: 270, color: 'data', width: 110, height: 35 },
    { id: 'vgae_s', label: 'VGAE Student', x: 350, y: 360, color: 'vgae', width: 110, height: 35 },
    { id: 'gat_s',  label: 'GAT Student',  x: 530, y: 360, color: 'gat',  width: 100, height: 35 },
  ];

  // Pipeline edges
  const pipelineEdges = [
    // Main pipeline (top row)
    { source: 'input_1', target: 'vgae_t', type: 'flow', color: 'grey' },
    { source: 'vgae_t',  target: 'gat_t',  type: 'flow', color: 'grey', label: 'hard samples' },
    { source: 'vgae_t',  target: 'dqn',    type: 'flow', color: 'grey', label: 'recon error' },
    { source: 'gat_t',   target: 'dqn',    type: 'flow', color: 'grey', label: 'classification' },
    { source: 'dqn',     target: 'output',  type: 'flow', color: 'grey' },
    // Knowledge distillation
    { source: 'vgae_t', target: 'vgae_s', type: 'kd', color: 'kd', label: 'KD' },
    { source: 'gat_t',  target: 'gat_s',  type: 'kd', color: 'kd', label: 'KD' },
    // Student → DQN
    { source: 'vgae_s', target: 'dqn', type: 'flow', color: 'grey' },
    { source: 'gat_s',  target: 'dqn', type: 'flow', color: 'grey' },
  ];

  const data = {
    nodes: input.nodes,
    edges: [...input.edges, ...pipelineEdges],
    boxes,
    containers: [],
  };
</script>

<div class="figure">
  <h3>KD-GAT Pipeline</h3>
  <Graph {data} width={1000} height={480}>
    <Edges type="structural" strokeOpacity={0.5} />
    <Edges type="flow" directed strokeDasharray="4 3" />
    <Edges type="kd" directed stroke="kd" strokeWidth={2} strokeDasharray="6 4" />
    <Nodes r={12} fontSize={7} fontFamily="CMU Typewriter Text, monospace" />
    <Boxes />
  </Graph>
</div>
