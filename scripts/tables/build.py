#!/usr/bin/env python3
"""Build markdown tables from raw CSVs + YAML spec.

Reads data/tables/spec.yaml, loads each CSV, merges literature baselines,
applies formatting + bolding, writes data/tables/{name}.md.

Output uses booktabs-style pipe tables: clean header separation,
no vertical rules in spirit (pipe tables require |), professional alignment.

Usage:
    python scripts/tables/build.py
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
SPEC_PATH = ROOT / "data" / "tables" / "spec.yaml"
OUT_DIR = ROOT / "data" / "tables"


def load_csv(path: Path) -> list[dict]:
    if not path.exists():
        print(f"  WARNING: {path.relative_to(ROOT)} not found", file=sys.stderr)
        return []
    with open(path) as f:
        return list(csv.DictReader(f))


def format_value(val: str | None, fmt: str | None) -> str:
    """Format a single cell value using a Python format string."""
    if fmt and val not in (None, ""):
        try:
            return fmt.format(float(val))
        except (ValueError, TypeError):
            pass
    return str(val) if val is not None else ""


def render_table(
    rows: list[dict],
    columns: dict[str, str],
    formats: dict[str, str],
    bold_models: set[str] | None = None,
    separator_indices: set[int] | None = None,
) -> str:
    """Render rows as a booktabs-style markdown pipe table.

    Args:
        rows: Data rows (list of dicts).
        columns: Ordered mapping {csv_key: display_header}.
        formats: Mapping {csv_key: python_format_string}.
        bold_models: Set of model names whose rows should be bolded.
        separator_indices: Row indices before which to insert a visual separator.
    """
    if not rows:
        return "*No data available.*\n"

    headers = list(columns.values())
    keys = list(columns.keys())
    bold_models = bold_models or set()
    separator_indices = separator_indices or set()

    # Format all cells, applying bold where needed
    formatted_rows: list[list[str]] = []
    for row in rows:
        cells = [format_value(row.get(k, ""), formats.get(k)) for k in keys]
        model_name = row.get("model", "")
        if model_name in bold_models:
            cells = [f"**{c}**" for c in cells]
        formatted_rows.append(cells)

    # Compute column widths (accounting for bold markers)
    widths = [len(h) for h in headers]
    for cells in formatted_rows:
        for i, c in enumerate(cells):
            widths[i] = max(widths[i], len(c))

    def fmt_row(cells: list[str]) -> str:
        return "| " + " | ".join(c.ljust(widths[i]) for i, c in enumerate(cells)) + " |"

    def separator_row() -> str:
        return "| " + " | ".join(" " * w for w in widths) + " |"

    # Build booktabs-style table
    lines: list[str] = []

    # Header row
    lines.append(fmt_row(headers))

    # Header rule (--- alignment row) — serves as the \midrule
    lines.append("| " + " | ".join("-" * w for w in widths) + " |")

    # Data rows, with separator between groups
    for idx, cells in enumerate(formatted_rows):
        if idx in separator_indices:
            lines.append(separator_row())
        lines.append(fmt_row(cells))

    return "\n".join(lines) + "\n"


def build_table(name: str, spec: dict) -> None:
    """Build a single table from its spec entry."""
    source = ROOT / "data" / spec["source"]
    rows = load_csv(source)

    sort_order = spec.get("sort_order", {})
    bold_model_names: set[str] = set(sort_order.get("bold_models", []))
    baselines_first = sort_order.get("baselines_first", False)

    # Load baselines from CSV if specified
    baselines: list[dict] = []
    if "baselines_source" in spec:
        baselines_path = ROOT / "data" / spec["baselines_source"]
        baselines = load_csv(baselines_path)

    if baselines_first and baselines:
        # Baselines sorted alphabetically, then user models sorted alphabetically
        baselines.sort(key=lambda r: r.get("model", ""))
        user_rows = sorted(rows, key=lambda r: r.get("model", ""))
        separator_idx = len(baselines)
        all_rows = baselines + user_rows
        separator_indices = {separator_idx} if user_rows else set()
    else:
        # Fallback: just append baselines and sort by sort_by keys
        all_rows = rows + baselines
        sort_keys = spec.get("sort_by", [])
        if sort_keys:
            all_rows.sort(key=lambda r: [r.get(k, "") for k in sort_keys])
        separator_indices = set()

    columns = spec.get("columns", {})
    formats = spec.get("format", {})

    md = render_table(all_rows, columns, formats, bold_model_names, separator_indices)
    out_path = OUT_DIR / f"{name}.md"
    out_path.write_text(md)
    print(f"  {name}: {len(all_rows)} rows -> {out_path.relative_to(ROOT)}")


def main() -> None:
    spec = yaml.safe_load(SPEC_PATH.read_text())
    print("Building tables from spec...")
    for name, table_spec in spec.items():
        build_table(name, table_spec)
    print("Done")


if __name__ == "__main__":
    main()
