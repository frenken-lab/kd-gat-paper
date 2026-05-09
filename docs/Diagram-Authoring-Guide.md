# Diagram Authoring Guide

All architecture diagrams are **spec-driven**: declare components, layout, and edges in YAML, then `specToFlow` converts the spec to SvelteFlow nodes/edges and runs ELK for placement and orthogonal routing. No hardcoded coordinates.

## Quick Start

### 1. Write a spec

Create `interactive/src/figures/diagrams/<name>/spec.yaml`:

```yaml
figure: my-figure

components:
  input: { type: graph, n: 5, topology: sparse, color: data, labels: auto, scale: 50 }
  enc:   { type: box,   label: "Encoder", color: vgae, width: 120, height: 40 }
  dec:   { type: box,   label: "Decoder", color: vgae, width: 120, height: 40 }

layout:
  type: pipeline
  gap: 60
  elements: [input, enc, dec]
  flowColor: vgae

bridges:
  - { from: dec, to: input_0, type: flow, color: grey, style: dashed, label: "reconstruct" }
```

### 2. Wire the Svelte component

`App.svelte`:

```svelte
<script>
  import spec from './spec.yaml';
  import { specToFlow, DiagramCanvas } from '../../../lib/flow';

  let nodes = $state.raw([]);
  let edges = $state.raw([]);
  specToFlow(spec).then((r) => { nodes = r.nodes; edges = r.edges; });
</script>

<div class="figure">
  <DiagramCanvas bind:nodes bind:edges width="100%" height="350px" />
</div>
```

For sub-spec composition pass a `specs` map: `specToFlow(mainSpec, { specs: { vgae: vgaeSpec, gat: gatSpec } })`.

### 3. Build

```bash
FIGURE=my-figure bun run build    # or: make build
```

Output: `_build/figures/my-figure.html` (self-contained, JS + CSS inlined).

## Library Layout

`interactive/src/lib/flow/`: `convert.ts` (specToFlow + ELK orchestration), `elk.ts` (ELK wrapper), `floating.ts` (edge geometry + bend-point paths), `palette.ts` (role → color), `types.ts`, `DiagramCanvas.svelte`, `nodes/` (CircleNode, BoxNode, ContainerNode), `edges/` (StructuralEdge, FlowEdge, EncodedEdge).

## Spec Reference

### Components

#### `type: graph` — node cluster on a ring

```yaml
input:
  type: graph
  n: 5                  # number of nodes
  topology: sparse      # sparse | full | none
  color: data
  labels: auto          # auto (v₁..vₙ) | none | ["c1", "c2", ...]
  scale: 80             # ring diameter in px (default: 80)
  r: 14                 # circle radius override
  container: { label: "Layer 0", color: gat }
```

`topology`: `sparse` = cycle + one chord; `full` = clique; `none` = no edges.

#### `type: box` — labeled rectangle

```yaml
encoder: { type: box, label: "GCN Encoder", color: vgae, width: 120, height: 40 }
```

#### `type: spec` — embed another spec scaled down

```yaml
vgae_t: { type: spec, ref: vgae, scale: 0.5 }
```

Sub-spec node IDs are prefixed with the embedding component's ID, enabling dotted bridge refs (`vgae_t.input_0`).

### Layout Tree

| Type | What it does | Key fields |
|------|--------------|------------|
| `hstack` | Left-to-right, no auto edges | `children`, `gap` |
| `vstack` | Top-to-bottom, no auto edges | `children`, `gap`, `align` |
| `pipeline` | Sequential + auto flow edges | `elements`, `gap`, `flowColor`, `direction` |

Children can be component IDs or nested layout nodes. `pipeline` feeds ELK super-edges for proper orthogonal routing. Any layout node can carry `container: { label, color }` to wrap children in a dashed group.

### Bridges

```yaml
bridges:
  - { from: vgae_t, to: vgae_s, type: kd, color: kd, label: KD }
  - { from: gat_s, to: dqn,    type: flow, color: grey, style: dashed }
```

| Field | Notes |
|-------|-------|
| `from` / `to` | Anchor — see below |
| `type` | `flow` (default) or `kd` (thick dashed + bold label preset) |
| `color` | Role name. Defaults: `grey` for flow, `kd` for KD preset. |
| `style` | `dashed`. KD preset is always dashed. |

### Anchor Resolution

| Form | Example | Resolves to |
|------|---------|-------------|
| Direct node ID | `input_0` | That node |
| Component ID | `dqn` | First non-container node of the component |
| Cardinal anchor | `enc1__top` | First leaf of `enc1` (routing hint, not a pinned handle) |
| Sub-spec dotted ref | `vgae_t.input_0` | Inner node `input_0` inside embedded `vgae_t` |

### Edge Types

| Type | How generated | Visual |
|------|---------------|--------|
| `structural` | Auto from `topology` | Straight faded line |
| `flow` | `pipeline` + bridges | Orthogonal smoothstep + arrow + optional label |
| `flow` (KD preset) | `type: kd` bridge | Thicker dashed + bold colored label |
| `encoded` | Post-`specToFlow` injection (see `gat-layer/App.svelte`) | Weight-modulated straight line |

### Colors

Use role names (`data`, `gat`, `vgae`, `dqn`, `kd`, `attention`, `grey`) — never hex. Defined in `styles.yml` under `roles:`, resolved by `palette.ts`. Add a role by editing `styles.yml` then referencing it in the spec.

## Data Flow

```
spec.yaml → specToFlow(spec, { specs? })
  → build nodes + structural edges from components
  → walk layout tree → pipeline flow edges + container parenting
  → resolve bridge anchors → flow/kd edges
  → ELK layout → orthogonal placement + bend points
  → { nodes, edges } → bind to <DiagramCanvas>
```

## Tuning Tips

- **Tight/sparse cluster?** Adjust `scale`; for small rings also bump `r`.
- **Container padding?** Edit `CONTAINER_PAD` / `CONTAINER_LABEL_PAD` constants in `convert.ts`.
- **Spaghetti edges?** Use `pipeline` (feeds ELK) rather than `hstack`/`vstack` + manual bridges.
- **Wrong anchor side?** Floating-edge geometry auto-picks the nearest cardinal side. If off, reorder layout children or use a different anchor hint.
- **Test geometry** — `__tests__/geometry.test.ts`; run with `bun run test` from `interactive/`.
- **Visual check required** — build validates structure, not aesthetics. Open the HTML or use `bun run dev` for HMR.
