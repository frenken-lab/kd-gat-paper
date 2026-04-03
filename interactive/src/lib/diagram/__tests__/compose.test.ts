import { describe, it, expect } from 'vitest';
import Graph from 'graphology';
import { buildGraph, boxNode } from '../buildGraph.ts';
import { pipeline, bridge, boxSequence } from '../compose.ts';

// --- pipeline ---

describe('pipeline', () => {
  it('creates a graph containing all child nodes', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const b = boxNode({ id: 'b', label: 'B' });
    const c = boxNode({ id: 'c', label: 'C' });
    const g = pipeline([a, b, c]);
    expect(g.hasNode('a')).toBe(true);
    expect(g.hasNode('b')).toBe(true);
    expect(g.hasNode('c')).toBe(true);
  });

  it('auto-wires N-1 directed flow edges between sequential anchors', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const b = boxNode({ id: 'b', label: 'B' });
    const c = boxNode({ id: 'c', label: 'C' });
    const g = pipeline([a, b, c]);
    // 3 elements → 2 flow edges
    const flowEdges = g.filterDirectedEdges((_e, attrs) => attrs.type === 'flow');
    expect(flowEdges.length).toBe(2);
    // Check connectivity: a→b and b→c
    expect(g.hasDirectedEdge('a', 'b')).toBe(true);
    expect(g.hasDirectedEdge('b', 'c')).toBe(true);
  });

  it('positions elements left-to-right by default (horizontal)', () => {
    const a = boxNode({ id: 'a', label: 'A', width: 60 });
    const b = boxNode({ id: 'b', label: 'B', width: 60 });
    const g = pipeline([a, b], { gap: 40 });
    expect(g.getNodeAttribute('a', 'x')).toBeLessThan(g.getNodeAttribute('b', 'x'));
  });

  it('positions elements top-to-bottom when direction=vertical', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const b = boxNode({ id: 'b', label: 'B' });
    const g = pipeline([a, b], { direction: 'vertical', gap: 40 });
    expect(g.getNodeAttribute('a', 'y')).toBeLessThan(g.getNodeAttribute('b', 'y'));
  });

  it('applies flowColor to auto-wired edges', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const b = boxNode({ id: 'b', label: 'B' });
    const g = pipeline([a, b], { flowColor: 'gat' });
    const edge = g.directedEdges('a', 'b')[0];
    expect(g.getEdgeAttribute(edge, 'color')).toBe('gat');
  });

  it('applies flowLabels to auto-wired edges', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const b = boxNode({ id: 'b', label: 'B' });
    const c = boxNode({ id: 'c', label: 'C' });
    const g = pipeline([a, b, c], { flowLabels: ['encode', 'decode'] });
    const ab = g.directedEdges('a', 'b')[0];
    const bc = g.directedEdges('b', 'c')[0];
    expect(g.getEdgeAttribute(ab, 'label')).toBe('encode');
    expect(g.getEdgeAttribute(bc, 'label')).toBe('decode');
  });

  it('resolves graph cluster anchor to first non-container node', () => {
    const cluster = buildGraph({
      n: 3, topology: 'sparse', color: 'gat', prefix: 'g',
      container: { label: 'Layer' },
    });
    const box = boxNode({ id: 'out', label: 'Output' });
    const g = pipeline([cluster, box]);
    // Flow edge should go from g_0 (first node) to out (box anchor)
    expect(g.hasDirectedEdge('g_0', 'out')).toBe(true);
  });

  it('does not mutate input elements', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const origX = a.getNodeAttribute('a', 'x');
    pipeline([a, boxNode({ id: 'b', label: 'B' })], { gap: 200 });
    expect(a.getNodeAttribute('a', 'x')).toBe(origX);
  });

  it('mixes graph clusters and boxes', () => {
    const cluster = buildGraph({ n: 3, topology: 'sparse', color: 'data', prefix: 'in' });
    const box1 = boxNode({ id: 'vgae', label: 'VGAE', color: 'vgae' });
    const box2 = boxNode({ id: 'gat', label: 'GAT', color: 'gat' });
    const g = pipeline([cluster, box1, box2]);
    // All nodes present
    expect(g.order).toBe(5); // 3 cluster + 2 boxes
    // Flow edges: in_0→vgae, vgae→gat
    expect(g.hasDirectedEdge('in_0', 'vgae')).toBe(true);
    expect(g.hasDirectedEdge('vgae', 'gat')).toBe(true);
  });

  it('handles single element (no flow edges)', () => {
    const a = boxNode({ id: 'a', label: 'A' });
    const g = pipeline([a]);
    expect(g.order).toBe(1);
    expect(g.size).toBe(0);
  });

  it('preserves structural edges from children', () => {
    const cluster = buildGraph({ n: 3, topology: 'full', color: 'x', prefix: 'c' });
    const box = boxNode({ id: 'b', label: 'B' });
    const g = pipeline([cluster, box]);
    // C(3,2) = 3 structural + 1 flow = 4 total
    expect(g.size).toBe(4);
  });
});

// --- bridge ---

describe('bridge', () => {
  it('adds directed edges between existing nodes', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    g.addNode('a', { x: 0, y: 0 });
    g.addNode('b', { x: 100, y: 100 });
    bridge(g, [{ from: 'a', to: 'b', type: 'kd', color: 'kd', label: 'KD' }]);
    expect(g.hasDirectedEdge('a', 'b')).toBe(true);
    const edge = g.directedEdges('a', 'b')[0];
    expect(g.getEdgeAttribute(edge, 'type')).toBe('kd');
    expect(g.getEdgeAttribute(edge, 'color')).toBe('kd');
    expect(g.getEdgeAttribute(edge, 'label')).toBe('KD');
  });

  it('throws if source node does not exist', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    g.addNode('b', { x: 0, y: 0 });
    expect(() => bridge(g, [{ from: 'ghost', to: 'b' }])).toThrow("node 'ghost' not found");
  });

  it('throws if target node does not exist', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    g.addNode('a', { x: 0, y: 0 });
    expect(() => bridge(g, [{ from: 'a', to: 'ghost' }])).toThrow("node 'ghost' not found");
  });

  it('defaults to type=flow and color=grey', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    g.addNode('a', { x: 0, y: 0 });
    g.addNode('b', { x: 100, y: 0 });
    bridge(g, [{ from: 'a', to: 'b' }]);
    const edge = g.directedEdges('a', 'b')[0];
    expect(g.getEdgeAttribute(edge, 'type')).toBe('flow');
    expect(g.getEdgeAttribute(edge, 'color')).toBe('grey');
  });

  it('applies optional style attribute', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    g.addNode('a', { x: 0, y: 0 });
    g.addNode('b', { x: 100, y: 0 });
    bridge(g, [{ from: 'a', to: 'b', style: 'dashed' }]);
    const edge = g.directedEdges('a', 'b')[0];
    expect(g.getEdgeAttribute(edge, 'style')).toBe('dashed');
  });

  it('adds multiple edges in one call', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    g.addNode('a', { x: 0, y: 0 });
    g.addNode('b', { x: 50, y: 0 });
    g.addNode('c', { x: 100, y: 0 });
    bridge(g, [
      { from: 'a', to: 'c', type: 'kd' },
      { from: 'b', to: 'c', type: 'flow' },
    ]);
    expect(g.hasDirectedEdge('a', 'c')).toBe(true);
    expect(g.hasDirectedEdge('b', 'c')).toBe(true);
  });

  it('works with pipeline output', () => {
    const g = pipeline([
      boxNode({ id: 'vgae_t', label: 'VGAE-T' }),
      boxNode({ id: 'gat_t', label: 'GAT-T' }),
    ]);
    const edgesBefore = g.size;
    bridge(g, [{ from: 'gat_t', to: 'vgae_t', type: 'kd', label: 'reverse' }]);
    expect(g.size).toBe(edgesBefore + 1);
    // Find the KD edge among all directed edges
    const kdEdges = g.filterDirectedEdges((_e, attrs) => attrs.type === 'kd');
    expect(kdEdges.length).toBe(1);
    expect(g.getEdgeAttribute(kdEdges[0], 'label')).toBe('reverse');
  });
});

// --- boxSequence ---

describe('boxSequence', () => {
  it('creates a pipeline of boxes', () => {
    const g = boxSequence([
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ]);
    expect(g.order).toBe(3);
    expect(g.hasDirectedEdge('a', 'b')).toBe(true);
    expect(g.hasDirectedEdge('b', 'c')).toBe(true);
  });

  it('passes pipeline options through', () => {
    const g = boxSequence(
      [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }],
      { direction: 'vertical', gap: 60, flowColor: 'gat' },
    );
    // Vertical: y_x < y_y
    expect(g.getNodeAttribute('x', 'y')).toBeLessThan(g.getNodeAttribute('y', 'y'));
    // Flow color
    const edge = g.directedEdges('x', 'y')[0];
    expect(g.getEdgeAttribute(edge, 'color')).toBe('gat');
  });

  it('preserves box dimensions', () => {
    const g = boxSequence([
      { id: 'wide', label: 'Wide', width: 200, height: 50 },
      { id: 'narrow', label: 'Narrow', width: 60, height: 20 },
    ]);
    expect(g.getNodeAttribute('wide', 'width')).toBe(200);
    expect(g.getNodeAttribute('narrow', 'width')).toBe(60);
  });
});
