#!/usr/bin/env python3
"""Pull paper data from HuggingFace and transform to figure/table formats.

Downloads from buckeyeguy/GraphIDS dataset and produces:
  - data/csv/*.csv          (table source data)
  - interactive/src/figures/*/data.json  (figure plot data)

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

import pandas as pd
import yaml
from huggingface_hub import hf_hub_download

REPO_ID = "buckeyeguy/GraphIDS"
ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schemas.yaml"

DEFAULT_RUN = "hcrl_sa/eval_large_evaluation"
DEFAULT_KD_RUN = "hcrl_sa/eval_small_evaluation_kd"  # CKA only exists for KD runs


def download(filename: str) -> Path:
    """Download a file from the HF dataset, return local path."""
    return Path(hf_hub_download(REPO_ID, filename, repo_type="dataset"))


# ---------------------------------------------------------------------------
# Input schema — expected columns per HF parquet file.
# Reads from schemas.yaml so there's one source of truth.
# If KD-GAT changes its export, this fails loudly at pull time.
# ---------------------------------------------------------------------------


def _load_input_schema() -> dict[str, list[str]]:
    with open(SCHEMA_PATH) as f:
        schemas = yaml.safe_load(f)
    return {name: spec["columns"] for name, spec in schemas.get("input", {}).items()}


def validate_input(filename: str, df: pd.DataFrame) -> None:
    """Check that a downloaded parquet has the expected columns. Raises on mismatch."""
    input_schema = _load_input_schema()
    expected = input_schema.get(filename)
    if expected is None:
        return
    missing = [c for c in expected if c not in df.columns]
    if missing:
        raise ValueError(
            f"{REPO_ID}/{filename} is missing expected columns: {missing}\n"
            f"  Found: {list(df.columns)}\n"
            f"  The HF dataset schema may have drifted from what pull_data.py expects.\n"
            f"  Update INPUT_SCHEMA in pull_data.py or fix the KD-GAT export."
        )


def download_parquet(filename: str) -> pd.DataFrame:
    """Download a parquet from HF and validate its columns."""
    df = pd.read_parquet(download(filename))
    validate_input(filename, df)
    return df


# ---------------------------------------------------------------------------
# CSV transforms (tables)
# ---------------------------------------------------------------------------


def build_main_results(run_id: str) -> pd.DataFrame:
    """Extract main_results.csv from metrics.parquet for a given run."""
    df = download_parquet("metrics.parquet")
    subset = df[df["run_id"] == run_id].copy()
    if subset.empty:
        print(f"  WARN: no metrics for run_id={run_id}", file=sys.stderr)
        return pd.DataFrame()

    cols = ["model", "accuracy", "precision", "recall", "f1", "auc", "specificity", "mcc"]
    subset["model"] = subset["model"].str.upper()
    return subset[cols].reset_index(drop=True)



def build_model_parameters() -> pd.DataFrame:
    """Extract model_parameters.csv from model_sizes.json.

    Note: model_sizes.json has param counts but not architecture details
    (layers, heads, hidden). Those are currently hardcoded in the CSV.
    This function preserves the existing CSV if present.
    """
    # model_parameters.csv has architecture detail not in HF data — keep as-is
    existing = ROOT / "data" / "csv" / "model_parameters.csv"
    if existing.exists():
        return pd.read_csv(existing)
    return pd.DataFrame()


# ---------------------------------------------------------------------------
# Figure JSON transforms
# ---------------------------------------------------------------------------


def build_umap(run_id: str) -> list[dict]:
    """Build umap/data.json from embeddings.parquet.

    Filters to GAT embeddings for the given run, maps label to attack_type.
    """
    df = download_parquet("embeddings.parquet")
    subset = df[(df["run_id"] == run_id) & (df["model"] == "gat")].copy()
    if subset.empty:
        print(f"  WARN: no GAT embeddings for run_id={run_id}", file=sys.stderr)
        return []

    label_map = {0: "Normal", 1: "Attack"}
    subset["attack_type"] = subset["label"].map(label_map)

    # Sample to keep data.json reasonable (match schema min_items: 50)
    if len(subset) > 500:
        subset = subset.sample(n=500, random_state=42)

    return subset[["x", "y", "label", "attack_type"]].to_dict(orient="records")


def build_cka(run_id: str) -> dict:
    """Build cka/data.json from cka_similarity.parquet.

    Pivots to {matrix, teacher_layers, student_layers} format.
    """
    df = download_parquet("cka_similarity.parquet")
    subset = df[df["run_id"] == run_id].copy()
    if subset.empty:
        print(f"  WARN: no CKA data for run_id={run_id}", file=sys.stderr)
        return {}

    teacher_layers = sorted(subset["teacher_layer"].unique())
    student_layers = sorted(subset["student_layer"].unique())

    pivot = subset.pivot(index="teacher_layer", columns="student_layer", values="similarity")
    pivot = pivot.reindex(index=teacher_layers, columns=student_layers)
    matrix = pivot.values.tolist()

    return {
        "matrix": matrix,
        "teacher_layers": teacher_layers,
        "student_layers": student_layers,
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


def write_csv(path: Path, df: pd.DataFrame, *, dry_run: bool = False) -> None:
    if dry_run:
        print(f"  [dry-run] would write {path.relative_to(ROOT)} ({len(df)} rows)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    print(f"  wrote {path.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", default=DEFAULT_RUN, help="Run ID to extract (default: %(default)s)")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be written")
    args = parser.parse_args()

    run_id = args.run
    dataset = run_id.split("/")[0]  # e.g. "hcrl_sa"
    kd_run = f"{dataset}/eval_small_evaluation_kd"

    print(f"Pulling data from {REPO_ID}")
    print(f"  run_id: {run_id}")
    print(f"  kd_run: {kd_run}")

    # --- CSVs ---
    print("\nBuilding CSVs...")
    main_results = build_main_results(run_id)
    if not main_results.empty:
        write_csv(ROOT / "data" / "csv" / "main_results.csv", main_results, dry_run=args.dry_run)

    # These CSVs need data not available on HF — keep existing committed files
    print("  skipping vgae_threshold.csv (optimal_threshold/youden_j need KD-GAT export)")
    print("  skipping test_results.csv (cross-dataset test scenarios not in HF data)")
    print("  skipping model_parameters.csv (architecture detail not in HF data)")

    # --- Figure JSONs ---
    print("\nBuilding figure data...")

    umap_data = build_umap(run_id)
    if umap_data:
        write_json(ROOT / "interactive" / "src" / "figures" / "umap" / "data.json", umap_data, dry_run=args.dry_run)

    cka_data = build_cka(kd_run)
    if cka_data:
        write_json(ROOT / "interactive" / "src" / "figures" / "cka" / "data.json", cka_data, dry_run=args.dry_run)

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
        capture_output=True, text=True,
    )
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode:
        print("Validation failed — some figures may need KD-GAT export pipeline")
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
