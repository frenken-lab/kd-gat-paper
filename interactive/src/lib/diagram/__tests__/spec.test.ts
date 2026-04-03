import { describe, it, expect, vi } from 'vitest';

vi.mock('virtual:styles', () => ({
  default: {
    palette: { blue: '#0000ff', red: '#ff0000', grey: '#999999' },
    fills: { blue: '#0000ff40', red: '#ff000040' },
    roles: { vgae: 'blue', gat: 'red', data: 'grey', dqn: 'grey', kd: 'red' },
  },
}));

import { buildFromSpec, type FigureSpec, type BuildOptions } from '../spec.ts';
import { compositeBounds } from '../transforms.ts';
import { flatten } from '../flatten.ts';

// --- Architecture spec (matches Phase 3 rewrite) ---

const architectureSpec: FigureSpec = {
  figure: 'architecture',
  components: {
    input:  { type: 'graph', n: 5, topology: 'sparse', color: 'data', labels: ['0x1A0', '0x2B3', '0x3C1', '0x4D5', '0x5E2'], scale: 50 },
    vgae_t: { type: 'box', label: 'VGAE Teacher', color: 'vgae', width: 120 },
    gat_t:  { type: 'box', label: 'GAT Teacher',  color: 'gat',  width: 110 },
    dqn:    { type: 'box', label: 'DQN Fusion',   color: 'dqn',  width: 100 },
    output: { type: 'box', label: 'Anomaly Score', color: 'data', width: 120 },
    vgae_s: { type: 'box', label: 'VGAE Student', color: 'vgae', width: 120 },
    gat_s:  { type: 'box', label: 'GAT Student',  color: 'gat',  width: 110 },
  },
  layout: {
    type: 'hstack',
    gap: 60,
    children: [
      'input',
      {
        type: 'vstack',
        gap: 100,
        children: [
          { type: 'pipeline', elements: ['vgae_t', 'gat_t', 'dqn', 'output'], gap: 50, flowLabels: ['hard samples', 'classification'] },
          { type: 'hstack', children: ['vgae_s', 'gat_s'], gap: 50 },
        ],
      },
    ],
  },
  bridges: [
    { from: 'input_0', to: 'vgae_t', type: 'flow', color: 'grey' },
    { from: 'vgae_t', to: 'dqn', type: 'flow', color: 'grey', label: 'recon error' },
    { from: 'vgae_s', to: 'dqn', type: 'flow', color: 'grey', style: 'dashed' },
    { from: 'gat_s',  to: 'dqn', type: 'flow', color: 'grey', style: 'dashed' },
    { from: 'vgae_t', to: 'vgae_s', type: 'kd', color: 'kd', label: 'KD' },
    { from: 'gat_t',  to: 'gat_s',  type: 'kd', color: 'kd', label: 'KD' },
  ],
  assertions: {
    prefixMap: { input: 'in' },
    checks: [
      'input_0: left-of vgae_t',
      'vgae_t: left-of gat_t',
      'vgae_t: above vgae_s',
    ],
  },
};

// --- GAT spec (matches Phase 3 rewrite) ---

const gatSpec: FigureSpec = {
  figure: 'gat',
  components: {
    L0: { type: 'graph', n: 5, topology: 'sparse', color: 'gat', labels: 'auto', scale: 80 },
    L1: { type: 'graph', n: 5, topology: 'sparse', color: 'gat', labels: 'auto', scale: 80 },
    L2: { type: 'graph', n: 5, topology: 'sparse', color: 'gat', labels: 'auto', scale: 80 },
    jk: { type: 'box', label: 'JK Concat', color: 'gat' },
    fc: { type: 'box', label: 'FC → class', color: 'gat' },
  },
  layout: {
    type: 'vstack',
    gap: 60,
    align: 'center',
    children: [
      { type: 'vstack', gap: 100, align: 'center', children: ['L0', 'L1', 'L2'] },
      { type: 'pipeline', elements: ['jk', 'fc'], direction: 'vertical', gap: 40, flowColor: 'gat' },
    ],
  },
  bridges: [
    { from: 'L0_0', to: 'L1_3', type: 'flow', color: 'gat' },
    { from: 'L1_0', to: 'L2_3', type: 'flow', color: 'gat' },
    { from: 'L0_4', to: 'jk', type: 'flow', color: 'gat' },
    { from: 'L1_4', to: 'jk', type: 'flow', color: 'gat' },
    { from: 'L2_4', to: 'jk', type: 'flow', color: 'gat' },
  ],
};

// --- Tests ---

describe('buildFromSpec', () => {
  describe('architecture', () => {
    const { graph, assertions, prefixMap } = buildFromSpec(architectureSpec);
    const data = flatten(graph);

    it('produces correct node count (5 input nodes)', () => {
      expect(data.nodes.length).toBe(5);
    });

    it('produces correct box count (6 boxes)', () => {
      expect(data.boxes.length).toBe(6);
    });

    it('produces correct edge counts', () => {
      const flow = data.edges.filter(e => e.type === 'flow');
      const kd = data.edges.filter(e => e.type === 'kd');
      const structural = data.edges.filter(e => e.type === 'structural');
      // Pipeline auto-wires 3 + bridge adds 4 flow = 7 flow
      expect(flow.length).toBe(7);
      expect(kd.length).toBe(2);
      // Sparse topology: cycle(5) + chord = 6 structural
      expect(structural.length).toBe(6);
    });

    it('has all expected nodes', () => {
      expect(graph.hasNode('input_0')).toBe(true);
      expect(graph.hasNode('vgae_t')).toBe(true);
      expect(graph.hasNode('gat_t')).toBe(true);
      expect(graph.hasNode('dqn')).toBe(true);
      expect(graph.hasNode('output')).toBe(true);
      expect(graph.hasNode('vgae_s')).toBe(true);
      expect(graph.hasNode('gat_s')).toBe(true);
    });

    it('has KD edges between teacher-student pairs', () => {
      expect(graph.hasDirectedEdge('vgae_t', 'vgae_s')).toBe(true);
      expect(graph.hasDirectedEdge('gat_t', 'gat_s')).toBe(true);
    });

    it('has dashed student→DQN flow edges', () => {
      const dashed = data.edges.filter(e => e.style === 'dashed');
      expect(dashed.length).toBe(2);
    });

    it('passes through assertions and prefixMap', () => {
      expect(assertions.length).toBe(3);
      expect(prefixMap).toEqual({ input: 'in' });
    });
  });

  describe('gat', () => {
    const { graph } = buildFromSpec(gatSpec);
    const data = flatten(graph);

    it('produces correct node count (3 layers × 5 = 15)', () => {
      expect(data.nodes.length).toBe(15);
    });

    it('produces correct box count (jk + fc = 2)', () => {
      expect(data.boxes.length).toBe(2);
    });

    it('produces correct edge counts', () => {
      const flow = data.edges.filter(e => e.type === 'flow');
      const structural = data.edges.filter(e => e.type === 'structural');
      // Pipeline auto-wires jk→fc (1) + bridge adds 5 = 6 flow
      expect(flow.length).toBe(6);
      // 3 layers × 6 structural = 18
      expect(structural.length).toBe(18);
    });

    it('has all layer nodes', () => {
      for (let L = 0; L < 3; L++) {
        for (let i = 0; i < 5; i++) {
          expect(graph.hasNode(`L${L}_${i}`)).toBe(true);
        }
      }
    });

    it('has inter-layer flow edges', () => {
      expect(graph.hasDirectedEdge('L0_0', 'L1_3')).toBe(true);
      expect(graph.hasDirectedEdge('L1_0', 'L2_3')).toBe(true);
    });

    it('has JK skip connections from all layers', () => {
      expect(graph.hasDirectedEdge('L0_4', 'jk')).toBe(true);
      expect(graph.hasDirectedEdge('L1_4', 'jk')).toBe(true);
      expect(graph.hasDirectedEdge('L2_4', 'jk')).toBe(true);
    });

    it('returns empty assertions when none specified', () => {
      const { assertions } = buildFromSpec(gatSpec);
      expect(assertions).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('throws on missing component reference', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: { a: { type: 'box', label: 'A' } },
        layout: { type: 'hstack', children: ['a', 'missing'] },
      };
      expect(() => buildFromSpec(spec)).toThrow("component 'missing' not found");
    });

    it('throws on empty layout children', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {},
        layout: { type: 'hstack', children: [] },
      };
      expect(() => buildFromSpec(spec)).toThrow('has no children');
    });

    it('throws on bridge referencing missing node', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: { a: { type: 'box', label: 'A' }, b: { type: 'box', label: 'B' } },
        layout: { type: 'hstack', children: ['a', 'b'] },
        bridges: [{ from: 'a', to: 'ghost' }],
      };
      expect(() => buildFromSpec(spec)).toThrow("node 'ghost' not found");
    });
  });

  describe('nested layouts', () => {
    it('supports deeply nested layout trees', () => {
      const spec: FigureSpec = {
        figure: 'nested',
        components: {
          a: { type: 'box', label: 'A' },
          b: { type: 'box', label: 'B' },
          c: { type: 'box', label: 'C' },
          d: { type: 'box', label: 'D' },
        },
        layout: {
          type: 'vstack',
          gap: 50,
          children: [
            { type: 'hstack', children: ['a', 'b'], gap: 30 },
            { type: 'pipeline', elements: ['c', 'd'], gap: 40 },
          ],
        },
      };
      const { graph } = buildFromSpec(spec);
      expect(graph.hasNode('a')).toBe(true);
      expect(graph.hasNode('d')).toBe(true);
      // Pipeline auto-wires c→d
      expect(graph.hasDirectedEdge('c', 'd')).toBe(true);
      // hstack doesn't auto-wire
      expect(graph.hasDirectedEdge('a', 'b')).toBe(false);
    });
  });

  describe('layout-level containers', () => {
    it('adds a container to an hstack layout', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          a: { type: 'box', label: 'A', width: 80 },
          b: { type: 'box', label: 'B', width: 80 },
        },
        layout: {
          type: 'hstack',
          children: ['a', 'b'],
          gap: 40,
          container: { label: 'My Group', color: 'gat' },
        },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      expect(data.containers.length).toBe(1);
      expect(data.containers[0].label).toBe('My Group');
    });

    it('container bounds enclose all children', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          a: { type: 'box', label: 'A', width: 80 },
          b: { type: 'box', label: 'B', width: 80 },
        },
        layout: {
          type: 'hstack',
          children: ['a', 'b'],
          gap: 40,
          container: { label: 'Wrapper', color: 'vgae' },
        },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      const c = data.containers[0];
      // Container should enclose all boxes
      for (const box of data.boxes) {
        expect(c.x1).toBeLessThan(box.x1);
        expect(c.y1).toBeLessThan(box.y1);
        expect(c.x2).toBeGreaterThan(box.x2);
        expect(c.y2).toBeGreaterThan(box.y2);
      }
    });

    it('vstack layout container works', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          a: { type: 'box', label: 'A' },
          b: { type: 'box', label: 'B' },
          c: { type: 'box', label: 'C' },
        },
        layout: {
          type: 'vstack',
          gap: 30,
          align: 'center',
          container: { label: 'Stack', color: 'gat' },
          children: ['a', 'b', 'c'],
        },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      expect(data.containers.length).toBe(1);
      expect(data.containers[0].label).toBe('Stack');
    });

    it('nested layout containers create multiple containers', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          a: { type: 'box', label: 'A' },
          b: { type: 'box', label: 'B' },
          c: { type: 'box', label: 'C' },
        },
        layout: {
          type: 'hstack',
          gap: 40,
          container: { label: 'Outer', color: 'data' },
          children: [
            {
              type: 'vstack',
              gap: 30,
              container: { label: 'Inner', color: 'gat' },
              children: ['a', 'b'],
            },
            'c',
          ],
        },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      expect(data.containers.length).toBe(2);
      const labels = data.containers.map(c => c.label).sort();
      expect(labels).toEqual(['Inner', 'Outer']);
    });

    it('pipeline layout container works', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          a: { type: 'box', label: 'A' },
          b: { type: 'box', label: 'B' },
        },
        layout: {
          type: 'pipeline',
          elements: ['a', 'b'],
          gap: 40,
          container: { label: 'Pipeline Group', color: 'vgae' },
        },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      expect(data.containers.length).toBe(1);
      expect(data.containers[0].label).toBe('Pipeline Group');
    });

    it('layout without container produces no containers', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          a: { type: 'box', label: 'A' },
          b: { type: 'box', label: 'B' },
        },
        layout: { type: 'hstack', children: ['a', 'b'] },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      expect(data.containers.length).toBe(0);
    });

    it('per-layer container coexists with layout container', () => {
      const spec: FigureSpec = {
        figure: 'test',
        components: {
          layer: { type: 'graph', n: 3, topology: 'sparse', color: 'gat', labels: 'auto', scale: 40, container: { label: 'Layer 0', color: 'gat' } },
          out: { type: 'box', label: 'Out', color: 'gat' },
        },
        layout: {
          type: 'vstack',
          gap: 40,
          align: 'center',
          container: { label: 'Model', color: 'gat' },
          children: ['layer', 'out'],
        },
      };
      const { graph } = buildFromSpec(spec);
      const data = flatten(graph);
      // 1 per-layer container + 1 layout container
      expect(data.containers.length).toBe(2);
      const labels = data.containers.map(c => c.label).sort();
      expect(labels).toEqual(['Layer 0', 'Model']);
    });
  });

  describe('type: spec components', () => {
    // A simple sub-spec to embed
    const subSpec: FigureSpec = {
      figure: 'sub',
      components: {
        enc: { type: 'box', label: 'Encoder', color: 'vgae', width: 100 },
        dec: { type: 'box', label: 'Decoder', color: 'vgae', width: 100 },
      },
      layout: { type: 'pipeline', elements: ['enc', 'dec'], gap: 40 },
    };

    it('embeds a referenced spec as a component', () => {
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          input: { type: 'box', label: 'Input', width: 80 },
          model: { type: 'spec', ref: 'sub' },
          output: { type: 'box', label: 'Output', width: 80 },
        },
        layout: { type: 'pipeline', elements: ['input', 'model', 'output'], gap: 60 },
      };
      const { graph } = buildFromSpec(parent, { specs: { sub: subSpec } });
      // Parent boxes + sub-spec boxes (prefixed with component id)
      expect(graph.hasNode('input')).toBe(true);
      expect(graph.hasNode('model.enc')).toBe(true);
      expect(graph.hasNode('model.dec')).toBe(true);
      expect(graph.hasNode('output')).toBe(true);
      // Sub-spec's internal flow edge preserved (prefixed)
      expect(graph.hasDirectedEdge('model.enc', 'model.dec')).toBe(true);
      // Parent pipeline wires input→model.enc and model.enc→output
      expect(graph.hasDirectedEdge('input', 'model.enc')).toBe(true);
    });

    it('scales a referenced spec', () => {
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          model: { type: 'spec', ref: 'sub', scale: 0.5 },
        },
        layout: { type: 'hstack', children: ['model'] },
      };
      const { graph } = buildFromSpec(parent, { specs: { sub: subSpec } });
      // Box dimensions should be halved (nodes prefixed)
      expect(graph.getNodeAttribute('model.enc', 'width')).toBe(50);  // 100 * 0.5
      expect(graph.getNodeAttribute('model.dec', 'width')).toBe(50);
    });

    it('preserves sub-spec internal edges', () => {
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          model: { type: 'spec', ref: 'sub' },
        },
        layout: { type: 'hstack', children: ['model'] },
      };
      const { graph } = buildFromSpec(parent, { specs: { sub: subSpec } });
      expect(graph.hasDirectedEdge('model.enc', 'model.dec')).toBe(true);
    });

    it('allows bridges to sub-spec nodes', () => {
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          trigger: { type: 'box', label: 'Trigger' },
          model: { type: 'spec', ref: 'sub' },
        },
        layout: { type: 'hstack', children: ['trigger', 'model'], gap: 40 },
        bridges: [
          { from: 'trigger', to: 'model.dec', type: 'kd', color: 'kd', label: 'KD' },
        ],
      };
      const { graph } = buildFromSpec(parent, { specs: { sub: subSpec } });
      expect(graph.hasDirectedEdge('trigger', 'model.dec')).toBe(true);
    });

    it('throws when referenced spec is not in specs map', () => {
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          model: { type: 'spec', ref: 'missing' },
        },
        layout: { type: 'hstack', children: ['model'] },
      };
      expect(() => buildFromSpec(parent, { specs: {} })).toThrow("spec 'missing' not found");
    });

    it('throws when specs map is not provided', () => {
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          model: { type: 'spec', ref: 'sub' },
        },
        layout: { type: 'hstack', children: ['model'] },
      };
      expect(() => buildFromSpec(parent)).toThrow("spec 'sub' not found");
    });

    it('supports sub-specs with graph components', () => {
      const graphSub: FigureSpec = {
        figure: 'graph-sub',
        components: {
          layer: { type: 'graph', n: 3, topology: 'sparse', color: 'gat', labels: 'auto', scale: 40 },
          out: { type: 'box', label: 'Out', color: 'gat' },
        },
        layout: { type: 'pipeline', elements: ['layer', 'out'], gap: 30, flowColor: 'gat' },
      };
      const parent: FigureSpec = {
        figure: 'parent',
        components: {
          model: { type: 'spec', ref: 'gsub', scale: 0.5 },
        },
        layout: { type: 'hstack', children: ['model'] },
      };
      const { graph } = buildFromSpec(parent, { specs: { gsub: graphSub } });
      // Graph nodes + box node (prefixed with component id)
      expect(graph.hasNode('model.layer_0')).toBe(true);
      expect(graph.hasNode('model.layer_2')).toBe(true);
      expect(graph.hasNode('model.out')).toBe(true);
      // Internal flow from anchor to out (prefixed)
      expect(graph.hasDirectedEdge('model.layer_0', 'model.out')).toBe(true);
    });
  });
});
