#!/usr/bin/env python3
"""Build markdown tables from raw CSVs + YAML spec.

Reads data/tables/spec.yaml, loads each CSV, merges literature baselines,
applies formatting + bolding, writes _build/tables/{name}.md.

Usage:
    python data/tables/build.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import yaml
from tabulate import tabulate

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "data" / "tables" / "spec.yaml"
OUT_DIR = ROOT / "_build" / "tables"


def load_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        print(f"  WARNING: {path.relative_to(ROOT)} not found", file=sys.stderr)
        return pd.DataFrame()
    return pd.read_csv(path, dtype=str)  # keep everything as strings for formatting


def render_table(
    df: pd.DataFrame,
    columns: dict[str, str],
    formats: dict[str, str],
    bold_models: set[str] | None = None,
    separator_at: int | None = None,
) -> str:
    """Render a DataFrame as a markdown pipe table via tabulate."""
    if df.empty:
        return "*No data available.*\n"

    bold_models = bold_models or set()
    keys = list(columns.keys())
    headers = list(columns.values())

    # Format values and apply bold
    rows: list[list[str]] = []
    for i, (_, row) in enumerate(df.iterrows()):
        # Insert blank separator row between groups
        if separator_at is not None and i == separator_at:
            rows.append([""] * len(keys))

        cells = []
        for k in keys:
            val = row.get(k, "")
            fmt = formats.get(k)
            if fmt and val not in (None, "", "nan"):
                try:
                    val = fmt.format(float(val))
                except (ValueError, TypeError):
                    pass
            cells.append(str(val) if val is not None else "")

        if row.get("model", "") in bold_models:
            cells = [f"**{c}**" for c in cells]

        rows.append(cells)

    return tabulate(rows, headers=headers, tablefmt="github", disable_numparse=True) + "\n"


def build_table(name: str, spec: dict) -> None:
    """Build a single table from its spec entry."""
    source = ROOT / "data" / spec["source"]
    df = load_csv(source)

    sort_order = spec.get("sort_order", {})
    bold_models: set[str] = set(sort_order.get("bold_models", []))
    baselines_first = sort_order.get("baselines_first", False)

    # Load and merge baselines
    separator_at = None
    if "baselines_source" in spec:
        baselines = load_csv(ROOT / "data" / spec["baselines_source"])
        if not baselines.empty and baselines_first:
            baselines = baselines.sort_values("model")
            df = df.sort_values("model")
            separator_at = len(baselines)
            df = pd.concat([baselines, df], ignore_index=True)
        elif not baselines.empty:
            df = pd.concat([df, baselines], ignore_index=True)

    # Fallback sort
    sort_keys = spec.get("sort_by", [])
    if sort_keys and separator_at is None:
        df = df.sort_values(sort_keys)

    md = render_table(df, spec.get("columns", {}), spec.get("format", {}), bold_models, separator_at)
    out_path = OUT_DIR / f"{name}.md"
    out_path.write_text(md)
    print(f"  {name}: {len(df)} rows -> {out_path.relative_to(ROOT)}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    spec = yaml.safe_load(SPEC_PATH.read_text())
    print("Building tables from spec...")
    for name, table_spec in spec.items():
        build_table(name, table_spec)
    print("Done")


if __name__ == "__main__":
    main()
