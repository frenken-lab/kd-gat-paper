#!/usr/bin/env python3
"""Convert MyST markdown to TMLR Beyond PDF submission format.

7-step pipeline: concatenate → frontmatter → directives → code-cells →
cross-refs → assets → validate.

Usage:
    python scripts/convert_tmlr.py --output submission_folder/
    python scripts/convert_tmlr.py --output submission_folder/ --anonymous
"""

from __future__ import annotations

import argparse
import csv
import re
import shutil
import sys
from io import StringIO
from pathlib import Path

import yaml  # noqa: E402 — PyYAML, always available (MyST dependency)

ROOT = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def strip_frontmatter(text: str) -> str:
    """Remove YAML frontmatter (--- ... ---) from markdown."""
    if not text.startswith("---"):
        return text
    end = text.find("\n---", 3)
    return text[end + 4 :].lstrip("\n") if end != -1 else text


def csv_to_table(csv_text: str) -> str:
    """Convert CSV text to markdown table."""
    rows = list(csv.reader(StringIO(csv_text.strip())))
    if not rows:
        return ""
    widths = [
        max(len(rows[r][c]) if c < len(rows[r]) else 0 for r in range(len(rows)))
        for c in range(len(rows[0]))
    ]
    fmt = lambda cells: "| " + " | ".join(c.ljust(widths[j]) for j, c in enumerate(cells)) + " |"
    return "\n".join(
        [fmt(rows[0]), "| " + " | ".join("-" * w for w in widths) + " |"]
        + [fmt(r) for r in rows[1:]]
    )


# ---------------------------------------------------------------------------
# Step 1: Concatenate files per myst.yml TOC
# ---------------------------------------------------------------------------


def get_toc_files(cfg: dict) -> list[Path]:
    toc = cfg.get("project", {}).get("toc", cfg.get("toc", []))
    files = []
    for entry in toc:
        if isinstance(entry, dict):
            if "file" in entry:
                files.append(ROOT / entry["file"])
            for child in entry.get("children", []) + entry.get("parts", []):
                if isinstance(child, dict) and "file" in child:
                    files.append(ROOT / child["file"])
        elif isinstance(entry, str):
            files.append(ROOT / entry)
    return files


def concatenate(toc_files: list[Path]) -> str:
    parts = []
    for f in toc_files:
        if f.exists():
            parts.append(strip_frontmatter(f.read_text()).strip())
        else:
            print(f"WARNING: missing {f}", file=sys.stderr)
    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Step 2: Generate TMLR frontmatter
# ---------------------------------------------------------------------------


def gen_frontmatter(
    cfg: dict, abstract: str, headers: list[str], *, anonymous: bool = False
) -> str:
    proj = cfg.get("project", cfg)
    title = proj.get("title", "Untitled")
    if anonymous:
        authors = "  - Anonymous"
    else:
        authors = "\n".join(
            f"  - {a['name'] if isinstance(a, dict) else a}"
            for a in proj.get("authors", [{"name": "Anonymous"}])
        )
    toc = "\n".join(f'  - name: "{h}"' for h in headers)
    return f'---\nlayout: distill\ntitle: "{title}"\ndescription: "{abstract}"\nhtmlwidgets: true\nauthors:\n{authors}\nbibliography: submission.bib\ntoc:\n{toc}\n---'


# ---------------------------------------------------------------------------
# Step 3: Convert MyST directives (table-driven)
# ---------------------------------------------------------------------------

DIRECTIVE_RULES = [
    # math blocks: ```{math}\n:label: eq-foo\n...\n``` → $$...$$
    (
        re.compile(r"```\{math\}\s*\n(?::label:\s*(\S+)\s*\n)?(.*?)\n```", re.DOTALL),
        lambda m: (
            f"$$ {{##{m.group(1)}}}\n{m.group(2).strip()}\n$$"
            if m.group(1)
            else f"$$\n{m.group(2).strip()}\n$$"
        ),
    ),
    # table blocks: :::{table} Caption → **Caption** + content
    (
        re.compile(r":{3,4}\{table\}\s*(.*?)\n(?::label:\s*\S+\s*\n)?(.*?)\n:{3,4}", re.DOTALL),
        lambda m: (
            (f"**{m.group(1).strip()}**\n\n" if m.group(1).strip() else "") + m.group(2).strip()
        ),
    ),
    # admonitions: :::{admonition} Title → blockquote
    (
        re.compile(
            r":{3,4}\{admonition\}\s*(.*?)\n(?::class:\s*\S+\s*\n)?(?::label:\s*(\S+)\s*\n)?(.*?)\n:{3,4}",
            re.DOTALL,
        ),
        lambda m: (
            f"> **{m.group(1).strip()}**\n>\n"
            + "\n".join(f"> {l}" if l.strip() else ">" for l in m.group(3).strip().splitlines())
        ),
    ),
]


def convert_directives(md: str) -> str:
    for pattern, repl in DIRECTIVE_RULES:
        md = pattern.sub(repl, md)
    return md


# ---------------------------------------------------------------------------
# Step 4: Render code cells as static tables
# ---------------------------------------------------------------------------


def render_code_cells(md: str) -> str:
    pattern = re.compile(r"```\{code-cell\}\s*python\s*\n(.*?)\n```", re.DOTALL)

    def repl(m: re.Match) -> str:
        block = m.group(1)
        caption = (re.search(r':caption:\s*"?([^"\n]+)"?', block) or [None, ""])[1]
        label = (re.search(r":label:\s*(\S+)", block) or [None, ""])[1]
        csv_m = re.search(r'read_csv\(["\']([^"\']+)["\']\)', block)
        if not csv_m:
            return f"<!-- code-cell: no CSV -->\n{block}"
        csv_file = ROOT / csv_m.group(1)
        if not csv_file.exists():
            return f"<!-- WARNING: CSV not found: {csv_m.group(1)} -->"
        parts = []
        if label:
            parts.append(f"<!-- :label: {label} -->")
        if caption:
            parts.append(f"**{caption}**\n")
        parts.append(csv_to_table(csv_file.read_text()))
        return "\n".join(parts)

    return pattern.sub(repl, md)


# ---------------------------------------------------------------------------
# Step 5: Cross-references
# ---------------------------------------------------------------------------

LABEL_PREFIXES = {
    "eq-": "Equation",
    "tbl-": "Table",
    "sec-": "Section",
    "alg-": "Algorithm",
    "fig-": "Figure",
}


def resolve_xrefs(md: str) -> str:
    # Build label → (category, number) map
    labels = [(m.start(), m.group(1)) for m in re.finditer(r":label:\s*(\S+)", md)]
    labels += [(m.start(), m.group(1)) for m in re.finditer(r"\{##(\S+)\}", md)]
    labels.sort()

    counters: dict[str, int] = {}
    label_map: dict[str, str] = {}
    for _, lbl in labels:
        if lbl in label_map:
            continue
        cat = next((v for k, v in LABEL_PREFIXES.items() if lbl.startswith(k)), "Ref")
        counters[cat] = counters.get(cat, 0) + 1
        label_map[lbl] = f"{cat} {counters[cat]}"

    print(f"  {len(label_map)} labels resolved")

    # Replace [](#label) references
    def repl(m: re.Match) -> str:
        return label_map.get(m.group(1), f"[UNRESOLVED: {m.group(1)}]")

    md = re.sub(r"\[]\(#([^)]+)\)", repl, md)
    md = re.sub(r"\s*\{##\S+\}", "", md)  # clean math label tags
    return md


# ---------------------------------------------------------------------------
# Step 6: Copy assets
# ---------------------------------------------------------------------------

ASSET_DIRS = {
    "img": (".png", ".svg", ".jpg", ".jpeg", ".pdf"),
    "gif": (".gif",),
    "html": (".html",),
}


def copy_assets(output_dir: Path) -> None:
    for subdir in ("img", "gif", "html"):
        (output_dir / "assets" / subdir / "submission").mkdir(parents=True, exist_ok=True)
    (output_dir / "assets" / "bibliography").mkdir(parents=True, exist_ok=True)

    bib = ROOT / "references.bib"
    if bib.exists():
        shutil.copy2(bib, output_dir / "assets" / "bibliography" / "submission.bib")

    figs = ROOT / "figures"
    if figs.exists():
        for f in sorted(figs.iterdir()):
            for subdir, exts in ASSET_DIRS.items():
                if f.suffix.lower() in exts:
                    shutil.copy2(f, output_dir / "assets" / subdir / "submission" / f.name)


def update_paths(md: str) -> str:
    md = re.sub(
        r"(!\[[^\]]*\]\()figures/([^)]+\.(png|jpg|jpeg|svg|pdf))(\))",
        r"\1assets/img/submission/\2\4",
        md,
    )
    md = re.sub(r"figures/([^\"'\s]+\.html)", r"assets/html/submission/\1", md)
    md = re.sub(r"(!\[[^\]]*\]\()figures/([^)]+\.gif)(\))", r"\1assets/gif/submission/\2\3", md)
    return md


# ---------------------------------------------------------------------------
# Step 7: Validate
# ---------------------------------------------------------------------------


def validate(md: str) -> list[str]:
    issues = []
    issues += [f"Remaining directive: ```{{{d}}}" for d in re.findall(r"```\{(\w+)\}", md)]
    issues += [f"Remaining directive: :::{{{d}}}" for d in re.findall(r":{3,}\{(\w+)\}", md)]
    issues += [f"Unresolved: {r}" for r in re.findall(r"\[UNRESOLVED:\s*([^\]]+)\]", md)]
    issues += [f"Unconverted xref: [](#{r})" for r in re.findall(r"\[]\(#([^)]+)\)", md)]
    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    p = argparse.ArgumentParser(description="Convert MyST → TMLR Beyond PDF")
    p.add_argument("--output", "-o", type=Path, required=True)
    p.add_argument("--anonymous", action="store_true")
    args = p.parse_args()

    out = args.output.resolve()
    cfg = yaml.safe_load((ROOT / "myst.yml").read_text())
    toc_files = get_toc_files(cfg)
    if not toc_files:
        print("ERROR: empty TOC", file=sys.stderr)
        sys.exit(1)
    print(f"Concatenating {len(toc_files)} files...")

    body = concatenate(toc_files)

    # Extract abstract from index.md
    index = ROOT / "index.md"
    abstract = ""
    if index.exists():
        fm = (
            yaml.safe_load(re.match(r"^---\n(.*?)\n---", index.read_text(), re.DOTALL).group(1))
            if index.read_text().startswith("---")
            else {}
        )
        abstract = fm.get("abstract", "") if isinstance(fm, dict) else ""

    headers = [m.group(1) for m in re.finditer(r"^##\s+(.+)$", body, re.MULTILINE)]
    fm = gen_frontmatter(cfg, abstract, headers, anonymous=args.anonymous)

    print("Converting directives...")
    md = convert_directives(body)
    md = render_code_cells(md)

    print("Resolving cross-references...")
    md = resolve_xrefs(md)

    print("Copying assets...")
    out.mkdir(parents=True, exist_ok=True)
    copy_assets(out)
    md = update_paths(md)

    (out / "submission.md").write_text(fm + "\n\n" + md + "\n")

    issues = validate(fm + "\n\n" + md)
    if issues:
        print(f"{len(issues)} issue(s):")
        for i in issues:
            print(f"  - {i}")
        sys.exit(1)
    print("Done — no issues")


if __name__ == "__main__":
    main()
