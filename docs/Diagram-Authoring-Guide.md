# Diagram Authoring Guide

All architecture diagrams in this repo are **spec-driven**: declare the components, layout, and edges in a YAML (or inline JS) spec, then a small Svelte script feeds the spec through `specToFlow` and binds the result to a `<DiagramCanvas>`. No hardcoded coordinates — ELK does layered placement and orthogonal edge routing at component granularity.

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

  specToFlow(spec).then((r) => {
    nodes = r.nodes;
    edges = r.edges;
  });
</script>

<div class="figure">
  <h3>My Figure</h3>
  <DiagramCanvas bind:nodes bind:edges width="100%" height="350px" />
</div>

<style>
  .figure { font-family: system-ui, -apple-system, sans-serif; }
  h3 { font-size: 14px; margin: 0 0 8px; color: #333; }
</style>
```

### 3. Build

```bash
cd interactive && npm run build
# or just one figure:
FIGURE=my-figure npm run build
```

Output lands in `_build/figures/my-figure.html` as a self-contained HTML file (JS + CSS + data inlined).

## Where Things Live

```
interactive/
├── src/
│   ├── figures/
│   │   └── diagrams/
│   │       ├── architecture/
│   │       │   ├── spec.yaml        # ← diagram spec (edit this)
│   │       │   ├── App.svelte       # ← rendering wrapper
│   │       │   ├── index.html       # ← build entry point (auto-generated)
│   │       │   └── main.js          # ← mount script (auto-generated)
│   │       ├── composition-pipeline/
│   │       ├── gat/
│   │       ├── gat-layer/
│   │       ├── graph-base/
│   │       ├── kd-gat/
│   │       ├── kd-vgae/
│   │       └── vgae/
│   └── lib/
│       └── flow/                     # ← shared diagram library
│           ├── convert.ts            # specToFlow: spec → nodes/edges + ELK layout
│           ├── elk.ts                # layoutWithELK wrapper
│           ├── floating.ts           # floating-edge geometry + bend-point path
│           ├── layout.ts             # circularPositions (used by graph clusters)
│           ├── palette.ts            # role names → stroke/fill colors
│           ├── types.ts              # FigureSpec, ComponentSpec, edge data types
│           ├── DiagramCanvas.svelte  # SvelteFlow canvas + node/edge type registry
│           ├── nodes/                # CircleNode, BoxNode, ContainerNode
│           ├── edges/                # StructuralEdge, FlowEdge, EncodedEdge
│           └── __tests__/            # geometry + cluster shape coverage
├── vite.config.js                    # YAML import + virtual:styles plugins
└── build.js                          # builds each figure in a separate Vite pass
```

## Spec Reference

### Components

Each key in `components:` is a graph element. The key is also the **node prefix** for graph types (e.g., `input` → nodes `input_0`, `input_1`, ...).

#### `type: graph` — node cluster on a ring

```yaml
input:
  type: graph
  n: 5                  # number of nodes
  topology: sparse      # sparse | full | none
  color: data           # role name (resolved via styles.yml)
  labels: auto          # auto (v₁..vₙ) | none | ["c1", "c2", ...]
  scale: 80             # ring diameter in px (default: 80)
  r: 14                 # circle radius override (default: heuristic on scale)
  container:            # optional dashed-bordered group around the cluster
    label: "Layer 0"
    color: gat
```

`topology` controls the structural edges drawn within the cluster:
- `sparse` — cycle + one chord (`v₀–v₂`) for `n > 3`
- `full` — clique (all pairs)
- `none` — no edges (you'll add custom edges via bridges or post-`specToFlow` injection)

`scale` is the diameter of the ring on which the nodes sit. The default `r` heuristic gives small circles (`r=10`) for tight rings and normal (`r=14`) for larger ones; override `r` when you need crowded clusters.

#### `type: box` — labeled rectangle

```yaml
encoder:
  type: box
  label: "GCN Encoder"
  color: vgae
  width: 120            # default: 90
  height: 40            # default: 32
```

#### `type: spec` — embed another spec as a component

```yaml
vgae_t: { type: spec, ref: vgae, scale: 0.5 }
```

Recursively builds the referenced spec and embeds its full graph as a single component. The `ref` key maps to the `specs` map passed via the second argument to `specToFlow`:

```svelte
<script>
  import mainSpec from './spec.yaml';
  import vgaeSpec from '../vgae/spec.yaml';
  import gatSpec from '../gat/spec.yaml';
  import { specToFlow, DiagramCanvas } from '../../../lib/flow';

  specToFlow(mainSpec, { specs: { vgae: vgaeSpec, gat: gatSpec } }).then(...);
</script>
```

| Field | Required | Description |
|-------|----------|-------------|
| `ref` | yes | Key into the `specs` map |
| `scale` | no | Shrink factor (e.g. `0.4` = 40% size). Scales circle radii and box dimensions. |

This is how `architecture` embeds the actual `vgae` and `gat` model diagrams instead of opaque labeled boxes. Sub-spec node IDs are prefixed with the embedding component's ID, so bridges from the parent can reach inner nodes (see [Anchor Resolution](#anchor-resolution)).

### Layout Tree

The `layout:` section is a recursive tree. Each node is one of:

| Type | What it does | Key fields |
|------|--------------|------------|
| `hstack` | Position children left-to-right (no auto edges) | `children`, `gap` |
| `vstack` | Position children top-to-bottom (no auto edges) | `children`, `gap`, `align` |
| `pipeline` | Position + auto-wire flow edges between sequential children | `elements`, `gap`, `flowColor`, `direction` |

Children can be **component IDs** (strings) or **nested layout nodes**:

```yaml
layout:
  type: hstack
  gap: 60
  children:
    - input
    - type: vstack
      gap: 100
      children:
        - type: pipeline
          elements: [vgae_t, gat_t, dqn]
          gap: 50
          flowColor: gat
        - type: hstack
          children: [vgae_s, gat_s]
          gap: 50
```

**Pipeline vs hstack/vstack** — `pipeline` adds visible flow-typed edges between consecutive children, anchored to the first leaf of each child. Use `hstack`/`vstack` when elements should be positioned but not connected.

**Layout containers** — any `hstack`/`vstack`/`pipeline` node can carry its own `container: { label, color }`, which wraps every direct child in a dashed group. Containers nest, so e.g. `Encoder` and `Decoder` groups can each sit inside an outer `VGAE Autoencoder` container (see `vgae/spec.yaml`).

### Bridges

Bridges add edges **after** layout — the right place for non-linear connections like KD edges, skip connections, and cross-row flows:

```yaml
bridges:
  - { from: vgae_t, to: vgae_s, type: kd, color: kd, label: KD }
  - { from: gat_t.jk, to: gat_s, type: kd, color: kd, label: KD }
  - { from: gat_s, to: dqn, type: flow, color: grey, style: dashed }
```

| Field | Required | Description |
|-------|----------|-------------|
| `from` / `to` | yes | Anchors — see [Anchor Resolution](#anchor-resolution) |
| `type` | no | `flow` (default) or `kd` (preset on flow). Other values pass through as edge types but you must register a custom edge component for them. |
| `color` | no | Role name. Defaults to `grey` for flow, `kd` for KD preset. |
| `label` | no | Edge label text. KD preset auto-labels `KD` if omitted. |
| `style` | no | `dashed` to dash the edge. KD preset is always dashed. |

**KD preset** — `type: kd` is shorthand for a thicker, dashed flow edge with a bold colored label offset to the right. There is no separate KD edge component; the preset is expanded inside `specToFlow` into flow-typed edge data with `strokeWidth: 2`, `dashArray: '6 4'`, `boldLabel: true`, `labelOnStroke: true`, `labelOffsetX: 10`, `labelLeftAlign: true`.

### <a id="anchor-resolution"></a>Anchor Resolution

Bridge `from`/`to` and other anchors accept several formats. `specToFlow` walks them in order:

| Form | Example | Resolves to |
|------|---------|-------------|
| Direct node ID | `input_0` | That node |
| Component ID | `dqn` | First non-container node in the component |
| Cardinal anchor | `enc1__top` | First non-container node of `enc1` (the cardinal hint helps ELK pick the side; the exact endpoint snap is handled by `getEdgeParams`) |
| Sub-spec dotted ref | `vgae_t.input_0` | Inner node `input_0` of the embedded `vgae_t` sub-spec |
| Sub-spec dotted anchor | `gat_t.L0__left` | First leaf of `L0` inside the embedded `gat_t` |

`__top|bottom|left|right` are **hints** — they don't pin to a specific handle; floating-edge geometry computes the exit/entry side based on the actual placed positions. Use them when the spec semantics call for a directional intent (e.g. `enc0__bottom → enc1__top` to read as "encoder layer 0 flows down into layer 1").

### Edge Types Cheat Sheet

| Type | Source | Renderer | Visual |
|------|--------|----------|--------|
| `structural` | Auto from `topology` | `StructuralEdge` | Straight line, faded |
| `flow` | `pipeline` layout + bridges with `type: flow` (or default) | `FlowEdge` | Orthogonal smoothstep with arrow + optional label, ELK bend points when routed around obstacles |
| `flow` (KD preset) | Bridges with `type: kd` | `FlowEdge` (with KD-preset data) | Thicker dashed + bold colored label |
| `encoded` | Post-`specToFlow` injection only | `EncodedEdge` | Straight line, weight-modulated stroke width + opacity |

`encoded` edges aren't producible from spec bridges today (bridges don't carry a `weight` field). Inject them manually after `specToFlow` returns — see `gat-layer/App.svelte` for the canonical example.

### Colors

Color values are **role names** resolved by `palette.ts` from `styles.yml`. Available roles include `data`, `gat`, `vgae`, `dqn`, `kd`, `attention`, `grey`. The palette uses the Observable 10 hex set. Don't write hex colors in specs — they pass through with a console warning.

To add a new role, edit `styles.yml` under `roles:`, then reference the name in your spec.

## Data Flow

```
spec.yaml (or inline spec object)
  → specToFlow(spec, { specs?, direction? })
       1. Build nodes from components (graph clusters → circles on a ring;
          boxes; sub-specs recursed and ID-prefixed)
       2. Add structural edges from each cluster's topology
       3. Walk layout tree → pipeline flow edges + layout-container parenting
       4. Resolve bridge anchors → flow / kd-preset / passthrough edges
       5. Run ELK at component granularity → orthogonal placement + bend points
       6. Finalize containers (deepest-first) → bbox fit + relative positions
       7. Topo-sort nodes so parents precede children (SvelteFlow requirement)
  → { nodes, edges }
  → bind to <DiagramCanvas>
  → SvelteFlow renders with the registered nodes/edges types
```

## Common Patterns

### Composing sub-specs (the `architecture` pattern)

```yaml
components:
  vgae_t: { type: spec, ref: vgae, scale: 0.4 }
  gat_t:  { type: spec, ref: gat,  scale: 0.35 }
  dqn:    { type: box,  label: "DQN Fusion", color: dqn }
layout:
  type: pipeline
  elements: [vgae_t, gat_t, dqn]
bridges:
  - { from: vgae_t.output_0, to: gat_t.L0__left, type: flow, color: grey, label: "hard samples" }
  - { from: vgae_t.enc1__bottom, to: vgae_s,     type: kd,   color: kd }
```

Each sub-spec is built once, embedded scaled, and you can reach inside it via dotted refs. Same source spec renders standalone (`vgae.html`) and as a component (inside `architecture.html`).

### Click-to-expand (the `gat-layer` pattern)

When you need an interaction that swaps between rendered diagrams (e.g. thumbnails → detail), build each as its own flow:

```svelte
<script>
  import { specToFlow, DiagramCanvas } from '../../../lib/flow';

  let detailFlows = $state.raw({});
  Promise.all(['h1', 'h2', 'h3'].map(() => specToFlow(detailSpec()))).then((flows) => {
    // ...inject custom encoded edges per head, then store keyed by head id
  });

  let selected = $state(null);
  let nodes = $state.raw([]);
  let edges = $state.raw([]);
</script>

{#each ['h1', 'h2', 'h3'] as head}
  <button onclick={() => { selected = head; nodes = detailFlows[head].nodes; edges = detailFlows[head].edges; }}>
    Head {head}
  </button>
{/each}

{#if selected}
  <DiagramCanvas bind:nodes bind:edges width="100%" height="280px" />
{/if}
```

For thumbnails that aren't meant to be panned/zoomed, wrap the `<DiagramCanvas>` in a `pointer-events: none` div and put a click overlay on top.

### Custom encoded edges

```ts
// after specToFlow returns
for (const [si, ti, weight] of attentionWeights) {
  flow.edges.push({
    id: `enc${i++}`,
    source: `attn_${si}`,
    target: `attn_${ti}`,
    type: 'encoded',
    data: { color: 'attention', weight },
  });
}
```

Encoded edges live in the same component (intra-cluster), so they fall through ELK and are rendered as straight stroke-modulated lines.

## Tuning Tips

- **Cluster too tight or too sparse?** Adjust `scale` (ring diameter in px). For very small rings, also bump `r` so circles aren't squashed.
- **Container hugs nodes too closely?** `CONTAINER_PAD` and `CONTAINER_LABEL_PAD` are fixed in `convert.ts` (16 + 18 px). Adjust there if you need tighter/looser groups across the board.
- **Edges look spaghetti?** Check that you're using `pipeline` (which feeds ELK super-edges) rather than `hstack`/`vstack` followed by manual bridges — pipeline gives ELK the layout signal it needs to place components in order.
- **Edge endpoints anchor on the wrong side?** Floating-edge geometry picks the nearest cardinal side automatically. If a bend-point routed edge looks off, the issue is usually that ELK placed components in an unexpected order; try a different layout tree or an explicit pipeline.
- **Test cluster geometry** — `__tests__/geometry.test.ts` has helpers (`absoluteCenter`, `aabb`, `overlaps`) you can copy when you want to assert "node X is left-of node Y" or "container bbox encloses children". Tests run via `npm test` (vitest).
- **Visual check is required** — `npm run build` validates structure (TypeScript + Svelte compile + ELK runs without errors), but not aesthetics. Open `_build/figures/<name>.html` in a browser, or run `make dev-figures` for HMR.
