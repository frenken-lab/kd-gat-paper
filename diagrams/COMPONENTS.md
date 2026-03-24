# Diagram Components

## Architecture

```
data/styles.yaml          → shared palette (Observable 10), sizes, fonts, roles
diagrams/*.yaml           → diagram specs (declarative composition)
scripts/
  components.py           → graph(), box(), gat(), vgae(), build_from_spec()
  build-diagrams.py       → CLI: reads YAML specs, calls components + Graphviz
figures/*.svg             → generated output
diagrams/ref/             → Typst reference diagrams from janosh/diagrams
```

## Build

```bash
python scripts/build-diagrams.py              # build all
python scripts/build-diagrams.py vgae          # build one
python scripts/build-diagrams.py --fmt pdf     # output PDF
python scripts/build-diagrams.py --fmt png     # output PNG
```

## Components

### Primitives

#### `graph(G, n, edges, color, labels, size, directed, id)`

Adds n nodes + edges to the graph. Returns anchors dict. Use top-level `prog: neato` in the YAML spec for force-directed layout.

| Param | Options | Default |
|-------|---------|---------|
| `n` | int | 5 |
| `edges` | `full`, `ring`, `path`, `star`, `sparse`, `none`, or explicit `"0-1,1-2"` | `sparse` |
| `color` | palette name (`blue`), role name (`vgae`, `gat`, `dqn`), or hex | `blue` |
| `labels` | `auto` (v₁..), `none`, or list of strings | `auto` |
| `size` | `small`, `medium`, `large` | `medium` |
| `directed` | bool | `false` |
| `id` | string prefix for node IDs | `g` |

**Anchors:** `input` (first node), `output` (last node), `all` (list of all). Named labels also become anchors.

#### `box(G, id, label, color)`

Single process/operation node. Rounded box shape.

**Anchors:** `self`, `input`, `output` (all the same node).

### Model Components (composed from primitives)

#### `gat(G, n_layers, n, edges, color, size, id, align)`

GAT classifier: N attention layers → JK Concat → FC. Each layer is a `rank=same` subgraph for horizontal alignment. `align` (default true) adds invisible weighted edges between layers for vertical registration.

**Anchors:** `input`, `output`, `jk`, `fc`, `layer0`, `layer1`, ...

#### `gat_layer(G, n, edges, color, size, id, heads, weights, align)`

GAT attention layer internals: input graph → attention-weighted directed graph → output graph. Shows the three visual stages of a single attention layer. Attention edges use dual encoding (penwidth + opacity) for weight magnitude.

| Param | Default | Notes |
|-------|---------|-------|
| `heads` | null | If set, adds "K=N heads" annotation |
| `weights` | null | Dict `"i-j"` → float, or null for schematic |
| `align` | true | Invisible alignment edges between stages |

**Anchors:** `input`, `output`, `stage_input`, `stage_attn`, `stage_output`

#### `latent(G, n, size, id)`

VAE latent block: μ row, σ row → z sampling row. Used by `vgae()` internally and available standalone.

**Anchors:** `input`, `output`, `mu`, `sigma`, `z`

#### `vgae(G, enc_layers, color, latent_n, size, id, align)`

VGAE autoencoder: GCN encoder (narrowing) → latent() → zᵀz decoder → reconstructed. `align` (default true) adds invisible weighted edges between encoder layers.

**Anchors:** `input`, `output`, `mu`, `sigma`, `z`, `decoder`, `reconstructed`

## YAML Spec Format

```yaml
direction: horizontal  # or vertical (default). Maps to rankdir=LR / TB.
ranksep: 1.5           # gap between ranks (Graphviz inches)
nodesep: 0.4           # gap between nodes in same rank
bgcolor: white          # background color (default: transparent)
prog: dot               # layout engine (default: auto-inferred)

components:
  - type: graph         # or box, gat, vgae
    params: {n: 5, color: vgae, id: input}
    container: {label: "Input Graph", color: vgae, style: dashed}  # optional cluster box
    place: {below: other_id}  # optional: place below another component

edges:
  - from: input.output        # component_id.anchor
    to: encoder.input
    color: grey               # hex or role name
    style: dashed             # solid, dashed
    width: 2.0                # maps to Graphviz penwidth
    label: "KD"
    constraint: false         # don't affect rank ordering
```

## Layout Engines

| Engine | When used | Best for |
|--------|-----------|----------|
| `dot` | Default for multi-component diagrams | Hierarchical DAGs, pipelines |
| `neato` | Set via top-level `prog: neato` in YAML spec | Force-directed, organic graphs |

Override with `prog: neato` (or `dot`, `fdp`, `circo`) at spec top level.

## Styles

All colors resolve from `data/styles.yaml`:
- **Roles:** `vgae` → blue, `gat` → orange, `dqn` → green, `kd` → red, `data` → teal
- **Palette:** Observable 10 (same as Svelte interactive figures)
- **Sizes:** `small` (0.30"), `medium` (0.60"), `large` (1.20") — Graphviz inches

## Diagrams

| Spec | What | Components used |
|------|------|----------------|
| `graph-base.yaml` | CAN bus input graph | `graph(organic, sparse, CAN hex labels)` |
| `graph-gat.yaml` | GAT attention graph | `graph(organic, sparse, auto labels)` |
| `vgae.yaml` | VGAE autoencoder | `vgae(enc_layers=[5,3])` + container |
| `gat.yaml` | GAT classifier | `gat(n_layers=3, n=5)` + container |
| `kd-vgae.yaml` | VGAE teacher/student | `vgae()` × 2 + KD edge |
| `kd-gat.yaml` | GAT teacher/student | `gat()` × 2 + KD edge |
| `architecture.yaml` | Full pipeline overview | `graph` + `box` × 6 + edges |
