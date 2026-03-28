#!/usr/bin/env python3
"""Build TMLR Beyond PDF submission from MyST AST.

Reads the site-build AST JSON (``_build/site/content/*.json``) and
serializes to Distill-layout markdown for TMLR Beyond PDF.

Prerequisites: run ``myst build --site`` before invoking this script.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

import yaml
from tabulate import tabulate as _tabulate

ROOT = Path(__file__).resolve().parents[2]
SITE_CONTENT = ROOT / "_build" / "site" / "content"
SITE_CONFIG = ROOT / "_build" / "site" / "config.json"


# ---------------------------------------------------------------------------
# AST → Distill Markdown serializer
# ---------------------------------------------------------------------------

def _children(children: list[dict]) -> str:
    return "".join(serialize(c) for c in children)


def _text_of(node: dict) -> str:
    """Extract plain text from an AST node (no markdown formatting)."""
    if node.get("type") == "text":
        return node.get("value", "")
    return "".join(_text_of(c) for c in node.get("children", []))


# --- Helpers for shorthand in dispatch table ---

_C = lambda n: _children(n.get("children", []))  # noqa: E731
_V = lambda n: n.get("value", "")  # noqa: E731


def _serialize_table(rows: list[dict]) -> str:
    """Render tableRow nodes as a pipe table via tabulate."""
    grid = [
        [_children(cell.get("children", [])).strip() for cell in row.get("children", [])]
        for row in rows if row.get("type") == "tableRow"
    ]
    return _tabulate(grid[1:], headers=grid[0], tablefmt="github") if len(grid) >= 2 else ""


# --- Named handlers (only for multi-line logic) ---

def _h_cross_reference(n: dict) -> str:
    template, enum = n.get("template", ""), n.get("enumerator", "")
    if template and enum:
        return template.replace("%s", str(enum))
    inner = _C(n)
    return inner if inner else f'[{n.get("identifier", "")}]'


def _h_link(n: dict) -> str:
    url = n.get("url", "")
    if url.startswith("/") and "." not in url:
        url = f"#{url.strip('/')}"
    return f'[{_C(n)}]({url})'


def _h_list(n: dict) -> str:
    ordered = n.get("ordered", False)
    items = []
    for i, c in enumerate(n.get("children", [])):
        marker = f"{i + 1}. " if ordered else "- "
        items.append(marker + serialize(c).strip())
    return "\n" + "\n".join(items) + "\n"


def _h_container(n: dict) -> str:
    kind, children = n.get("kind", ""), n.get("children", [])
    if kind == "figure":
        id_attr = f' id="{n["identifier"]}"' if n.get("identifier") else ""
        return f'\n<figure{id_attr}>\n{_children(children)}\n</figure>\n'
    if kind == "table":
        cap, body = "", ""
        for c in children:
            if c.get("type") == "caption":
                cap = _text_of(c).strip()
            else:
                body += serialize(c)
        return (f"\n**{cap}**\n" if cap else "") + body
    return _children(children)


def _h_iframe(n: dict) -> str:
    src = Path(n.get("src", "")).name
    path = f"assets/html/submission/{src}"
    return (
        f'<iframe src="{{{{ \'{path}\' | relative_url }}}}" '
        f'width="100%" height="500" '
        f'style="border:none; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" '
        f'title="{Path(src).stem}"></iframe>'
    )


def _h_admonition(n: dict) -> str:
    title = ""
    body_parts: list[str] = []
    for c in n.get("children", []):
        if c.get("type") == "admonitionTitle":
            title = _C(c)
        else:
            body_parts.append(serialize(c).strip())

    if "algorithm" in n.get("class", ""):
        box = "border:1px solid #ccc; border-radius:6px; padding:16px 20px; margin:16px 0; background:#fafafa;"
        cap = "font-weight:600; font-size:14px; margin:0 0 12px; padding-bottom:8px; border-bottom:1px solid #ddd;"
        return (
            f'\n<div class="algorithm" style="{box}" markdown="1">\n'
            f'<p style="{cap}">{title}</p>\n\n'
            f'{"".join(body_parts)}\n\n</div>\n'
        )

    body = "\n".join(f"> {l}" if l else ">" for p in body_parts for l in p.split("\n"))
    return f'\n> **{title}**\n>\n{body}\n' if title else f'\n{body}\n'


# --- Dispatch table ---

HANDLERS: dict[str, callable] = {
    # Leaf nodes
    "text":           lambda n: re.sub(r"\s*\{#[^}]+\}\s*$", "", _V(n)),
    "inlineMath":     lambda n: f'${_V(n)}$',
    "math":           lambda n: f'\n$$\n{_V(n)}\n$$\n',
    "inlineCode":     lambda n: f'`{_V(n)}`',
    "code":           lambda n: f'\n```{n.get("lang", "")}\n{_V(n)}\n```\n',
    "comment":        lambda _: "",
    "thematicBreak":  lambda _: "\n---\n",
    # Citations
    "citeGroup":      lambda n: "".join(
                          f'<d-cite key="{c.get("label", c["identifier"])}"></d-cite>'
                          for c in n.get("children", []) if c.get("type") == "cite"),
    "cite":           lambda n: f'<d-cite key="{n.get("label", n["identifier"])}"></d-cite>',
    # Structure
    "heading":        lambda n: f'\n{"#" * n.get("depth", 2)} {_C(n)}\n',
    "paragraph":      lambda n: f'\n{_C(n)}\n',
    "strong":         lambda n: f'**{_C(n)}**',
    "emphasis":       lambda n: f'*{_C(n)}*',
    "caption":        lambda n: f'\n<figcaption>{_C(n)}</figcaption>',
    "captionNumber":  lambda n: _C(n) + " ",
    # Tables
    "table":          lambda n: "\n" + _serialize_table(n.get("children", [])) + "\n",
    # Passthrough (just recurse into children)
    "root": _C, "block": _C, "include": _C, "listItem": _C,
    "legend": _C, "outputs": _C, "admonitionTitle": lambda _: "",
    # Multi-line logic
    "crossReference": _h_cross_reference,
    "link":           _h_link,
    "list":           _h_list,
    "container":      _h_container,
    "iframe":         _h_iframe,
    "admonition":     _h_admonition,
}


def serialize(node: dict) -> str:
    """Recursively serialize an MDAST node to Distill-compatible markdown."""
    return HANDLERS.get(node.get("type", ""), _C)(node)


# ---------------------------------------------------------------------------
# Build orchestration
# ---------------------------------------------------------------------------

def build_frontmatter(proj: dict, anonymous: bool) -> str:
    """Build TMLR YAML frontmatter from site config metadata."""
    # Abstract from index page AST
    abstract = ""
    idx_path = SITE_CONTENT / "index.json"
    if idx_path.exists():
        idx_data = json.loads(idx_path.read_text())
        abstract_ast = (
            idx_data.get("frontmatter", {}).get("parts", {}).get("abstract", {}).get("mdast")
        )
        if abstract_ast:
            if isinstance(abstract_ast, str):
                abstract_ast = json.loads(abstract_ast)
            abstract = _text_of(abstract_ast)

    # Authors
    if anonymous:
        authors = [{"name": "Anonymous", "affiliations": {"name": "Anonymous"}}]
    else:
        authors = []
        for a in proj.get("authors", []):
            entry: dict = {"name": a.get("name", "")}
            affs = a.get("affiliations", [])
            if affs:
                entry["affiliations"] = {
                    "name": affs[0] if isinstance(affs[0], str) else affs[0].get("name", "")
                }
            authors.append(entry)

    return yaml.dump({
        "layout": "distill",
        "title": proj.get("title", ""),
        "description": abstract,
        "htmlwidgets": True,
        "authors": authors,
        "bibliography": "submission.bib",
    }, sort_keys=False)


def build_toc(content: str) -> list[dict]:
    """Scan serialized markdown for ## and ### headings to build TOC."""
    entries: list[dict] = []
    for line in content.split("\n"):
        if line.startswith("## ") and not line.startswith("### "):
            entries.append({"name": line[3:].strip()})
        elif line.startswith("### ") and entries:
            entries[-1].setdefault("subsections", []).append(
                {"name": line[4:].strip()}
            )
    return entries


def copy_assets(out: Path) -> None:
    """Copy bibliography and HTML figures into submission asset dirs."""
    (out / "assets" / "html" / "submission").mkdir(parents=True, exist_ok=True)
    (out / "assets" / "bibliography").mkdir(parents=True, exist_ok=True)

    # Concatenate all bib files into a single submission.bib
    bib_dir = ROOT / "references"
    if bib_dir.is_dir():
        with open(out / "assets" / "bibliography" / "submission.bib", "w") as dest:
            for bib in sorted(bib_dir.glob("*.bib")):
                dest.write(bib.read_text() + "\n")

    # Copy built HTML figures
    figures_dir = ROOT / "figures"
    if figures_dir.exists():
        for f in figures_dir.iterdir():
            if f.suffix == ".html":
                shutil.copy2(f, out / "assets" / "html" / "submission" / f.name)


def main() -> None:
    p = argparse.ArgumentParser(description="Build TMLR Beyond PDF submission")
    p.add_argument("--output", "-o", type=Path, required=True)
    p.add_argument("--anonymous", action="store_true")
    args = p.parse_args()

    # Require pre-built site AST
    if not SITE_CONTENT.exists() or not SITE_CONFIG.exists():
        print("ERROR: _build/site/content/ not found. Run 'myst build --site' first.")
        sys.exit(1)

    site_cfg = json.loads(SITE_CONFIG.read_text())
    proj = site_cfg.get("projects", [{}])[0]

    # Read TOC order and serialize each page
    toc_files: list[str] = []
    for entry in proj.get("toc", []):
        if isinstance(entry, dict):
            if "file" in entry:
                toc_files.append(entry["file"])
            for child in entry.get("children", []):
                if isinstance(child, dict) and "file" in child:
                    toc_files.append(child["file"])

    parts: list[str] = []
    for rel in toc_files:
        ast_path = SITE_CONTENT / f"{Path(rel).stem}.json"
        if not ast_path.exists():
            print(f"  skip: {rel} (no AST)")
            continue
        data = json.loads(ast_path.read_text())
        mdast = data["mdast"]
        if isinstance(mdast, str):
            mdast = json.loads(mdast)
        parts.append(serialize(mdast))
        print(f"  ok: {rel}")

    if not parts:
        print("No content serialized")
        sys.exit(1)

    content = re.sub(r"\n{3,}", "\n\n", "\n\n".join(parts))

    # Build output
    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)

    frontmatter = build_frontmatter(proj, args.anonymous)
    toc_entries = build_toc(content)
    toc = yaml.dump({"toc": toc_entries}, sort_keys=False) if toc_entries else ""
    (out / "submission.md").write_text(f"---\n{frontmatter}{toc}---\n\n{content}")

    copy_assets(out)
    print(f"Done: {out / 'submission.md'}")


if __name__ == "__main__":
    main()
