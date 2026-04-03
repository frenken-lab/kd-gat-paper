#!/usr/bin/env python3
"""Build markdown tables from raw CSVs + YAML spec.

Reads tools/tables/spec.yaml, loads each CSV, merges literature baselines,
applies formatting + bolding, writes _build/tables/{name}.md.

Usage:
    python tools/tables/build.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import yaml
from tabulate import tabulate

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "tools" / "tables" / "spec.yaml"
STYLES_PATH = ROOT / "styles.yml"
OUT_DIR = ROOT / "_build" / "tables"

# Load palette fills from shared styles (used by HTML table renderer)
_styles = yaml.safe_load(STYLES_PATH.read_text())
FILL_GREEN = _styles["fills"]["green"]   # #D7E8D3 — best-in-column
FILL_BLUE = _styles["fills"]["blue"]     # #DAE3EF — near-best
ACCENT_BLUE = _styles["palette"]["blue"] # #4E79A7 — our-model left border


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


def render_html_table(
    df: pd.DataFrame,
    columns: dict[str, str],
    formats: dict[str, str],
    bold_models: set[str] | None = None,
    separator_at: int | None = None,
) -> str:
    """Render a DataFrame as an HTML table with inline styles and conditional formatting."""
    if df.empty:
        return "<p><em>No data available.</em></p>\n"

    bold_models = bold_models or set()
    keys = list(columns.keys())
    headers = list(columns.values())
    metric_keys = [k for k in keys if k != "model" and formats.get(k)]

    # Compute column-wise best for conditional coloring
    col_best: dict[str, float] = {}
    for k in metric_keys:
        numeric = pd.to_numeric(df[k], errors="coerce")
        if numeric.notna().any():
            col_best[k] = numeric.max()

    # Table styles
    table_css = (
        "border-collapse:collapse; width:100%; font-size:0.9rem; "
        "font-family:system-ui,-apple-system,sans-serif"
    )
    th_css = "padding:6px 12px; text-align:right; font-weight:600; border-bottom:2px solid #333"
    th_model_css = th_css.replace("text-align:right", "text-align:left")

    lines = [f'<table style="{table_css}">']

    # Header
    lines.append("  <thead>")
    lines.append('    <tr style="border-top:2px solid #333">')
    for i, h in enumerate(headers):
        css = th_model_css if i == 0 else th_css
        lines.append(f'      <th style="{css}">{h}</th>')
    lines.append("    </tr>")
    lines.append("  </thead>")

    # Body
    lines.append("  <tbody>")
    row_idx = 0
    for _, row in df.iterrows():
        # Separator row
        if separator_at is not None and row_idx == separator_at:
            lines.append(
                f'    <tr><td colspan="{len(keys)}" '
                f'style="height:4px; border-bottom:1px solid #ccc; padding:0"></td></tr>'
            )

        is_ours = row.get("model", "") in bold_models
        is_last = row_idx == len(df) - 1

        cells: list[str] = []
        for i, k in enumerate(keys):
            val = row.get(k, "")
            fmt = formats.get(k)
            if fmt and val not in (None, "", "nan"):
                try:
                    val = fmt.format(float(val))
                except (ValueError, TypeError):
                    pass
            val = str(val) if val is not None else ""

            # Cell styling
            parts = ["padding:6px 12px"]
            if i == 0:
                parts.append("text-align:left")
            else:
                parts.append("text-align:right; font-variant-numeric:tabular-nums")

            # Conditional coloring for metric cells
            if k in col_best:
                try:
                    num = float(row.get(k, ""))
                    if num == col_best[k]:
                        parts.append(f"background:{FILL_GREEN}")
                    elif num >= col_best[k] * 0.99:
                        parts.append(f"background:{FILL_BLUE}")
                except (ValueError, TypeError):
                    pass

            # Bottom border on last row
            if is_last:
                parts.append("border-bottom:2px solid #333")
            else:
                parts.append("border-bottom:1px solid rgba(0,0,0,0.05)")

            # Our-model accent
            if is_ours:
                parts.append("font-weight:700")
                if i == 0:
                    parts.append(f"border-left:3px solid {ACCENT_BLUE}")

            css = "; ".join(parts)
            cells.append(f'      <td style="{css}">{val}</td>')

        lines.append("    <tr>")
        lines.extend(cells)
        lines.append("    </tr>")
        row_idx += 1

    lines.append("  </tbody>")
    lines.append("</table>")
    return "\n".join(lines) + "\n"


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

    cols, fmts = spec.get("columns", {}), spec.get("format", {})
    if spec.get("format_mode") == "html":
        md = render_html_table(df, cols, fmts, bold_models, separator_at)
    else:
        md = render_table(df, cols, fmts, bold_models, separator_at)
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
