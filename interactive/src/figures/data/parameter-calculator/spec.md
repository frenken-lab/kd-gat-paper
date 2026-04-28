# `parameter-calculator` — Interactive Param / FLOP Estimator

> **Status: design spec, not yet implemented.** Files in this directory are stubs. Calibrate `formulas.ts` against one real graphids run per architecture family before the figure ships, and record the calibration in §"Status" below.

## Goal

Replace the static `tbl-model-allocation` table in the appendix with an interactive widget that lets the reader plug in their own architectural knobs (layers, heads, hidden dim, encoder schedule, MLP width, action space) and see an estimate of the resulting parameter count, FLOPs per inference, and latency margin against the 7 ms CAN message cycle.

The figure has two-tier framing:

- **Default view: ensemble.** The reader sees the *combined* GAT + VGAE + Fusion budget — matching what the deleted `tbl-model-allocation` table showed in its **Total (Onboard)** row. This is the load-bearing view for the appendix's "fits in 7 ms" argument.
- **Drill-in: per-model.** The reader can pivot into any single model (GAT / VGAE / Fusion) to tweak its architectural knobs. The deployed student and teacher are anchored presets per family.

Numbers are explicitly **estimates with quantified uncertainty**, not specifications. Each model family carries a tolerance band measured during calibration; `ResultPanel` renders that band so the reader can reason about whether the latency margin survives the worst case.

## Non-goals

- Pinning the paper to exact parameter counts. The static table did that; we just deleted it for that reason.
- Reproducing PyTorch's parameter accounting bit-for-bit. PyG's internal fusions, biases, and scale parameters are out of scope. The calibrated tolerance encodes how much we're willing to be off.
- Tracking ablation-time hyperparameters that don't affect param/FLOP count (dropout rates, optimizer betas, exploration epsilon). These belong in graphids configs.
- Letting the reader edit the VGAE encoder *schedule* (depth + taper) interactively. See §"What's not sliderable".

## Logic and knob metadata

Three things live in `formulas.ts`: the type spine, the per-knob metadata that the UI reads, and the per-family tolerance that the tests and the UI both read. The math is one consumer of the metadata; the UI is another. Keeping them in one file means a new knob is impossible to add without touching every consumer it needs to touch — TypeScript will not compile until they all agree.

### Type spine

```ts
// formulas.ts

export type GatKnobs = {
  model: "gat";
  layers: number;       // GATv2Conv depth
  heads: number;
  hidden: number;       // per-head channel width
  embed_dim: number;    // CAN ID embedding
  proj_dim: number;     // input feature projection
  fc_layers: number;    // classification head depth
};

export type VgaeKnobs = {
  model: "vgae";
  schedule: number[];   // encoder hidden dims, e.g. [80, 40, 16]
  heads: number;
  embed_dim: number;
  proj_dim: number;
};

export type FusionKnobs = {
  model: "fusion";
  layers: number;
  hidden: number;       // MLP body width
  action_dim: number;   // |A| — usually 21
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
  uncertainty: number;          // fractional, applied to all three numbers above
  breakdown: { name: string; params: number }[];
};

export type Preset = { name: string; knobs: Knobs };

export function compute(knobs: Knobs): Result {
  switch (knobs.model) {
    case "gat":      return computeGat(knobs);
    case "vgae":     return computeVgae(knobs);
    case "fusion":   return computeFusion(knobs);
    case "ensemble": return computeEnsemble(knobs);
  }
}

function computeEnsemble(k: EnsembleKnobs): Result {
  const g = computeGat(k.gat);
  const v = computeVgae(k.vgae);
  const f = computeFusion(k.fusion);
  const total       = g.total + v.total + f.total;
  const flops       = g.flops + v.flops + f.flops;
  const latency_ms  = (flops / HARDWARE_FLOPS_PER_S) * SPARSITY * 1000;
  const uncertainty = TOLERANCE.ensemble;   // see §"Tolerance and uncertainty"
  return {
    total, flops, latency_ms, uncertainty,
    breakdown: [
      { name: "GAT classifier",   params: g.total },
      { name: "VGAE autoencoder", params: v.total },
      { name: "Fusion agent",     params: f.total },
    ],
  };
}
```

The `switch` in `compute` is the *only* place model dispatch happens in the math layer. TypeScript's exhaustiveness check turns "I forgot to update one site after adding a fifth model" into a compile error.

### Knob metadata

Every numeric knob has a range, a step, and a display label. The metadata table is parallel to the type union and TypeScript-checked against it:

```ts
// formulas.ts (continued)

type RangeSpec = { min: number; max: number; step: number; label: string };

// Helper: extract the keys of K whose values are `number` (not number[]).
type NumericFields<K> =
  { [P in keyof K]: K[P] extends number ? P : never }[keyof K] & string;

// Per-leaf-model metadata. Ensemble is composite; it has no per-knob metadata.
type LeafModel = Exclude<Knobs["model"], "ensemble">;
type KnobMetaShape = {
  [M in LeafModel]: Record<NumericFields<Extract<Knobs, { model: M }>>, RangeSpec>;
};

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
```

`KnobsPanel.svelte` consumes this directly: `{#each Object.entries(KNOB_META[knobs.model]) as [field, spec]}` renders one labeled slider per entry, with `bind:value={knobs[field]}`. No hand-written slider blocks per model.

### What's not sliderable in the lighter version

A few knobs don't fit cleanly under the per-field `RangeSpec` shape, and exposing them would mean adding bespoke UI per knob. The lighter version accepts the limitation:

- **VGAE encoder schedule** (`schedule: number[]`). Not a single number; depth and taper need their own controls. Exposed as **preset-only** — the reader picks "Deployed VGAE student" or "Deployed VGAE teacher" and gets that schedule. Sliders adjust `heads`, `embed_dim`, and `proj_dim` only; depth and latent dim come from whichever preset was last loaded.
- **Ensemble composition.** The ensemble view does not expose per-knob sliders. It exposes three sub-`PresetPicker`s (one per model) and a "drill into this model" button. To tweak GAT internals, the reader drills in.

If the calculator gets used heavily and the encoder-depth restriction becomes the friction point, a follow-up adds two derived knobs (`schedule_depth`, `schedule_taper`) and a small generator function — out of scope for the lighter version.

## Components (interactivity surface)

Four components, each with a single responsibility. They communicate only through `Knobs` and `Result` — no shared store, no event bus.

| Component             | Owns          | Prop in              | Prop out (`bind:`)   | How it dispatches on `.model`            |
|-----------------------|---------------|----------------------|----------------------|------------------------------------------|
| `App.svelte`          | `knobs` state | —                    | —                    | No dispatch                              |
| `KnobsPanel.svelte`   | nothing       | —                    | `knobs: Knobs`       | Lookup `KNOB_META[knobs.model]`; ensemble case renders three sub-`PresetPicker`s + drill-in |
| `ResultPanel.svelte`  | nothing       | `result: Result`     | —                    | No dispatch — uniform render             |
| `PresetPicker.svelte` | nothing       | `presets: Preset[]`  | `knobs: Knobs`       | Filters by current `knobs.model`         |

`KnobsPanel` has two modes selected by the discriminated tag. **Leaf mode** (`knobs.model in {"gat", "vgae", "fusion"}`) iterates `KNOB_META[knobs.model]` and renders one slider per entry. **Ensemble mode** (`knobs.model === "ensemble"`) renders three sub-`PresetPicker`s — one per component model — plus a "drill into this model" button that swaps `knobs` to the corresponding sub-Knobs. Drill-out (returning to ensemble view) is a separate button on the leaf-mode panel.

`ResultPanel` takes a `Result` and renders the same layout regardless of which model produced it: a total-params readout shown as `≈ N (± uncertainty·N)`, a FLOPs readout, and a latency bar. **In ensemble mode only**, the latency bar shows the 7 ms hard limit as a wall and renders the latency value as a *band* of width `latency_ms × uncertainty` rather than a single line. If the upper edge of the band crosses the wall, the band turns red; if only the center crosses, amber. In per-model mode, the bar shows that model's contribution to the total without a margin claim — the margin is an ensemble-level statement.

The breakdown is a horizontal stacked bar (SveltePlot `<Cell>` over `result.breakdown`). In ensemble mode it shows three segments (one per sub-model); in leaf mode it shows the per-component breakdown specific to that family.

`PresetPicker` lists presets matching the current `knobs.model` and replaces `knobs` wholesale on click (`knobs = { ...p.knobs }`). It's the same component instance whether used at the App level (ensemble preset) or as a sub-component inside ensemble-mode `KnobsPanel` (per-model preset).

## Ensemble view as the headline

The calculator's primary job is to support the appendix's "fits in 7 ms" argument. That argument is about the *combined* student ensemble (173 K params, 4.8 ms latency, 2.2 ms margin), not about any one model. So the ensemble view is the default the reader lands on, and the latency-margin claim renders only there.

`data.json` has two top-level lists: component presets (one row per deployed student/teacher per family) and ensemble presets (a small list that joins component-preset names into ensembles). App.svelte resolves an ensemble preset at init by looking up its component refs:

```json
{
  "presets": [
    { "name": "Deployed GAT student", "knobs": { "model": "gat", ... } },
    { "name": "Deployed GAT teacher", "knobs": { "model": "gat", ... } },
    "...",
  ],
  "ensemble_presets": [
    {
      "name": "Deployed Ensemble (student)",
      "components": ["Deployed GAT student", "Deployed VGAE student", "Deployed Fusion student"]
    },
    {
      "name": "Deployed Ensemble (teacher)",
      "components": ["Deployed GAT teacher", "Deployed VGAE teacher", "Deployed Fusion teacher"]
    }
  ]
}
```

This keeps the component presets as the single source of truth — an ensemble is a composition pointer, not a duplicated config. Maintenance: retuning the GAT student is one JSON row; the ensemble view automatically reflects it because it composes by reference.

State transitions between views (ensemble ↔ per-model) are wholesale `knobs` replacements — no new mechanism beyond what preset selection already does. The Svelte reactivity contract (one `$state`, one `$derived`) is unchanged.

## Reactivity flow

```
data.json ──► component presets + ensemble preset list (frozen at init)
                                    │
                                    ▼
              ┌─────────────────────────────────────────────────┐
              │  App.svelte                                     │
              │   let knobs: Knobs = $state(<ensemble preset>); │
              │   let result      = $derived(compute(knobs));   │
              └────┬────────────────┬──────────────┬────────────┘
                   │ bind:knobs     │ {result}     │ presets, bind:knobs
                   ▼                ▼              ▼
            ┌────────────┐   ┌──────────────┐   ┌────────────────┐
            │KnobsPanel  │   │ ResultPanel  │   │ PresetPicker   │
            │            │   │              │   │ (top-level:    │
            │ ensemble:  │   │ total±unc.   │   │  ensemble      │
            │  3 sub-    │   │ flops        │   │  presets)      │
            │  pickers   │   │ latency band │   │                │
            │  + drill-in│   │ + 7 ms wall  │   │                │
            │            │   │ (ensemble)   │   │                │
            │ leaf:      │   │              │   │                │
            │  KNOB_META │   │ breakdown[]  │   │                │
            │  slider    │   │              │   │                │
            │  loop +    │   │              │   │                │
            │  drill-out │   │              │   │                │
            └────────────┘   └──────────────┘   └────────────────┘
```

Slider movement → `knobs.<field>` updates → Svelte invalidates `result` → `ResultPanel` re-renders. Preset click → entire `knobs` object replaced → same propagation. Drill in/out → entire `knobs` replaced (different variant of the union) → same propagation. No effects, no manual subscriptions, no stale-state windows.

## Test surface

`__tests__/formulas.test.ts` covers four independent failure modes. Discovery via vitest's default include pattern (`src/**/__tests__/*.test.ts`).

1. **Anchor tests.** Each preset's `compute(preset.knobs).total` lands within `TOLERANCE[knobs.model]` of a paper-claimed (or calibrated graphids-measured) total. Catches silent formula rot when graphids changes.
2. **Monotonicity tests.** Doubling a width knob increases `total`. Catches sign errors and missing terms.
3. **Internal consistency.** `result.breakdown.reduce((s, b) => s + b.params, 0) === result.total` for each variant. Catches breakdown bookkeeping bugs.
4. **Ensemble composition.** `computeEnsemble({gat, vgae, fusion}).total === computeGat(gat).total + computeVgae(vgae).total + computeFusion(fusion).total`. Catches ensemble-side accounting bugs that don't show up in the leaf-mode anchor tests.

The anchor tolerance is **per-family** and read from the `TOLERANCE` table, not hardcoded in the test. See §"Tolerance and uncertainty" for what the values mean and how they're set.

## Tolerance and uncertainty

The calculator quantifies its own error and surfaces it to the reader. Two concrete pieces:

```ts
// formulas.ts (continued)

// Calibrated per-family fractional tolerance: max|formula − PyG| / PyG measured
// across the deployed presets, rounded up to the next 5 % step.
//
// Updated in the same PR that retunes any of the formula's load-bearing terms.
// Calibration record (date, graphids commit, measured drift) lives in spec.md §Status.
export const TOLERANCE: Record<Knobs["model"], number> = {
  gat:      0.20,   // placeholder — replace at calibration
  vgae:     0.20,   // placeholder
  fusion:   0.10,   // plain MLP, expect tighter
  ensemble: 0.20,   // worst-case sum-correlated propagation; see below
};
```

**How `TOLERANCE.ensemble` is set.** Component errors may be correlated (a missing bias term in the GAT formula likely also misses one in VGAE if both use the same `Linear` pattern). For safety the spec uses the conservative bound:

```
ensemble_error ≈ max(gat_err, vgae_err, fusion_err)
```

Sum-of-absolute-errors weighted by param share is also defensible, but only if a calibration measurement supports it. Default to the max until calibration says otherwise.

**How `ResultPanel` renders the uncertainty.** The total-params and FLOPs readouts show `≈ N (± uncertainty·N)`. The latency bar renders a band of width `latency_ms × uncertainty` instead of a single line. In ensemble mode only, a 7 ms vertical wall is drawn; the band crossing it is the visual "is the margin safe?" answer:

- band entirely below 7 ms ⇒ green (safe under the worst-case estimate)
- band straddles 7 ms (center below) ⇒ amber (safe under nominal but at risk under the upper bound)
- band entirely above 7 ms ⇒ red (over budget even under nominal)

This is what makes the calculator honest about the tightness of the latency-margin claim. A reader who slides into a config that produces "5.8 ms ± 0.7 ms" against a 7 ms wall sees that the upper edge of the band touches the wall — and can decide for themselves whether 0.5 ms of worst-case headroom is enough.

**Downstream prose edit (out of spec scope, but flagged here).** The appendix's "≈ 2.2 ms safety margin" sentence should be reworded once calibration lands — something like "ensemble inference fits within the 7 ms cycle with ≈ 30 % nominal headroom; the figure below shows how the margin band changes under alternative configurations."

## File layout

```
interactive/src/figures/data/parameter-calculator/
  App.svelte               # composes the four sub-components, owns state
  KnobsPanel.svelte        # leaf mode iterates KNOB_META; ensemble mode composes
  ResultPanel.svelte       # uniform render; uncertainty band; 7 ms wall in ensemble mode
  PresetPicker.svelte      # filters presets by current model; replaces knobs on click
  formulas.ts              # types + KNOB_META + TOLERANCE + compute*
  data.json                # component presets + ensemble preset refs
  __tests__/
    formulas.test.ts       # anchor (per-family TOLERANCE) / monotonicity / consistency / ensemble
  spec.md                  # this file
```

`index.html` and `main.js` are auto-generated by `interactive/build.js` from templates when not present, so the figure builds with just `App.svelte` (other files added as the implementation lands).

## Maintenance contract

When graphids retunes a deployed configuration:

1. **One JSON row.** Edit the matching component preset in `data.json`. Ensemble presets reference component presets by name, so the ensemble view picks up the change automatically. Most knob retunes touch only this file.
2. **`npm test`** in `interactive/`. Anchor tests fail loudly if the new preset lands outside `TOLERANCE[model]`. The failure points at the formula or the tolerance, not at the JSON.
3. **Formula edit, only if the architectural family changed.** If graphids replaces `JK = LSTM` with a different aggregator, or the symmetric VGAE decoder becomes asymmetric, that's a `formulas.ts` edit, likely with a tolerance refresh, and an updated calibration record in §"Status".

Failure mode is loud (CI red), not silent. The maintenance surface is one file in the common case, three in the worst.

## Status

- Skeleton stubs in place: `App.svelte`, `formulas.ts`, `data.json`, `__tests__/formulas.test.ts`.
- Sub-components (`KnobsPanel.svelte`, `ResultPanel.svelte`, `PresetPicker.svelte`) — not yet created. Current `App.svelte` is a single-file placeholder that renders "Awaiting calibration."
- `KNOB_META` and `TOLERANCE` tables — types declared in spec; not yet populated in `formulas.ts`.
- Formula constants (`FLOPS_PER_PARAM`, sparsity factor, GATv2Conv per-layer expression) are first-cut approximations. **Calibration step required** before the figure ships.
- Anchor test totals in `__tests__/formulas.test.ts` are placeholders matching the paper's prose claims (55 K / 1.100 M / 86 K / 1.710 M / 32 K / 687 K). Replace with measured values during calibration if they differ.

### Calibration record

Populate this section once calibration runs. One row per measurement.

| Date | graphids commit | Family | Measured drift | TOLERANCE set to | Notes |
|------|-----------------|--------|----------------|------------------|-------|
| —    | —               | —      | —              | —                | pending |
