# `umap` — UMAP Embedding Scatter

## What it shows
2D UMAP projection of GAT graph embeddings, colored by attack type. Shows cluster separation in the learned representation. Wishlist proposes extension: per-model and per-training-type panels with contour-density overlay.

## Data
One record per graph:

```json
[{ "x": -3.21, "y": 7.84, "label": 0, "attack_type": "Normal", "confidence": 0.97, "graph_idx": 42 }]
```

Source: `data/embeddings.parquet`. Currently 187 points; only Normal/Attack classes are in the data, even though the component defines a 7-class color domain.

## Sources
- McInnes et al. 2018 introduces UMAP.
- SveltePlot: `Dot` with attack-type color scale + toggle buttons. For the planned contour-density variant, `Cell` over a KDE grid pre-computed in export.

## Status
**Partial.** 7-class color domain defined in component; only 2 classes in the current data. Wishlist proposes per-model/per-training-type panels with contour density — planned upgrade pending fresh export from KD-GAT.
