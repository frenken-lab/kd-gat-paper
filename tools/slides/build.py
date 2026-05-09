"""Thin colloquium slide build wrapper."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from colloquium.build import build_file
import colloquium.elements as _elements  # noqa: E402
from presentations._slides import register_with, apply_slide_postprocessing_path

register_with(_elements.ELEMENTS)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: uv run python tools/slides/build.py <input.md> [output_dir]")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("_build/slides")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = str(output_dir / f"{input_path.stem}.html")

    result = build_file(str(input_path), output_path)
    apply_slide_postprocessing_path(result, input_path.parent)
    print(f"Built: {result}")

