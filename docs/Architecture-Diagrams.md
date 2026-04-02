# Architecture Diagrams

Architecture diagrams (GAT, VGAE, KD-GAT pipeline, etc.) are SveltePlot figures built with a shared diagram library on top of [graphology](https://graphology.github.io/).

## Library Location

`interactive/src/lib/diagram/` — re-exports: `buildGraph`, `addLayer`, `unpack`, `resolve`, `connectContainers`, `boundingBox`.

## Pipeline

```
buildGraph()     Create positioned graphology graphs (one per component)
     ↓
addLayer()       Compose multiple graphs side-by-side into a parent graph
     ↓
unpack()         Convert graphology graph → flat arrays for SveltePlot
     ↓
SveltePlot       Render nodes, edges, boxes, containers as SVG marks
```

## API Reference

### `buildGraph(options)` → `Graph`

Creates a single positioned graphology graph cluster.

| Option | Type | Description |
|--------|------|-------------|
| `n` | `number` | Number of nodes |
| `topology` | `'full' \| 'sparse' \| 'none'` | `full` = clique, `sparse` = cycle + cross-edge, `none` = no edges |
| `color` | `string` | Role name (`vgae`, `gat`, `kd`) or hex color |
| `prefix` | `string` | Node key prefix (must be unique across layers) |
| `labels` | `string[] \| 'auto' \| 'none'` | `'auto'` generates v₁, v₂, etc. |
| `directed` | `boolean` | Default `false` |
| `positions` | `[x, y][]` | Explicit positions; falls back to circular layout |
| `edges` | `[srcIdx, tgtIdx, attrs?][]` | Custom edges added after topology |
| `group` | `string` | Group name for container bounds (defaults to `prefix`) |
| `scale` | `number` | Circular layout radius (default `80`) |
| `container` | `object` | Adds a `nodeType: 'container'` node for bounding box |

### `addLayer(parent, children, options)` → `void`

Positions child graphs side-by-side and imports them into a parent graph. Each child is treated as a rigid body — internal positions preserved, only group translation applied.

| Option | Type | Description |
|--------|------|-------------|
| `x`, `y` | `number` | Origin for the layout |
| `gap` | `number` | Horizontal spacing between children (default `50`) |
| `scale` | `number` | Scale relative to group centroid |
| `rotate` | `number` | Rotation in degrees |

Container/box nodes are excluded from bounds calculations.

### `unpack(graph)` → `UnpackedData`

Three-pass conversion of a composed graphology graph into flat arrays for SveltePlot:

1. **Nodes**: Separated by `nodeType` (`node`, `container`, `box`). Colors resolved via `resolve()`.
2. **Boxes**: Standalone boxes use explicit `x/y/width/height` attributes. Group-derived boxes auto-center on group bounds with 30px padding.
3. **Edges**: Bucketed by `type` attribute into `structural`, `flow`, `kd`, `encoded`, `annotation`.

Returns:
```typescript
{
  nodes: UnpackedNode[],
  boxes: UnpackedBox[],
  edges: {
    structural: UnpackedEdge[],
    flow: UnpackedEdge[],
    kd: UnpackedEdge[],
    encoded: UnpackedEdge[],
    annotation: UnpackedEdge[]
  },
  containers: UnpackedContainer[]
}
```

### `resolve(name)` → `{ stroke, fill }`

Maps a role name, palette color name, or raw hex string to stroke/fill colors. Fill defaults to stroke + 40% alpha. Colors sourced from `styles.yml` palette.

Built-in roles: `vgae`, `gat`, `kd`, `dqn`, etc.

### `connectContainers(containers, options)` → `Edge[]`

Generates flow arrows connecting sequential containers (right-edge → left-edge at vertical midpoint). Optional `labels[]` array for edge labels.

### `boundingBox(containers, padding)` → `{x1, y1, x2, y2}`

Returns bounding box covering all containers with optional padding (default `15`).

## Example: Building a Diagram

```svelte
<script>
  import { buildGraph, addLayer, unpack, resolve } from '$lib/diagram'
  import { Cell, Dot, Line, Arrow, Rect } from 'svelteplot'
  import Graph from 'graphology'

  const parent = new Graph()

  const encoder = buildGraph({
    n: 4, topology: 'full', color: 'vgae',
    prefix: 'enc', labels: 'auto', container: { label: 'Encoder' }
  })

  const decoder = buildGraph({
    n: 4, topology: 'sparse', color: 'gat',
    prefix: 'dec', labels: 'auto', container: { label: 'Decoder' }
  })

  addLayer(parent, [encoder, decoder], { gap: 120 })

  const { nodes, boxes, edges, containers } = unpack(parent)
</script>

<Cell width={600} height={300}>
  <!-- Render containers -->
  {#each containers as c}
    <Rect x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
          fill="none" stroke="#ccc" strokeDasharray="4" />
  {/each}

  <!-- Render edges by type -->
  {#each edges.structural as e}
    <Line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={e.stroke} />
  {/each}

  <!-- Render nodes -->
  {#each nodes as n}
    <Dot x={n.x} y={n.y} fill={n.fill} stroke={n.stroke} r={8} />
  {/each}
</Cell>
```

## Color Convention

Never hardcode colors in diagrams. Use role names that resolve via `resolve()`:

```javascript
// Good
buildGraph({ color: 'vgae' })

// Bad
buildGraph({ color: '#4269d0' })
```

The palette is defined in `interactive/styles.yml` using Observable 10 colors.
