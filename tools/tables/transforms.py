#!/usr/bin/env python3
"""Pure helpers and composable transforms for the table builder.

Two flavors of function live here:

  - **Data prep** — take a spec / Path / DataFrame, return data. Pure
    functions, no module-level state.
  - **GT chain steps** — take a GT (plus explicit args), return a GT.
    Designed for use in `.pipe()` chains. All config (colors, models,
    flags) is passed in by the caller; this module knows nothing about
    styles.yml.

`build.py` is the composition layer that wires these into per-kind
render pipelines.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import polars as pl
from great_tables import GT, loc, md, style


# --- Pure helpers ----------------------------------------------------------


def decimals_from_format(fmt: str) -> int:
    m = re.search(r"\.(\d+)f", fmt)
    return int(m.group(1)) if m else 4


def load_csv(path: Path) -> pl.DataFrame:
    if not path.exists():
        print(f"  WARNING: {path} not found", file=sys.stderr)
        return pl.DataFrame()
    return pl.read_csv(path, infer_schema_length=0)


def harvey_records(spec: dict) -> list[dict]:
    """Inline rows in spec → list of records. Glyph mapping inlined; row
    length is checked against the columns: declaration order, which IS
    the row schema. Adds `section` (key) and `_grp` (display label) so
    great-tables' groupname_col can drive the row groups."""
    col_order = list(spec["columns"].keys())
    cov_cols = spec["spanner"]["over"]
    section_labels = {g["key"]: g["label"] for g in spec["row_groups"]}
    glyphs = {"primary": "●", "secondary": "◐"}
    records: list[dict] = []
    for sec_key, sec_rows in spec.get("rows", {}).items():
        for row in sec_rows:
            if len(row) != len(col_order):
                raise ValueError(
                    f"rows[{sec_key}]: row length {len(row)} != "
                    f"{len(col_order)} columns ({col_order}); row={row!r}"
                )
            rec = dict(zip(col_order, row))
            for c in cov_cols:
                rec[c] = glyphs.get(rec.get(c) or "", "")
            rec["section"] = sec_key
            rec["_grp"] = section_labels[sec_key]
            records.append(rec)
    return records


def merge_baselines(
    df: pl.DataFrame, baselines: pl.DataFrame, baselines_first: bool
) -> tuple[pl.DataFrame, int | None]:
    """Concat literature baselines with main results. Returns (df, sep_at)
    where sep_at marks the row index where baselines end (None if not
    baselines_first). `diagonal` handles the column-set mismatch (baselines
    carry citation_key; main results don't)."""
    if baselines.is_empty():
        return df, None
    if baselines_first:
        baselines = baselines.sort("model")
        df = df.sort("model")
        return pl.concat([baselines, df], how="diagonal"), baselines.height
    return pl.concat([df, baselines], how="diagonal"), None


# --- GT chain steps: numeric path -----------------------------------------


def numeric_align(gt: GT, metric_keys: list[str], model_present: bool) -> GT:
    if metric_keys:
        gt = gt.cols_align(align="right", columns=metric_keys)
    if model_present:
        gt = gt.cols_align(align="left", columns=["model"])
    return gt


def numeric_format(gt: GT, metric_keys: list[str], decimals: dict[str, int]) -> GT:
    for k in metric_keys:
        gt = gt.fmt_number(columns=k, decimals=decimals[k])
    return gt


def numeric_best_near_best(
    gt: GT,
    df: pl.DataFrame,
    metric_keys: list[str],
    fill_best: str,
    fill_near: str,
) -> GT:
    """Best-in-column → fill_best; near-best (>=99% of max) → fill_near."""
    for k in metric_keys:
        col_max = df[k].max()
        if col_max is None:
            continue
        gt = gt.tab_style(
            style=style.fill(color=fill_best),
            locations=loc.body(columns=k, rows=pl.col(k) == col_max),
        ).tab_style(
            style=style.fill(color=fill_near),
            locations=loc.body(
                columns=k,
                rows=(pl.col(k) >= col_max * 0.99) & (pl.col(k) != col_max),
            ),
        )
    return gt


def numeric_bold_our_models(gt: GT, bold_models: set[str], accent: str, model_present: bool) -> GT:
    if not (bold_models and model_present):
        return gt
    ours = pl.col("model").is_in(list(bold_models))
    return gt.tab_style(style=style.text(weight="bold"), locations=loc.body(rows=ours)).tab_style(
        style=style.borders(sides="left", color=accent, weight="3px"),
        locations=loc.body(columns="model", rows=ours),
    )


# --- GT chain steps: harvey_balls path ------------------------------------


def harvey_label_and_spanner(gt: GT, spec: dict) -> GT:
    cols = spec["columns"]
    return gt.cols_label(**{k: v for k, v in cols.items() if k != "contribution"}).tab_spanner(
        label=spec["spanner"]["label"], columns=spec["spanner"]["over"]
    )


def harvey_order_groups(gt: GT, spec: dict) -> GT:
    labels = {g["key"]: g["label"] for g in spec["row_groups"]}
    return gt.row_group_order([labels[g["key"]] for g in spec["row_groups"]])


def harvey_color_columns(gt: GT, cols: list[str], color_map: dict[str, str]) -> GT:
    """Per-column body text color + center align. color_map: column → hex."""
    for col in cols:
        gt = gt.tab_style(
            style=[style.text(color=color_map[col], weight="bold", size="18px")],
            locations=loc.body(columns=col),
        ).cols_align(align="center", columns=col)
    return gt


def harvey_highlight_section(gt: GT, spec: dict) -> GT:
    """gt_extras is lazy-imported here — harvey_balls is the only path
    that needs it, and it shouldn't pull in on numeric builds."""
    sec = spec.get("highlight_section")
    if not sec:
        return gt
    import gt_extras as gte

    return gte.gt_highlight_rows(
        gt,
        rows=pl.col("section") == sec,
        fill="#F2F2F2",
        font_weight="bold",
        include_row_labels=True,
    )


# --- GT chain steps: shared -----------------------------------------------


def add_source_note(gt: GT, html: str) -> GT:
    return gt.tab_source_note(source_note=md(html))


def theme_538(gt: GT) -> GT:
    import gt_extras as gte

    return gte.gt_theme_538(gt)


# --- GFM renderers --------------------------------------------------------


def render_numeric_gfm(
    df: pl.DataFrame,
    columns: dict[str, str],
    formats: dict[str, str],
    bold_models: set[str],
) -> str:
    """No fill / no row groups — markdown can't carry them. Inline-bold
    for our-model rows; numeric formatting preserved.

    Curvenote editor uses this because @curvenote/schema's mdast→PM parser
    handles `table`/`tableRow`/`tableCell` natively but silently drops
    raw HTML."""
    if df.is_empty():
        return "_No data available._\n"
    keys = [k for k in columns if k in df.columns]
    metric_keys = [k for k in keys if k != "model" and formats.get(k)]
    decimals = {k: decimals_from_format(formats[k]) for k in metric_keys}

    def fmt(k: str, v) -> str:
        if v is None or v == "":
            return ""
        if k in metric_keys:
            try:
                return f"{float(v):.{decimals[k]}f}"
            except (ValueError, TypeError):
                return str(v)
        return str(v)

    lines = [
        "| " + " | ".join(columns[k] for k in keys) + " |",
        "| " + " | ".join("---" for _ in keys) + " |",
    ]
    for row in df.iter_rows(named=True):
        is_ours = row.get("model") in bold_models
        cells = [fmt(k, row.get(k)) for k in keys]
        if is_ours:
            cells = [f"**{c}**" if c else c for c in cells]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"


def render_harvey_gfm(df: pl.DataFrame, spec: dict) -> str:
    """Section labels render as italic single-cell divider rows;
    highlight_section row gets cells inline-bolded. Cell values are
    already Unicode glyphs by the time this is called."""
    cov_cols = list(spec["spanner"]["over"])
    columns = spec["columns"]
    section_labels = {g["key"]: g["label"] for g in spec["row_groups"]}
    keys = ["contribution", *cov_cols]
    headers = [columns[k] for k in keys]
    n = len(headers)

    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    seen: str | None = None
    for row in df.iter_rows(named=True):
        sec = row["section"]
        if sec != seen:
            label = section_labels.get(sec, "").strip()
            if label:
                lines.append("| " + " | ".join([f"*{label}*"] + [""] * (n - 1)) + " |")
            seen = sec
        cells = [str(row.get("contribution") or "")]
        for c in cov_cols:
            cells.append(row.get(c) or "")
        if sec == spec.get("highlight_section"):
            cells = [f"**{c}**" if c else c for c in cells]
        lines.append("| " + " | ".join(cells) + " |")
    return "\n".join(lines) + "\n"
