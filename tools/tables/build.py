#!/usr/bin/env python3
"""Build HTML tables from raw CSVs + YAML spec.

Reads tools/tables/spec.yaml, loads each CSV with polars, merges literature
baselines, applies formatting + per-cell highlighting, writes
_build/tables/{name}.md as great-tables HTML.

Distill (TMLR Beyond PDF), the MyST site, and curve.space all render raw
HTML tables, so a single render path covers every consumer. The TMLR
serializer (tools/tmlr/build.mjs) copies these files through verbatim.

Usage:
    uv run python tools/tables/build.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import polars as pl
import yaml
from great_tables import GT, loc, style

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "tools" / "tables" / "spec.yaml"
STYLES_PATH = ROOT / "styles.yml"
OUT_DIR = ROOT / "_build" / "tables"

_styles = yaml.safe_load(STYLES_PATH.read_text())
FILL_GREEN = _styles["fills"]["green"]    # best-in-column
FILL_BLUE = _styles["fills"]["blue"]      # near-best (>= 99% of column max)
ACCENT_BLUE = _styles["palette"]["blue"]  # our-model accent border


def load_csv(path: Path) -> pl.DataFrame:
    if not path.exists():
        print(f"  WARNING: {path.relative_to(ROOT)} not found", file=sys.stderr)
        return pl.DataFrame()
    # All strings: spec-driven formatting handles numeric coercion downstream.
    return pl.read_csv(path, infer_schema_length=0)


def _decimals_from_format(fmt: str) -> int:
    m = re.search(r"\.(\d+)f", fmt)
    return int(m.group(1)) if m else 4


def render_html_table(
    df: pl.DataFrame,
    columns: dict[str, str],
    formats: dict[str, str],
    bold_models: set[str],
    separator_at: int | None,
) -> str:
    """Publication-grade HTML via great-tables. Conditional fill on best/near-best;
    our-model rows get bold + accent border on the model column."""
    if df.is_empty():
        return "<p><em>No data available.</em></p>\n"

    keys = list(columns.keys())
    metric_keys = [k for k in keys if k != "model" and formats.get(k)]

    # Coerce metric columns to float so great-tables can format numerically and
    # so our column-max comparisons work in polars expressions below.
    df_typed = df.with_columns(
        [pl.col(k).cast(pl.Float64, strict=False) for k in metric_keys if k in df.columns]
    )

    # Use row groups to render the baselines/our-models separator. Empty-string
    # group labels keep the visual separator without a labeled header.
    if separator_at is not None and 0 < separator_at < df_typed.height:
        groups = ["baselines"] * separator_at + ["ours"] * (df_typed.height - separator_at)
        df_typed = df_typed.with_columns(pl.Series("_group", groups))
        gt = GT(df_typed, groupname_col="_group")
    else:
        gt = GT(df_typed)

    # Column labels and alignment
    gt = gt.cols_label(**{k: v for k, v in columns.items() if k in df_typed.columns})
    if metric_keys:
        gt = gt.cols_align(align="right", columns=metric_keys)
    if "model" in df_typed.columns:
        gt = gt.cols_align(align="left", columns=["model"])

    # Numeric formatting per column from the {:.Nf} spec strings
    for k, fmt in formats.items():
        if k in metric_keys:
            gt = gt.fmt_number(columns=k, decimals=_decimals_from_format(fmt))

    # Conditional fill: best-in-column → green, near-best (>= 99% of max) → blue
    for k in metric_keys:
        col_max = df_typed[k].max()
        if col_max is None:
            continue
        gt = gt.tab_style(
            style=style.fill(color=FILL_GREEN),
            locations=loc.body(columns=k, rows=pl.col(k) == col_max),
        )
        gt = gt.tab_style(
            style=style.fill(color=FILL_BLUE),
            locations=loc.body(
                columns=k, rows=(pl.col(k) >= col_max * 0.99) & (pl.col(k) != col_max)
            ),
        )

    # Our-model emphasis: bold the row, accent border on the model cell
    if bold_models and "model" in df_typed.columns:
        ours = pl.col("model").is_in(list(bold_models))
        gt = gt.tab_style(style=style.text(weight="bold"), locations=loc.body(rows=ours))
        gt = gt.tab_style(
            style=style.borders(sides="left", color=ACCENT_BLUE, weight="3px"),
            locations=loc.body(columns="model", rows=ours),
        )

    return gt.as_raw_html() + "\n"


def build_table(name: str, spec: dict) -> None:
    source = ROOT / "data" / spec["source"]
    df = load_csv(source)

    sort_order = spec.get("sort_order", {})
    bold_models: set[str] = set(sort_order.get("bold_models", []))
    baselines_first = sort_order.get("baselines_first", False)

    # Merge literature baselines if declared. `diagonal` handles the column-set
    # mismatch (baselines carry citation_key; main results don't).
    separator_at: int | None = None
    if "baselines_source" in spec:
        baselines = load_csv(ROOT / "data" / spec["baselines_source"])
        if not baselines.is_empty() and baselines_first:
            baselines = baselines.sort("model")
            df = df.sort("model")
            separator_at = baselines.height
            df = pl.concat([baselines, df], how="diagonal")
        elif not baselines.is_empty():
            df = pl.concat([df, baselines], how="diagonal")

    sort_keys = spec.get("sort_by", [])
    if sort_keys and separator_at is None:
        df = df.sort(sort_keys)

    cols = spec.get("columns", {})
    fmts = spec.get("format", {})
    out = render_html_table(df, cols, fmts, bold_models, separator_at)

    out_path = OUT_DIR / f"{name}.md"
    out_path.write_text(out)
    print(f"  {name}: {df.height} rows -> {out_path.relative_to(ROOT)}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    spec = yaml.safe_load(SPEC_PATH.read_text())
    print("Building tables from spec...")
    for name, table_spec in spec.items():
        build_table(name, table_spec)
    print("Done")


if __name__ == "__main__":
    main()
