# `pareto-frontier` — F1 vs. Parameter Count Pareto Frontier

## What it shows
Each model as a point at (parameter count, F1). The Pareto frontier connects non-dominated configurations. Shows which models are dominated and which sit on the accuracy/efficiency frontier — the visual answer to "is the smaller model worth it?"

## Data
One record per model:

```json
[{ "model": "GAT-Teacher", "params": 5400000, "f1": 0.94 }]
```

Source: `data/metrics.parquet` joined with model parameter counts (frontier computed in export, not in component — figures are dumb renderers).

## Sources
- Standard accuracy/efficiency Pareto plots in efficient-ML literature (e.g., Tan & Le 2019, *EfficientNet*).
- SveltePlot: `Dot` for points + `Line` for the frontier polyline.

## Status
**Planned.** Wishlisted as "Pareto Frontier (metric to param count)."
