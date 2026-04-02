import { describe, it, expect } from 'vitest';
import { connectContainers, boundingBox } from '../layout.ts';
import type { FlatContainer } from '../flatten.ts';

function makeContainer(x1: number, y1: number, x2: number, y2: number): FlatContainer {
  return { x1, y1, x2, y2, fill: '#fff', stroke: '#000', label: '', group: '' };
}

describe('connectContainers', () => {
  it('creates n-1 arrows for n containers', () => {
    const containers = [
      makeContainer(0, 0, 50, 50),
      makeContainer(100, 0, 150, 50),
      makeContainer(200, 0, 250, 50),
    ];
    const arrows = connectContainers(containers);
    expect(arrows).toHaveLength(2);
  });

  it('connects right edge of one to left edge of next at vertical midpoint', () => {
    const a = makeContainer(0, 0, 50, 100);
    const b = makeContainer(100, 0, 150, 100);
    const [arrow] = connectContainers([a, b]);
    expect(arrow.x1).toBe(50);  // right edge of a
    expect(arrow.x2).toBe(100); // left edge of b
    expect(arrow.y1).toBe(50);  // vertical midpoint of a
    expect(arrow.y2).toBe(50);
  });

  it('attaches labels when provided', () => {
    const containers = [makeContainer(0, 0, 10, 10), makeContainer(20, 0, 30, 10)];
    const arrows = connectContainers(containers, { labels: ['KD loss'] });
    expect(arrows[0].label).toBe('KD loss');
  });

  it('returns empty array for fewer than 2 containers', () => {
    expect(connectContainers([])).toEqual([]);
    expect(connectContainers([makeContainer(0, 0, 10, 10)])).toEqual([]);
  });
});

describe('boundingBox', () => {
  it('computes tight bounds with default padding', () => {
    const containers = [
      makeContainer(10, 20, 50, 60),
      makeContainer(100, 5, 200, 80),
    ];
    const box = boundingBox(containers);
    // Default padding = 15
    expect(box.x1).toBe(10 - 15);
    expect(box.y1).toBe(5 - 15);
    expect(box.x2).toBe(200 + 15);
    expect(box.y2).toBe(80 + 15);
  });

  it('respects custom padding', () => {
    const containers = [makeContainer(0, 0, 100, 100)];
    const box = boundingBox(containers, 0);
    expect(box).toEqual({ x1: 0, y1: 0, x2: 100, y2: 100 });
  });
});
