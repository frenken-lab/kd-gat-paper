#!/usr/bin/env python3
"""Convert MyST Markdown files under paper/ to Quarto .qmd.

Rules implemented (mechanical, conservative — hand-fix what the script flags):

1.  ``(label)=`` standalone label  →  `{#sec-<slug>}` attached to next heading,
    or `{#alg-<slug>}` attached to next ``:::{admonition}`` (algorithm) block.
2.  ``+++`` and ``+++ {...}`` block separators  →  removed.
3.  ```` ```{math}\n:label: eq-X\nBODY\n``` ````  →  ``$$\nBODY\n$$ {#eq-X}``.
4.  ```` ```{include} path\n[:start-line: N]\n``` ````  →  ``{{< include path >}}``.
5.  ```` ```{code-cell} python\n:tags: [...]\nBODY\n``` ````
        →  ```` ```{python}\n#| echo: false\nBODY\n``` ````.
6.  ``:::{iframe} URL\n:label: fig-X\n:width: W\nCAPTION\n:::``  →
        ``::: {#fig-X}\n```{=html}\n<iframe src="URL" ...></iframe>\n```\n\nCAPTION\n:::``.
7.  ``:::{figure} URL\n:label: fig-X\nCAPTION\n:::``  →
        ``![CAPTION](URL){#fig-X}``.
8.  ``:::{table} CAPTION\n:label: tbl-X\n\nBODY\n:::``  →
        ``::: {#tbl-X}\nBODY\n\n: CAPTION\n:::``.
9.  ``:::{admonition} TITLE\n:class: algorithm\n\nBODY\n:::``  →
        ``::: {.algorithm[ #id]}\n**TITLE**\n\nBODY\n:::``.
10. ``:::{dropdown} TITLE\n:open:\n\nBODY\n:::``  →
        ``::: {.callout-note collapse="false" title="TITLE"}\nBODY\n:::``.
11. ``{eq}`X```  →  ``@X``.
12. ``[](#id)`` cross-refs:
        - id matches ``fig-X|tbl-X|eq-X``  →  ``@id``
        - ``tab:X`` or ``tab-X``  →  ``@tbl-X``
        - everything else (sections, subsections, named anchors)  →  ``@sec-<slug>``.
13. ``[](file.md)`` and ``[text](path/file.md#anchor)``  →  ``.qmd`` extension.
14. Frontmatter:
        - drop ``subtitle`` (book yaml owns it),
        - drop ``kernelspec`` (Quarto execute owns it),
        - drop ``jupyter`` (legacy MyST kernel routing).

Anything unconverted is left in place and printed as a warning so the human
running the migration can review.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# --------------------------------------------------------------------------
# Slug normalization
# --------------------------------------------------------------------------

_SLUG_BAD = re.compile(r"[^a-z0-9-]+")


def slugify(label: str) -> str:
    s = label.strip().lower()
    s = s.replace(":", "-").replace("_", "-").replace(" ", "-")
    s = _SLUG_BAD.sub("-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    # Normalize the `tab-` prefix → `tbl-` so Quarto's @tbl- shortcut renders.
    if s.startswith("tab-") and not s.startswith("tbl-"):
        s = "tbl-" + s[len("tab-") :]
    return s


def is_known_xref_prefix(slug: str) -> bool:
    return slug.startswith(("fig-", "tbl-", "eq-", "sec-"))


# --------------------------------------------------------------------------
# Frontmatter
# --------------------------------------------------------------------------

_FM_RE = re.compile(r"\A---\n(.*?)\n---\n", re.DOTALL)


def rewrite_frontmatter(text: str) -> str:
    m = _FM_RE.match(text)
    if not m:
        return text
    body = m.group(1)
    # Drop fields that don't apply under Quarto book.
    out_lines: list[str] = []
    skip_block_indent: int | None = None
    for line in body.splitlines():
        stripped_indent = len(line) - len(line.lstrip(" "))
        if skip_block_indent is not None:
            if line.strip() == "" or stripped_indent > skip_block_indent:
                continue
            skip_block_indent = None
        if line.startswith(("subtitle:", "kernelspec:", "jupyter:")):
            if line.rstrip().endswith(":"):
                skip_block_indent = stripped_indent
            continue
        out_lines.append(line)
    new_fm = "\n".join(out_lines).strip("\n")
    return f"---\n{new_fm}\n---\n" + text[m.end() :]


# --------------------------------------------------------------------------
# +++ block separators (Curvenote/Jupyter Notebook metadata)
# --------------------------------------------------------------------------

_PLUS_RE = re.compile(r"^\+\+\+[^\n]*\n", re.MULTILINE)


def strip_plus_separators(text: str) -> str:
    return _PLUS_RE.sub("", text)


# --------------------------------------------------------------------------
# Fenced ``` blocks: math, include, code-cell
# --------------------------------------------------------------------------

_FENCE_RE = re.compile(
    r"^```\{(math|include|code-cell)\}([^\n]*)\n(.*?)^```[^\n]*$",
    re.DOTALL | re.MULTILINE,
)


def rewrite_fenced(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        kind = m.group(1)
        head = m.group(2).strip()
        body = m.group(3)
        if kind == "math":
            label = None
            body_lines: list[str] = []
            for line in body.splitlines():
                lab_match = re.match(r"\s*:label:\s+(\S+)", line)
                if lab_match and label is None:
                    label = slugify(lab_match.group(1))
                else:
                    body_lines.append(line)
            inner = "\n".join(body_lines).strip("\n")
            if label:
                return f"$$\n{inner}\n$$ {{#{label}}}"
            return f"$$\n{inner}\n$$"
        if kind == "include":
            path = head.strip()
            if not path:
                # Path was on the directive line as ``` ```{include}\npath ```
                first, _, rest = body.partition("\n")
                path = first.strip()
            # Drop :start-line: directive arg — wrappers are dropped from TOC.
            path = re.sub(r":start-line:\s*\d+", "", path).strip()
            return f"{{{{< include {path} >}}}}"
        if kind == "code-cell":
            lang = head.strip() or "python"
            body_lines = []
            tags: list[str] = []
            for line in body.splitlines():
                tag_match = re.match(r"\s*:tags:\s*\[(.*?)\]", line)
                if tag_match:
                    tags = [t.strip() for t in tag_match.group(1).split(",")]
                    continue
                if re.match(r"\s*:[a-zA-Z][a-zA-Z0-9_-]*:", line):
                    # Drop other ``:foo:`` directive args silently.
                    continue
                body_lines.append(line)
            opts: list[str] = []
            if "remove-input" in tags or "hide-input" in tags:
                opts.append("#| echo: false")
            inner = "\n".join(body_lines).strip("\n")
            opt_block = "\n".join(opts) + ("\n" if opts else "")
            return f"```{{{lang}}}\n{opt_block}{inner}\n```"
        return m.group(0)

    return _FENCE_RE.sub(repl, text)


# --------------------------------------------------------------------------
# ::: directive blocks (iframe, figure, table, admonition, dropdown)
# --------------------------------------------------------------------------

_DIRECTIVE_RE = re.compile(
    r"^:::\{(iframe|figure|table|admonition|dropdown)\}([^\n]*)\n(.*?)^:::[^\n]*$",
    re.DOTALL | re.MULTILINE,
)


def parse_directive_options(body: str) -> tuple[dict[str, str], str]:
    """Pull out ``:key: value`` lines at the top of a directive body."""
    opts: dict[str, str] = {}
    rest_lines: list[str] = []
    in_options = True
    for line in body.splitlines():
        if in_options:
            m = re.match(r"\s*:([a-zA-Z][a-zA-Z0-9_-]*):\s*(.*?)\s*$", line)
            if m:
                opts[m.group(1)] = m.group(2)
                continue
            if line.strip() == "" and not rest_lines:
                # Skip leading blank line between options and body.
                continue
            in_options = False
        rest_lines.append(line)
    return opts, "\n".join(rest_lines).strip("\n")


def rewrite_directives(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        kind = m.group(1)
        head = m.group(2).strip()
        body = m.group(3)
        opts, body_rest = parse_directive_options(body)
        label = opts.get("label")
        if label:
            label = slugify(label)
        if kind == "iframe":
            url = head
            attrs: list[str] = []
            if label:
                attrs.append(f"#{label}")
            cls = opts.get("class")
            if cls:
                attrs.extend(f".{c}" for c in cls.split())
            iframe_html = (
                f'<iframe src="{url}" width="100%" height="500" '
                f'frameborder="0" loading="lazy"></iframe>'
            )
            div_open = f"::: {{{' '.join(attrs)}}}" if attrs else ":::"
            return f"{div_open}\n```{{=html}}\n{iframe_html}\n```\n\n{body_rest}\n:::"
        if kind == "figure":
            url = head
            attrs = []
            if label:
                attrs.append(f"#{label}")
            width = opts.get("width")
            if width:
                attrs.append(f'width="{width}"')
            # Quarto image attrs attach with NO space between `)` and `{`.
            attr_str = ("{" + " ".join(attrs) + "}") if attrs else ""
            return f"![{body_rest}]({url}){attr_str}"
        if kind == "table":
            caption = head
            attrs = []
            if label:
                attrs.append(f"#{label}")
            attr_str = (" {" + " ".join(attrs) + "}") if attrs else ""
            cap_line = f"\n\n: {caption}" if caption else ""
            return f":::{attr_str}\n{body_rest}{cap_line}\n:::"
        if kind == "admonition":
            title = head
            cls = opts.get("class", "")
            attrs = []
            if "algorithm" in cls.split():
                attrs.append(".algorithm")
            else:
                attrs.append(".callout-note")
            if label:
                attrs.append(f"#{label}")
            attr_str = " ".join(attrs)
            title_line = f"**{title}**\n\n" if title else ""
            return f"::: {{{attr_str}}}\n{title_line}{body_rest}\n:::"
        if kind == "dropdown":
            title = head
            attrs = [".callout-note"]
            collapse = "false" if "open" in opts else "true"
            attrs.append(f'collapse="{collapse}"')
            if title:
                attrs.append(f'title="{title}"')
            if label:
                attrs.append(f"#{label}")
            attr_str = " ".join(attrs)
            return f"::: {{{attr_str}}}\n{body_rest}\n:::"
        return m.group(0)

    return _DIRECTIVE_RE.sub(repl, text)


# --------------------------------------------------------------------------
# (label)= standalone, attach to next heading or directive
# --------------------------------------------------------------------------

_STANDALONE_LABEL_RE = re.compile(r"^\(([A-Za-z][A-Za-z0-9_:.\-]*)\)=\s*\n", re.MULTILINE)


def attach_standalone_labels(text: str) -> str:
    """Attach standalone ``(name)=`` labels to the next heading or directive."""
    out: list[str] = []
    pending_label: str | None = None
    for line in text.splitlines(keepends=True):
        m = re.match(r"^\(([A-Za-z][A-Za-z0-9_:.\-]*)\)=\s*$", line.rstrip("\n"))
        if m:
            slug = slugify(m.group(1))
            # Algorithm labels keep their `alg-` prefix; everything else is a section.
            if slug.startswith("alg-"):
                pending_label = slug
            elif is_known_xref_prefix(slug):
                pending_label = slug
            else:
                pending_label = f"sec-{slug}"
            continue
        if pending_label is not None and line.strip() == "":
            # Skip blank lines between label and the thing it attaches to.
            continue
        if pending_label is not None:
            heading = re.match(r"^(#+\s+.*?)(\s*\{[^}]*\})?\s*$", line.rstrip("\n"))
            if heading:
                head, existing = heading.group(1), heading.group(2)
                if existing:
                    new_attr = existing.rstrip("}") + f" #{pending_label}}}"
                    out.append(f"{head} {new_attr}\n")
                else:
                    out.append(f"{head} {{#{pending_label}}}\n")
                pending_label = None
                continue
            div_open = re.match(r"^:::\s*\{([^}]*)\}\s*$", line.rstrip("\n"))
            if div_open:
                attrs = div_open.group(1)
                out.append(f"::: {{{attrs} #{pending_label}}}\n")
                pending_label = None
                continue
            # Not a heading or directive — emit inline anchor and the line.
            out.append(f"[]{{#{pending_label}}}\n\n")
            out.append(line)
            pending_label = None
            continue
        out.append(line)
    if pending_label is not None:
        out.append(f"[]{{#{pending_label}}}\n")
    return "".join(out)


# --------------------------------------------------------------------------
# Cross-refs and inline roles
# --------------------------------------------------------------------------

_EQ_ROLE_RE = re.compile(r"\{eq\}`([^`]+)`")


def rewrite_eq_role(text: str) -> str:
    return _EQ_ROLE_RE.sub(lambda m: f"@{slugify(m.group(1))}", text)


_EMPTY_LINK_RE = re.compile(r"\[\]\(#([A-Za-z][A-Za-z0-9_:.\-]*)\)")


def rewrite_empty_xrefs(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        slug = slugify(m.group(1))
        if slug.startswith(("fig-", "tbl-", "eq-")):
            return f"@{slug}"
        if slug.startswith("alg-"):
            return f"[](#{slug})"
        if not slug.startswith("sec-"):
            slug = f"sec-{slug}"
        return f"@{slug}"

    return _EMPTY_LINK_RE.sub(repl, text)


_TEXT_LINK_HASH_RE = re.compile(r"\[([^\]]+)\]\(#([A-Za-z][A-Za-z0-9_:.\-]*)\)")


def rewrite_text_xrefs(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        link_text, raw_id = m.group(1), m.group(2)
        slug = slugify(raw_id)
        if not slug.startswith(("fig-", "tbl-", "eq-", "sec-", "alg-")):
            slug = f"sec-{slug}"
        return f"[{link_text}](#{slug})"

    return _TEXT_LINK_HASH_RE.sub(repl, text)


# Plain links to .md → .qmd
_MD_LINK_RE = re.compile(r"\]\(([^)]+?)\.md(#[A-Za-z0-9_:.\-]*)?\)")


def rewrite_md_extensions(text: str) -> str:
    return _MD_LINK_RE.sub(lambda m: f"]({m.group(1)}.qmd{m.group(2) or ''})", text)


# --------------------------------------------------------------------------
# Driver
# --------------------------------------------------------------------------

PIPELINE = [
    rewrite_frontmatter,
    strip_plus_separators,
    rewrite_fenced,
    rewrite_directives,
    attach_standalone_labels,
    rewrite_eq_role,
    rewrite_empty_xrefs,
    rewrite_text_xrefs,
    rewrite_md_extensions,
]


def convert(text: str) -> str:
    for stage in PIPELINE:
        text = stage(text)
    return text


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("inputs", nargs="+", help=".md files to convert")
    ap.add_argument(
        "--write",
        action="store_true",
        help="Write .qmd next to .md (default: print converted output to stdout).",
    )
    ap.add_argument(
        "--check",
        action="store_true",
        help="Fail if any MyST-only syntax remains in the output.",
    )
    args = ap.parse_args()

    suspicious_patterns = [
        (r"\{numref\}", "{numref} role"),
        (r"\{cite\}", "{cite} role"),
        (r"\{ref\}", "{ref} role"),
        (r":::\{(iframe|figure|table|admonition|dropdown)\}", "unconverted directive"),
        (r"```\{(math|include|code-cell)\}", "unconverted fence"),
        (r"^\(([A-Za-z][A-Za-z0-9_:.\-]*)\)=\s*$", "unconverted (label)="),
    ]

    failures = 0
    for inp in args.inputs:
        path = Path(inp)
        text = path.read_text(encoding="utf-8")
        out = convert(text)
        if args.write:
            qmd_path = path.with_suffix(".qmd")
            qmd_path.write_text(out, encoding="utf-8")
            print(f"wrote {qmd_path}", file=sys.stderr)
        else:
            sys.stdout.write(out)
        if args.check:
            for pat, name in suspicious_patterns:
                hits = re.findall(pat, out, re.MULTILINE)
                if hits:
                    print(
                        f"warn {path}: {len(hits)} occurrences of {name}",
                        file=sys.stderr,
                    )
                    failures += 1
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
