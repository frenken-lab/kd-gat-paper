# TMLR Beyond PDF Conversion

Converts the MyST paper to TMLR Beyond PDF (Distill-layout) by serializing
the mystmd `mdast` tree.

## Usage

```bash
make tmlr          # Build submission
make tmlr-anon     # Build anonymous submission
cd tools/tmlr && bun test     # Run serializer tests
```

## How It Works

`build.mjs` is a thin orchestrator on top of
[`mdast-util-to-markdown`](https://github.com/syntax-tree/mdast-util-to-markdown)
+ its `gfm-table` extension. The strategy is to *delegate* common nodes to
`defaultHandlers` (paragraphs, lists, headings, links, code, emphasis,
strong, html, text, blockquote, thematicBreak) and only override the
handful of node types where Distill output diverges from generic markdown:

| Node                 | Distill output                                           |
| -------------------- | -------------------------------------------------------- |
| `cite` / `citeGroup` | `<d-cite key="...">` runs                                |
| `crossReference`     | `template.replace('%s', enumerator)` or `[identifier]`   |
| `link` (internal)    | `/foo` → `#foo`                                          |
| `inlineMath`/`math`  | `$x$` / fenced `$$ $$`                                   |
| `iframe`             | Jekyll `{{ '...' \| relative_url }}` → `assets/html/...` |
| `image`              | Same Jekyll path; `.pdf` → `<embed>`                     |
| `container[figure]`  | `<figure id="...">` wrapper                              |
| `container[table]`   | Pre-built HTML from `_build/tables/<name>.md`, else AST  |
| `details`            | HTML5 `<details markdown="1">`                           |
| `tabSet`             | Sequential bold-titled sections (Distill blocks tabs)    |
| `admonition`         | `class="algorithm"` → styled div; else blockquote        |
| `text`               | Strips `{#anchor}` suffixes                              |

The pipeline:

1. Read `_build/site/config.json` → project metadata + TOC.
2. For each TOC file, read `_build/site/content/<stem>.json` and serialize the `mdast` field.
3. Build YAML frontmatter (Distill layout, abstract from `index.json`, authors).
4. Build TOC by scanning `##`/`###` headings.
5. Concat → `_build/submission/submission.md`.
6. Copy assets: `paper/references/*.bib` (concatenated) → `submission.bib`; `_build/figures/*.html` → `assets/html/submission/`; `images/*.{png,svg,pdf}` → `assets/images/`.

## Tests

`build.test.mjs` uses Bun's built-in test runner (`bun test`) and checks
observable *properties* of the output (does `<d-cite>` survive table cells?
does `.pdf` images render as `<embed>`?) rather than byte-exact strings —
because exact-string assertions break trivially when
`mdast-util-to-markdown` updates its escaping or wrapping.

## Dependencies

- Node.js 20+
- `mdast-util-to-markdown` ^2.1
- `mdast-util-gfm-table` (transitive via `myst-to-md`)
- `js-yaml` ^4.1

Install: `bun install` (run from this directory; the lockfile lives here).
