import type { DiagramNode, DiagramEdge, DiagramBox, DiagramContainer, ModelOutput, Position } from './types.ts';
import { createGraph, FULL_5, TRI_3, PAIR_2 } from './graph.ts';

const SUB = ['₁', '₂', '₃', '₄', '₅'];

export interface VgaeConfig {
  encoderSizes?: [number, number];
  latentDim?: number;
  xOffset?: number;
  yOffset?: number;
  prefix?: string;
  label?: string | null;
  yGap?: number;
}

/** Generate a horizontal row of positions centered around midX. */
function horizontalRow(n: number, midX: number, y: number, spacing = 60): Position[] {
  const startX = midX - ((n - 1) * spacing) / 2;
  return Array.from({ length: n }, (_, i) => [startX + i * spacing, y] as Position);
}

/** Select position template for a fully-connected graph of size n. */
function fullPositions(n: number): Position[] {
  if (n >= 5) return FULL_5;
  if (n >= 3) return TRI_3;
  return PAIR_2;
}

/**
 * Create a VGAE autoencoder diagram.
 * Pipeline: encoder graphs → mu/sigma rows → z row → decoder box → reconstruction graph.
 *
 * Wiring (from vgae.yaml / kd-vgae.yaml):
 *   - enc0 → enc1 (dashed, vgae)
 *   - enc1 → mu first + sigma first (dashed, vgae)
 *   - mu mid → z mid, sigma mid → z mid (solid, purple)
 *   - z last → decoder box (solid, dqn)
 *   - decoder → recon first (dashed, grey)
 */
export function createVgae(config: VgaeConfig = {}): ModelOutput {
  const {
    encoderSizes = [5, 3] as [number, number],
    latentDim = 3,
    xOffset = 0,
    yOffset = 0,
    prefix = '',
    label = 'VGAE Model',
    yGap = 300,
  } = config;

  const p = prefix ? `${prefix}_` : '';
  const allNodes: DiagramNode[] = [];
  const allEdges: DiagramEdge[] = [];

  // Approximate horizontal center of the encoder area
  const midX = 95;

  // --- Encoder layers ---
  const encPrefixes: string[] = [];
  for (let i = 0; i < encoderSizes.length; i++) {
    const encPrefix = `${p}enc${i}`;
    encPrefixes.push(encPrefix);
    const { nodes, edges } = createGraph({
      n: encoderSizes[i],
      topology: 'full',
      color: 'vgae',
      labels: 'none',
      positions: fullPositions(encoderSizes[i]),
      xOffset,
      yOffset: yOffset + i * yGap,
      prefix: encPrefix,
      group: `${p}vgae`,
    });
    allNodes.push(...nodes);
    allEdges.push(...edges);
  }

  // enc0 → enc1 flow edge (representative nodes)
  // Use output-like node (highest x) of enc0 → input-like node (lowest x) of enc1
  const enc0OutIdx = encoderSizes[0] >= 5 ? 1 : (encoderSizes[0] >= 3 ? 1 : 1); // rightmost
  const enc1InIdx = 0; // leftmost in TRI_3/PAIR_2
  allEdges.push({
    source: `${encPrefixes[0]}_${enc0OutIdx}`,
    target: `${encPrefixes[1]}_${enc1InIdx}`,
    type: 'flow',
    color: 'vgae',
  });

  // --- Mu/Sigma/Z latent rows ---
  const latentY = yOffset + encoderSizes.length * yGap;

  // Mu row (left side)
  const muPositions = horizontalRow(latentDim, xOffset + midX - 55, latentY);
  const muPrefix = `${p}mu`;
  const { nodes: muNodes } = createGraph({
    n: latentDim,
    topology: 'none',
    color: 'purple',
    labels: Array.from({ length: latentDim }, (_, i) => `μ${SUB[i]}`),
    positions: muPositions,
    xOffset: 0, yOffset: 0, // positions are absolute
    prefix: muPrefix,
    group: `${p}vgae`,
  });
  allNodes.push(...muNodes);

  // Sigma row (right side)
  const sigmaPositions = horizontalRow(latentDim, xOffset + midX + 115, latentY);
  const sigmaPrefix = `${p}sigma`;
  const { nodes: sigmaNodes } = createGraph({
    n: latentDim,
    topology: 'none',
    color: 'purple',
    labels: Array.from({ length: latentDim }, (_, i) => `σ${SUB[i]}`),
    positions: sigmaPositions,
    xOffset: 0, yOffset: 0,
    prefix: sigmaPrefix,
    group: `${p}vgae`,
  });
  allNodes.push(...sigmaNodes);

  // Z row (centered)
  const zY = latentY + yGap * 0.67;
  const zPositions = horizontalRow(latentDim, xOffset + midX, zY);
  const zPrefix = `${p}z`;
  const { nodes: zNodes } = createGraph({
    n: latentDim,
    topology: 'none',
    color: 'dqn',
    labels: Array.from({ length: latentDim }, (_, i) => `z${SUB[i]}`),
    positions: zPositions,
    xOffset: 0, yOffset: 0,
    prefix: zPrefix,
    group: `${p}vgae`,
  });
  allNodes.push(...zNodes);

  // enc1 → mu/sigma (dashed flow from enc1's output node)
  const enc1OutIdx = encoderSizes[1] >= 3 ? 1 : 1; // rightmost
  allEdges.push(
    { source: `${encPrefixes[1]}_${enc1OutIdx}`, target: `${muPrefix}_0`, type: 'flow', color: 'vgae' },
    { source: `${encPrefixes[1]}_${enc1OutIdx}`, target: `${sigmaPrefix}_0`, type: 'flow', color: 'vgae' },
  );

  // mu mid → z mid, sigma mid → z mid
  const midLatent = latentDim >= 3 ? 1 : 0;
  allEdges.push(
    { source: `${muPrefix}_${midLatent}`, target: `${zPrefix}_${midLatent}`, type: 'flow', color: 'purple' },
    { source: `${sigmaPrefix}_${midLatent}`, target: `${zPrefix}_${midLatent}`, type: 'flow', color: 'purple' },
  );

  // --- Decoder box ---
  const decY = zY + yGap * 0.55;
  const boxes: DiagramBox[] = [{
    id: `${p}dec`,
    label: 'z\u1d40z',
    x: xOffset + midX,
    y: decY,
    color: 'grey',
  }];

  // z last → decoder
  allEdges.push({
    source: `${zPrefix}_${latentDim - 1}`,
    target: `${p}dec`,
    type: 'flow',
    color: 'dqn',
  });

  // --- Reconstruction graph ---
  const reconY = decY + yGap * 0.7;
  const reconN = encoderSizes[0]; // same size as enc0
  const reconPrefix = `${p}recon`;
  const { nodes: reconNodes, edges: reconEdges } = createGraph({
    n: reconN,
    topology: 'full',
    color: 'vgae',
    labels: 'none',
    positions: fullPositions(reconN),
    xOffset,
    yOffset: reconY,
    prefix: reconPrefix,
    group: `${p}vgae`,
  });
  allNodes.push(...reconNodes);
  allEdges.push(...reconEdges);

  // decoder → recon (dashed flow)
  allEdges.push({
    source: `${p}dec`,
    target: `${reconPrefix}_0`,
    type: 'flow',
    color: 'grey',
  });

  // --- Container ---
  const containers: DiagramContainer[] = label
    ? [{ group: `${p}vgae`, label, color: 'vgae' }]
    : [];

  // KD wiring point: reconstruction output node (rightmost)
  const reconOutIdx = reconN >= 5 ? 1 : (reconN >= 3 ? 1 : 1);

  return {
    nodes: allNodes,
    edges: allEdges,
    boxes,
    containers,
    kdId: `${reconPrefix}_${reconOutIdx}`,
  };
}
