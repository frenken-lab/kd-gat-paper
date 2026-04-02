import { describe, it, expect, vi } from 'vitest';

vi.mock('virtual:styles', () => ({
  default: {
    palette: { blue: '#0000ff', red: '#ff0000', grey: '#999999' },
    fills: { blue: '#0000ff40', red: '#ff000040' },
    roles: { vgae: 'blue', gat: 'red' },
  },
}));

import Graph from 'graphology';
import { flatten } from '../flatten.ts';

function simpleGraph(): Graph {
  const g = new Graph();
  g.addNode('a', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: 'A', group: 'g1' });
  g.addNode('b', { nodeType: 'node', x: 100, y: 100, color: 'red', label: 'B', group: 'g1' });
  g.addEdge('a', 'b', { type: 'structural', color: 'blue' });
  return g;
}

describe('flatten', () => {
  it('does NOT mutate the input graph', () => {
    const g = new Graph();
    g.addNode('n1', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('n2', { nodeType: 'node', x: 20, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('box', { nodeType: 'box', group: 'g', label: 'B', color: 'blue' });

    // Before flatten, box has no x/y
    expect(g.getNodeAttribute('box', 'x')).toBeUndefined();
    flatten(g);
    // After flatten, box STILL has no x/y (no mutation)
    expect(g.getNodeAttribute('box', 'x')).toBeUndefined();
  });

  it('returns a flat edge array with type field preserved', () => {
    const g = new Graph({ type: 'directed' });
    g.addNode('a', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '' });
    g.addNode('b', { nodeType: 'node', x: 10, y: 0, color: 'blue', label: '' });
    g.addDirectedEdge('a', 'b', { type: 'flow', color: 'red' });
    g.addDirectedEdge('b', 'a', { type: 'kd', color: 'blue' });

    const { edges } = flatten(g);
    expect(edges).toHaveLength(2);
    expect(edges.filter(e => e.type === 'flow')).toHaveLength(1);
    expect(edges.filter(e => e.type === 'kd')).toHaveLength(1);
  });

  it('defaults untyped edges to structural', () => {
    const g = new Graph();
    g.addNode('a', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '' });
    g.addNode('b', { nodeType: 'node', x: 5, y: 5, color: 'blue', label: '' });
    g.addEdge('a', 'b', { color: 'blue' });
    const { edges } = flatten(g);
    expect(edges[0].type).toBe('structural');
  });

  it('computes a padded domain from all elements', () => {
    const { domain } = flatten(simpleGraph());
    // Nodes at (0,0) and (100,100), default padding = 40
    expect(domain.x[0]).toBe(-40);
    expect(domain.x[1]).toBe(140);
    expect(domain.y[0]).toBe(-40);
    expect(domain.y[1]).toBe(140);
  });

  it('accepts custom padding for domain', () => {
    const { domain } = flatten(simpleGraph(), 10);
    expect(domain.x[0]).toBe(-10);
    expect(domain.x[1]).toBe(110);
  });

  it('includes boxes in domain computation', () => {
    const g = new Graph();
    g.addNode('n', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('box', { nodeType: 'box', x: 200, y: 200, color: 'blue', label: '', group: 'g', width: 100 });
    const { domain } = flatten(g, 0);
    // Box extends to x=250 (200 + 100/2)
    expect(domain.x[1]).toBe(250);
  });

  it('resolves colors through the palette', () => {
    const g = new Graph();
    g.addNode('v', { nodeType: 'node', x: 0, y: 0, color: 'vgae', label: '' });
    const { nodes } = flatten(g);
    // 'vgae' → roles['vgae'] = 'blue' → palette['blue'] = '#0000ff'
    expect(nodes[0].stroke).toBe('#0000ff');
    expect(nodes[0].fill).toBe('#0000ff40');
  });

  it('resolves box colors and computes group-derived bounds', () => {
    const g = new Graph();
    g.addNode('n1', { nodeType: 'node', x: 10, y: 20, color: 'blue', label: '', group: 'g' });
    g.addNode('n2', { nodeType: 'node', x: 50, y: 60, color: 'blue', label: '', group: 'g' });
    g.addNode('box', { nodeType: 'box', group: 'g', label: 'B', color: 'blue' });

    const { boxes } = flatten(g);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].x).toBe(30); // midpoint of (10-30, 50+30) bounds
    expect(boxes[0].stroke).toBe('#0000ff');
  });

  it('resolves edge endpoints through box positions', () => {
    const g = new Graph({ type: 'directed' });
    g.addNode('n1', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '' });
    g.addNode('box', { nodeType: 'box', x: 100, y: 100, color: 'blue', label: '', group: 'x' });
    g.addDirectedEdge('n1', 'box', { type: 'flow', color: 'blue' });

    const { edges } = flatten(g);
    expect(edges[0].x1).toBe(0);  // node position
    expect(edges[0].x2).toBe(100); // box center
  });

  it('handles isBox legacy attribute', () => {
    const g = new Graph();
    g.addNode('b', { isBox: true, x: 50, y: 50, color: 'blue', label: 'Legacy' });
    const { nodes, boxes } = flatten(g);
    expect(nodes).toHaveLength(0);
    expect(boxes).toHaveLength(1);
    expect(boxes[0].label).toBe('Legacy');
  });

  it('warns on orphaned box group', () => {
    const g = new Graph();
    g.addNode('box', { nodeType: 'box', group: 'nope', label: 'B', color: 'blue' });
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { boxes } = flatten(g);
    expect(boxes).toHaveLength(0);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("group 'nope'"));
    spy.mockRestore();
  });
});
