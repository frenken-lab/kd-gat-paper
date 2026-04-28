# `cka` — CKA Similarity Heatmap

## What it shows
Centered Kernel Alignment between teacher and student layers; color = CKA value (0 = unrelated, 1 = identical representations). Diagnoses where in the network knowledge transfer succeeded and where it stalled.

## Data
Object with matrix + axis labels:

```json
{
  "matrix": [[0.85, 0.12], [0.34, 0.91]],
  "teacher_layers": ["Teacher L1", "Teacher L2"],
  "student_layers": ["Student L1", "Student L2"]
}
```

Source: `data/cka_similarity.parquet`. Current data is a 3×2 placeholder.

## Sources
- Kornblith et al. 2019 introduces CKA as a representation-similarity metric.
- Companion to `kd-transfer/` — CKA shows *layer-wise* similarity; the scatter shows *metric-level* transfer.
- SveltePlot: `Cell` + `Text` annotations.

## Status
**Placeholder.** Needs fresh export from KD-GAT. Wishlist proposed per-model and per-training-type panels — multi-panel extension is planned.
