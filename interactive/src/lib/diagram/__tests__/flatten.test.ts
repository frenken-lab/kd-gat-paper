import { describe, it, expect, vi } from 'vitest';

vi.mock('virtual:styles', () => ({
  default: {
    palette: { blue: '#0000ff', red: '#ff0000', grey: '#999999' },
    fills: { blue: '#0000ff40', red: '#ff000040' },
    roles: { vgae: 'blue', gat: 'red' },
  },
}));

import Graph from 'graphology';
import { flatten, extractLayout, decorate } from '../flatten.ts';

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

  it('preserves raw color role name alongside resolved stroke/fill', () => {
    const g = new Graph();
    g.addNode('v', { nodeType: 'node', x: 0, y: 0, color: 'vgae', label: '' });
    const { nodes } = flatten(g);
    expect(nodes[0].color).toBe('vgae');
    expect(nodes[0].stroke).toBe('#0000ff');
  });
});

describe('extractLayout', () => {
  it('returns spatial data with raw color names and empty stroke/fill', () => {
    const g = new Graph();
    g.addNode('v', { nodeType: 'node', x: 0, y: 0, color: 'vgae', label: 'V' });
    const data = extractLayout(g);
    expect(data.nodes[0].color).toBe('vgae');
    expect(data.nodes[0].stroke).toBe('');
    expect(data.nodes[0].fill).toBe('');
  });

  it('returns correct spatial positions for boxes', () => {
    const g = new Graph();
    g.addNode('n1', { nodeType: 'node', x: 10, y: 20, color: 'blue', label: '', group: 'g' });
    g.addNode('n2', { nodeType: 'node', x: 50, y: 60, color: 'blue', label: '', group: 'g' });
    g.addNode('box', { nodeType: 'box', group: 'g', label: 'B', color: 'gat' });

    const data = extractLayout(g);
    expect(data.boxes).toHaveLength(1);
    expect(data.boxes[0].x).toBe(30);
    expect(data.boxes[0].color).toBe('gat');
    expect(data.boxes[0].stroke).toBe('');
  });

  it('returns containers with raw color and empty stroke/fill', () => {
    const g = new Graph();
    g.addNode('n', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('c', { nodeType: 'container', group: 'g', label: 'C', color: 'gat' });

    const data = extractLayout(g);
    expect(data.containers).toHaveLength(1);
    expect(data.containers[0].color).toBe('gat');
    expect(data.containers[0].stroke).toBe('');
  });

  it('returns edges with raw color and empty stroke', () => {
    const g = new Graph();
    g.addNode('a', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '' });
    g.addNode('b', { nodeType: 'node', x: 10, y: 0, color: 'blue', label: '' });
    g.addEdge('a', 'b', { type: 'structural', color: 'vgae' });

    const data = extractLayout(g);
    expect(data.edges[0].color).toBe('vgae');
    expect(data.edges[0].stroke).toBe('');
  });

  it('computes the same domain as flatten', () => {
    const g = simpleGraph();
    const raw = extractLayout(g);
    const decorated = flatten(g);
    expect(raw.domain).toEqual(decorated.domain);
  });
});

describe('anchor nodes', () => {
  it('positions anchors at container boundary midpoints', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    // 3 nodes in a group at known positions
    g.addNode('n0', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('n1', { nodeType: 'node', x: 100, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('n2', { nodeType: 'node', x: 50, y: 80, color: 'blue', label: '', group: 'g' });
    // Container + anchors
    g.addNode('g__container', { nodeType: 'container', group: 'g', label: 'G', color: 'blue' });
    g.addNode('g__top', { nodeType: 'anchor', group: 'g', anchorSide: 'top' });
    g.addNode('g__bottom', { nodeType: 'anchor', group: 'g', anchorSide: 'bottom' });
    g.addNode('g__left', { nodeType: 'anchor', group: 'g', anchorSide: 'left' });
    g.addNode('g__right', { nodeType: 'anchor', group: 'g', anchorSide: 'right' });
    // External box
    g.addNode('ext', { nodeType: 'box', x: 200, y: 40, label: 'Ext', color: 'blue', width: 60, height: 30, group: 'ext' });
    // Edge from right anchor to external box
    g.addDirectedEdge('g__right', 'ext', { type: 'flow', color: 'blue' });

    const data = extractLayout(g);
    // Anchors should not appear as visible nodes
    expect(data.nodes.length).toBe(3);
    // The edge should start at the right boundary of the container (x=100 + padding=30)
    const edge = data.edges.find(e => e.type === 'flow');
    expect(edge).toBeDefined();
    expect(edge!.x1).toBe(130); // container x2 = max(0,100,50) + 30 padding
    expect(edge!.y1).toBe(40);  // container midY = (-30 + 110) / 2 = 40
  });

  it('edges between two anchored containers connect at boundaries', () => {
    const g = new Graph({ multi: true, type: 'mixed' });
    // Group A
    g.addNode('a0', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'a' });
    g.addNode('a__container', { nodeType: 'container', group: 'a', label: 'A', color: 'blue' });
    g.addNode('a__bottom', { nodeType: 'anchor', group: 'a', anchorSide: 'bottom' });
    // Group B
    g.addNode('b0', { nodeType: 'node', x: 0, y: 100, color: 'blue', label: '', group: 'b' });
    g.addNode('b__container', { nodeType: 'container', group: 'b', label: 'B', color: 'blue' });
    g.addNode('b__top', { nodeType: 'anchor', group: 'b', anchorSide: 'top' });
    // Connect bottom of A to top of B
    g.addDirectedEdge('a__bottom', 'b__top', { type: 'flow', color: 'blue' });

    const data = extractLayout(g);
    const edge = data.edges[0];
    // A bottom: y = max_y(a) + padding = 0 + 30 = 30
    expect(edge.y1).toBe(30);
    // B top: y = min_y(b) - padding = 100 - 30 = 70
    expect(edge.y2).toBe(70);
    // Both x should be the center of their single-node groups
    expect(edge.x1).toBe(0);
    expect(edge.x2).toBe(0);
  });
});

describe('decorate', () => {
  it('resolves node colors via palette', () => {
    const g = new Graph();
    g.addNode('v', { nodeType: 'node', x: 0, y: 0, color: 'vgae', label: '' });
    const data = extractLayout(g);
    expect(data.nodes[0].stroke).toBe('');

    decorate(data);
    expect(data.nodes[0].stroke).toBe('#0000ff');
    expect(data.nodes[0].fill).toBe('#0000ff40');
    // Raw color is preserved
    expect(data.nodes[0].color).toBe('vgae');
  });

  it('resolves box colors via palette', () => {
    const g = new Graph();
    g.addNode('n', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('box', { nodeType: 'box', group: 'g', label: 'B', color: 'gat' });

    const data = decorate(extractLayout(g));
    expect(data.boxes[0].stroke).toBe('#ff0000');
    expect(data.boxes[0].fill).toBe('#ff000040');
    expect(data.boxes[0].color).toBe('gat');
  });

  it('resolves container colors via palette', () => {
    const g = new Graph();
    g.addNode('n', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '', group: 'g' });
    g.addNode('c', { nodeType: 'container', group: 'g', label: 'C', color: 'vgae' });

    const data = decorate(extractLayout(g));
    expect(data.containers[0].stroke).toBe('#0000ff');
    expect(data.containers[0].fill).toBe('#0000ff40');
  });

  it('resolves edge colors via palette', () => {
    const g = new Graph();
    g.addNode('a', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '' });
    g.addNode('b', { nodeType: 'node', x: 10, y: 0, color: 'blue', label: '' });
    g.addEdge('a', 'b', { type: 'structural', color: 'gat' });

    const data = decorate(extractLayout(g));
    expect(data.edges[0].stroke).toBe('#ff0000');
    expect(data.edges[0].color).toBe('gat');
  });

  it('returns the same reference (mutates in place)', () => {
    const g = new Graph();
    g.addNode('v', { nodeType: 'node', x: 0, y: 0, color: 'blue', label: '' });
    const data = extractLayout(g);
    const result = decorate(data);
    expect(result).toBe(data);
  });

  it('handles missing color gracefully', () => {
    const g = new Graph();
    g.addNode('v', { nodeType: 'node', x: 0, y: 0, label: '' });
    const data = decorate(extractLayout(g));
    // Empty string color should fall through resolve() to grey fallback
    expect(data.nodes[0].stroke).toBe('#999999');
  });
});
