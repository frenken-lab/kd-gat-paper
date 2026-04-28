# `resource-stats` — Computational Resource Profile

## What it shows
Resource consumption per model: inference latency, peak memory, FLOPs. Wishlist proposed contour plots — likely (batch size × latency) per model, or (model × hardware) heatmap of latency.

## Data
Records per (model, hardware, batch_size):

```json
[{ "model": "GAT-Student", "hardware": "RTX-3060", "batch_size": 32, "latency_ms": 4.7, "peak_mem_mb": 312, "flops": 1400000000 }]
```

Source: profiling pass on KD-GAT models (export-time).

## Sources
- Efficiency benchmark layouts in @drlids_survey2024 and the broader efficient-ML literature (e.g., Tan & Le 2019).
- SveltePlot: contour plots require a custom mark or a pre-computed grid; alternative is `Cell` heatmap.

## Status
**Planned.** Wishlisted as "Resource stats (will be new contours more details)."
