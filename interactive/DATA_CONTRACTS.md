# Interactive Figure Data Contracts

Validation schemas: [`data/schemas.yaml`](../data/schemas.yaml)

Each figure imports `data.json` — **plot-ready data, no transforms in the component**.
All preprocessing (sampling, flattening, ROC computation, layout) happens in `export_paper_data.py`.

## umap — GAT embedding scatter
Array of `{x, y, label, attack_type, confidence, graph_idx}`. UMAP pre-computed.

## reconstruction — VGAE error decomposition
Object with 3 panels, each pre-computed:
- `kde`: `[{value, component, class}]` — flattened for histograms
- `heatmap`: `[{row, component, value}]` — sorted by composite error
- `roc`: `[{fpr, tpr, component}]` — per-component ROC curves

## fusion — Bandit fusion weight distribution
Array of `{alpha, label, attack_type}`.

## cka — Teacher-student layer similarity
Object: `{matrix, teacher_layers, student_layers}`. Direct copy from eval.

## attention — GAT attention graph
Array of graphs. Nodes have pre-computed `x, y` positions (spring layout).
Edges have `layer_N_attention` (mean across heads).

## Build Pipeline

```
KD-GAT eval artifacts → export_paper_data.py → ESS exports/paper/
  → pull_data.py → interactive/src/*/data.json
  → npm run build → figures/*.html (self-contained via vite-plugin-singlefile)
```
