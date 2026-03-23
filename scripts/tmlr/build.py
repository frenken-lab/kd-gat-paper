#!/usr/bin/env python3
"""Build TMLR Beyond PDF submission."""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]


def _strip_frontmatter(text: str) -> str:
    """Remove YAML frontmatter delimited by ``---``."""
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:].lstrip()
    return text


def _resolve_includes(text: str, base_dir: Path) -> str:
    """Inline ``{include}`` directives with referenced file content."""
    def _repl(m: re.Match) -> str:
        inc = (base_dir / m.group(1).strip()).resolve()
        return inc.read_text().strip() if inc.exists() else m.group(0)
    return re.sub(r"```\{include\}\s*(\S+)\s*\n```", _repl, text)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--output", "-o", type=Path, required=True)
    p.add_argument("--anonymous", action="store_true")
    args = p.parse_args()

    out = args.output.resolve()
    out.mkdir(parents=True, exist_ok=True)

    # 1. Get TOC files
    cfg = yaml.safe_load((ROOT / "myst.yml").read_text())
    toc = cfg.get("project", {}).get("toc", [])
    files = []
    for entry in toc:
        if isinstance(entry, dict):
            if "file" in entry:
                files.append(ROOT / entry["file"])
            for child in entry.get("children", []):
                if isinstance(child, dict) and "file" in child:
                    files.append(ROOT / child["file"])

    # 2. Export each file — myst for prose, raw source for directive-heavy files
    print("Exporting paper sections...")
    exported_parts: list[str] = []
    exports_dir = ROOT / "_build" / "exports"

    for f in files:
        if not f.exists():
            continue
        rel = f.relative_to(ROOT)
        raw = f.read_text()

        # Files with {include} or :::{iframe} break myst --md export
        # (tables mangled to lists, iframe causes TypeError).
        # Use resolved raw source for these files.
        if "```{include}" in raw or ":::{iframe}" in raw:
            print(f"  raw: {rel}")
            text = _strip_frontmatter(raw)
            text = _resolve_includes(text, f.parent)
            exported_parts.append(text)
            continue

        cmd = ["npx", "mystmd", "build", str(rel), "--md", "--force"]
        subprocess.run(cmd, cwd=ROOT, capture_output=True)

        out_name = f.stem + ".md"
        out_path = exports_dir / out_name
        if out_path.exists():
            text = _strip_frontmatter(out_path.read_text())
            exported_parts.append(text)
            out_path.unlink()
        else:
            # myst failed — fall back to raw source
            print(f"  fallback: {rel}")
            text = _strip_frontmatter(raw)
            exported_parts.append(text)

    if not exported_parts:
        print("No files exported")
        sys.exit(1)

    content = "\n\n".join(exported_parts)

    # Post-process: convert MyST syntax to standard markdown
    # {cite:p}`key` or {cite:p}`key1,key2` -> [@key] or [@key1; @key2]
    def convert_cite(m):
        keys = m.group(1).split(',')
        return '[' + '; '.join(f'@{k.strip()}' for k in keys) + ']'
    content = re.sub(r'\{cite:p\}`([^`]+)`', convert_cite, content)
    # {math}`...` -> $...$
    content = re.sub(r'\{math\}`([^`]+)`', r'$\1$', content)
    # ```{math}\n:label: ...\n\nEQN\n``` -> $$\nEQN\n$$
    content = re.sub(
        r'```\{math\}\n(?::label:[^\n]*\n)*\n?(.*?)\n```',
        r'$$\n\1\n$$',
        content,
        flags=re.DOTALL
    )
    # Convert :::{iframe} directives to <iframe> HTML
    def convert_iframe(m: re.Match) -> str:
        path = m.group(1).strip()
        body = m.group(2)
        filename = Path(path).name
        src = f"assets/html/submission/{filename}"
        label = ""
        caption_lines = []
        for line in body.strip().split("\n"):
            if line.startswith(":label:"):
                label = line.split(":", 2)[2].strip()
            elif line.startswith(":"):
                continue
            elif line.strip():
                caption_lines.append(line.strip())
        caption = " ".join(caption_lines)
        id_attr = f' id="{label}"' if label else ""
        tag = f'<iframe src="{src}" width="100%" style="border:none; min-height:450px;"></iframe>'
        if caption:
            return f"<figure{id_attr}>\n{tag}\n<figcaption>{caption}</figcaption>\n</figure>"
        return f"<figure{id_attr}>\n{tag}\n</figure>"

    content = re.sub(
        r":::\{iframe\}\s+(\S+)\n(.*?)^:::\s*$",
        convert_iframe,
        content,
        flags=re.DOTALL | re.MULTILINE,
    )

    # Convert :::{table} directives — keep content, add caption
    def convert_table(m: re.Match) -> str:
        caption = m.group(1).strip()
        body = m.group(2)
        clean = "\n".join(
            ln for ln in body.split("\n") if not ln.startswith(":")
        ).strip()
        if caption:
            return f"**{caption}**\n\n{clean}"
        return clean

    content = re.sub(
        r":::\{table\}\s*([^\n]*)\n(.*?)^:::\s*$",
        convert_table,
        content,
        flags=re.DOTALL | re.MULTILINE,
    )

    # Convert :::{admonition} directives to blockquotes
    def convert_admonition(m: re.Match) -> str:
        title = m.group(1).strip()
        body = m.group(2)
        clean = "\n".join(
            ln for ln in body.split("\n") if not ln.startswith(":")
        ).strip()
        quoted = "\n".join(f"> {ln}" if ln.strip() else ">" for ln in clean.split("\n"))
        if title:
            return f"> **{title}**\n>\n{quoted}"
        return quoted

    content = re.sub(
        r":::\{admonition\}\s*([^\n]*)\n(.*?)^:::\s*$",
        convert_admonition,
        content,
        flags=re.DOTALL | re.MULTILINE,
    )

    # Remove remaining ::: directive wrappers (keep content)
    content = re.sub(r":::\{[^}]+\}[^\n]*\n?", "", content)
    content = re.sub(r"^:::\s*$", "", content, flags=re.MULTILINE)
    # +++ thematic breaks -> ---
    content = re.sub(r"^\+\+\+\s*$", "---", content, flags=re.MULTILINE)
    # Strip MyST header attributes like {#sec-dqn} or {.class}
    content = re.sub(r"(^#{1,6}\s+.*?)\s*\{[^}]+\}\s*$", r"\1", content, flags=re.MULTILINE)

    # Build TOC from ## and ### headers
    toc_entries: list[dict] = []
    for line in content.split("\n"):
        if line.startswith("## ") and not line.startswith("### "):
            toc_entries.append({"name": line[3:].strip()})
        elif line.startswith("### ") and toc_entries:
            toc_entries[-1].setdefault("subsections", []).append(
                {"name": line[4:].strip()}
            )

    proj = cfg.get("project", {})
    idx = ROOT / "index.md"
    abstract = ""
    if idx.exists() and idx.read_text().startswith("---"):
        fm = yaml.safe_load(idx.read_text().split("---")[1])
        abstract = fm.get("abstract", "").replace("\n", " ") if fm else ""

    authors = ["Anonymous"] if args.anonymous else [
        a.get("name") if isinstance(a, dict) else a for a in proj.get("authors", [])
    ]

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

    if (ROOT / "references.bib").exists():
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
