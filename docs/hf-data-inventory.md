# Hugging Face Data Inventory

Inventory of KD-GAT data on Hugging Face under `buckeyeguy`. Audited 2026-04-02.

## Datasets

### `buckeyeguy/GraphIDS`

Primary data source for the paper. `make data` pulls from this dataset via `tools/pull_data.py`. Contains 30+ files validated against `data/schemas.yaml`.

### `buckeyeguy/kd-gat-experiments`

MLflow experiment run tracking. 181 rows × 65 columns (`experiments.parquet`, 65KB). Covers training/sweep/test runs with metrics, hyperparameters, and SLURM provenance. High null rate (~50–90%) due to heterogeneous run types.

### `buckeyeguy/kd-gat-sweeps`

Hyperparameter sweep results. 37 rows × 30 columns (`sweeps.parquet`, 8KB). Complete hyperparameter records for all trials across VGAE/GAT/DQN/fusion search spaces.

## Spaces

### `buckeyeguy/kd-gat-paper` (static Space — deprecated)

Old Quarto-based dashboard (SDK: static). Predates the current MyST paper pipeline; not actively maintained. Data files in this Space map to current paper figures:

| File | Size | Description |
|---|---|---|
| `data/metrics.parquet` | 6KB | Summary metrics |
| `data/metrics/*.json` (18 files) | ~6–7KB each | Per-config eval metrics (6 datasets × 3 scales) |
| `data/recon_errors.parquet` | 3.1MB | VGAE reconstruction error data |
| `data/embeddings.parquet` | 1.1MB | Graph embeddings (UMAP source) |
| `data/dqn_policy.parquet` | 1.1MB | DQN fusion policy data |
| `data/graph_samples.json` | 1.7MB | Raw graph instances (attention vis source) |
| `data/attention_weights.parquet` | 7KB | GAT attention weight data |
| `data/cka_similarity.parquet` | 2KB | CKA similarity matrix |
| `data/leaderboard.json` | 63KB | Model comparison leaderboard |
| `data/training_curves.parquet` | 137KB | Aggregated training curves |

### `buckeyeguy/osc-usage-dashboard` (Docker Space)

Separate project — OSC resource usage dashboard. Not related to this paper.

## Relevance to Paper Figures

| Paper Figure | HF Source | Notes |
|---|---|---|
| `umap` | `data/embeddings.parquet` | Full embeddings; paper uses 187-point sample |
| `reconstruction` | `data/recon_errors.parquet` | Paper currently has placeholder data |
| `attention` | `data/graph_samples.json` + `data/attention_weights.parquet` | Paper uses 10-graph sample |
| `cka` | `data/cka_similarity.parquet` | Paper currently has placeholder 3×2 matrix |
| `fusion` | `data/dqn_policy.parquet` | Paper has 1,873 records |
| Tables | `data/metrics/*.json` + `data/leaderboard.json` | 18 eval configs |
