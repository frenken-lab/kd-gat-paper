#!/usr/bin/env python3
"""Pull paper data from HuggingFace and transform to figure/table formats.

Downloads from buckeyeguy/GraphIDS dataset and produces:
  - data/csv/*.csv          (table source data)
  - interactive/src/figures/data/*/data.json  (figure plot data)

Usage:
    python tools/pull_data.py                          # default run
    python tools/pull_data.py --run hcrl_sa/eval_large_evaluation
    python tools/pull_data.py --dry-run                # show what would be written
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import polars as pl
import yaml

HF_BASE = "hf://datasets/buckeyeguy/GraphIDS"
ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schemas.yaml"

DEFAULT_RUN = "hcrl_sa/eval_large_evaluation"


# ---------------------------------------------------------------------------
# Input schema — expected columns per HF parquet file.
# Reads from schemas.yaml so there's one source of truth.
# If KD-GAT changes its export, this fails loudly at pull time.
# ---------------------------------------------------------------------------


def _load_input_schema() -> dict[str, list[str]]:
    with open(SCHEMA_PATH) as f:
        schemas = yaml.safe_load(f)
    return {name: spec["columns"] for name, spec in schemas.get("input", {}).items()}


def read_parquet(filename: str) -> pl.DataFrame:
    """Read a parquet from HF and validate its columns."""
    df = pl.read_parquet(f"{HF_BASE}/{filename}")
    input_schema = _load_input_schema()
    expected = input_schema.get(filename)
    if expected is not None:
        missing = [c for c in expected if c not in df.columns]
        if missing:
            raise ValueError(
                f"{HF_BASE}/{filename} is missing expected columns: {missing}\n"
                f"  Found: {df.columns}\n"
                f"  The HF dataset schema may have drifted from what pull_data.py expects.\n"
                f"  Update data/schemas.yaml or fix the KD-GAT export."
            )
    return df


# ---------------------------------------------------------------------------
# CSV transforms (tables)
# ---------------------------------------------------------------------------


def build_main_results(run_id: str) -> pl.DataFrame | None:
    """Extract main_results.csv from metrics.parquet for a given run."""
    df = read_parquet("metrics.parquet")
    subset = df.filter(pl.col("run_id") == run_id)
    if subset.is_empty():
        print(f"  WARN: no metrics for run_id={run_id}", file=sys.stderr)
        return None

    cols = ["model", "accuracy", "precision", "recall", "f1", "auc", "specificity", "mcc"]
    return subset.select(cols).with_columns(pl.col("model").str.to_uppercase())


# ---------------------------------------------------------------------------
# Figure JSON transforms
# ---------------------------------------------------------------------------


def build_umap(run_id: str) -> dict:
    """Build umap/data.json from embeddings.parquet.

    Filters to GAT embeddings for the given run, maps label to attack_type.
    Returns {points, bounds, metrics}:
      - points: every GAT embedding {x, y, label, attack_type} (raw input
        for svelteplot's <Density>, densityX/Y transforms, and Dot)
      - bounds: padded {x1, y1, x2, y2} used to pin the Plot domain so
        toggling classes doesn't reflow the axes
      - metrics: overlap integral, Wasserstein distance, energy distance

    All KDE/contour/histogram work happens client-side in svelteplot now;
    Python only ships raw points + the three separability scalars.
    """
    import numpy as np
    from scipy.stats import gaussian_kde, energy_distance, wasserstein_distance_nd

    df = read_parquet("embeddings.parquet")
    subset = df.filter((pl.col("run_id") == run_id) & (pl.col("model") == "gat")).with_columns(
        pl.col("label").replace_strict({0: "Normal", 1: "Attack"}).alias("attack_type")
    )
    if subset.is_empty():
        print(f"  WARN: no GAT embeddings for run_id={run_id}", file=sys.stderr)
        return {}

    # Padded bounds for axis pinning (5% on each side).
    x_min, x_max = subset["x"].min(), subset["x"].max()
    y_min, y_max = subset["y"].min(), subset["y"].max()
    pad_x = (x_max - x_min) * 0.05
    pad_y = (y_max - y_min) * 0.05
    x1, x2 = x_min - pad_x, x_max + pad_x
    y1, y2 = y_min - pad_y, y_max + pad_y

    # Separability metrics (computed from full point sets).
    metrics = {}
    types = sorted(subset["attack_type"].unique())
    if len(types) == 2:
        a, b = types
        cls_a = subset.filter(pl.col("attack_type") == a)
        cls_b = subset.filter(pl.col("attack_type") == b)
        xy_a = np.vstack([cls_a["x"].to_numpy(), cls_a["y"].to_numpy()])  # (2, n_a)
        xy_b = np.vstack([cls_b["x"].to_numpy(), cls_b["y"].to_numpy()])  # (2, n_b)
        kde_a = gaussian_kde(xy_a)
        kde_b = gaussian_kde(xy_b)
        metrics["overlap_integral"] = round(float(kde_a.integrate_kde(kde_b)), 6)
        metrics["wasserstein_2d"] = round(float(wasserstein_distance_nd(xy_a.T, xy_b.T)), 4)
        metrics["energy_distance"] = round(float(energy_distance(xy_a.ravel(), xy_b.ravel())), 4)

    points = subset.select("x", "y", "label", "attack_type").to_dicts()

    return {
        "points": points,
        "bounds": {"x1": round(x1, 2), "y1": round(y1, 2), "x2": round(x2, 2), "y2": round(y2, 2)},
        "metrics": metrics,
    }


def build_cka(run_id: str) -> dict:
    """Build cka/data.json from cka_similarity.parquet.

    Pivots to {matrix, teacher_layers, student_layers} format.
    """
    df = read_parquet("cka_similarity.parquet")
    subset = df.filter(pl.col("run_id") == run_id)
    if subset.is_empty():
        print(f"  WARN: no CKA data for run_id={run_id}", file=sys.stderr)
        return {}

    pivot = subset.pivot(on="student_layer", index="teacher_layer", values="similarity")
    teacher_layers = sorted(pivot["teacher_layer"].to_list())
    student_cols = sorted([c for c in pivot.columns if c != "teacher_layer"])

    # Reorder rows to match sorted teacher_layers
    pivot = pivot.sort("teacher_layer")
    matrix = pivot.select(student_cols).to_numpy().tolist()

    return {
        "matrix": matrix,
        "teacher_layers": teacher_layers,
        "student_layers": student_cols,
    }


# ---------------------------------------------------------------------------
# Figures that can't be derived from HF data (yet)
# ---------------------------------------------------------------------------

SKIP_FIGURES = {
    "reconstruction": (
        "recon_errors.parquet has only scalar error per graph, no per-component "
        "decomposition (Node Recon, CAN ID, Neighbor, KL). Needs KD-GAT export."
    ),
    "attention": (
        "attention_weights.parquet has mean_alpha per head (aggregated), not "
        "per-edge weights. graph_samples.json has topology but no pre-computed "
        "node positions. Needs KD-GAT export."
    ),
}


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def write_json(path: Path, data: dict | list, *, dry_run: bool = False) -> None:
    if dry_run:
        n = len(data) if isinstance(data, list) else len(data.get("matrix", data))
        print(f"  [dry-run] would write {path.relative_to(ROOT)} ({n} items)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=None, separators=(",", ":"))
    print(f"  wrote {path.relative_to(ROOT)}")


def write_csv(path: Path, df: pl.DataFrame, *, dry_run: bool = False) -> None:
    if dry_run:
        print(f"  [dry-run] would write {path.relative_to(ROOT)} ({len(df)} rows)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    df.write_csv(path)
    print(f"  wrote {path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--run", default=DEFAULT_RUN, help="Run ID to extract (default: %(default)s)"
    )
    parser.add_argument("--dry-run", action="store_true", help="Show what would be written")
    args = parser.parse_args()

    run_id = args.run
    dataset = run_id.split("/")[0]  # e.g. "hcrl_sa"
    kd_run = f"{dataset}/eval_small_evaluation_kd"

    print(f"Pulling data from {HF_BASE}")
    print(f"  run_id: {run_id}")
    print(f"  kd_run: {kd_run}")

    # --- CSVs ---
    print("\nBuilding CSVs...")
    main_results = build_main_results(run_id)
    if main_results is not None:
        write_csv(ROOT / "data" / "csv" / "main_results.csv", main_results, dry_run=args.dry_run)

    # These CSVs need data not available on HF — keep existing committed files
    print("  skipping vgae_threshold.csv (optimal_threshold/youden_j need KD-GAT export)")
    print("  skipping test_results.csv (cross-dataset test scenarios not in HF data)")
    print("  skipping model_parameters.csv (architecture detail not in HF data)")

    # --- Figure JSONs ---
    print("\nBuilding figure data...")

    umap_data = build_umap(run_id)
    if umap_data and umap_data.get("points"):
        write_json(
            ROOT / "interactive" / "src" / "figures" / "data" / "umap" / "data.json",
            umap_data,
            dry_run=args.dry_run,
        )

    cka_data = build_cka(kd_run)
    if cka_data:
        write_json(
            ROOT / "interactive" / "src" / "figures" / "data" / "cka" / "data.json",
            cka_data,
            dry_run=args.dry_run,
        )

    # fusion: dqn_policy.parquet lacks per-graph labels, so we can't produce
    # the full format (alpha + label + attack_type). Keep existing data.json.
    print("  skipping fusion/data.json — HF data lacks per-graph labels. Needs KD-GAT export.")

    # Figures that can't be derived
    for fig, reason in SKIP_FIGURES.items():
        print(f"  skipping {fig}/data.json — {reason}")

    # --- Validate output against schemas.yaml ---
    print("\nValidating output...")
    import subprocess

    result = subprocess.run(
        [sys.executable, str(ROOT / "tools" / "validate_data.py")],
        capture_output=True,
        text=True,
    )
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode:
        print("Validation failed — some figures may need KD-GAT export pipeline")
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
