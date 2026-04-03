import { describe, it, expect } from 'vitest';
import Graph from 'graphology';
import { buildGraph } from '../buildGraph.ts';
import { bounds, compositeBounds, translate, scale, hstack, vstack } from '../transforms.ts';
import { boxNode } from '../buildGraph.ts';

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

describe('compositeBounds', () => {
  it('includes regular positioned nodes', () => {
    const g = new Graph();
    g.addNode('a', { x: 10, y: 20 });
    g.addNode('b', { x: 50, y: 60 });
    expect(compositeBounds(g)).toEqual({ x1: 10, y1: 20, x2: 50, y2: 60 });
  });

  it('includes box nodes using width/height extents', () => {
    const g = boxNode({ id: 'b', label: 'B', width: 100, height: 40 });
    // Box at (0,0) with width=100, height=40 → extents: [-50,-20] to [50,20]
    const b = compositeBounds(g);
    expect(b.x1).toBe(-50);
    expect(b.x2).toBe(50);
    expect(b.y1).toBe(-20);
    expect(b.y2).toBe(20);
  });

  it('uses default box dimensions when unspecified', () => {
    const g = new Graph();
    g.addNode('box1', { nodeType: 'box', x: 0, y: 0 });
    const b = compositeBounds(g);
    expect(b.x1).toBe(-45);  // 90/2
    expect(b.y1).toBe(-16);  // 32/2
  });

  it('excludes container nodes', () => {
    const g = new Graph();
    g.addNode('a', { x: 10, y: 10 });
    g.addNode('c', { nodeType: 'container', x: 999, y: 999 });
    const b = compositeBounds(g);
    expect(b.x2).toBe(10);
    expect(b.y2).toBe(10);
  });

  it('combines regular nodes and box nodes', () => {
    const g = new Graph();
    g.addNode('n', { x: 0, y: 0 });
    g.addNode('b', { nodeType: 'box', x: 200, y: 0, width: 100, height: 40 });
    const b = compositeBounds(g);
    expect(b.x1).toBe(0);
    expect(b.x2).toBe(250); // 200 + 100/2
  });
});

describe('vstack', () => {
  it('stacks children top-to-bottom', () => {
    const parent = new Graph();
    const a = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'a', positions: [[0, 0], [20, 0]] });
    const b = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'b', positions: [[0, 0], [20, 0]] });
    vstack(parent, [a, b], { gap: 50 });
    const aMaxY = Math.max(parent.getNodeAttribute('a_0', 'y'), parent.getNodeAttribute('a_1', 'y'));
    const bMinY = Math.min(parent.getNodeAttribute('b_0', 'y'), parent.getNodeAttribute('b_1', 'y'));
    expect(bMinY).toBeGreaterThanOrEqual(aMaxY + 50);
  });

  it('left-aligns by default', () => {
    const parent = new Graph();
    const a = buildGraph({ n: 1, topology: 'none', color: 'x', prefix: 'a', positions: [[0, 0]] });
    const b = buildGraph({ n: 1, topology: 'none', color: 'x', prefix: 'b', positions: [[50, 0]] });
    vstack(parent, [a, b], { x: 10, y: 0, gap: 20 });
    // Both should have their left edge at x=10
    expect(parent.getNodeAttribute('a_0', 'x')).toBeCloseTo(10);
    expect(parent.getNodeAttribute('b_0', 'x')).toBeCloseTo(10);
  });

  it('center-aligns when requested', () => {
    const parent = new Graph();
    const a = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'a', positions: [[0, 0], [100, 0]] });
    const b = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'b', positions: [[0, 0], [40, 0]] });
    vstack(parent, [a, b], { x: 0, y: 0, gap: 20, align: 'center' });
    // Center of a: (0+100)/2 = 50, center of b: (0+40)/2 = 20
    // Both centers should align at x=0
    const aCenterX = (parent.getNodeAttribute('a_0', 'x') + parent.getNodeAttribute('a_1', 'x')) / 2;
    const bCenterX = (parent.getNodeAttribute('b_0', 'x') + parent.getNodeAttribute('b_1', 'x')) / 2;
    expect(aCenterX).toBeCloseTo(bCenterX, 0);
  });

  it('works with boxNode children', () => {
    const parent = new Graph();
    const box1 = boxNode({ id: 'b1', label: 'A', width: 100, height: 40 });
    const box2 = boxNode({ id: 'b2', label: 'B', width: 100, height: 40 });
    vstack(parent, [box1, box2], { gap: 30 });
    const y1 = parent.getNodeAttribute('b1', 'y');
    const y2 = parent.getNodeAttribute('b2', 'y');
    // b2 should be below b1 by at least height + gap
    expect(y2 - y1).toBeGreaterThanOrEqual(40 + 30);
  });

  it('mixes graph clusters and boxes', () => {
    const parent = new Graph();
    const graph = buildGraph({ n: 3, topology: 'none', color: 'x', prefix: 'g', positions: [[0, 0], [20, 0], [40, 0]] });
    const box = boxNode({ id: 'b', label: 'Box', width: 80, height: 30 });
    vstack(parent, [graph, box], { gap: 20 });
    const graphMaxY = Math.max(
      parent.getNodeAttribute('g_0', 'y'),
      parent.getNodeAttribute('g_1', 'y'),
      parent.getNodeAttribute('g_2', 'y'),
    );
    const boxY = parent.getNodeAttribute('b', 'y');
    const boxHalfH = 15; // 30/2
    expect(boxY - boxHalfH).toBeGreaterThanOrEqual(graphMaxY + 20);
  });

  it('does not mutate children', () => {
    const parent = new Graph();
    const child = buildGraph({ n: 2, topology: 'none', color: 'x', prefix: 'c', positions: [[0, 0], [10, 10]] });
    const origX = child.getNodeAttribute('c_0', 'x');
    vstack(parent, [child], { y: 500 });
    expect(child.getNodeAttribute('c_0', 'x')).toBe(origX);
  });
});
