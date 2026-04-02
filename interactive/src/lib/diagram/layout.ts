import type { FlatContainer } from './flatten.ts';

interface FlowArrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  label?: string;
}

/**
 * Create flow arrows connecting sequential containers (right edge → left edge).
 * Optional labels array provides annotation text for each arrow.
 */
export function connectContainers(
  containers: FlatContainer[],
  opts: { stroke?: string; labels?: string[] } = {},
): FlowArrow[] {
  const { stroke = '#999', labels } = opts;
  const arrows: FlowArrow[] = [];
  for (let i = 0; i < containers.length - 1; i++) {
    const from = containers[i];
    const to = containers[i + 1];
    const midY = (from.y1 + from.y2) / 2;
    arrows.push({
      x1: from.x2, y1: midY,
      x2: to.x1, y2: midY,
      stroke,
      ...(labels?.[i] != null && { label: labels[i] }),
    });
  }
  return arrows;
}

/** Compute a bounding box around all containers with optional padding. */
export function boundingBox(
  containers: FlatContainer[],
  padding = 15,
): { x1: number; y1: number; x2: number; y2: number } {
  const xs = containers.flatMap(c => [c.x1, c.x2]);
  const ys = containers.flatMap(c => [c.y1, c.y2]);
  return {
    x1: Math.min(...xs) - padding,
    y1: Math.min(...ys) - padding,
    x2: Math.max(...xs) + padding,
    y2: Math.max(...ys) + padding,
  };
}
