#!/usr/bin/env python3
"""Pull paper data from the buckeyeguy/graphids-kd-gat HF dataset.

The bundle is an ablation set keyed on (group, variant, dataset, seed). Bundle
metadata identifies the active metric (currently f1_macro) and which groups
and datasets are present. Authentication uses HF_TOKEN (env var) via
huggingface_hub.

The pull manifest lives in data/schemas.yaml under `input:` — each parquet
entry declares its columns, output CSV, and sort order. New metrics are added
by editing the schema, not this file.

Outputs (data/csv/):
  - leaderboard.csv         f1_macro mean +/- CI per (group, variant, dataset)
  - effect_size.csv         pairwise effect sizes within each group
  - expected_max.csv        expected max-of-K f1_macro per variant
  - tie_candidates.csv      variant pairs that are statistically tied

Skipped (this bundle does not provide):
  - umap, cka, attention, attention-heatmap, reconstruction
      need artifacts/analysis/, currently 0 files (run `python -m graphids
      analyze` against the staged checkpoints to populate)
  - fusion
      needs dqn_policy with per-graph labels, not in this bundle

The committed data/csv/main_results.csv (multi-metric leaderboard from the old
buckeyeguy/GraphIDS flat-parquet bundle, retired 2026-04-28) is NOT regenerated
here: this bundle is f1_macro-only. KD-GAT must re-export multi-metric data, or
main_results.csv stays at its committed values.

Usage:
    python tools/pull_data.py                       # pull everything
    python tools/pull_data.py --dry-run             # preview only
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import polars as pl
import yaml
from huggingface_hub import hf_hub_download

REPO_ID = "buckeyeguy/graphids-kd-gat"
ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "data" / "schemas.yaml"
VALIDATOR = ROOT / "tools" / "validate" / "inputs" / "data.py"


def load_input_manifest() -> dict[str, dict]:
    """Return {parquet_path: spec} for every entry under schemas.yaml's `input:`."""
    with open(SCHEMA_PATH) as f:
        return yaml.safe_load(f).get("input", {})


def fetch_parquet(filename: str, expected_columns: list[str]) -> pl.DataFrame:
    """Download a parquet from the HF bundle and validate columns."""
    local = hf_hub_download(repo_id=REPO_ID, filename=filename, repo_type="dataset")
    df = pl.read_parquet(local)
    missing = [c for c in expected_columns if c not in df.columns]
    if missing:
        raise ValueError(
            f"{REPO_ID}/{filename} is missing expected columns: {missing}\n"
            f"  Found: {df.columns}\n"
            f"  Update data/schemas.yaml or fix the KD-GAT export."
        )
    return df


def fetch_metadata() -> dict:
    """Pull metadata.json from the bundle root."""
    local = hf_hub_download(repo_id=REPO_ID, filename="metadata.json", repo_type="dataset")
    with open(local) as f:
        return json.load(f)


SKIPPED_TABLES = {
    "main_results.csv": "this bundle is f1_macro-only; multi-metric leaderboard not regenerable here",
    "test_results.csv": "cross-dataset test scenarios not in this bundle",
    "vgae_threshold.csv": "optimal_threshold/youden_j not in this bundle",
}

SKIPPED_FIGURES = {
    "umap": "needs artifacts/analysis/ - currently 0 files in bundle",
    "cka": "needs artifacts/analysis/ - currently 0 files in bundle",
    "attention": "needs per-edge weights from analyze batch - currently 0 files",
    "attention-heatmap": "needs aggregated attention from analyze batch - currently 0 files",
    "reconstruction": "needs per-component decomposition from analyze batch",
    "fusion": "needs dqn_policy with per-graph labels - not in this bundle",
}


def write_csv(path: Path, df: pl.DataFrame, *, dry_run: bool = False) -> None:
    if dry_run:
        print(f"  [dry-run] would write {path.relative_to(ROOT)} ({len(df)} rows)")
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    df.write_csv(path)
    print(f"  wrote {path.relative_to(ROOT)} ({len(df)} rows)")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Show what would be written")
    args = parser.parse_args()

    print(f"Pulling data from huggingface.co/datasets/{REPO_ID}")

    meta = fetch_metadata()
    print(f"  ablation_set:    {meta.get('ablation_set')}")
    print(f"  metric:          {meta.get('metric')}")
    print(f"  graphids_sha:    {meta.get('graphids_sha')}")
    print(f"  groups:          {meta.get('groups')}")
    print(f"  datasets:        {meta.get('datasets')}")
    print(f"  artifact_counts: {meta.get('artifact_counts')}")

    manifest = load_input_manifest()
    csv_dir = ROOT / "data" / "csv"

    print(f"\nBuilding {len(manifest)} CSVs from metrics/ bucket...")
    for parquet, spec in manifest.items():
        df = fetch_parquet(parquet, spec["columns"])
        sort_by = spec.get("sort_by", [])
        if sort_by:
            df = df.sort(sort_by, descending=spec.get("descending", False))
        write_csv(csv_dir / spec["output"], df, dry_run=args.dry_run)

    print("\nSkipped tables (this bundle does not provide):")
    for name, reason in SKIPPED_TABLES.items():
        print(f"  - {name}: {reason}")

    print("\nSkipped figures (this bundle does not provide):")
    if meta.get("artifact_counts", {}).get("analysis", 0) == 0:
        print("  artifacts/analysis/ is empty in this bundle.")
        print("  Run `python -m graphids analyze` against the staged checkpoints to populate it.")
    for name, reason in SKIPPED_FIGURES.items():
        print(f"  - {name}: {reason}")

    print("\nValidating output...")
    result = subprocess.run([sys.executable, str(VALIDATOR)], capture_output=True, text=True)
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    if result.returncode:
        print("Validation failed - some figures may need KD-GAT export pipeline")
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
