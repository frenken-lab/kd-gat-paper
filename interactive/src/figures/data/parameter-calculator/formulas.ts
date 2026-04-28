// Parameter / FLOP estimator for the three-model student-teacher ensemble.
// See ./spec.md for the design. Constants are first-cut approximations;
// calibrate against a real graphids run before relying on the numbers.

// ─── Type spine ──────────────────────────────────────────────────────────────

export type GatKnobs = {
  model: "gat";
  layers: number;
  heads: number;
  hidden: number;
  embed_dim: number;
  proj_dim: number;
  fc_layers: number;
};

export type VgaeKnobs = {
  model: "vgae";
  schedule: number[];
  heads: number;
  embed_dim: number;
  proj_dim: number;
};

export type FusionKnobs = {
  model: "fusion";
  layers: number;
  hidden: number;
  action_dim: number;
};

export type EnsembleKnobs = {
  model: "ensemble";
  gat: GatKnobs;
  vgae: VgaeKnobs;
  fusion: FusionKnobs;
};

export type Knobs = GatKnobs | VgaeKnobs | FusionKnobs | EnsembleKnobs;

export type Result = {
  total: number;
  flops: number;
  latency_ms: number;
  uncertainty: number; // fractional — applied to total / flops / latency_ms
  breakdown: { name: string; params: number }[];
};

export type Preset = { name: string; knobs: Knobs };

// ─── Knob metadata (drives the slider UI) ────────────────────────────────────

type RangeSpec = { min: number; max: number; step: number; label: string };

// Extract keys of K whose values are `number` (not number[], not nested objects).
type NumericFields<K> = {
  [P in keyof K]: K[P] extends number ? P : never;
}[keyof K] &
  string;

// Per-leaf-model metadata. Ensemble has no per-knob metadata (it composes leaves).
type LeafModel = Exclude<Knobs["model"], "ensemble">;
type KnobMetaShape = {
  [M in LeafModel]: Record<NumericFields<Extract<Knobs, { model: M }>>, RangeSpec>;
};

// Adding a numeric field to a Knobs variant without a matching KNOB_META row
// is a TypeScript error (the `satisfies KnobMetaShape` clause enforces it).
// VGAE.schedule is intentionally absent — preset-only in the lighter version,
// see spec.md §"What's not sliderable".
export const KNOB_META = {
  gat: {
    layers:    { min: 1, max: 6,   step: 1, label: "GATv2Conv layers" },
    heads:     { min: 1, max: 8,   step: 1, label: "Attention heads" },
    hidden:    { min: 8, max: 128, step: 8, label: "Hidden channels / head" },
    embed_dim: { min: 4, max: 32,  step: 4, label: "CAN ID embed dim" },
    proj_dim:  { min: 8, max: 128, step: 8, label: "Feature projection" },
    fc_layers: { min: 1, max: 6,   step: 1, label: "FC head layers" },
  },
  vgae: {
    heads:     { min: 1, max: 8,   step: 1, label: "Attention heads" },
    embed_dim: { min: 4, max: 32,  step: 4, label: "CAN ID embed dim" },
    proj_dim:  { min: 8, max: 128, step: 8, label: "Feature projection" },
  },
  fusion: {
    layers:     { min: 1,  max: 6,   step: 1,  label: "MLP layers" },
    hidden:     { min: 32, max: 512, step: 32, label: "MLP width" },
    action_dim: { min: 5,  max: 41,  step: 2,  label: "Actions |A|" },
  },
} as const satisfies KnobMetaShape;

// ─── Tolerance (drives test bands and the result-panel uncertainty render) ──

// Calibrated per-family fractional tolerance — max|formula − PyG| / PyG measured
// across deployed presets, rounded up to the next 5 % step. Update in the same
// PR that retunes any load-bearing formula term. Calibration record lives in
// spec.md §Status.
export const TOLERANCE: Record<Knobs["model"], number> = {
  gat: 0.2,
  vgae: 0.2,
  fusion: 0.1,
  ensemble: 0.2, // worst-case sum-correlated propagation; see spec.md
};

// ─── Hardware constants ──────────────────────────────────────────────────────

export const VOCAB_SIZE = 100;
export const N_NODE_FEATS = 35;
export const EDGE_DIM = 11;
export const HARDWARE_FLOPS_PER_S = 50e6;
export const SPARSITY = 0.7;
export const FLOPS_PER_PARAM = 2;

// ─── Math layer ──────────────────────────────────────────────────────────────

export function compute(knobs: Knobs): Result {
  switch (knobs.model) {
    case "gat":
      return computeGat(knobs);
    case "vgae":
      return computeVgae(knobs);
    case "fusion":
      return computeFusion(knobs);
    case "ensemble":
      return computeEnsemble(knobs);
  }
}

export function computeGat(_k: GatKnobs): Result {
  // TODO(calibration): heads × hidden × (2·in + edge_dim + 2) per GATv2Conv layer
  // + LSTM JK + FC head + embeds. See spec.md §"Logic and knob metadata".
  return stubLeafResult("gat");
}

export function computeVgae(_k: VgaeKnobs): Result {
  // TODO(calibration): encoder over schedule + variational reparam + symmetric
  // decoder + neighborhood MLP.
  return stubLeafResult("vgae");
}

export function computeFusion(_k: FusionKnobs): Result {
  // TODO(calibration): MLP body × layers + per-arm head sized by action_dim.
  return stubLeafResult("fusion");
}

export function computeEnsemble(k: EnsembleKnobs): Result {
  const g = computeGat(k.gat);
  const v = computeVgae(k.vgae);
  const f = computeFusion(k.fusion);
  const total = g.total + v.total + f.total;
  const flops = g.flops + v.flops + f.flops;
  const latency_ms = (flops / HARDWARE_FLOPS_PER_S) * SPARSITY * 1000;
  return {
    total,
    flops,
    latency_ms,
    uncertainty: TOLERANCE.ensemble,
    breakdown: [
      { name: "GAT classifier", params: g.total },
      { name: "VGAE autoencoder", params: v.total },
      { name: "Fusion agent", params: f.total },
    ],
  };
}

function stubLeafResult(model: LeafModel): Result {
  return {
    total: 0,
    flops: 0,
    latency_ms: 0,
    uncertainty: TOLERANCE[model],
    breakdown: [{ name: "(awaiting calibration)", params: 0 }],
  };
}
