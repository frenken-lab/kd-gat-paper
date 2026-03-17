#!/usr/bin/env python3
"""Build markdown tables from raw CSVs + YAML spec.

Reads data/tables/spec.yaml, loads each CSV, merges baselines,
applies formatting, writes data/tables/{name}.md.

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


def format_value(val, fmt: str | None) -> str:
    if fmt and val not in (None, ""):
        try:
            return fmt.format(float(val))
        except (ValueError, TypeError):
            pass
    return str(val)


def render_table(rows: list[dict], columns: dict, formats: dict) -> str:
    """Render rows as a markdown table with given column mapping and formats."""
    if not rows:
        return "*No data available.*\n"

    headers = list(columns.values())
    keys = list(columns.keys())

    # Compute column widths
    widths = [len(h) for h in headers]
    formatted_rows = []
    for row in rows:
        cells = [format_value(row.get(k, ""), formats.get(k)) for k in keys]
        for i, c in enumerate(cells):
            widths[i] = max(widths[i], len(c))
        formatted_rows.append(cells)

    # Build table
    def fmt_row(cells):
        return "| " + " | ".join(c.ljust(widths[i]) for i, c in enumerate(cells)) + " |"

    lines = [
        fmt_row(headers),
        "| " + " | ".join("-" * w for w in widths) + " |",
    ]
    lines.extend(fmt_row(cells) for cells in formatted_rows)
    return "\n".join(lines) + "\n"


def build_table(name: str, spec: dict) -> None:
    source = ROOT / "data" / spec["source"]
    rows = load_csv(source)

    # Merge baselines
    for b in spec.get("baselines", []):
        rows.append(b)

    # Sort
    sort_keys = spec.get("sort_by", [])
    if sort_keys:
        rows.sort(key=lambda r: [r.get(k, "") for k in sort_keys])

    columns = spec.get("columns", {})
    formats = spec.get("format", {})

    md = render_table(rows, columns, formats)
    out_path = OUT_DIR / f"{name}.md"
    out_path.write_text(md)
    print(f"  {name}: {len(rows)} rows → {out_path.relative_to(ROOT)}")


def main() -> None:
    spec = yaml.safe_load(SPEC_PATH.read_text())
    print("Building tables from spec...")
    for name, table_spec in spec.items():
        build_table(name, table_spec)
    print("Done")


if __name__ == "__main__":
    main()
