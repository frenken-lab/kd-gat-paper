# `bubble-metrics` — Model × Dataset Performance Bubble Chart

## What it shows
F1, accuracy, and AUC for every (model, dataset) pair as a bubble chart. One bubble per pair: x = F1, y = accuracy, size = AUC, color = dataset (or model). Lets the reader scan the full benchmark surface and spot dominated configurations at once.

## Data
Flat array, one record per (model, dataset):

```json
[{ "model": "GAT-Student", "dataset": "Survival", "f1": 0.91, "accuracy": 0.99, "auc": 0.95 }]
```

Source: same provenance as `results-table` — `data/leaderboard.json` or `data/metrics.parquet`.

## Sources
- Multi-axis benchmark plots in @rajapaksha2022aiidssurvey and @drlids_survey2024.
- SveltePlot: `Dot` with size scale + `HTMLTooltip`.

## Status
**Planned.** No `App.svelte` yet. Wishlisted in `docs/figures-wishlist.md` ("bubble charts (F1, acc, AUC across models and datasets)").
