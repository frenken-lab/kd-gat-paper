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

    # 2. Export each file with myst and concatenate outputs
    print("Running myst build --md on each file...")
    exported_parts = []
    exports_dir = ROOT / "_build" / "exports"

    for f in files:
        if not f.exists():
            continue
        rel = f.relative_to(ROOT)
        cmd = ["npx", "mystmd", "build", str(rel), "--md", "--force"]
        subprocess.run(cmd, cwd=ROOT, capture_output=True)

        # myst outputs to _build/exports/<filename>.md
        out_name = f.stem + ".md"
        out_path = exports_dir / out_name
        if out_path.exists():
            text = out_path.read_text()
            # Strip myst frontmatter
            if text.startswith("---"):
                end = text.find("\n---", 3)
                if end != -1:
                    text = text[end + 4:].lstrip()
            exported_parts.append(text)
            out_path.unlink()

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
    # Remove ::: directive wrappers (keep content)
    content = re.sub(r':::\{[^}]+\}\n?', '', content)
    content = re.sub(r'^:::\s*$', '', content, flags=re.MULTILINE)
    # +++ thematic breaks -> ---
    content = re.sub(r'^\+\+\+\s*$', '---', content, flags=re.MULTILINE)

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
