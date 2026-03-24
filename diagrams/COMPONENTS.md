# Diagram Components

## Architecture

```
data/styles.yaml          → shared palette (Observable 10), sizes, fonts, roles
diagrams/*.yaml           → diagram specs (declarative composition)
scripts/
  components.py           → graph(), box(), gat(), vgae(), build_from_spec()
  renderers.py            → render_matplotlib(), export_positions()
  build-diagrams.py       → CLI: reads YAML specs, calls components + renderer
figures/*.svg             → generated output
diagrams/ref/             → Typst reference diagrams from janosh/diagrams
```

## Build

```bash
python scripts/build-diagrams.py              # build all
python scripts/build-diagrams.py vgae          # build one
python scripts/build-diagrams.py --fmt pdf     # output PDF
python scripts/build-diagrams.py --positions   # export node positions JSON (for Typst label layer)
```

## Components

### Primitives

#### `graph(n, layout, edges, color, labels, size, directed, id)`

The base building block. Returns `(nx.DiGraph, positions, anchors)`.

| Param | Options | Default |
|-------|---------|---------|
| `n` | int | 5 |
| `layout` | `organic`, `linear`, `grid` | `organic` |
| `edges` | `full`, `ring`, `path`, `star`, `sparse`, `none`, or explicit `"0-1,1-2"` | `sparse` |
| `color` | palette name (`blue`), role name (`vgae`, `gat`, `dqn`), or hex | `blue` |
| `labels` | `auto` ($v_1$..), `none`, or list of strings | `auto` |
| `size` | `small`, `medium`, `large`, or number | `medium` |
| `directed` | bool | `false` |
| `id` | string prefix for node IDs | `g` |

**Anchors:** `input` (first node), `output` (last node), `all` (list of all). Named labels also become anchors.

#### `box(id, label, color)`

Single process/operation node. Square shape.

**Anchors:** `self`, `input`, `output` (all the same node).

### Model Components (composed from primitives)

#### `gat(n_layers, n, edges, color, size, id, gap)`

GAT classifier: N attention layers → JK Concat → FC.

**Anchors:** `input`, `output`, `jk`, `fc`, `layer0`, `layer1`, ...

#### `vgae(enc_layers, color, latent_n, size, id, gap)`

VGAE autoencoder: GCN encoder (narrowing) → μ/σ → z → z^Tz → reconstructed.

**Anchors:** `input`, `output`, `mu`, `sigma`, `z`, `decoder`, `reconstructed`

## YAML Spec Format

```yaml
figsize: [12, 6]
direction: horizontal  # or vertical

components:
  - type: graph         # or box, gat, vgae
    params: {n: 5, layout: organic, color: vgae, id: input}
    container: {label: "Input Graph", color: vgae, style: dashed}  # optional bounding box
    place: {gap: 1.5, side: left}  # optional positioning hints

edges:
  - from: input.output        # component_id.anchor
    to: encoder.input
    color: grey
    style: dashed             # solid, dashed
    connectionstyle: "arc3,rad=0.3"   # curved edges
    arrowstyle: "-|>"         # arrow head style
    width: 2.0
    label: "KD"
```

## Edge Styles

### `connectionstyle` (via matplotlib)
| Style | Effect |
|-------|--------|
| `arc3` | Straight (default, `rad=0`) or curved (`rad=0.3`) |
| `arc3,rad=0.3` | Bezier curve, positive = curve left |
| `angle3` | Fixed exit/entry angles |
| `bar` | Right-angle connector |

### `arrowstyle` (via matplotlib)
| Style | Effect |
|-------|--------|
| `->` | Simple arrow (default) |
| `-\|>` | Filled triangle |
| `<->` | Both ends |
| `fancy` | Curved fancy arrow |
| `simple` | Simple arrow |
| `-` | No arrowhead |

### `edges` patterns (via NetworkX)
| Pattern | Generator | Effect |
|---------|-----------|--------|
| `full` | `nx.complete_graph` | All-to-all |
| `ring` | `nx.cycle_graph` | Circular chain |
| `path` | `nx.path_graph` | Linear chain |
| `star` | `nx.star_graph` | Hub + spokes |
| `sparse` | ring + cross | Ring with one diagonal |
| `none` | — | Nodes only |
| `"0-1,1-2,2-3"` | explicit | Custom edge list |

## Styles

All colors resolve from `data/styles.yaml`:
- **Roles:** `vgae` → blue, `gat` → orange, `dqn` → green, `kd` → red, `data` → teal
- **Palette:** Observable 10 (same as Svelte interactive figures)
- **Sizes:** `small` (150), `medium` (400), `large` (800)

## Rendering

Currently: **matplotlib** → SVG/PDF/PNG
- Per-node colors, shapes, sizes from graph attributes
- Per-edge colors, styles, widths, connection styles
- Container bounding boxes with labels
- Math labels via matplotlib TeX renderer (`$\alpha_{ij}$`)

Future options:
- **Typst label layer:** `--positions` exports node coords as JSON, Typst overlays math annotations
- **drawsvg:** direct SVG generation for cleaner output

## Diagrams

| Spec | What | Components used |
|------|------|----------------|
| `graph-base.yaml` | CAN bus input graph | `graph(organic, sparse, CAN hex labels)` |
| `graph-gat.yaml` | GAT attention graph | `graph(organic, sparse, auto labels)` |
| `vgae.yaml` | VGAE autoencoder | `vgae(enc_layers=[5,3])` |
| `gat.yaml` | GAT classifier | `gat(n_layers=3, n=5)` |
| `kd-vgae.yaml` | VGAE teacher/student | `vgae()` × 2 + KD edge |
| `kd-gat.yaml` | GAT teacher/student | `gat()` × 2 + KD edge |
| `architecture.yaml` | Full pipeline | `graph` + `vgae` × 2 + `gat` × 2 + `box` × 2 + edges |
