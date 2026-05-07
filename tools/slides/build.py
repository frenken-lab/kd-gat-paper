"""Colloquium build wrapper with custom iframe element.

Monkey-patches colloquium.elements.ELEMENTS before calling build_file so the
iframe fenced block is available without forking colloquium.

Usage:
    uv run python tools/slides/build.py <input.md> [output_dir]

Output defaults to _build/slides/<stem>.html.

Iframe syntax in slides:
    ```iframe
    src: https://example.com/figure.html
    height: 520
    title: Optional accessible title
    ```
"""

from __future__ import annotations

import html as html_module
import re
import sys
from pathlib import Path

import yaml

# --- iframe element -----------------------------------------------------------

PATTERN = re.compile(
    r'<pre><code class="language-iframe">(.*?)</code></pre>',
    re.DOTALL,
)


def process(yaml_str: str) -> str:
    raw = html_module.unescape(yaml_str.strip())
    try:
        spec = yaml.safe_load(raw)
    except yaml.YAMLError:
        return '<p style="color:red">Invalid iframe YAML</p>'

    if not isinstance(spec, dict) or "src" not in spec:
        return '<p style="color:red">iframe element requires at least: src: &lt;url&gt;</p>'

    src = html_module.escape(str(spec["src"]))
    height = int(spec.get("height", 500))
    title = html_module.escape(str(spec.get("title", "")))

    return (
        f'<div class="colloquium-iframe-container" '
        f'style="width:100%;height:{height}px;overflow:hidden">'
        f'<iframe src="{src}" width="100%" height="{height}" title="{title}" '
        f'frameborder="0" allowfullscreen '
        f'style="border:none;display:block;width:100%;height:100%"></iframe>'
        f"</div>"
    )


# --- inject into colloquium registry before importing build_file -------------

import colloquium.elements as _elements  # noqa: E402

_elements.ELEMENTS.append((PATTERN, process))

from colloquium.build import build_file  # noqa: E402

# -----------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: uv run python tools/slides/build.py <input.md> [output_dir]")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("_build/slides")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = str(output_dir / f"{input_path.stem}.html")

    result = build_file(str(input_path), output_path)
    print(f"Built: {result}")
