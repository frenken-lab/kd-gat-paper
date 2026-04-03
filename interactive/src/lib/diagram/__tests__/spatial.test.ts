import { describe, it, expect } from 'vitest';
import {
  buildSpatialIndex,
  parseAssertion,
  checkSpatial,
  type SpatialElement,
} from '../spatial.ts';
import type { FlatData } from '../flatten.ts';

// --- Test fixtures ---

/** Minimal FlatData for testing: two boxes and a node. */
function twoBoxLayout(): FlatData {
  return {
    nodes: [
      { id: 'n1', x: 50, y: 100, color: 'blue', fill: '', stroke: '', label: 'N1', group: 'g1' },
      { id: 'n2', x: 150, y: 100, color: 'blue', fill: '', stroke: '', label: 'N2', group: 'g1' },
    ],
    boxes: [
      { id: 'box_a', x: 100, y: 100, x1: 50, y1: 50, x2: 150, y2: 150, color: 'red', fill: '', stroke: '', label: 'A', rx: 6 },
      { id: 'box_b', x: 300, y: 100, x1: 250, y1: 50, x2: 350, y2: 150, color: 'red', fill: '', stroke: '', label: 'B', rx: 6 },
    ],
    containers: [
      { group: 'c1', x1: 0, y1: 0, x2: 200, y2: 200, color: 'grey', fill: '', stroke: '', label: 'C1' },
    ],
    edges: [],
    domain: { x: [-40, 390], y: [-40, 240] },
  };
}

/** Two-row architecture-like layout. */
function twoRowLayout(): FlatData {
  return {
    nodes: [
      { id: 'in_0', x: 50, y: 100, color: 'blue', fill: '', stroke: '', label: '' },
      { id: 'in_1', x: 80, y: 130, color: 'blue', fill: '', stroke: '', label: '' },
      { id: 'in_2', x: 80, y: 70, color: 'blue', fill: '', stroke: '', label: '' },
    ],
    boxes: [
      { id: 'vgae_t', x: 200, y: 100, x1: 150, y1: 70, x2: 250, y2: 130, color: 'vgae', fill: '', stroke: '', label: 'VGAE-T', rx: 6 },
      { id: 'gat_t', x: 400, y: 100, x1: 350, y1: 70, x2: 450, y2: 130, color: 'gat', fill: '', stroke: '', label: 'GAT-T', rx: 6 },
      { id: 'vgae_s', x: 200, y: 300, x1: 150, y1: 270, x2: 250, y2: 330, color: 'vgae', fill: '', stroke: '', label: 'VGAE-S', rx: 6 },
      { id: 'gat_s', x: 400, y: 300, x1: 350, y1: 270, x2: 450, y2: 330, color: 'gat', fill: '', stroke: '', label: 'GAT-S', rx: 6 },
    ],
    containers: [],
    edges: [],
    domain: { x: [-40, 490], y: [-40, 370] },
  };
}

// --- buildSpatialIndex ---

describe('buildSpatialIndex', () => {
  it('indexes nodes by id', () => {
    const data = twoBoxLayout();
    const index = buildSpatialIndex(data);
    const n1 = index.get('n1');
    expect(n1).toBeDefined();
    expect(n1!.x).toBe(50);
    expect(n1!.y).toBe(100);
    expect(n1!.kind).toBe('node');
  });

  it('indexes boxes by id with bounds', () => {
    const data = twoBoxLayout();
    const index = buildSpatialIndex(data);
    const box = index.get('box_a');
    expect(box).toBeDefined();
    expect(box!.x).toBe(100);
    expect(box!.x1).toBe(50);
    expect(box!.x2).toBe(150);
    expect(box!.kind).toBe('box');
  });

  it('indexes containers by group with computed center', () => {
    const data = twoBoxLayout();
    const index = buildSpatialIndex(data);
    const c = index.get('c1');
    expect(c).toBeDefined();
    expect(c!.x).toBe(100); // (0+200)/2
    expect(c!.y).toBe(100); // (0+200)/2
    expect(c!.kind).toBe('container');
    expect(c!.x1).toBe(0);
    expect(c!.x2).toBe(200);
  });

  it('computes graph cluster centroids via prefixMap', () => {
    const data = twoRowLayout();
    const index = buildSpatialIndex(data, { input: 'in' });
    const input = index.get('input');
    expect(input).toBeDefined();
    // Centroid of in_0(50,100), in_1(80,130), in_2(80,70)
    expect(input!.x).toBeCloseTo(70, 0);
    expect(input!.y).toBeCloseTo(100, 0);
    expect(input!.kind).toBe('node');
    // Bounds should cover all matching nodes
    expect(input!.x1).toBe(50);
    expect(input!.x2).toBe(80);
  });

  it('skips prefixMap entries with no matching nodes', () => {
    const data = twoBoxLayout();
    const index = buildSpatialIndex(data, { missing: 'zzz' });
    expect(index.has('missing')).toBe(false);
  });
});

// --- parseAssertion ---

describe('parseAssertion', () => {
  it('parses simple predicate', () => {
    const p = parseAssertion('vgae_t: left-of gat_t');
    expect(p.subject).toBe('vgae_t');
    expect(p.predicate).toBe('left-of');
    expect(p.object).toBe('gat_t');
    expect(p.min).toBeUndefined();
    expect(p.max).toBeUndefined();
  });

  it('parses predicate with range', () => {
    const p = parseAssertion('a: above b 80 to 250');
    expect(p.subject).toBe('a');
    expect(p.predicate).toBe('above');
    expect(p.object).toBe('b');
    expect(p.min).toBe(80);
    expect(p.max).toBe(250);
  });

  it('parses aligned-horizontally', () => {
    const p = parseAssertion('x: aligned-horizontally y');
    expect(p.predicate).toBe('aligned-horizontally');
  });

  it('parses aligned-vertically', () => {
    const p = parseAssertion('x: aligned-vertically y');
    expect(p.predicate).toBe('aligned-vertically');
  });

  it('parses inside', () => {
    const p = parseAssertion('node1: inside container1');
    expect(p.predicate).toBe('inside');
    expect(p.subject).toBe('node1');
    expect(p.object).toBe('container1');
  });

  it('throws on missing colon', () => {
    expect(() => parseAssertion('no colon here')).toThrow('no colon');
  });

  it('throws on unknown predicate', () => {
    expect(() => parseAssertion('a: overlaps b')).toThrow('Unknown predicate');
  });

  it('throws on missing object', () => {
    expect(() => parseAssertion('a: left-of')).toThrow('Missing object');
  });

  it('throws on trailing tokens after object', () => {
    expect(() => parseAssertion('a: left-of b garbage')).toThrow('Unexpected tokens');
  });

  it('throws on malformed range (missing "to")', () => {
    expect(() => parseAssertion('a: left-of b 10 250')).toThrow('Unexpected tokens');
  });

  it('parses float ranges', () => {
    const p = parseAssertion('a: left-of b 10.5 to 20.5');
    expect(p.min).toBeCloseTo(10.5);
    expect(p.max).toBeCloseTo(20.5);
  });
});

// --- checkSpatial predicates ---

describe('checkSpatial', () => {
  describe('left-of / right-of', () => {
    it('passes when a.x < b.x', () => {
      const data = twoBoxLayout();
      const [r] = checkSpatial(data, ['box_a: left-of box_b']);
      expect(r.passed).toBe(true);
    });

    it('fails when a.x >= b.x', () => {
      const data = twoBoxLayout();
      const [r] = checkSpatial(data, ['box_b: left-of box_a']);
      expect(r.passed).toBe(false);
    });

    it('checks gap range', () => {
      const data = twoBoxLayout(); // box_a.x=100, box_b.x=300, gap=200
      const [pass] = checkSpatial(data, ['box_a: left-of box_b 100 to 250']);
      expect(pass.passed).toBe(true);
      const [fail] = checkSpatial(data, ['box_a: left-of box_b 10 to 50']);
      expect(fail.passed).toBe(false);
    });

    it('right-of works', () => {
      const data = twoBoxLayout();
      const [r] = checkSpatial(data, ['box_b: right-of box_a']);
      expect(r.passed).toBe(true);
    });
  });

  describe('above / below', () => {
    it('above passes when a.y < b.y (SVG Y-down)', () => {
      const data = twoRowLayout();
      const [r] = checkSpatial(data, ['vgae_t: above vgae_s']);
      expect(r.passed).toBe(true); // 100 < 300
    });

    it('above fails when a.y >= b.y', () => {
      const data = twoRowLayout();
      const [r] = checkSpatial(data, ['vgae_s: above vgae_t']);
      expect(r.passed).toBe(false);
    });

    it('above with range checks gap', () => {
      const data = twoRowLayout(); // vgae_t.y=100, vgae_s.y=300, gap=200
      const [pass] = checkSpatial(data, ['vgae_t: above vgae_s 150 to 250']);
      expect(pass.passed).toBe(true);
      const [fail] = checkSpatial(data, ['vgae_t: above vgae_s 10 to 50']);
      expect(fail.passed).toBe(false);
    });

    it('below works', () => {
      const data = twoRowLayout();
      const [r] = checkSpatial(data, ['vgae_s: below vgae_t']);
      expect(r.passed).toBe(true);
    });
  });

  describe('aligned-horizontally / aligned-vertically', () => {
    it('aligned-horizontally passes when y values are within tolerance', () => {
      const data = twoRowLayout(); // vgae_t.y=100, gat_t.y=100
      const [r] = checkSpatial(data, ['vgae_t: aligned-horizontally gat_t']);
      expect(r.passed).toBe(true);
    });

    it('aligned-horizontally fails when y values differ', () => {
      const data = twoRowLayout(); // vgae_t.y=100, vgae_s.y=300
      const [r] = checkSpatial(data, ['vgae_t: aligned-horizontally vgae_s']);
      expect(r.passed).toBe(false);
    });

    it('aligned-vertically passes when x values match', () => {
      const data = twoRowLayout(); // vgae_t.x=200, vgae_s.x=200
      const [r] = checkSpatial(data, ['vgae_t: aligned-vertically vgae_s']);
      expect(r.passed).toBe(true);
    });

    it('aligned-vertically fails when x values differ', () => {
      const data = twoRowLayout(); // vgae_t.x=200, gat_t.x=400
      const [r] = checkSpatial(data, ['vgae_t: aligned-vertically gat_t']);
      expect(r.passed).toBe(false);
    });

    it('respects custom tolerance', () => {
      const data = twoRowLayout();
      // vgae_t.y=100, vgae_s.y=300, diff=200
      const [r] = checkSpatial(data, ['vgae_t: aligned-horizontally vgae_s'], { tolerance: 250 });
      expect(r.passed).toBe(true);
    });
  });

  describe('inside', () => {
    it('point inside bounds passes', () => {
      const data = twoBoxLayout(); // n1(50,100) inside c1(0,0,200,200)
      const [r] = checkSpatial(data, ['n1: inside c1']);
      expect(r.passed).toBe(true);
    });

    it('point outside bounds fails', () => {
      const data = twoBoxLayout(); // box_b center(300,100) outside c1(0,0,200,200)
      const [r] = checkSpatial(data, ['box_b: inside c1']);
      expect(r.passed).toBe(false);
    });

    it('bounded inside bounded passes', () => {
      const data = twoBoxLayout(); // box_a(50,50,150,150) inside c1(0,0,200,200)
      const [r] = checkSpatial(data, ['box_a: inside c1']);
      expect(r.passed).toBe(true);
    });

    it('fails when target has no bounds', () => {
      const data = twoBoxLayout();
      const [r] = checkSpatial(data, ['box_a: inside n1']); // n1 has no bounds
      expect(r.passed).toBe(false);
    });
  });

  describe('error handling', () => {
    it('reports missing subject element', () => {
      const data = twoBoxLayout();
      const [r] = checkSpatial(data, ['nonexistent: left-of box_a']);
      expect(r.passed).toBe(false);
      expect(r.detail).toContain('not found');
    });

    it('reports missing object element', () => {
      const data = twoBoxLayout();
      const [r] = checkSpatial(data, ['box_a: left-of nonexistent']);
      expect(r.passed).toBe(false);
      expect(r.detail).toContain('not found');
    });
  });

  describe('multiple assertions', () => {
    it('returns results for all assertions', () => {
      const data = twoRowLayout();
      const results = checkSpatial(data, [
        'vgae_t: left-of gat_t',
        'vgae_t: above vgae_s',
        'vgae_t: aligned-horizontally gat_t',
        'vgae_t: aligned-vertically vgae_s',
      ]);
      expect(results).toHaveLength(4);
      expect(results.every(r => r.passed)).toBe(true);
    });

    it('mixed pass/fail returns correct results', () => {
      const data = twoRowLayout();
      const results = checkSpatial(data, [
        'vgae_t: left-of gat_t',       // pass
        'vgae_s: above vgae_t',         // fail (300 > 100)
      ]);
      expect(results).toHaveLength(2);
      expect(results[0].passed).toBe(true);
      expect(results[1].passed).toBe(false);
    });
  });

  describe('prefixMap', () => {
    it('allows cluster-level assertions', () => {
      const data = twoRowLayout();
      const results = checkSpatial(data, [
        'input: left-of vgae_t',
      ], { prefixMap: { input: 'in' } });
      expect(results[0].passed).toBe(true); // centroid(70) < 200
    });
  });
});
