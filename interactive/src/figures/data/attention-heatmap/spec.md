# `attention-heatmap` — GAT Attention Heatmap (Layers × Heads)

## What it shows
Aggregated GAT attention organised as a heatmap: rows = GAT layers (L0, L1, L2), columns = attention heads, color = mean attention magnitude (or entropy / sparsity). Complements `attention/`, which renders per-graph network views with edge thickness encoding attention.

## Data
One record per (layer, head):

```json
[{ "layer": 0, "head": 0, "mean_attention": 0.34, "entropy": 1.21 }]
```

Source: aggregated from `data/attention_weights.parquet`.

## Sources
- Head-importance summaries comparable to Michel et al. 2019 (*"Are Sixteen Heads Really Better than One?"*) and the standard transformer-attention diagnostic literature.
- SveltePlot: `Cell` + color scale + `Text` for cell annotations.

## Status
**Planned.** Wishlisted as "GAT attention heatmap layers vs heads hue is attention." Distinct from existing `attention/` (per-graph network view).
