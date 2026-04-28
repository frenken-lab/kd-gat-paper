# `dataset-stats` — Dataset Statistics Panel

## What it shows
Multi-panel descriptive statistics for the CAN-IDS dataset. Wishlist sub-items:

- Attack-type distribution (raw counts).
- Attack stats across graph features (density, edges, nodes, payload variation).
- Adjacency matrices by attack type (one heatmap per class).
- Graph properties: density, clustering coefficient, average path length, etc., by attack type.
- Summary table.

## Data
Object with sub-arrays per panel:

```json
{
  "attack_distribution": [{ "attack_type": "DoS", "count": 412 }],
  "feature_stats": [{ "attack_type": "DoS", "feature": "edge_count", "mean": 21.4, "std": 8.7 }],
  "adjacency": [{ "attack_type": "DoS", "row": 0, "col": 1, "value": 0.87 }],
  "graph_properties": [{ "attack_type": "DoS", "density": 0.43, "clustering": 0.62, "avg_path_length": 1.8 }]
}
```

Source: derived from `data/graph_samples.json` plus dataset-level aggregates (export-time).

## Sources
- @rajapaksha2022aiidssurvey reviews dataset characterisations for CAN-IDS literature.
- Standard graph-statistics panels (network-science textbook material — Newman, *Networks*).
- SveltePlot: mix of `Cell` (adjacency, feature stats), `RectY` (distribution), and HTML table (summary).

## Status
**Planned.** Wishlisted as "Dataset statistics" with five sub-items. May be split across multiple figure dirs if any one panel grows too complex.
