import { describe, it, expect } from 'vitest';
import Graph from 'graphology';
import { buildGraph } from '../buildGraph.ts';
import { bounds, translate, scale, hstack } from '../transforms.ts';

describe('bounds', () => {
  it('returns bounding box of positioned nodes', () => {
    const g = new Graph();
    g.addNode('a', { x: 10, y: 20 });
    g.addNode('b', { x: 50, y: 60 });
    expect(bounds(g)).toEqual({ x1: 10, y1: 20, x2: 50, y2: 60 });
  });

  it('excludes container and box nodes', () => {
    const g = new Graph();
    g.addNode('n', { x: 0, y: 0 });
    g.addNode('c', { nodeType: 'container', x: 999, y: 999 });
    g.addNode('b', { nodeType: 'box', x: -999, y: -999 });
    expect(bounds(g)).toEqual({ x1: 0, y1: 0, x2: 0, y2: 0 });
  });
});

describe('translate', () => {
  it('shifts all positioned nodes by dx, dy', () => {
    const g = new Graph();
    g.addNode('a', { x: 10, y: 20 });
    g.addNode('b', { x: 30, y: 40 });
    translate(g, 100, 200);
    expect(g.getNodeAttribute('a', 'x')).toBe(110);
    expect(g.getNodeAttribute('a', 'y')).toBe(220);
    expect(g.getNodeAttribute('b', 'x')).toBe(130);
  });

  it('does not move container nodes', () => {
    const g = new Graph();
    g.addNode('c', { nodeType: 'container', x: 5, y: 5 });
    translate(g, 100, 100);
    expect(g.getNodeAttribute('c', 'x')).toBe(5);
  });
});

describe('scale', () => {
  it('scales positions relative to centroid', () => {
    const g = new Graph();
    g.addNode('a', { x: -10, y: 0 });
    g.addNode('b', { x: 10, y: 0 });
    // Centroid is (0, 0). Scale 2x → -20, 20
    scale(g, 2);
    expect(g.getNodeAttribute('a', 'x')).toBe(-20);
    expect(g.getNodeAttribute('b', 'x')).toBe(20);
  });

  it('is a no-op for factor=1', () => {
    const g = new Graph();
    g.addNode('a', { x: 5, y: 5 });
    scale(g, 1);
    expect(g.getNodeAttribute('a', 'x')).toBe(5);
  });
});

describe('hstack', () => {
  it('imports all child nodes and edges into the parent', () => {
    const parent = new Graph();
    const a = buildGraph({ n: 3, topology: 'full', color: 'red', prefix: 'a' });
    const b = buildGraph({ n: 2, topology: 'full', color: 'blue', prefix: 'b' });
    hstack(parent, [a, b]);
    expect(parent.order).toBe(5);
    expect(parent.size).toBe(4); // C(3,2) + C(2,2)
  });

  it('does not mutate the child graphs', () => {
    const parent = new Graph();
    const child = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'c', positions: [[0, 0], [10, 0]] });
    const origX = child.getNodeAttribute('c_0', 'x');
    hstack(parent, [child], { x: 500, y: 500 });
    expect(child.getNodeAttribute('c_0', 'x')).toBe(origX);
  });

  it('places children sequentially with gap between them', () => {
    const parent = new Graph();
    const a = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'a', positions: [[0, 0], [20, 0]] });
    const b = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'b', positions: [[0, 0], [20, 0]] });
    hstack(parent, [a, b], { x: 0, y: 0, gap: 50 });
    const bMinX = Math.min(parent.getNodeAttribute('b_0', 'x'), parent.getNodeAttribute('b_1', 'x'));
    const aMaxX = Math.max(parent.getNodeAttribute('a_0', 'x'), parent.getNodeAttribute('a_1', 'x'));
    expect(bMinX).toBeGreaterThanOrEqual(aMaxX + 50);
  });

  it('translates to the specified (x, y) origin', () => {
    const parent = new Graph();
    const child = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 't', positions: [[5, 10], [15, 20]] });
    hstack(parent, [child], { x: 100, y: 200 });
    const xs = parent.mapNodes((_, a) => a.x);
    const ys = parent.mapNodes((_, a) => a.y);
    expect(Math.min(...xs)).toBeCloseTo(100);
    expect(Math.min(...ys)).toBeCloseTo(200);
  });
});
