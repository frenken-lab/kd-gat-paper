"""Slide-specific runtime helpers owned by the presentation source."""

from __future__ import annotations

import base64
import html as html_module
import re
from pathlib import Path

import colloquium.elements as _elements
import yaml

IFRAME_DEFAULT_HEIGHT = 480

IFRAME_PATTERN = re.compile(
    r'<pre><code class="language-iframe">(.*?)</code></pre>',
    re.DOTALL,
)


def _parse_height(value: object) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return IFRAME_DEFAULT_HEIGHT
    return parsed if parsed > 0 else IFRAME_DEFAULT_HEIGHT


def process_iframe(yaml_str: str) -> str:
    """Convert an iframe YAML spec to HTML."""
    raw = html_module.unescape(yaml_str.strip())
    try:
        spec = yaml.safe_load(raw)
    except yaml.YAMLError:
        return '<p style="color:red">Invalid iframe YAML</p>'

    if not isinstance(spec, dict):
        return '<p style="color:red">Iframe spec must be a YAML mapping</p>'

    src = str(spec.get("src", "")).strip()
    if not src:
        return '<p style="color:red">Iframe requires src</p>'

    height = _parse_height(spec.get("height", IFRAME_DEFAULT_HEIGHT))
    title = html_module.escape(str(spec.get("title", "")).strip())
    loading = html_module.escape(str(spec.get("loading", "lazy")).strip() or "lazy")
    allow_fullscreen = spec.get("allowfullscreen", True) not in {False, "false", "off", "0"}

    src_attr = html_module.escape(src, quote=True)
    allow_attr = " allowfullscreen" if allow_fullscreen else ""

    return (
        f'<div class="colloquium-iframe-container" style="width:100%;height:auto;min-height:{height}px;">'
        f'<iframe class="colloquium-iframe" src="{src_attr}" title="{title}" loading="{loading}" '
        f'width="100%" height="{height}" frameborder="0"{allow_attr} '
        f'style="border:none;display:block;width:100%;height:{height}px"></iframe>'
        "</div>"
    )

ELEMENTS = [
    (IFRAME_PATTERN, process_iframe),
]

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


def register_with(registry: list[tuple[object, object]]) -> None:
    existing = {(pattern.pattern, processor.__name__) for pattern, processor in registry}
    for pattern, processor in ELEMENTS:
        key = (pattern.pattern, processor.__name__)
        if key not in existing:
            registry.append((pattern, processor))
            existing.add(key)


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


def apply_slide_postprocessing(html: str, base_dir: Path) -> str:
    return apply_inline_svgs(apply_keyboard_relay(html), base_dir)


def apply_slide_postprocessing_path(html_path: str | Path, base_dir: Path) -> str:
    p = Path(html_path)
    p.write_text(
        apply_slide_postprocessing(p.read_text(encoding="utf-8"), base_dir),
        encoding="utf-8",
    )
    return str(p)
