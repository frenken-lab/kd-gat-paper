# `graph-samples` — Representative Graph Force-Layout Viewer

## What it shows
Force-layout view of representative CAN bus graphs across attack types. Lets the reader inspect graph topology directly — node count, edge density, structural patterns by class. Distinct from `attention/`, which renders the same graphs with attention-weighted edges.

## Data
Array of graph objects:

```json
[
  { "graph_idx": 0, "label": 1, "attack_type": "DoS",
    "nodes": [{ "id": 0, "can_id": "0x80" }],
    "edges": [{ "source": 0, "target": 1 }] }
]
```

Source: `data/graph_samples.json` — same provenance as `attention/`.

## Sources
- Standard D3 force-layout. The wishlist explicitly called out D3, but the existing diagram pipeline (`interactive/src/lib/flow/`) covers force-layout natively via SvelteFlow + ELK — either substrate is viable.
- SveltePlot does not have a force-layout primitive; either pre-compute positions in export and use `Dot` + `Arrow`, or build on SvelteFlow.

## Status
**Planned.** Wishlisted as "Graph samples force-layout D3."
