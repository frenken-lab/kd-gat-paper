# Interactive Figure Spec Sheet

Catalog of all interactive figures under `interactive/src/figures/{data,diagrams}/`. Data-driven plots live under `data/`, SvelteFlow architecture diagrams under `diagrams/`.

## Summary

| Figure | Type | Data Source |
|---|---|---|
| `algorithm` | Pseudocode | `data.json` |
| `attention` | Network graph | `data.json` |
| `attention-heatmap` | Heatmap | `data.json` |
| `bubble-metrics` | Bubble chart | `data.json` |
| `cka` | Heatmap | `data.json` |
| `counting-stats` | Stats | `data.json` |
| `dataset-stats` | Stats | `data.json` |
| `fedavg-drift` | Line chart | `data.json` |
| `fusion` | Histogram | `data.json` |
| `graph-samples` | Network graph | `data.json` |
| `kd-transfer` | Transfer vis | `data.json` |
| `parameter-calculator` | Interactive calc | `data.json` |
| `pareto-frontier` | Scatter | `data.json` |
| `reconstruction` | Multi-panel | `data.json` |
| `resource-stats` | Stats | `data.json` |
| `results-table` | Data table | `data.json` |
| `training-stats` | Line chart | `data.json` |
| `umap` | Scatter | `data.json` |
| `architecture` | Diagram | `spec.yaml` (composes `vgae` + `gat`) |
| `composition-pipeline` | Diagram (candidacy) | `spec.yaml` |
| `gat` | Diagram | `spec.yaml` |
| `gat-layer` | Diagram | Inline spec |
| `graph-base` | Diagram | Inline spec |
| `gsn-thesis` | Diagram | `data.json` (from `data/gsn/gsn-dag.yaml` via `tools/gsn/render.py`) |
| `kd-gat` | Diagram | `spec.yaml` |
| `kd-vgae` | Diagram | `spec.yaml` |
| `vehicle-pinn` | Diagram (candidacy) | `spec.yaml` |
| `vgae` | Diagram | `spec.yaml` |

## Data-Driven Figures

These consume `data.json` and render it. No transforms in the component — all preprocessing happens in the export script.

### `attention` — GAT Attention Network Graph

- **What it shows:** GAT attention weights on CAN bus graph snapshots. Edge thickness/opacity encode per-layer attention.
- **Chart type:** Weighted directed network graph
- **Marks:** `Arrow`, `Dot`, `Text`, `HTMLTooltip`
- **Interactions:** Dropdown (graph instance), toggle buttons (L0/L1/L2 layers), hover tooltip

### `cka` — CKA Similarity Heatmap

- **What it shows:** Centered Kernel Alignment between teacher and student layers, indicating knowledge transfer quality per layer pair.
- **Chart type:** Annotated heatmap
- **Marks:** `Cell`, `Text`
- **Interactions:** None (static)

### `fusion` — DQN Fusion Weight Distribution

- **What it shows:** Distribution of the DQN bandit fusion weight alpha across evaluated graphs, split by traffic class. Shows how the bandit adapts per attack type.
- **Chart type:** Histogram (binned)
- **Marks:** `RectY` (via `binX`), `RuleY`
- **Interactions:** Toggle buttons per attack type, color legend

### `reconstruction` — VGAE Reconstruction Error Analysis

- **What it shows:** Decomposes VGAE reconstruction error into 4 components (Node Recon, CAN ID, Neighbor, KL) and shows discriminative power via histogram, heatmap, and ROC curves.
- **Chart type:** Multi-panel — histogram + heatmap + ROC
- **Marks:** `RectY`, `RuleY`, `Cell`, `Line`, `RuleX`, `AxisX`, `AxisY`, `Pointer`
- **Interactions:** Component toggle buttons, ROC crosshair pointer (synchronized FPR/TPR)

### `umap` — UMAP Embedding Scatter

- **What it shows:** 2D UMAP projection of GAT graph embeddings colored by attack type. Shows cluster separation.
- **Chart type:** Scatter plot
- **Marks:** `Dot`
- **Interactions:** Toggle buttons per attack type, color legend

### `algorithm` — Pseudocode Algorithm Blocks

- **What it shows:** Rendered pseudocode for the paper's algorithms (training procedure, DQN fusion).
- **Chart type:** Pseudocode (KaTeX + pseudocode.js, not SveltePlot)
- **Interactions:** None (static)

### `results-table` — Interactive Results Table

- **What it shows:** Model evaluation metrics (accuracy, precision, recall, F1, AUC) as a styled table.
- **Chart type:** Data table (HTML, not SveltePlot)
- **Interactions:** None (static)

## Architecture Diagrams

These use `interactive/src/lib/flow/` — SvelteFlow + ELK. All topology comes from `spec.yaml` or an inline spec passed to `specToFlow`. No external data.

### `architecture` — Full KD-GAT System

Complete system overview: VGAE Teacher → GAT Teacher → DQN Fusion → Anomaly Score, with KD distillation edges to student models. Composes `vgae` + `gat` sub-specs as scaled components plus DQN/output/student boxes. ~7 cross-component bridges (flow + KD presets).

### `composition-pipeline` — Deployment-Time Decision Pipeline

Five-stage candidacy decision pipeline: trust gates → simplex policy → safety shield → UCB deferral → conformal abstain. 8 boxes + 9 flow bridges + 3 dashed defer bridges.

### `gat` — 3-Layer GAT Classifier

Stacked 3-layer GAT with JK concatenation feeding into FC classifier. 3 graph clusters with containers, 2 box stages.

### `gat-layer` — Single GAT Layer with Attention Heads

3 parallel attention heads within a single GAT layer. Click a head thumbnail to expand its internal mechanism (input → attention → output) with weighted attention edges. 3 thumbnail flows + 3 detail flows; encoded edges injected post-layout.

### `graph-base` — CAN Bus Graph

Simple 5-node CAN bus input graph illustration (sparse cycle + chord). One graph component, sparse topology.

### `kd-gat` — KD-GAT Knowledge Distillation

Knowledge distillation from GAT teacher to GAT student with feature-matching edges. KD bridge rendered via the `kd` preset on the unified flow edge.

### `kd-vgae` — KD-VGAE Knowledge Distillation

Knowledge distillation from VGAE teacher to VGAE student. Same shape as `kd-gat` with VGAE color/labels.

### `vgae` — VGAE Autoencoder Architecture

Variational graph autoencoder: encoder → latent space (μ, log σ, z) → decoder → reconstruction, with auxiliary CAN-ID and neighbor heads off z. Encoder/latent/decoder containers, 4 graph clusters, 5 boxes.
