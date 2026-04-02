# Hugging Face Data Inventory

Inventory of all KD-GAT data currently on Hugging Face under `buckeyeguy`. Audited 2026-04-02.

## Datasets

### `buckeyeguy/kd-gat-experiments`

MLflow experiment run tracking data. Last modified: 2026-03-10.

- **File:** `experiments.parquet` (65KB)
- **Shape:** 181 rows x 65 columns
- **Key columns:**
  - `run_id`, `experiment_id`, `status` — run identity
  - `metrics.val_loss`, `metrics.train_loss`, `metrics.val_acc`, `metrics.train_acc` — training metrics
  - `metrics.peak_gpu_mb`, `metrics.duration_seconds` — resource usage
  - `params.model_type` (gat/vgae), `params.stage` (curriculum/autoencoder), `params.dataset`, `params.scale` (large/small)
  - `params.lr`, `params.batch_size`, `params.seed`, `params.has_kd`
  - `tags.run_group`, `tags.config_hash`, `tags.gpu_name`, `tags.slurm_job_id`
- **Sparsity:** High null rate (~50-90%) on many columns due to heterogeneous run types (training, sweeps, test runs). 90/181 runs missing `duration_seconds`, 120/181 missing `val_acc`/`train_acc`.
- **Notes:** Artifact URIs point to OSC filesystem (`/users/PAS2022/rf15/KD-GAT/mlruns/`). Contains test/debug runs mixed with production runs.

### `buckeyeguy/kd-gat-sweeps`

Hyperparameter sweep results. Last modified: 2026-03-06.

- **File:** `sweeps.parquet` (8KB)
- **Shape:** 37 rows x 30 columns
- **Key columns:**
  - `sweep_id`, `trial_id`, `stage`, `dataset`, `scale`, `status`
  - `val_loss`, `duration_s`, `timestamp`
  - `hp_training.*` (lr, weight_decay)
  - `hp_vgae.*` (dropout, embedding_dim, heads, latent_dim, proj_dim)
  - `hp_gat.*` (dropout, embedding_dim, fc_layers, heads, hidden, layers, proj_dim)
  - `hp_dqn.*` (epsilon, epsilon_decay, gamma, hidden, layers)
  - `hp_fusion.*` (episodes, lr)
- **Notes:** Clean, structured sweep data. All 37 trials have complete hyperparameter records.

## Spaces

### `buckeyeguy/kd-gat-paper` (static Space)

Old Quarto-based dashboard. Created 2026-03-03, last modified 2026-03-06. SDK: static.

**This is the old fragile Space** that had OJS/D3 issues. Contains a rich data directory that predates the current MyST paper pipeline.

#### Data files in the Space:

| File | Size | Format | Description |
|---|---|---|---|
| `data/metrics.parquet` | 6KB | parquet | Summary metrics |
| `data/metrics/*.json` (18 files) | ~6-7KB each | JSON | Per-config evaluation metrics (6 datasets x 3 scales: large, small, small_kd) |
| `data/metrics/metric_catalog.json` | 391B | JSON | Metric definitions |
| `data/recon_errors.parquet` | 3.1MB | parquet | VGAE reconstruction error data (largest file) |
| `data/embeddings.parquet` | 1.1MB | parquet | Graph embeddings (likely UMAP source) |
| `data/dqn_policy.parquet` | 1.1MB | parquet | DQN fusion policy data |
| `data/graph_statistics.parquet` | 182KB | parquet | Per-graph statistics |
| `data/training_curves.parquet` | 137KB | parquet | Aggregated training curves |
| `data/training_curves/*.json` (~30 files) | 200B-90KB | JSON | Per-run training curves by config |
| `data/graph_samples.json` | 1.7MB | JSON | Raw graph instances (attention visualization source) |
| `data/attention_weights.parquet` | 7KB | parquet | GAT attention weight data |
| `data/cka_similarity.parquet` | 2KB | parquet | CKA similarity matrix data |
| `data/runs.parquet` / `data/runs.json` | 8KB / 26KB | parquet+JSON | Run metadata |
| `data/leaderboard.json` | 63KB | JSON | Model comparison leaderboard |
| `data/datasets.parquet` / `data/datasets.json` | 3KB / 2KB | parquet+JSON | Dataset metadata |
| `data/model_sizes.json` | 831B | JSON | Model parameter counts |
| `data/kd_transfer.json` | 16KB | JSON | Knowledge distillation transfer metrics |

#### OJS/JS files in the Space:

| File | Description |
|---|---|
| `_ojs/aggregations.js` | Data aggregation helpers |
| `_ojs/chart-helpers.js` | Chart utility functions |
| `_ojs/force-graph.js` (21KB) | Force-directed graph layout (D3) |
| `_ojs/graph-analysis.js` (11KB) | Graph analysis computations |
| `_ojs/mosaic-renderer.js` | Mosaic plot renderer |
| `_ojs/mosaic-setup.js` | Mosaic initialization |
| `_ojs/theme.js` | Visual theme config |
| `dashboard.html` (388KB) | Monolithic Quarto-rendered dashboard |

### `buckeyeguy/osc-usage-dashboard` (Docker Space)

Separate project — OSC resource usage dashboard. Not related to KD-GAT paper.

## Relevance to Paper Figures

Several Space data files map directly to current paper figures:

| Paper Figure | Potential HF Source | Notes |
|---|---|---|
| `umap` (scatter) | `data/embeddings.parquet` | 1.1MB — likely full embeddings, paper has 187-point sample |
| `reconstruction` (histogram+heatmap+ROC) | `data/recon_errors.parquet` | 3.1MB — paper has placeholder data |
| `attention` (network graph) | `data/graph_samples.json` + `data/attention_weights.parquet` | Paper has 10-graph sample |
| `cka` (heatmap) | `data/cka_similarity.parquet` | Paper has placeholder 3x2 matrix |
| `fusion` (histogram) | `data/dqn_policy.parquet` | 1.1MB — paper has 1,873 records |
| Tables (main results) | `data/metrics/*.json` + `data/leaderboard.json` | 18 eval configs |
