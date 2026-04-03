import { describe, it, expect } from 'vitest';
import { buildFromSpec } from '../spec.ts';

import archSpec from '../../../figures/architecture/spec.yaml';
import gatSpec from '../../../figures/gat/spec.yaml';
import vgaeSpec from '../../../figures/vgae/spec.yaml';

describe('architecture composition', () => {
  const { graph } = buildFromSpec(archSpec, { specs: { gat: gatSpec, vgae: vgaeSpec } });

  it('produces expected node counts', () => {
    const nodesByType = { node: 0, box: 0, container: 0, anchor: 0 };
    graph.forEachNode((_id, attrs) => {
      const t = attrs.nodeType ?? 'node';
      nodesByType[t as keyof typeof nodesByType]++;
    });
    console.log('Nodes by type:', nodesByType);
    console.log('Total graph nodes:', graph.order);
    console.log('Total graph edges:', graph.size);

    // 5 input + 35 vgae (7 graphs × 5 nodes) + 15 gat (3 graphs × 5 nodes) = 55 graph nodes
    // + boxes: 3 latent(mu,sigma,z) + 2 gat(jk,fc) + dqn + output + vgae_s + gat_s + canid + nbr = 11
    expect(nodesByType.node).toBeGreaterThan(40);
    expect(nodesByType.box).toBeGreaterThan(5);
  });

  it('has positioned all nodes', () => {
    const unpositioned: string[] = [];
    graph.forEachNode((id, attrs) => {
      if (attrs.nodeType === 'container' || attrs.nodeType === 'anchor') return;
      if (attrs.x == null || attrs.y == null) unpositioned.push(id);
    });
    if (unpositioned.length > 0) {
      console.log('Unpositioned nodes:', unpositioned);
    }
    expect(unpositioned).toEqual([]);
  });

  it('sub-spec nodes have scaled radius', () => {
    const vgaeNodes: Array<{ id: string; r: number }> = [];
    const gatNodes: Array<{ id: string; r: number }> = [];
    const inputNodes: Array<{ id: string; r: number | undefined }> = [];

    graph.forEachNode((id, attrs) => {
      if (attrs.nodeType !== 'node') return;
      if (id.startsWith('vgae_t.')) vgaeNodes.push({ id, r: attrs.r });
      else if (id.startsWith('gat_t.')) gatNodes.push({ id, r: attrs.r });
      else if (id.startsWith('input_')) inputNodes.push({ id, r: attrs.r });
    });

    console.log('Input nodes r:', inputNodes.map(n => n.r));
    console.log('VGAE sub-spec nodes r (sample):', vgaeNodes.slice(0, 3).map(n => `${n.id}=${n.r?.toFixed(1)}`));
    console.log('GAT sub-spec nodes r (sample):', gatNodes.slice(0, 3).map(n => `${n.id}=${n.r?.toFixed(1)}`));

    // VGAE at scale 0.4: r should be ~5.6
    for (const n of vgaeNodes) {
      expect(n.r).toBeDefined();
      expect(n.r).toBeLessThan(10);
    }
    // GAT at scale 0.35: r should be ~4.9
    for (const n of gatNodes) {
      expect(n.r).toBeDefined();
      expect(n.r).toBeLessThan(10);
    }
    // Input nodes: no scaling, r should be undefined (default 14 at render)
    for (const n of inputNodes) {
      expect(n.r).toBeUndefined();
    }
  });

  it('has no node-node overlaps', () => {
    const positioned: Array<{ id: string; x: number; y: number; r: number }> = [];
    graph.forEachNode((id, attrs) => {
      if (attrs.nodeType === 'container') return;
      if (attrs.x == null || attrs.y == null) return;
      const r = attrs.nodeType === 'box'
        ? Math.max((attrs.width ?? 90) / 2, (attrs.height ?? 32) / 2)
        : (attrs.r ?? 14);
      positioned.push({ id, x: attrs.x, y: attrs.y, r });
    });

    let overlaps = 0;
    const overlapList: string[] = [];
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i], b = positioned[j];
        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist < a.r + b.r) {
          overlaps++;
          if (overlaps <= 15) {
            overlapList.push(`${a.id} <-> ${b.id} dist=${dist.toFixed(1)} need=${(a.r + b.r).toFixed(1)}`);
          }
        }
      }
    }
    if (overlapList.length > 0) {
      console.log('Overlapping elements:');
      for (const o of overlapList) console.log(' ', o);
      if (overlaps > 15) console.log(`  ... and ${overlaps - 15} more`);
    }
    console.log('Total overlaps:', overlaps, '/', positioned.length, 'elements');
    expect(overlaps).toBe(0);
  });

  it('domain is reasonable for 1100x550 plot', () => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    graph.forEachNode((_id, attrs) => {
      if (attrs.nodeType === 'container') return;
      if (attrs.x == null) return;
      minX = Math.min(minX, attrs.x); maxX = Math.max(maxX, attrs.x);
      minY = Math.min(minY, attrs.y); maxY = Math.max(maxY, attrs.y);
    });
    const spanX = maxX - minX;
    const spanY = maxY - minY;
    console.log(`Spatial extent: x=[${minX.toFixed(0)},${maxX.toFixed(0)}] span=${spanX.toFixed(0)}`);
    console.log(`                y=[${minY.toFixed(0)},${maxY.toFixed(0)}] span=${spanY.toFixed(0)}`);
    console.log(`Aspect ratio: ${(spanX / spanY).toFixed(2)}`);

    expect(spanX).toBeGreaterThan(0);
    expect(spanY).toBeGreaterThan(0);
  });
});
