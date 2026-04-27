import { describe, it, expect, vi } from 'vitest';

vi.mock('@xyflow/svelte', () => ({
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}));

const { getEdgeParams, boundaryToward, roundedPolylinePath } = await import('../floating.ts');

// Build a fake InternalNode shape that matches what xyflow exposes:
// `internals.positionAbsolute` (top-left in canvas coords) and
// `measured: { width, height }`.
function fakeNode(opts: {
  type: 'circle' | 'box';
  cx: number;
  cy: number;
  size: number; // diameter for circle, width=height for box
}): any {
  const { type, cx, cy, size } = opts;
  return {
    type,
    measured: { width: size, height: size },
    internals: { positionAbsolute: { x: cx - size / 2, y: cy - size / 2 } },
  };
}

describe('getEdgeParams — circle source/target', () => {
  it('right-of-source target → exits right side, enters left side', () => {
    const s = fakeNode({ type: 'circle', cx: 0, cy: 0, size: 20 });
    const t = fakeNode({ type: 'circle', cx: 100, cy: 0, size: 20 });
    const p = getEdgeParams(s, t);
    expect(p.sourcePos).toBe('right');
    expect(p.targetPos).toBe('left');
    // Source intersection sits on the right edge of the source circle
    expect(p.sx).toBeCloseTo(10, 5);
    expect(p.sy).toBeCloseTo(0, 5);
    expect(p.tx).toBeCloseTo(90, 5);
    expect(p.ty).toBeCloseTo(0, 5);
  });

  it('below-source target → exits bottom side, enters top side (was wrap-around bug)', () => {
    const s = fakeNode({ type: 'circle', cx: 0, cy: 0, size: 20 });
    const t = fakeNode({ type: 'circle', cx: 0, cy: 100, size: 20 });
    const p = getEdgeParams(s, t);
    expect(p.sourcePos).toBe('bottom');
    expect(p.targetPos).toBe('top');
  });

  it('diagonal target → still snaps to a single cardinal side', () => {
    const s = fakeNode({ type: 'circle', cx: 0, cy: 0, size: 20 });
    const t = fakeNode({ type: 'circle', cx: 100, cy: 30, size: 20 });
    const p = getEdgeParams(s, t);
    // Mostly to the right (atan2(30, 100) ≈ 17°), so right
    expect(p.sourcePos).toBe('right');
    expect(p.targetPos).toBe('left');
  });
});

describe('getEdgeParams — rectangular source/target', () => {
  it('right-of-source target → boundary exit on the rect right edge', () => {
    const s = fakeNode({ type: 'box', cx: 0, cy: 0, size: 40 });
    const t = fakeNode({ type: 'box', cx: 200, cy: 0, size: 40 });
    const p = getEdgeParams(s, t);
    expect(p.sourcePos).toBe('right');
    expect(p.targetPos).toBe('left');
    expect(p.sx).toBeCloseTo(20, 5); // half-width of source
    expect(p.tx).toBeCloseTo(180, 5); // 200 - 20
  });

  it('above-source target → exits top, enters bottom', () => {
    const s = fakeNode({ type: 'box', cx: 0, cy: 0, size: 40 });
    const t = fakeNode({ type: 'box', cx: 0, cy: -200, size: 40 });
    const p = getEdgeParams(s, t);
    expect(p.sourcePos).toBe('top');
    expect(p.targetPos).toBe('bottom');
  });
});

describe('boundaryToward — node-to-bend-point cap', () => {
  it('circle node toward a point to the right → caps on the right edge', () => {
    const s = fakeNode({ type: 'circle', cx: 0, cy: 0, size: 20 });
    const p = boundaryToward(s, { x: 100, y: 0 });
    expect(p.x).toBeCloseTo(10, 5);
    expect(p.y).toBeCloseTo(0, 5);
  });

  it('rectangle node toward an above-left point → caps on the top edge', () => {
    const s = fakeNode({ type: 'box', cx: 0, cy: 0, size: 40 });
    const p = boundaryToward(s, { x: -5, y: -100 });
    // mostly above, so the binding axis is y → caps at top edge (y = -20)
    expect(p.y).toBeCloseTo(-20, 5);
  });
});

describe('roundedPolylinePath — SVG path generator', () => {
  it('two points → simple straight L command', () => {
    const d = roundedPolylinePath([{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    expect(d).toBe('M 0 0 L 100 0');
  });

  it('three points with a 90° bend → contains a Q (quadratic) corner', () => {
    const d = roundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }],
      8,
    );
    expect(d).toMatch(/^M 0 0/);
    expect(d).toContain('Q 100 0'); // corner control point at the bend
    expect(d).toMatch(/L 100 100$/);
  });

  it('truncates corner radius to half the shorter segment', () => {
    // Both segments are 4 units long; radius=8 should clamp to 2.
    const d = roundedPolylinePath(
      [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }],
      8,
    );
    // Should still produce a valid path, no NaN
    expect(d).not.toContain('NaN');
    expect(d).toMatch(/^M 0 0/);
  });

  it('< 2 points → empty path', () => {
    expect(roundedPolylinePath([])).toBe('');
    expect(roundedPolylinePath([{ x: 5, y: 5 }])).toBe('');
  });
});

describe('getEdgeParams — degenerate cases', () => {
  it('coincident centers → returns center, does not crash', () => {
    const s = fakeNode({ type: 'circle', cx: 50, cy: 50, size: 20 });
    const t = fakeNode({ type: 'circle', cx: 50, cy: 50, size: 20 });
    const p = getEdgeParams(s, t);
    expect(Number.isFinite(p.sx)).toBe(true);
    expect(Number.isFinite(p.sy)).toBe(true);
    expect(p.sx).toBe(50);
    expect(p.sy).toBe(50);
  });

  it('zero-size measured → falls back to center, no NaN', () => {
    const s: any = {
      type: 'circle',
      measured: { width: 0, height: 0 },
      internals: { positionAbsolute: { x: 0, y: 0 } },
    };
    const t = fakeNode({ type: 'circle', cx: 100, cy: 0, size: 20 });
    const p = getEdgeParams(s, t);
    expect(Number.isFinite(p.sx)).toBe(true);
    expect(Number.isFinite(p.sy)).toBe(true);
  });
});
