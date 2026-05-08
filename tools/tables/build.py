#!/usr/bin/env python3
"""Build paper tables from tools/tables/spec.yaml.

This is the composition layer. The actual transforms (data prep, GT chain
steps, GFM serialization) live in tools/tables/transforms.py — this file
wires them into per-kind render pipelines and writes outputs.

Two outputs per spec entry, written to _build/tables/:
  {name}.md      great-tables HTML — for MyST {include}, the TMLR
                 verbatim passthrough, and curve.space.
  {name}.gfm.md  GFM pipe table — for tools/curvenote/buildv2.mjs editor
                 push (PM schema can't render raw HTML). Gated by the
                 spec's `editor:` flag (default true).

Adding a new kind: write `render_<kind>(spec) -> (df, html, gfm)`,
register it in RENDERERS, and add `kind: <kind>` to the spec entry.
Reusable transforms go in transforms.py; this file should stay thin.

Usage:
    uv run python tools/tables/build.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import polars as pl
import yaml
from great_tables import GT

sys.path.insert(0, str(Path(__file__).resolve().parent))
import transforms as t  # noqa: E402  (sibling module, see sys.path above)

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "tools" / "tables" / "spec.yaml"
STYLES_PATH = ROOT / "styles.yml"
OUT_DIR = ROOT / "_build" / "tables"

_styles = yaml.safe_load(STYLES_PATH.read_text())
FILL_BEST = _styles["fills"]["green"]  # best-in-column
FILL_NEAR = _styles["fills"]["blue"]  # near-best (>= 99% of max)
ACCENT = _styles["palette"]["blue"]  # our-model border accent


def _role_color(role_key: str) -> str:
    return _styles["palette"][_styles["roles"][role_key]]


# --- Per-kind composition --------------------------------------------------


def render_numeric(spec: dict) -> tuple[pl.DataFrame, str, str]:
    df = t.load_csv(ROOT / "data" / spec["source"])
    sort_order = spec.get("sort_order", {})
    bold_models: set[str] = set(sort_order.get("bold_models", []))

    separator_at: int | None = None
    if "baselines_source" in spec:
        baselines = t.load_csv(ROOT / "data" / spec["baselines_source"])
        df, separator_at = t.merge_baselines(
            df, baselines, sort_order.get("baselines_first", False)
        )

    sort_keys = spec.get("sort_by", [])
    if sort_keys and separator_at is None:
        df = df.sort(sort_keys)

    cols = spec.get("columns", {})
    fmts = spec.get("format", {})

    if df.is_empty():
        return df, "<p><em>No data available.</em></p>\n", "_No data available._\n"

    keys = list(cols.keys())
    metric_keys = [k for k in keys if k != "model" and fmts.get(k)]
    df_typed = df.with_columns(
        [pl.col(k).cast(pl.Float64, strict=False) for k in metric_keys if k in df.columns]
    )
    model_present = "model" in df_typed.columns

    if separator_at is not None and 0 < separator_at < df_typed.height:
        groups = ["baselines"] * separator_at + ["ours"] * (df_typed.height - separator_at)
        df_typed = df_typed.with_columns(pl.Series("_group", groups))
        gt = GT(df_typed, groupname_col="_group")
    else:
        gt = GT(df_typed)

    decimals = {k: t.decimals_from_format(fmts[k]) for k in metric_keys}

    gt = (
        gt.cols_label(**{k: v for k, v in cols.items() if k in df_typed.columns})
        .pipe(t.numeric_align, metric_keys, model_present)
        .pipe(t.numeric_format, metric_keys, decimals)
        .pipe(t.numeric_best_near_best, df_typed, metric_keys, FILL_BEST, FILL_NEAR)
        .pipe(t.numeric_bold_our_models, bold_models, ACCENT, model_present)
    )

    return df, gt.as_raw_html() + "\n", t.render_numeric_gfm(df, cols, fmts, bold_models)


def render_harvey_balls(spec: dict) -> tuple[pl.DataFrame, str, str]:
    records = t.harvey_records(spec)
    if not records:
        return (
            pl.DataFrame(),
            "<p><em>No data available.</em></p>\n",
            "_No data available._\n",
        )

    df = pl.DataFrame(records)
    cov_cols = spec["spanner"]["over"]
    challenge_color = {c: _role_color(f"challenge_{c}") for c in cov_cols}

    gt = (
        GT(df, rowname_col="contribution", groupname_col="_grp")
        .cols_hide(columns="section")
        .pipe(t.harvey_label_and_spanner, spec)
        .pipe(t.harvey_order_groups, spec)
        .pipe(t.harvey_color_columns, cov_cols, challenge_color)
        .pipe(t.harvey_highlight_section, spec)
        .pipe(t.add_source_note, "● primary &middot; ◐ secondary")
        .pipe(t.theme_538)
    )

    return df, gt.as_raw_html() + "\n", t.render_harvey_gfm(df, spec)


def render_definition(spec: dict) -> tuple[pl.DataFrame, str, str]:
    """Render a simple definition/glossary table from inline rows."""
    cols = spec["columns"]
    rows = spec["rows"]
    keys = list(cols.keys())
    records = [{keys[i]: row[i] for i in range(len(keys))} for row in rows]
    df = pl.DataFrame(records)

    gt = GT(df).cols_label(**cols).cols_align(align="left").pipe(t.theme_538)

    gfm_lines = [
        "| " + " | ".join(cols.values()) + " |",
        "| " + " | ".join("---" for _ in cols) + " |",
    ]
    for row in rows:
        gfm_lines.append("| " + " | ".join(str(v) for v in row) + " |")

    return df, gt.as_raw_html() + "\n", "\n".join(gfm_lines) + "\n"


# --- Dispatch + write ------------------------------------------------------


RENDERERS = {
    "numeric": render_numeric,
    "harvey_balls": render_harvey_balls,
    "definition": render_definition,
}


def build_table(name: str, spec: dict) -> None:
    render = RENDERERS[spec.get("kind", "numeric")]
    df, html, gfm = render(spec)

    (OUT_DIR / f"{name}.md").write_text(html)

    # Emit standalone .html for iframe embedding (used by slides)
    if spec.get("kind") == "definition":
        standalone = (
            '<!DOCTYPE html><html><head><meta charset="utf-8">'
            "<style>body{margin:0;padding:8px;background:white;}</style>"
            f"</head><body>{html}</body></html>"
        )
        (OUT_DIR / f"{name}.html").write_text(standalone)

    suffix = ""
    if spec.get("editor", True):
        (OUT_DIR / f"{name}.gfm.md").write_text(gfm)
        suffix = " (+ .gfm.md)"

    print(f"  {name}: {df.height} rows -> _build/tables/{name}.md{suffix}")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    spec = yaml.safe_load(SPEC_PATH.read_text())
    print("Building tables from spec...")
    for name, table_spec in spec.items():
        build_table(name, table_spec)
    print("Done")


if __name__ == "__main__":
    main()
