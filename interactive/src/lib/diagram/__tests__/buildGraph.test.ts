import { describe, it, expect } from 'vitest';
import { buildGraph, boxNode } from '../buildGraph.ts';

describe('buildGraph', () => {
  it('creates n nodes with prefixed keys', () => {
    const g = buildGraph({ n: 4, topology: 'none', color: 'blue', prefix: 'a' });
    expect(g.order).toBe(4);
    expect(g.nodes()).toEqual(['a_0', 'a_1', 'a_2', 'a_3']);
  });

  it('full topology produces a complete graph (n*(n-1)/2 edges)', () => {
    const g = buildGraph({ n: 4, topology: 'full', color: 'red', prefix: 'f' });
    expect(g.size).toBe(6); // C(4,2)
    // Every pair is connected
    expect(g.hasEdge('f_0', 'f_1')).toBe(true);
    expect(g.hasEdge('f_0', 'f_3')).toBe(true);
    expect(g.hasEdge('f_2', 'f_3')).toBe(true);
  });

  it('sparse topology produces a cycle plus one chord for n>3', () => {
    const g = buildGraph({ n: 5, topology: 'sparse', color: 'green', prefix: 's' });
    // Cycle: 5 edges, plus chord [0,2]: 6 total
    expect(g.size).toBe(6);
    expect(g.hasEdge('s_0', 's_1')).toBe(true);
    expect(g.hasEdge('s_4', 's_0')).toBe(true);
    expect(g.hasEdge('s_0', 's_2')).toBe(true); // chord
  });

  it('none topology produces zero edges', () => {
    const g = buildGraph({ n: 3, topology: 'none', color: 'grey', prefix: 'z' });
    expect(g.size).toBe(0);
  });

  it('assigns circular positions when no explicit positions given', () => {
    const g = buildGraph({ n: 3, topology: 'none', color: 'x', prefix: 'c', scale: 100 });
    // All nodes should have numeric x, y
    g.forEachNode((_, attrs) => {
      expect(typeof attrs.x).toBe('number');
      expect(typeof attrs.y).toBe('number');
      expect(Number.isFinite(attrs.x)).toBe(true);
    });
    // Positions should be distinct
    const positions = g.mapNodes((_, a) => [a.x, a.y]);
    const unique = new Set(positions.map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`));
    expect(unique.size).toBe(3);
  });

  it('uses explicit positions when provided', () => {
    const pos: [number, number][] = [[10, 20], [30, 40]];
    const g = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'p', positions: pos });
    expect(g.getNodeAttribute('p_0', 'x')).toBe(10);
    expect(g.getNodeAttribute('p_0', 'y')).toBe(20);
    expect(g.getNodeAttribute('p_1', 'x')).toBe(30);
    expect(g.getNodeAttribute('p_1', 'y')).toBe(40);
  });

  it('adds a container node that is not positioned by circular layout', () => {
    const g = buildGraph({
      n: 3, topology: 'none', color: 'blue', prefix: 'ct',
      container: { label: 'Box', color: 'grey' },
    });
    expect(g.order).toBe(8); // 3 nodes + 1 container + 4 anchors
    const cAttrs = g.getNodeAttributes('ct__container');
    expect(cAttrs.nodeType).toBe('container');
    expect(cAttrs.label).toBe('Box');
    // Container should NOT have x/y from circular layout
    expect(cAttrs.x).toBeUndefined();
    // Anchors should exist but have no position yet
    for (const side of ['top', 'bottom', 'left', 'right']) {
      const aAttrs = g.getNodeAttributes(`ct__${side}`);
      expect(aAttrs.nodeType).toBe('anchor');
      expect(aAttrs.anchorSide).toBe(side);
      expect(aAttrs.x).toBeUndefined();
    }
  });

  it('auto labels produce subscript characters', () => {
    const g = buildGraph({ n: 3, topology: 'none', color: 'x', prefix: 'l', labels: 'auto' });
    expect(g.getNodeAttribute('l_0', 'label')).toBe('v₁');
    expect(g.getNodeAttribute('l_2', 'label')).toBe('v₃');
  });

  it('sparse topology with n=3 produces a 3-cycle (no chord needed)', () => {
    const g = buildGraph({ n: 3, topology: 'sparse', color: 'x', prefix: 's3' });
    // 3-cycle = 3 edges, no chord because n <= 3
    expect(g.size).toBe(3);
    expect(g.hasEdge('s3_0', 's3_1')).toBe(true);
    expect(g.hasEdge('s3_1', 's3_2')).toBe(true);
    expect(g.hasEdge('s3_2', 's3_0')).toBe(true);
  });

  it('sparse topology with n=2 produces a single edge', () => {
    const g = buildGraph({ n: 2, topology: 'sparse', color: 'x', prefix: 's2' });
    expect(g.size).toBe(1);
  });

  it('sparse topology with n=1 produces zero edges', () => {
    const g = buildGraph({ n: 1, topology: 'sparse', color: 'x', prefix: 's1' });
    expect(g.size).toBe(0);
  });

  it('custom edges are added with directed type when directed=true', () => {
    const g = buildGraph({
      n: 3, topology: 'none', color: 'x', prefix: 'd', directed: true,
      edges: [[0, 2, { type: 'flow', weight: 5 }]],
    });
    expect(g.type).toBe('directed');
    expect(g.size).toBe(1);
    const edgeAttrs = g.getEdgeAttributes('d_0', 'd_2');
    expect(edgeAttrs.type).toBe('flow');
    expect(edgeAttrs.weight).toBe(5);
  });

  it('color is optional and defaults to grey', () => {
    const g = buildGraph({ n: 2, topology: 'none', prefix: 'opt' });
    expect(g.getNodeAttribute('opt_0', 'color')).toBe('grey');
  });

  it('container color is optional', () => {
    const g = buildGraph({
      n: 2, topology: 'none', prefix: 'cc',
      container: { label: 'Test' },
    });
    const cAttrs = g.getNodeAttributes('cc__container');
    expect(cAttrs.label).toBe('Test');
    // container.color is undefined when omitted
    expect(cAttrs.color).toBeUndefined();
  });
});

describe('boxNode', () => {
  it('creates a graph with one box node at origin', () => {
    const g = boxNode({ id: 'vgae_t', label: 'VGAE Teacher', color: 'vgae', width: 120 });
    expect(g.order).toBe(1);
    expect(g.hasNode('vgae_t')).toBe(true);
    const attrs = g.getNodeAttributes('vgae_t');
    expect(attrs.nodeType).toBe('box');
    expect(attrs.x).toBe(0);
    expect(attrs.y).toBe(0);
    expect(attrs.label).toBe('VGAE Teacher');
    expect(attrs.color).toBe('vgae');
    expect(attrs.width).toBe(120);
  });

  it('uses default dimensions when unspecified', () => {
    const g = boxNode({ id: 'b', label: 'B' });
    const attrs = g.getNodeAttributes('b');
    expect(attrs.width).toBe(90);
    expect(attrs.height).toBe(32);
    expect(attrs.color).toBe('grey');
  });

  it('creates a mixed multi-graph for composition', () => {
    const g = boxNode({ id: 'b', label: 'B' });
    expect(g.multi).toBe(true);
    expect(g.type).toBe('mixed');
  });
});
