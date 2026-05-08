"""Colloquium build wrapper with custom iframe element.

Monkey-patches colloquium.elements.ELEMENTS before calling build_file so the
iframe fenced block is available without forking colloquium.

Usage:
    uv run python tools/slides/build.py <input.md> [output_dir]

Output defaults to _build/slides/<stem>.html.

Iframe syntax in slides:
    ```iframe
    src: https://example.com/figure.html
    height: 520          # optional; defaults to IFRAME_DEFAULT_HEIGHT
    title: Optional accessible title
    ```

Global defaults (edit constants below):
    IFRAME_DEFAULT_HEIGHT  — pixel height for iframes without an explicit height:
"""

from __future__ import annotations

import base64
import html as html_module
import re
import sys
from pathlib import Path

import yaml

# --- global defaults ----------------------------------------------------------

IFRAME_DEFAULT_HEIGHT = 480  # px; override per-block with height: N

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
    height = int(spec.get("height", IFRAME_DEFAULT_HEIGHT))
    title = html_module.escape(str(spec.get("title", "")))

    # height:auto lets the container grow when figure-resize.ts expands the iframe.
    # min-height keeps the slot reserved before the figure loads.
    return (
        f'<div class="colloquium-iframe-container" '
        f'style="width:100%;height:auto;min-height:{height}px;">'
        f'<iframe src="{src}" width="100%" height="{height}" title="{title}" '
        f'frameborder="0" allowfullscreen '
        f'style="border:none;display:block;width:100%;height:{height}px"></iframe>'
        f"</div>"
    )


# --- keyboard relay injected into built HTML ----------------------------------

_KEYBOARD_RELAY_JS = """\
<script>
/* Relay keydown events from same-origin iframes to the parent window so
   colloquium slide navigation works after the user clicks inside a figure. */
(function () {
  function relay(iframe) {
    try {
      iframe.contentWindow.addEventListener('keydown', function (e) {
        window.dispatchEvent(new KeyboardEvent('keydown', {
          key: e.key, code: e.code, keyCode: e.keyCode, which: e.which,
          shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey,
          metaKey: e.metaKey, bubbles: true, cancelable: true,
        }));
      }, true);
    } catch (_) {}
  }
  function attachAll() {
    document.querySelectorAll('iframe').forEach(function (f) {
      if (f.contentDocument && f.contentDocument.readyState === 'complete') relay(f);
      f.addEventListener('load', function () { relay(f); });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachAll);
  } else {
    attachAll();
  }
})();
</script>
"""


_SVG_IMG_RE = re.compile(r'<img([^>]*)\bsrc="([^"]+\.svg)"([^>]*)>', re.IGNORECASE)


def apply_keyboard_relay(html: str) -> str:
    if "</body>" not in html:
        return html
    return html.replace("</body>", _KEYBOARD_RELAY_JS + "</body>", 1)


def apply_inline_svgs(html: str, base_dir: Path) -> str:
    def _replace(m: re.Match) -> str:
        pre, svg_path, post = m.group(1), m.group(2), m.group(3)
        full = base_dir / svg_path
        if not full.exists():
            return m.group(0)
        b64 = base64.b64encode(full.read_bytes()).decode("ascii")
        return f'<img{pre}src="data:image/svg+xml;base64,{b64}"{post}>'

    return _SVG_IMG_RE.sub(_replace, html)


def _inject_keyboard_relay(html_path: str) -> None:
    p = Path(html_path)
    p.write_text(apply_keyboard_relay(p.read_text(encoding="utf-8")), encoding="utf-8")


def _inline_svgs(html_path: str, base_dir: Path) -> None:
    p = Path(html_path)
    p.write_text(apply_inline_svgs(p.read_text(encoding="utf-8"), base_dir), encoding="utf-8")


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
    _inject_keyboard_relay(result)
    _inline_svgs(result, input_path.parent)
    print(f"Built: {result}")
