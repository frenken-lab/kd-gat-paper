"""Thin colloquium slide dev-server wrapper."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

import colloquium.build as _build_mod
import colloquium.elements as _elements
import colloquium.serve as _serve_mod

from presentations._slides import apply_slide_postprocessing, register_with

register_with(_elements.ELEMENTS)

_orig_build_file = _build_mod.build_file


def _wrapped_build_file(input_path: str, output_path: str) -> str:
    result = _orig_build_file(input_path, output_path)
    p = Path(result)
    p.write_text(
        apply_slide_postprocessing(p.read_text(encoding="utf-8"), Path(input_path).parent),
        encoding="utf-8",
    )
    return result


_build_mod.build_file = _wrapped_build_file

_orig_snapshot = _serve_mod._build_snapshot_html


def _wrapped_snapshot(input_path: str, text: str) -> str:
    return apply_slide_postprocessing(_orig_snapshot(input_path, text), Path(input_path).parent)


_serve_mod._build_snapshot_html = _wrapped_snapshot


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("input", help="Markdown presentation file")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    _serve_mod.serve(args.input, port=args.port)

