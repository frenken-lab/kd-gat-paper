# `training-stats` — Training Curves and Convergence

## What it shows
Per-model training curves: train and validation loss vs step, plus convergence step and total wall-clock training time. Multi-line plot with one line per model; small-multiple panels per metric (loss, F1, accuracy).

## Data
Long-form, one record per (model, step):

```json
[{ "model": "GAT-Teacher", "step": 100, "train_loss": 0.43, "val_loss": 0.51, "val_f1": 0.78 }]
```

Source: training logs from the KD-GAT export pipeline (`run_*.csv` or similar).

## Sources
- Standard training-curve plots in ML papers; @kornblith2019similarity and @hinton2015distilling include comparable diagnostic panels.
- SveltePlot: `Line` with model-color encoding; `RuleX` for convergence-step markers.

## Status
**Planned.** Wishlisted as "Training stats."
