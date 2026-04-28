# `counting-stats` — Top-Level Counting Statistics

## What it shows
Descriptive counts for the dataset: number of CAN frames, number of windows, number of graphs, per-class counts after preprocessing. Either a small grid of large-number cards or a horizontal bar chart of class counts — whichever reads cleaner alongside `dataset-stats`.

## Data
Object with named counts:

```json
{
  "frames_total": 12854312,
  "windows_total": 9217,
  "graphs_total": 9217,
  "class_counts": { "Normal": 8237, "DoS": 412, "Fuzzy": 198, "Replay": 87, "Masquerade": 21 }
}
```

Source: derived from the same pipeline that emits `data/schemas.yaml` summaries plus per-class counts from preprocessing.

## Sources
- Standard descriptive-stats panels; comparable to dataset cards in the HF Hub format.
- SveltePlot: `RectY` for the bar variant; HTML cards for the number-grid variant.

## Status
**Planned.** Wishlisted as "counting stats." Implementation may resolve to a numbers-card grid or a bar chart depending on which reads cleaner alongside `dataset-stats`.
