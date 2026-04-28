# `kd-transfer` — Teacher vs. Student Metric Scatter

## What it shows
For each (model, distillation_type) pair, plot teacher metric vs. student metric. The y=x diagonal is perfect transfer; below-diagonal points show degradation, above-diagonal points show student improving on teacher (rare but informative). One panel per metric (F1, accuracy, AUC).

## Data
Records per (model, distillation_type, metric):

```json
[{ "model": "GAT", "distillation": "FitNet", "metric": "f1", "teacher": 0.94, "student": 0.91 }]
```

Source: KD evaluation pipeline (export-time).

## Sources
- Hinton et al. 2015 introduces knowledge distillation; FitNet (Romero et al. 2014) for layer-wise hints; CRD (Tian et al. 2019) for contrastive variants.
- Companion to `cka/` — CKA explains *where* in the network transfer happened; this scatter shows *how well* it generalised to the metric.
- SveltePlot: `Dot` + `Line` for the y=x reference; small-multiple panels per metric.

## Status
**Planned.** Wishlisted as "KD transfer (F1 vs F1, metric vs metric) + CKA." The CKA half lives in `cka/`; this is the scatter half.
