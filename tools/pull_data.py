#!/usr/bin/env python3
"""Pull paper data from two HF repos and build figure data files.

  Metrics tables      →  buckeyeguy/graphids-kd-gat  (leaderboard, effect_size, …)
  Analysis artifacts  →  buckeyeguy/graphids-data     (embeddings, cka)

Outputs:
  data/csv/
    leaderboard.csv, effect_size.csv, expected_max.csv, tie_candidates.csv
  interactive/src/figures/data/cka/data.json
    Per-dataset heatmaps: {dataset: [n_layers × n_variants]} teacher-student CKA,
    averaged across seeds within each dataset. Missing variants → null cells.
  interactive/src/figures/data/umap/data.json
    Per-dataset UMAP projections: {dataset: {points, bounds, metrics}},
    using UMAP_GROUP/UMAP_VARIANT/UMAP_SEED for each dataset.
    Binary labels (Normal/Attack) only — see note below.

Usage:
    python tools/pull_data.py                  # full pull
    python tools/pull_data.py --dry-run        # preview what would be written
    python tools/pull_data.py --skip-metrics   # figures only (skip CSV tables)
    python tools/pull_data.py --skip-figures   # metrics tables only (skip figures)

UMAP variant (edit these constants to use a different run):
    UMAP_GROUP, UMAP_VARIANT, UMAP_SEED  (applied to all datasets)

Note — missing artifacts:
  - Multi-class attack-type labels not in embeddings.npz; UMAP uses binary
    labels only. Requires a GraphIDS analyze export fix (subclass_labels).
  - attention_weights.npz absent from most runs; attention figures stay skipped.
  - Metrics tables require graphids-kd-gat (separate from graphids-data).
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import polars as pl
import yaml
from huggingface_hub import hf_hub_download, list_repo_files

METRICS_REPO_ID = "buckeyeguy/graphids-kd-gat"
ANALYSIS_REPO_ID = "buckeyeguy/graphids-data"

# Canonical variant used for UMAP figures (one projection per dataset)
UMAP_GROUP = "gat_loss"
UMAP_VARIANT = "ce"
UMAP_SEED = 42

# Display order for variant columns in the CKA heatmap
VARIANT_ORDER = [
    "ce",
    "focal",
    "weighted_ce",  # gat_loss
    "none",
    "curriculum_vgae",
    "curriculum_random",  # gat_sampling
    "hash",
    "lookup",  # id_encoding
]

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schemas.yaml"
VALIDATOR = ROOT / "tools" / "validate" / "inputs" / "data.py"
FIGURES_DIR = ROOT / "interactive" / "src" / "figures" / "data"

MULTICLASS_ATTACK_TYPE_LABELS: dict[int, str] = {
    0: "Normal",
    1: "DoS",
    2: "Fuzzy",
    3: "Gear",
    4: "RPM",
    5: "Flooding",
    6: "Malfunction",
    7: "Double",
    8: "Triple",
    9: "Interval",
    10: "Speed",
    11: "Speed (accessory)",
    12: "RPM (accessory)",
    13: "Standstill",
    14: "Systematic",
    15: "Suppress",
    16: "Masquerade",
}

# ── helpers ───────────────────────────────────────────────────────────────────


def load_input_manifest() -> dict[str, dict]:
    with open(SCHEMA_PATH) as f:
        return yaml.safe_load(f).get("input", {})


def fetch_parquet(repo_id: str, filename: str, expected_columns: list[str]) -> pl.DataFrame:
    local = hf_hub_download(repo_id=repo_id, filename=filename, repo_type="dataset")
    df = pl.read_parquet(local)
    missing = [c for c in expected_columns if c not in df.columns]
    if missing:
        raise ValueError(
            f"{repo_id}/{filename} missing expected columns: {missing}\n"
            f"  Found: {df.columns}\n"
            f"  Update data/schemas.yaml or fix the KD-GAT export."
        )
    return df


def fetch_metadata(repo_id: str) -> dict:
    local = hf_hub_download(repo_id=repo_id, filename="metadata.json", repo_type="dataset")
    with open(local) as f:
        return json.load(f)


def write_csv(path: Path, df: pl.DataFrame, *, dry_run: bool = False) -> None:
    if dry_run:
        print(f"  [dry-run] would write {path.relative_to(ROOT)} ({len(df)} rows)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    df.write_csv(path)
    print(f"  wrote {path.relative_to(ROOT)} ({len(df)} rows)")


def write_json(path: Path, data: object, *, dry_run: bool = False) -> None:
    if dry_run:
        print(f"  [dry-run] would write {path.relative_to(ROOT)}")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  wrote {path.relative_to(ROOT)}")


# ── CKA figure ────────────────────────────────────────────────────────────────


def build_cka_figure(dry_run: bool = False) -> None:
    """Collect cka.json per (dataset, group, variant, seed) and build per-dataset matrices.

    Each cka.json contains {layer_0: float, layer_1: float} — teacher-student CKA
    per corresponding GAT layer. Values are averaged across seeds within each dataset.
    Output: {matrices: {dataset: [[...], [...]]}, teacher_layers, student_layers}
    Missing variants in a dataset (e.g. curriculum_random absent in set_01) → null cells.
    """
    print(f"\nBuilding CKA figure from {ANALYSIS_REPO_ID}...")

    all_files = list(list_repo_files(ANALYSIS_REPO_ID, repo_type="dataset"))
    cka_files = [f for f in all_files if f.endswith("/cka.json") and "/teacher/" not in f]
    if not cka_files:
        print("  no cka.json files found — skipping")
        return
    print(f"  found {len(cka_files)} cka.json files (excluding teacher)")

    records: list[dict] = []
    for fpath in cka_files:
        # path pattern: analysis/{dataset}/{group}/{variant}/seed_{N}/cka.json
        parts = fpath.split("/")
        _analysis, dataset, group, variant, seed_tag = parts[:5]
        local = hf_hub_download(repo_id=ANALYSIS_REPO_ID, filename=fpath, repo_type="dataset")
        with open(local) as f:
            values = json.load(f)
        records.append(
            {
                "dataset": dataset,
                "group": group,
                "variant": variant,
                "seed": seed_tag,
                **values,
            }
        )

    df = pl.DataFrame(records)
    layer_cols = sorted(c for c in df.columns if c.startswith("layer_"))
    n_layers = len(layer_cols)
    datasets = sorted(df["dataset"].unique().to_list())
    print(f"  {n_layers} GAT layers, {df['variant'].n_unique()} variants, {len(datasets)} datasets")

    # Canonical variant order across all datasets
    present = set(df["variant"].to_list())
    ordered = [v for v in VARIANT_ORDER if v in present]
    ordered += sorted(present - set(ordered))
    order_map = {v: i for i, v in enumerate(ordered)}

    matrices: dict[str, list] = {}
    for dataset in datasets:
        sub = df.filter(pl.col("dataset") == dataset)
        agg = sub.group_by("variant").agg([pl.col(c).mean().round(4).alias(c) for c in layer_cols])
        agg = (
            agg.with_columns(
                pl.col("variant")
                .map_elements(lambda v: order_map.get(v, 999), return_dtype=pl.Int32)
                .alias("_order")
            )
            .sort("_order")
            .drop("_order")
        )
        variant_vals = {row["variant"]: row for row in agg.to_dicts()}
        matrices[dataset] = [
            [round(float(variant_vals[v][lc]), 4) if v in variant_vals else None for v in ordered]
            for lc in layer_cols
        ]

    cka_data = {
        "matrices": matrices,
        "teacher_layers": [f"Layer {i}" for i in range(n_layers)],
        "student_layers": ordered,
    }
    write_json(FIGURES_DIR / "cka" / "data.json", cka_data, dry_run=dry_run)


# ── UMAP figure ───────────────────────────────────────────────────────────────


def _umap_one(
    embeddings: "np.ndarray",
    labels: "np.ndarray",
    umap_lib: object,
    gaussian_kde: object,
    wasserstein_distance: object,
) -> dict:
    """Project one embeddings array to 2D and compute separability metrics."""
    reducer = umap_lib.UMAP(n_components=2, random_state=42, n_jobs=1)  # type: ignore[attr-defined]
    projected: np.ndarray = reducer.fit_transform(embeddings)

    label_map = {0: "Normal", 1: "Attack"}
    points = [
        {
            "x": round(float(projected[i, 0]), 6),
            "y": round(float(projected[i, 1]), 6),
            "label": int(labels[i]),
            "attack_type": label_map[int(labels[i])],
        }
        for i in range(len(labels))
    ]

    xs, ys = projected[:, 0], projected[:, 1]
    pad = 0.5
    bounds = {
        "x1": round(float(xs.min() - pad), 2),
        "y1": round(float(ys.min() - pad), 2),
        "x2": round(float(xs.max() + pad), 2),
        "y2": round(float(ys.max() + pad), 2),
    }

    normal = projected[labels == 0]
    attack = projected[labels == 1]

    # Wasserstein distance: average of 1D marginal distances over both axes
    w2d = float(
        (
            wasserstein_distance(normal[:, 0], attack[:, 0])  # type: ignore[operator]
            + wasserstein_distance(normal[:, 1], attack[:, 1])  # type: ignore[operator]
        )
        / 2
    )

    # Energy distance: E[||X-Y||] - 0.5*E[||X-X'||] - 0.5*E[||Y-Y'||], subsampled
    rng = np.random.default_rng(42)
    n_sample = min(500, len(normal), len(attack))
    n_sub = normal[rng.choice(len(normal), n_sample, replace=False)]
    a_sub = attack[rng.choice(len(attack), n_sample, replace=False)]
    energy_dist = float(
        np.linalg.norm(n_sub[:, None] - a_sub[None, :], axis=2).mean()
        - 0.5 * np.linalg.norm(n_sub[:, None] - n_sub[None, :], axis=2).mean()
        - 0.5 * np.linalg.norm(a_sub[:, None] - a_sub[None, :], axis=2).mean()
    )

    # Overlap integral: KDE minimum density evaluated on a 50×50 grid
    try:
        kde_n = gaussian_kde(normal.T)  # type: ignore[operator]
        kde_a = gaussian_kde(attack.T)  # type: ignore[operator]
        xx, yy = np.mgrid[xs.min() : xs.max() : 50j, ys.min() : ys.max() : 50j]
        grid = np.vstack([xx.ravel(), yy.ravel()])
        p_n = kde_n(grid).reshape(50, 50)
        p_a = kde_a(grid).reshape(50, 50)
        p_n /= p_n.sum()
        p_a /= p_a.sum()
        overlap = float(np.minimum(p_n, p_a).sum())
    except Exception:
        overlap = 0.0

    metrics = {
        "overlap_integral": round(overlap, 6),
        "wasserstein_2d": round(w2d, 4),
        "energy_distance": round(energy_dist, 4),
    }
    return {"points": points, "bounds": bounds, "metrics": metrics}


def build_umap_figure(dry_run: bool = False) -> None:
    """Project embeddings.npz for UMAP_GROUP/UMAP_VARIANT/UMAP_SEED across all datasets.

    Uses binary labels (Normal/Attack). Multi-class attack types require a GraphIDS
    export fix — subclass_labels not yet present in embeddings.npz.
    Output: {datasets: {dataset: {points, bounds, metrics}}}
    """
    try:
        import umap as umap_lib
    except ImportError:
        print("\n  [SKIP umap] umap-learn not installed — run `uv sync` to add it")
        return

    from scipy.stats import gaussian_kde, wasserstein_distance

    suffix = f"/{UMAP_GROUP}/{UMAP_VARIANT}/seed_{UMAP_SEED}/embeddings.npz"
    print(
        f"\nBuilding UMAP figure from {ANALYSIS_REPO_ID} "
        f"(group={UMAP_GROUP}, variant={UMAP_VARIANT}, seed={UMAP_SEED})..."
    )

    all_files = list(list_repo_files(ANALYSIS_REPO_ID, repo_type="dataset"))
    datasets = sorted(
        p.split("/")[1] for p in all_files if p.startswith("analysis/") and p.endswith(suffix)
    )
    if not datasets:
        print("  no matching embeddings.npz found — skipping")
        return
    print(f"  found {len(datasets)} datasets: {datasets}")

    dataset_data: dict[str, dict] = {}
    for dataset in datasets:
        fpath = f"analysis/{dataset}{suffix}"
        local = hf_hub_download(repo_id=ANALYSIS_REPO_ID, filename=fpath, repo_type="dataset")
        d = np.load(local)
        embeddings: np.ndarray = d["embeddings"]
        labels: np.ndarray = d["labels"]
        print(f"  {dataset}: {embeddings.shape[0]} × {embeddings.shape[1]} → UMAP 2D ...")
        result = _umap_one(embeddings, labels, umap_lib, gaussian_kde, wasserstein_distance)
        print(f"    metrics: {result['metrics']}")
        dataset_data[dataset] = result

    write_json(FIGURES_DIR / "umap" / "data.json", {"datasets": dataset_data}, dry_run=dry_run)


# ── Metrics tables (graphids-kd-gat) ─────────────────────────────────────────

SKIPPED_TABLES = {
    "main_results.csv": "f1_macro-only bundle; multi-metric leaderboard not regenerable here",
    "test_results.csv": "cross-dataset test scenarios not in this bundle",
    "vgae_threshold.csv": "optimal_threshold/youden_j not in this bundle",
}

SKIPPED_FIGURES = {
    "attention": "attention_weights.npz absent from most runs in graphids-data",
    "attention-heatmap": "aggregated attention not in current exports",
    "reconstruction": "per-component decomposition not in current exports",
    "fusion": "dqn_policy with per-graph labels not in graphids-data",
}


def pull_metrics(dry_run: bool = False) -> None:
    print(f"Pulling metrics from huggingface.co/datasets/{METRICS_REPO_ID}")
    meta = fetch_metadata(METRICS_REPO_ID)
    print(f"  ablation_set:    {meta.get('ablation_set')}")
    print(f"  metric:          {meta.get('metric')}")
    print(f"  graphids_sha:    {meta.get('graphids_sha')}")
    print(f"  groups:          {meta.get('groups')}")
    print(f"  datasets:        {meta.get('datasets')}")

    manifest = load_input_manifest()
    csv_dir = ROOT / "data" / "csv"
    print(f"\nBuilding {len(manifest)} CSVs from metrics/ bucket...")
    for parquet, spec in manifest.items():
        df = fetch_parquet(METRICS_REPO_ID, parquet, spec["columns"])
        sort_by = spec.get("sort_by", [])
        if sort_by:
            df = df.sort(sort_by, descending=spec.get("descending", False))
        write_csv(csv_dir / spec["output"], df, dry_run=dry_run)

    print("\nSkipped tables (not in metrics bundle):")
    for name, reason in SKIPPED_TABLES.items():
        print(f"  - {name}: {reason}")


# ── entry point ───────────────────────────────────────────────────────────────


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Show what would be written")
    parser.add_argument("--skip-metrics", action="store_true", help="Skip metrics table pull")
    parser.add_argument("--skip-figures", action="store_true", help="Skip figure data generation")
    args = parser.parse_args()

    if not args.skip_metrics:
        pull_metrics(dry_run=args.dry_run)

    if not args.skip_figures:
        build_cka_figure(dry_run=args.dry_run)
        build_umap_figure(dry_run=args.dry_run)

        print("\nStill skipped figures (artifacts not yet available in graphids-data):")
        for name, reason in SKIPPED_FIGURES.items():
            print(f"  - {name}: {reason}")

    if not args.dry_run:
        print("\nValidating output...")
        result = subprocess.run([sys.executable, str(VALIDATOR)], capture_output=True, text=True)
        print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        if result.returncode:
            print("Validation failed — some figures may need KD-GAT export pipeline")
        sys.exit(result.returncode)


if __name__ == "__main__":
    main()
