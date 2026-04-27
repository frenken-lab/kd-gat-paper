/**
 * Generate circular positions for n nodes around a center point.
 * Used by specToFlow when laying out a graph cluster as a ring.
 */
export function circularPositions(
  n: number,
  cx = 0,
  cy = 0,
  radius = 40,
): Array<{ x: number; y: number }> {
  return Array.from({ length: n }, (_, i) => ({
    x: cx + radius * Math.cos((2 * Math.PI * i) / n - Math.PI / 2),
    y: cy + radius * Math.sin((2 * Math.PI * i) / n - Math.PI / 2),
  }));
}
