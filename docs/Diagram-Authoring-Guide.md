# Diagram Authoring Guide

All architecture diagrams in this repo are **spec-driven**: you write a YAML spec declaring components, layout, and edges, then a 3-line Svelte script builds the diagram. No hardcoded coordinates.

## Quick Start

### 1. Write a spec

Create `interactive/src/figures/diagrams/<name>/spec.yaml`:

```yaml
figure: my-figure

components:
  input:  { type: graph, n: 5, topology: sparse, color: data, labels: auto, scale: 50 }
  enc:    { type: box, label: "Encoder", color: vgae, width: 120, height: 40 }
  dec:    { type: box, label: "Decoder", color: vgae, width: 120, height: 40 }

layout:
  type: pipeline
  gap: 60
  elements: [input, enc, dec]

bridges:
  - { from: dec, to: input_0, type: flow, color: grey, style: dashed, label: "reconstruct" }
```

### 2. Wire the Svelte component

`App.svelte`:

```svelte
<script>
  import { Plot, Dot, Text, Link, Arrow, Rect } from 'svelteplot';
  import spec from './spec.yaml';
  import { buildFromSpec, flatten, labelCenter } from '../../lib/diagram';
  import Figure from '../../lib/Figure.svelte';

  const { graph } = buildFromSpec(spec);
  const { nodes, edges, boxes, domain } = flatten(graph);

  const flowEdges = edges.filter(e => e.type === 'flow');
  const structuralEdges = edges.filter(e => e.type === 'structural');
</script>

<Figure title="My Figure">
  <Plot width={600} height={300} grid={false} axes={false} frame={false}
    x={{ domain: domain.x }} y={{ domain: domain.y }} inset={10}>
    <Link data={structuralEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeOpacity={0.5} strokeWidth={1.5} />
    <Arrow data={flowEdges} x1="x1" y1="y1" x2="x2" y2="y2"
      stroke="stroke" strokeWidth={1} />
    <Rect data={boxes} x1="x1" y1="y1" x2="x2" y2="y2"
      fill="fill" stroke="stroke" strokeWidth={1.5} rx={6} />
    <Text data={boxes} {...labelCenter} text="label" fontSize={9} fill="#333" />
    <Dot data={nodes} x="x" y="y" r={14}
      fill="fill" stroke="stroke" strokeWidth={1.5} />
    <Text data={nodes} {...labelCenter} text="label" fontSize={7} fill="#333" />
  </Plot>
</Figure>
```

### 3. Build

```bash
cd interactive && npm run build
```

## Where Things Live

```
interactive/
├── src/
│   ├── figures/
│   │   ├── architecture/
│   │   │   ├── spec.yaml        # ← diagram spec (edit this)
│   │   │   ├── App.svelte       # ← rendering template
│   │   │   ├── index.html       # ← build entry point (don't edit)
│   │   │   └── main.js          # ← mount script (don't edit)
│   │   ├── gat/
│   │   │   └── ...              # same structure
│   │   ├── kd-gat/
│   │   ├── kd-vgae/
│   │   └── vgae/
│   └── lib/
│       └── diagram/             # ← composition library
│           ├── spec.ts          # buildFromSpec (YAML → Graph)
│           ├── compose.ts       # pipeline, bridge, boxSequence
│           ├── buildGraph.ts    # buildGraph, boxNode
│           ├── transforms.ts    # hstack, vstack, translate, scale
│           ├── flatten.ts       # Graph → flat arrays for SveltePlot
│           ├── palette.ts       # role names → stroke/fill colors
│           ├── text.ts          # label positioning helpers
│           ├── spatial.ts       # spatial predicate engine
│           ├── assertSpatial.ts # vitest assertion helper
│           └── index.js         # barrel exports
├── vite.config.js               # includes YAML import plugin
└── build.js                     # builds all figures
```

## Spec Reference

### Components

Each key in `components:` becomes a graph element. The key is also the **node prefix** for graph types (e.g., `input` → nodes `input_0`, `input_1`, ...).

#### `type: graph` — node cluster with topology

```yaml
input:
  type: graph
  n: 5                  # number of nodes
  topology: sparse      # sparse | full | none
  color: data           # role name (resolved via palette)
  labels: auto          # auto | none | ["label1", "label2", ...]
  scale: 80             # circular layout radius (default: 80)
  directed: false       # edge direction (default: false)
  container:            # optional visual grouping
    label: "Layer 0"
    color: gat
```

#### `type: box` — labeled rectangle

```yaml
encoder:
  type: box
  label: "GCN Encoder"
  color: vgae            # role name
  width: 120             # default: 90
  height: 40             # default: 32
```

#### `type: spec` — embed another spec as a component

```yaml
vgae_t: { type: spec, ref: vgae, scale: 0.5 }
```

Builds the referenced spec's graph and embeds it as a single composable element. The `ref` key maps to the `specs` map passed in `App.svelte`:

```svelte
<script>
  import mainSpec from './spec.yaml';
  import vgaeSpec from '../vgae/spec.yaml';
  import gatSpec from '../gat/spec.yaml';
  import { buildFromSpec, flatten } from '../../lib/diagram';

  const { graph } = buildFromSpec(mainSpec, {
    specs: { vgae: vgaeSpec, gat: gatSpec }
  });
  const data = flatten(graph);
</script>
```

| Field | Required | Description |
|-------|----------|-------------|
| `ref` | yes | Key into the `specs` map |
| `scale` | no | Shrink factor (e.g., `0.5` = half size). Scales positions and box dimensions. |

This is how the architecture overview embeds actual model diagrams instead of labeled boxes. Each sub-spec is defined once and rendered three ways: standalone figure, scaled component in a parent, and click-to-expand detail panel.

**Node naming**: Sub-spec nodes keep their original IDs. Ensure component keys don't collide across specs (e.g., don't name a component `input` in both parent and sub-spec). Bridges in the parent can reference sub-spec nodes directly (e.g., `from: enc, to: dec`).

### Layout Tree

The `layout:` section is a recursive tree. Each node is one of:

| Type | What it does | Key fields |
|------|-------------|------------|
| `hstack` | Horizontal, left-to-right | `children`, `gap` |
| `vstack` | Vertical, top-to-bottom | `children`, `gap`, `align` (left/center/right) |
| `pipeline` | Layout + auto-wired flow edges | `elements`, `gap`, `direction`, `flowColor`, `flowLabels` |

Children can be **component IDs** (strings) or **nested layout nodes**:

```yaml
layout:
  type: vstack
  gap: 80
  align: center
  children:
    - type: pipeline                    # nested layout node
      elements: [vgae_t, gat_t, dqn]
      gap: 50
      flowLabels: ["hard samples", "classification"]
    - type: hstack                      # another nested node
      children: [vgae_s, gat_s]
      gap: 50
```

**Pipeline vs hstack/vstack**: `pipeline` always auto-wires directed flow edges between sequential elements. Use `hstack`/`vstack` when elements should be positioned but not connected.

**Anchor resolution**: When pipeline connects elements, it uses the first non-container node for graph clusters, or the box's own ID for boxes.

### Bridges

Bridges add directed edges **after** composition — for non-linear connections like KD edges, skip connections, cross-row flows:

```yaml
bridges:
  - { from: vgae_t, to: vgae_s, type: kd, color: kd, label: KD }
  - { from: gat_s, to: dqn, type: flow, color: grey, style: dashed }
```

Bridge references use **node IDs** in the composed graph. For graph components, that's `<component_key>_<index>` (e.g., `input_0`). For box components, it's the component key itself (e.g., `vgae_t`).

### Assertions (optional)

Spatial invariants checked by `assertSpatial` in tests:

```yaml
assertions:
  prefixMap: { input: in }    # shorthand for centroid lookups
  checks:
    - "vgae_t: left-of gat_t"
    - "vgae_t: above vgae_s"
    - "vgae_t: aligned-horizontally gat_t"
```

Available predicates: `left-of`, `right-of`, `above`, `below`, `aligned-horizontally`, `aligned-vertically`, `inside`.

### Colors

Color values are **role names** resolved by `palette.ts` from `styles.yml`. Available roles include `data`, `gat`, `vgae`, `dqn`, `kd`, `attention`, `grey`. Don't use hex colors in specs.

## Data Flow

```
spec.yaml
  → buildFromSpec()     walks layout tree, builds graphology Graph
  → flatten()           extracts nodes/boxes/edges/domain for rendering
  → SveltePlot marks    <Dot>, <Rect>, <Arrow>, <Link>, <Text>
```

## Tuning Tips

- **Gap too wide/narrow?** Change `gap:` in the layout node. No other values need to change.
- **Box too big/small?** Change `width:`/`height:` on the box component.
- **Graph cluster too spread out?** Change `scale:` on the graph component.
- **Need a new color role?** Add it to `styles.yml` under `roles:`, then use the name in specs.
- **Visual check required** — `npm run build` then open `_build/figures/<name>.html` in a browser. The build pipeline validates structure but not aesthetics.
