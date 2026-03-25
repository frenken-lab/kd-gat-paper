#!/usr/bin/env python3
"""Build TMLR Beyond PDF submission from MyST AST.

Reads the site-build AST JSON (``_build/site/content/*.json``) and
serializes to Distill-layout markdown for TMLR Beyond PDF.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
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

def serialize(node: dict) -> str:
    """Recursively serialize an MDAST node to Distill-compatible markdown."""
    t = node.get("type", "")
    children = node.get("children", [])

    # --- Leaf nodes ---
    if t == "text":
        # Strip MyST header attributes baked into text values
        val = node.get("value", "")
        val = re.sub(r"\s*\{#[^}]+\}\s*$", "", val)
        return val
    if t == "inlineMath":
        return f'${node["value"]}$'
    if t == "math":
        return f'\n$$\n{node["value"]}\n$$\n'
    if t == "inlineCode":
        return f'`{node.get("value", "")}`'
    if t == "code":
        lang = node.get("lang", "")
        return f'\n```{lang}\n{node.get("value", "")}\n```\n'
    if t == "comment":
        return ""
    if t == "thematicBreak":
        return "\n---\n"

    # --- Citations (Distill format, use label to preserve BibTeX key casing) ---
    if t == "citeGroup":
        cites = "".join(
            f'<d-cite key="{c.get("label", c["identifier"])}"></d-cite>'
            for c in children if c.get("type") == "cite"
        )
        return cites
    if t == "cite":
        return f'<d-cite key="{node.get("label", node["identifier"])}"></d-cite>'

    # --- Cross-references ---
    if t == "crossReference":
        template = node.get("template", "")
        enum = node.get("enumerator", "")
        if template and enum:
            return template.replace("%s", str(enum))
        inner = _children(children)
        return inner if inner else f'[{node.get("identifier", "")}]'

    # --- Structure ---
    if t == "heading":
        prefix = "#" * node.get("depth", 2)
        return f'\n{prefix} {_children(children)}\n'
    if t == "paragraph":
        return f'\n{_children(children)}\n'
    if t in ("root", "block"):
        return _children(children)

    # --- Formatting ---
    if t == "strong":
        return f'**{_children(children)}**'
    if t == "emphasis":
        return f'*{_children(children)}*'
    if t == "link":
        url = node.get("url", "")
        # Convert internal MyST route links to section anchors
        if url.startswith("/") and "." not in url:
            url = f"#{url.strip('/')}"
        return f'[{_children(children)}]({url})'

    # --- Lists ---
    if t == "list":
        ordered = node.get("ordered", False)
        items = []
        for i, c in enumerate(children):
            marker = f"{i + 1}. " if ordered else "- "
            items.append(marker + serialize(c).strip())
        return "\n" + "\n".join(items) + "\n"
    if t == "listItem":
        return _children(children)

    # --- Tables ---
    if t == "table":
        return "\n" + _serialize_table(children) + "\n"
    if t == "include":
        # Already resolved by myst — children contain parsed content
        return _children(children)

    # --- Figures / containers ---
    if t == "container":
        kind = node.get("kind", "")
        label = node.get("identifier", "")
        if kind == "figure":
            inner = _children(children)
            id_attr = f' id="{label}"' if label else ""
            return f'\n<figure{id_attr}>\n{inner}\n</figure>\n'
        if kind == "table":
            # Render caption as bold header, then table content from legend
            cap = ""
            body = ""
            for c in children:
                if c.get("type") == "caption":
                    cap = _text_of(c).strip()
                else:
                    body += serialize(c)
            header = f"\n**{cap}**\n" if cap else ""
            return f"{header}{body}"
        return _children(children)
    if t == "caption":
        return f'\n<figcaption>{_children(children)}</figcaption>'
    if t == "captionNumber":
        # Render "Table 1:" etc. — children contain the text; add trailing space
        return _children(children) + " "
    if t == "legend":
        # Table containers store {include} content in legend nodes
        return _children(children)
    if t == "iframe":
        src = Path(node.get("src", "")).name
        asset_path = f"assets/html/submission/{src}"
        return (
            f'<iframe src="{{{{ \'{asset_path}\' | relative_url }}}}" '
            f'width="100%" height="500" '
            f'style="border:none; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.1);" '
            f'title="{Path(src).stem}"></iframe>'
        )

    # --- Admonitions (algorithms, notes) ---
    if t == "admonition":
        cls = node.get("class", "")
        title = ""
        body_parts = []
        for c in children:
            if c.get("type") == "admonitionTitle":
                title = _children(c.get("children", []))
            else:
                body_parts.append(serialize(c).strip())
        body_md = "\n\n".join(body_parts)

        # Algorithm blocks get a styled container instead of a blockquote
        # markdown="1" tells kramdown to process markdown inside the HTML block
        if "algorithm" in cls:
            style = (
                "border:1px solid #ccc; border-radius:6px; padding:16px 20px; "
                "margin:16px 0; background:#fafafa;"
            )
            caption_style = (
                "font-weight:600; font-size:14px; margin:0 0 12px; "
                "padding-bottom:8px; border-bottom:1px solid #ddd;"
            )
            return (
                f'\n<div class="algorithm" style="{style}" markdown="1">\n'
                f'<p style="{caption_style}">{title}</p>\n\n'
                f'{body_md}\n\n</div>\n'
            )

        # Other admonitions → blockquote
        body = "\n".join(f"> {line}" if line else ">" for part in body_parts for line in part.split("\n"))
        if title:
            return f'\n> **{title}**\n>\n{body}\n'
        return f'\n{body}\n'
    if t == "admonitionTitle":
        return ""

    # --- Executable code outputs (appendix tables) ---
    if t == "outputs":
        return _children(children)

    # --- Fallback: render children ---
    return _children(children)


def _children(children: list[dict]) -> str:
    return "".join(serialize(c) for c in children)


def _text_of(node: dict) -> str:
    """Extract plain text from an AST node (no markdown formatting)."""
    if node.get("type") == "text":
        return node.get("value", "")
    return "".join(_text_of(c) for c in node.get("children", []))


def _serialize_table(rows: list[dict]) -> str:
    """Render tableRow nodes as a pipe table via tabulate."""
    grid = [
        [_children(cell.get("children", [])).strip() for cell in row.get("children", [])]
        for row in rows if row.get("type") == "tableRow"
    ]
    if len(grid) < 2:
        return ""
    return _tabulate(grid[1:], headers=grid[0], tablefmt="github")


# ---------------------------------------------------------------------------
# Build orchestration
# ---------------------------------------------------------------------------

def main() -> None:
    p = argparse.ArgumentParser(description="Build TMLR Beyond PDF submission")
    p.add_argument("--output", "-o", type=Path, required=True)
    p.add_argument("--anonymous", action="store_true")
    args = p.parse_args()

    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)

    # 1. Ensure site AST is built
    print("Building site AST...")
    subprocess.run(
        ["npx", "mystmd", "build", "--site", "--force"],
        cwd=ROOT, capture_output=True,
    )
    if not SITE_CONTENT.exists() or not SITE_CONFIG.exists():
        print("ERROR: myst build --site produced no content")
        sys.exit(1)

    site_cfg = json.loads(SITE_CONFIG.read_text())
    proj = site_cfg.get("projects", [{}])[0]

    # 2. Read TOC order from site config
    toc_files = []
    for entry in proj.get("toc", []):
        if isinstance(entry, dict):
            if "file" in entry:
                toc_files.append(entry["file"])
            for child in entry.get("children", []):
                if isinstance(child, dict) and "file" in child:
                    toc_files.append(child["file"])

    parts: list[str] = []
    for rel in toc_files:
        slug = Path(rel).stem
        ast_path = SITE_CONTENT / f"{slug}.json"
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

    content = "\n\n".join(parts)
    # Clean up excessive blank lines
    content = re.sub(r"\n{3,}", "\n\n", content)

    # 3. Build TOC from headers
    toc_entries: list[dict] = []
    for line in content.split("\n"):
        if line.startswith("## ") and not line.startswith("### "):
            toc_entries.append({"name": line[3:].strip()})
        elif line.startswith("### ") and toc_entries:
            toc_entries[-1].setdefault("subsections", []).append(
                {"name": line[4:].strip()}
            )

    # 4. Build frontmatter from AST metadata
    # Abstract lives in the index page's AST frontmatter.parts.abstract
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

    if args.anonymous:
        authors = [{"name": "Anonymous", "affiliations": {"name": "Anonymous"}}]
    else:
        authors = []
        for a in proj.get("authors", []):
            entry = {"name": a.get("name", "")}
            affs = a.get("affiliations", [])
            if affs:
                entry["affiliations"] = {"name": affs[0] if isinstance(affs[0], str) else affs[0].get("name", "")}
            authors.append(entry)

    tmlr_fm = yaml.dump({
        "layout": "distill",
        "title": proj.get("title", ""),
        "description": abstract,
        "htmlwidgets": True,
        "authors": authors,
        "bibliography": "submission.bib",
        "toc": toc_entries,
    }, sort_keys=False)

    (out / "submission.md").write_text(f"---\n{tmlr_fm}---\n\n{content}")

    # 5. Copy assets
    for d in ["img", "gif", "html"]:
        (out / "assets" / d / "submission").mkdir(parents=True, exist_ok=True)
    (out / "assets" / "bibliography").mkdir(parents=True, exist_ok=True)

    # Concatenate all bib files into a single submission.bib
    bib_dir = ROOT / "references"
    if bib_dir.is_dir():
        with open(out / "assets" / "bibliography" / "submission.bib", "w") as dest:
            for bib in sorted(bib_dir.glob("*.bib")):
                dest.write(bib.read_text() + "\n")
    elif (ROOT / "references.bib").exists():
        shutil.copy2(ROOT / "references.bib", out / "assets" / "bibliography" / "submission.bib")

    for src in [ROOT / "figures", ROOT / "interactive" / "dist"]:
        if src.exists():
            for f in src.iterdir():
                if f.suffix in (".png", ".jpg", ".svg", ".pdf"):
                    shutil.copy2(f, out / "assets" / "img" / "submission" / f.name)
                elif f.suffix == ".html":
                    shutil.copy2(f, out / "assets" / "html" / "submission" / f.name)

    print(f"Done: {out / 'submission.md'}")


if __name__ == "__main__":
    main()
