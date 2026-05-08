"""Colloquium dev server with iframe + keyboard relay + SVG inlining support.

Wraps colloquium.serve.serve() applying the same post-processing as build.py to
both the initial build and every live rebuild.

Usage:
    uv run python tools/slides/serve.py <input.md> [--port 8080]
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

# --- 1. iframe monkey-patch (must precede any colloquium.build import) --------

import colloquium.elements as _elements

from tools.slides.build import (
    PATTERN,
    apply_inline_svgs,
    apply_keyboard_relay,
    process,
)

_elements.ELEMENTS.append((PATTERN, process))

# --- 2. patch build_file so the initial build gets post-processed -------------

import colloquium.build as _build_mod

_orig_build_file = _build_mod.build_file


def _wrapped_build_file(input_path: str, output_path: str) -> str:
    result = _orig_build_file(input_path, output_path)
    p = Path(result)
    html = p.read_text(encoding="utf-8")
    html = apply_keyboard_relay(html)
    html = apply_inline_svgs(html, Path(input_path).parent)
    p.write_text(html, encoding="utf-8")
    return result


_build_mod.build_file = _wrapped_build_file

# --- 3. patch _build_snapshot_html so live rebuilds get post-processed -------

import colloquium.serve as _serve_mod

_orig_snapshot = _serve_mod._build_snapshot_html


def _wrapped_snapshot(input_path: str, text: str) -> str:
    html = _orig_snapshot(input_path, text)
    html = apply_keyboard_relay(html)
    html = apply_inline_svgs(html, Path(input_path).parent)
    return html


_serve_mod._build_snapshot_html = _wrapped_snapshot

# --- 4. run -------------------------------------------------------------------

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="Markdown presentation file")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    _serve_mod.serve(args.input, port=args.port)
