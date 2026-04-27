import { describe, it, expect, vi } from 'vitest';

// Stub @xyflow/svelte — vitest can't resolve its directory exports in pure node,
// and convert/layout only need the Position enum.
vi.mock('@xyflow/svelte', () => ({
  Position: { Top: 'top', Right: 'right', Bottom: 'bottom', Left: 'left' },
}));

const { specToFlow } = await import('../convert.ts');
type DiagramNode = import('../types.ts').DiagramNode;

// Compute absolute (x, y) center of a node, walking up parentId chain so
// SvelteFlow's parent-relative coordinates resolve to canvas coordinates.
function absoluteCenter(node: DiagramNode, all: DiagramNode[]): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let cursor: DiagramNode | undefined = node;
  while (cursor?.parentId) {
    const parent = all.find((n) => n.id === cursor!.parentId);
    if (!parent) break;
    x += parent.position.x;
    y += parent.position.y;
    cursor = parent;
  }
  const w = nodeWidth(node);
  const h = nodeHeight(node);
  return { x: x + w / 2, y: y + h / 2 };
}

function nodeWidth(node: DiagramNode): number {
  if (node.type === 'circle') return ((node.data as { r?: number }).r ?? 14) * 2;
  if (node.type === 'box') return (node.data as { width?: number }).width ?? 90;
  if (node.type === 'container') return node.width ?? 200;
  return 50;
}

function nodeHeight(node: DiagramNode): number {
  if (node.type === 'circle') return ((node.data as { r?: number }).r ?? 14) * 2;
  if (node.type === 'box') return (node.data as { height?: number }).height ?? 32;
  if (node.type === 'container') return node.height ?? 150;
  return 50;
}

function aabb(node: DiagramNode, all: DiagramNode[]) {
  const c = absoluteCenter(node, all);
  const w = nodeWidth(node);
  const h = nodeHeight(node);
  return { x0: c.x - w / 2, y0: c.y - h / 2, x1: c.x + w / 2, y1: c.y + h / 2 };
}

function overlaps(a: ReturnType<typeof aabb>, b: ReturnType<typeof aabb>): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

describe('cluster geometry — single sparse 5-cycle', () => {
  const spec = {
    figure: 'graph-base',
    components: {
      input: { type: 'graph' as const, n: 5, topology: 'sparse' as const, color: 'vgae', labels: 'auto' as const, scale: 80 },
    },
    layout: { type: 'hstack' as const, children: ['input'] },
  };

  it('produces 5 circle nodes', async () => {
    const { nodes } = await specToFlow(spec);
    const circles = nodes.filter((n) => n.type === 'circle');
    expect(circles).toHaveLength(5);
  });

  it('places circles equidistant from cluster centroid (ring shape preserved)', async () => {
    const { nodes } = await specToFlow(spec);
    const circles = nodes.filter((n) => n.type === 'circle');
    const centers = circles.map((n) => absoluteCenter(n, nodes));
    const cx = centers.reduce((s, p) => s + p.x, 0) / centers.length;
    const cy = centers.reduce((s, p) => s + p.y, 0) / centers.length;
    const radii = centers.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const meanR = radii.reduce((s, r) => s + r, 0) / radii.length;

    // Every node within ±15% of mean radius — cluster is on a circle
    for (const r of radii) {
      expect(Math.abs(r - meanR) / meanR).toBeLessThan(0.15);
    }
    // And the radius is non-trivial (cluster didn't collapse to a point)
    expect(meanR).toBeGreaterThan(20);
  });

  it('has no overlapping circle nodes', async () => {
    const { nodes } = await specToFlow(spec);
    const circles = nodes.filter((n) => n.type === 'circle');
    const boxes = circles.map((n) => aabb(n, nodes));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlaps(boxes[i], boxes[j])).toBe(false);
      }
    }
  });
});

describe('container geometry — graph cluster with container', () => {
  const spec = {
    figure: 'graph-base-with-container',
    components: {
      input: {
        type: 'graph' as const,
        n: 5,
        topology: 'sparse' as const,
        color: 'vgae',
        labels: 'auto' as const,
        scale: 80,
        container: { label: 'CAN Bus', color: 'vgae' },
      },
    },
    layout: { type: 'hstack' as const, children: ['input'] },
  };

  it('emits a container node', async () => {
    const { nodes } = await specToFlow(spec);
    expect(nodes.filter((n) => n.type === 'container')).toHaveLength(1);
  });

  it('container bbox encloses all child circles with padding', async () => {
    const { nodes } = await specToFlow(spec);
    const container = nodes.find((n) => n.type === 'container')!;
    const cBox = aabb(container, nodes);

    const children = nodes.filter((n) => n.parentId === container.id);
    expect(children.length).toBeGreaterThan(0);

    const PAD = 8;
    for (const child of children) {
      const cb = aabb(child, nodes);
      expect(cb.x0).toBeGreaterThanOrEqual(cBox.x0 + PAD);
      expect(cb.y0).toBeGreaterThanOrEqual(cBox.y0 + PAD);
      expect(cb.x1).toBeLessThanOrEqual(cBox.x1 - PAD);
      expect(cb.y1).toBeLessThanOrEqual(cBox.y1 - PAD);
    }
  });
});

describe('pipeline monotonicity — multi-stage layout', () => {
  const spec = {
    figure: 'pipeline-test',
    components: {
      a: { type: 'graph' as const, n: 5, topology: 'sparse' as const, color: 'vgae', scale: 60 },
      b: { type: 'box' as const, label: 'mid', color: 'gat' },
      c: { type: 'graph' as const, n: 5, topology: 'sparse' as const, color: 'kd', scale: 60 },
    },
    layout: { type: 'pipeline' as const, children: ['a', 'b', 'c'] },
  };

  it('stage centroids increase monotonically along x (LR layout)', async () => {
    const { nodes } = await specToFlow(spec, { direction: 'LR' });
    const stageX: number[] = [];
    for (const stage of ['a', 'b', 'c']) {
      const stageNodes = nodes.filter((n) => n.id === stage || n.id.startsWith(`${stage}_`));
      const xs = stageNodes.map((n) => absoluteCenter(n, nodes).x);
      stageX.push(xs.reduce((s, x) => s + x, 0) / xs.length);
    }
    expect(stageX[1]).toBeGreaterThan(stageX[0]);
    expect(stageX[2]).toBeGreaterThan(stageX[1]);
  });
});
