import { describe, it, expect } from 'vitest';
import {
  labelAbove, labelBoxCenter, labelCenter, labelEdgeMid,
  labelAboveOf, labelBoxCenterOf, labelCenterOf, labelEdgeMidOf,
} from '../text.ts';

describe('labelAbove (accessor)', () => {
  it('has middle anchor and negative dy', () => {
    expect(labelAbove.textAnchor).toBe('middle');
    expect(labelAbove.dy).toBe(-8);
  });

  it('x accessor computes horizontal midpoint of bounded element', () => {
    const el = { x1: 10, y1: 20, x2: 50, y2: 60 };
    expect((labelAbove.x as Function)(el)).toBe(30);
  });

  it('y accessor uses y1 (top edge)', () => {
    expect(labelAbove.y).toBe('y1');
  });
});

describe('labelBoxCenter (accessor)', () => {
  it('computes center of bounding box', () => {
    const el = { x1: 0, y1: 0, x2: 100, y2: 80 };
    expect((labelBoxCenter.x as Function)(el)).toBe(50);
    expect((labelBoxCenter.y as Function)(el)).toBe(40);
  });

  it('has middle anchor and dy=1', () => {
    expect(labelBoxCenter.textAnchor).toBe('middle');
    expect(labelBoxCenter.dy).toBe(1);
  });
});

describe('labelCenter (accessor)', () => {
  it('uses x and y string accessors', () => {
    expect(labelCenter.x).toBe('x');
    expect(labelCenter.y).toBe('y');
  });

  it('has middle anchor and dy=1', () => {
    expect(labelCenter.textAnchor).toBe('middle');
    expect(labelCenter.dy).toBe(1);
  });
});

describe('labelEdgeMid (accessor)', () => {
  it('computes midpoint of edge endpoints', () => {
    const edge = { x1: 0, y1: 0, x2: 100, y2: 200 };
    expect((labelEdgeMid.x as Function)(edge)).toBe(50);
    expect((labelEdgeMid.y as Function)(edge)).toBe(100);
  });

  it('has middle anchor and dy=-8', () => {
    expect(labelEdgeMid.textAnchor).toBe('middle');
    expect(labelEdgeMid.dy).toBe(-8);
  });
});

describe('labelAboveOf (single-item)', () => {
  it('returns concrete position above a bounded element', () => {
    const pos = labelAboveOf({ x1: 10, y1: 20, x2: 50, y2: 60 });
    expect(pos.x).toBe(30);
    expect(pos.y).toBe(20);
    expect(pos.textAnchor).toBe('middle');
    expect(pos.dy).toBe(-8);
  });

  it('accepts custom dy', () => {
    const pos = labelAboveOf({ x1: 0, y1: 0, x2: 100, y2: 100 }, -12);
    expect(pos.dy).toBe(-12);
  });
});

describe('labelBoxCenterOf (single-item)', () => {
  it('returns center of bounding box', () => {
    const pos = labelBoxCenterOf({ x1: 0, y1: 0, x2: 100, y2: 80 });
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(40);
    expect(pos.textAnchor).toBe('middle');
    expect(pos.dy).toBe(1);
  });
});

describe('labelCenterOf (single-item)', () => {
  it('returns the element position directly', () => {
    const pos = labelCenterOf({ x: 42, y: 99 });
    expect(pos.x).toBe(42);
    expect(pos.y).toBe(99);
    expect(pos.textAnchor).toBe('middle');
    expect(pos.dy).toBe(1);
  });
});

describe('labelEdgeMidOf (single-item)', () => {
  it('returns midpoint of edge endpoints', () => {
    const pos = labelEdgeMidOf({ x1: 0, y1: 0, x2: 100, y2: 200 });
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(100);
    expect(pos.textAnchor).toBe('middle');
    expect(pos.dy).toBe(-8);
  });

  it('supports dx offset', () => {
    const pos = labelEdgeMidOf({ x1: 0, y1: 0, x2: 100, y2: 0 }, { dx: 14 });
    expect(pos.x).toBe(64);
  });

  it('supports dy override', () => {
    const pos = labelEdgeMidOf({ x1: 0, y1: 0, x2: 100, y2: 0 }, { dy: -10 });
    expect(pos.dy).toBe(-10);
  });
});
