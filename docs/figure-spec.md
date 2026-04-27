# Interactive Figure Spec Sheet

Complete catalog of all interactive figures under `interactive/src/figures/{data,diagrams}/`. Audited 2026-04-03; reorganised into `data/` + `diagrams/` subtrees 2026-04-23. Data-driven plots live under `data/`, SvelteFlow architecture diagrams under `diagrams/`.

## Data-Driven Figures

These consume `data.json` and render it. No transforms in the component — all preprocessing happens in the export script.

### `attention` — GAT Attention Network Graph

- **What it shows:** GAT attention weights on CAN bus graph snapshots from the test set. Edge thickness/opacity encode attention weights per layer.
- **Chart type:** Weighted directed network graph
- **Marks:** `Arrow`, `Dot`, `Text`, `HTMLTooltip`
- **Interactions:** Dropdown (graph instance), toggle buttons (L0/L1/L2 layers), hover tooltip
- **Data format:** Array of graph objects
  ```json
  [
    {
      "graph_idx": 0,
      "label": 1,
      "attack_type": "Attack",
      "nodes": [
        { "id": 0, "can_id": "0x80", "x": -12.3, "y": 5.1 }
      ],
      "edges": [
        { "source": 0, "target": 1,
          "layer_0_attention": 0.23,
          "layer_1_attention": 0.41,
          "layer_2_attention": 0.18 }
      ]
    }
  ]
  ```
- **Current data:** 10 graphs, real data
- **HF source:** `data/graph_samples.json` + `data/attention_weights.parquet`

---

### `cka` — CKA Similarity Heatmap

- **What it shows:** Centered Kernel Alignment between teacher and student layers, indicating knowledge transfer quality per layer pair.
- **Chart type:** Annotated heatmap
- **Marks:** `Cell`, `Text`
- **Interactions:** None (static)
- **Data format:** Object with matrix + axis labels
  ```json
  {
    "matrix": [[0.85, 0.12], [0.34, 0.91], [0.15, 0.78]],
    "teacher_layers": ["Teacher L1", "Teacher L2", "Teacher L3"],
    "student_layers": ["Student L1", "Student L2"]
  }
  ```
- **Current data:** Placeholder 3x2 matrix
- **HF source:** `data/cka_similarity.parquet`

---

### `fusion` — DQN Fusion Weight Distribution

- **What it shows:** Distribution of the DQN bandit fusion weight alpha (0 = full VGAE, 1 = full GAT) across evaluated graphs, split by traffic class. Shows how the bandit adapts per attack type.
- **Chart type:** Histogram (binned)
- **Marks:** `RectY` (via `binX`), `RuleY`
- **Interactions:** Toggle buttons per attack type (Normal/Attack), color legend
- **Data format:** Flat array of records
  ```json
  [
    { "alpha": 0.73, "label": 1, "attack_type": "Attack" }
  ]
  ```
- **Current data:** 1,873 records, real data
- **HF source:** `data/dqn_policy.parquet`

---

### `reconstruction` — VGAE Reconstruction Error Analysis

- **What it shows:** Decomposes VGAE reconstruction error into 4 components (Node Recon, CAN ID, Neighbor, KL) and shows discriminative power via histogram, heatmap, and ROC curves.
- **Chart type:** Multi-panel — histogram + heatmap + ROC
- **Marks:** `RectY` (binX), `RuleY`, `Cell`, `Line`, `RuleX`, `RuleY`, `AxisX`, `AxisY`, `Pointer`
- **Interactions:** Component toggle buttons, ROC crosshair pointer (synchronized FPR/TPR)
- **Data format:** Object with three sub-datasets
  ```json
  {
    "kde": [
      { "value": 0.034, "component": "Node Recon", "class": "normal" }
    ],
    "heatmap": [
      { "row": "G1", "component": "Node Recon", "value": 0.82 }
    ],
    "roc": [
      { "fpr": 0.0, "tpr": 0.0, "component": "Node Recon" }
    ]
  }
  ```
- **Current data:** Placeholder (24 kde, 12 heatmap, 24 roc records)
- **HF source:** `data/recon_errors.parquet`

---

### `umap` — UMAP Embedding Scatter

- **What it shows:** 2D UMAP projection of GAT graph embeddings colored by attack type. Shows cluster separation.
- **Chart type:** Scatter plot
- **Marks:** `Dot`
- **Interactions:** Toggle buttons per attack type, color legend (7-class domain defined)
- **Data format:** Flat array of point records
  ```json
  [
    { "x": -3.21, "y": 7.84, "label": 0, "attack_type": "Normal",
      "confidence": 0.97, "graph_idx": 42 }
  ]
  ```
- **Current data:** 187 points, only Normal/Attack classes present (7-class domain defined in component but not yet in data)
- **HF source:** `data/embeddings.parquet`

---

### `algorithm` — Pseudocode Algorithm Blocks

- **What it shows:** Rendered pseudocode for the paper's algorithms (e.g., training procedure, DQN fusion).
- **Chart type:** Pseudocode rendering (KaTeX + pseudocode.js)
- **Marks:** None (HTML rendering, not SveltePlot)
- **Interactions:** None (static)
- **Data format:** Object with `algorithms` array
- **Current data:** data.json driven
- **HF source:** —

---

### `results-table` — Interactive Results Table

- **What it shows:** Model evaluation metrics (accuracy, precision, recall, F1, AUC) as a styled interactive table.
- **Chart type:** Data table
- **Marks:** None (HTML table, not SveltePlot)
- **Interactions:** None (static)
- **Data format:** Flat array of metric records
- **Current data:** data.json driven
- **HF source:** `data/metrics.parquet` / `data/leaderboard.json`

---

## Architecture Diagrams

These use the diagram library (`interactive/src/lib/flow/`) — SvelteFlow + ELK. No external data — all topology comes from each diagram's `spec.yaml` (or an inline spec object passed to `specToFlow`).

### `architecture` — Full KD-GAT System

- **What it shows:** Complete system overview: VGAE Teacher → GAT Teacher → DQN Fusion → Anomaly Score, with KD distillation edges to student models.
- **Chart type:** Architecture diagram (composed)
- **Interactions:** None
- **Data:** `spec.yaml` composing `vgae` + `gat` sub-specs as scaled components, plus DQN/output/student boxes. ~7 cross-component bridges (flow + KD presets).

### `composition-pipeline` — Deployment-Time Decision Pipeline

- **What it shows:** Five-stage decision pipeline composing the candidacy answers — trust gates → simplex policy → safety shield → UCB deferral → conformal abstain — with confident/defer outputs.
- **Chart type:** Architecture diagram (spec-driven, candidacy-only)
- **Interactions:** None
- **Data:** Inline via `spec.yaml` (8 boxes + 9 flow bridges + 3 dashed defer bridges).

### `gat` — 3-Layer GAT Classifier

- **What it shows:** Stacked 3-layer GAT with JK concatenation feeding into FC classifier.
- **Chart type:** Architecture diagram (spec-driven)
- **Interactions:** None
- **Data:** Inline via `spec.yaml` (3 graph clusters with containers, 2 box stages).

### `gat-layer` — Single GAT Layer with Attention Heads

- **What it shows:** 3 parallel attention heads within a single GAT layer. Click a head thumbnail to expand its internal mechanism (input → attention → output) with weighted attention edges.
- **Chart type:** Drill-down architecture diagram
- **Interactions:** Click thumbnail to expand detail panel; close button.
- **Data:** Inline spec objects passed to `specToFlow`. 3 thumbnail flows (one cluster each) + 3 detail flows (input + attn + output, with 6 encoded edges per head injected post-layout).

### `graph-base` — CAN Bus Graph

- **What it shows:** Simple 5-node CAN bus input graph illustration (sparse cycle + chord).
- **Chart type:** Network graph
- **Interactions:** None
- **Data:** Inline spec object passed to `specToFlow` (one graph component, sparse topology).

### `kd-gat` — KD-GAT Knowledge Distillation

- **What it shows:** Knowledge distillation from GAT teacher to GAT student with feature-matching edges.
- **Chart type:** Architecture diagram (spec-driven)
- **Interactions:** None
- **Data:** Inline via `spec.yaml`. KD bridge between teacher and student is rendered via the `kd` preset on the unified flow edge.

### `kd-vgae` — KD-VGAE Knowledge Distillation

- **What it shows:** Knowledge distillation from VGAE teacher to VGAE student.
- **Chart type:** Architecture diagram (spec-driven)
- **Interactions:** None
- **Data:** Inline via `spec.yaml`. Same shape as `kd-gat` with VGAE color/labels.

### `vgae` — VGAE Autoencoder Architecture

- **What it shows:** Variational graph autoencoder: encoder → latent space (μ, log σ, z) → decoder → reconstruction, with auxiliary CAN-ID and neighbor heads off z.
- **Chart type:** Architecture diagram (spec-driven)
- **Interactions:** None
- **Data:** Inline via `spec.yaml` (encoder/latent/decoder containers, 4 graph clusters, 5 boxes).

---

## Summary

| Figure | Type | Data Source | Status | HF Equivalent |
|---|---|---|---|---|
| `algorithm` | Pseudocode | `data.json` | Complete | — |
| `attention` | Network graph | `data.json` (10 graphs) | Real data | `graph_samples.json` + `attention_weights.parquet` |
| `cka` | Heatmap | `data.json` (3x2) | Placeholder | `cka_similarity.parquet` |
| `fusion` | Histogram | `data.json` (1,873) | Real data | `dqn_policy.parquet` |
| `reconstruction` | Multi-panel | `data.json` (3 sub-datasets) | Placeholder | `recon_errors.parquet` |
| `results-table` | Data table | `data.json` | Complete | `metrics.parquet` / `leaderboard.json` |
| `umap` | Scatter | `data.json` (187 pts) | Partial (2 of 7 classes) | `embeddings.parquet` |
| `architecture` | Diagram | `spec.yaml` (composes `vgae` + `gat`) | Complete | — |
| `composition-pipeline` | Diagram (candidacy) | `spec.yaml` | Complete | — |
| `gat` | Diagram | `spec.yaml` | Complete | — |
| `gat-layer` | Diagram | Inline | Complete | — |
| `graph-base` | Diagram | Inline | Complete | — |
| `kd-gat` | Diagram | `spec.yaml` | Complete | — |
| `kd-vgae` | Diagram | `spec.yaml` | Complete | — |
| `vgae` | Diagram | `spec.yaml` | Complete | — |

### Data Completeness

- **Real data:** `attention`, `fusion` — ready for paper
- **Placeholder/partial:** `cka`, `reconstruction`, `umap` — need fresh export from KD-GAT
- **No data needed:** architecture diagrams (spec-driven inline)
- **Complete (non-data):** `algorithm`, `results-table`, all 8 architecture diagrams
