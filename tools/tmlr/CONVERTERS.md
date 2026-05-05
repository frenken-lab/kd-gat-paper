# Markdown Converter Survey — for `tools/tmlr/build.mjs`

Survey of "markdown → other format" converters, scored against the question:
should `build.mjs` keep growing, or pivot to a published tool?

## TL;DR

- Keep `build.mjs`. It is ~480 LOC and already rides `mdast-util-to-markdown`'s defaults; the bespoke part is ~15 Distill-flavored handlers (`<d-cite>`, `<iframe>` rewrite, algorithm `<div>`, table HTML inlining). No off-the-shelf tool emits Distill markdown.
- `myst-to-md` (already vendored at `node_modules/myst-to-md/1.0.16`) emits **MyST-flavored markdown** (`{cite}` roles, `:::{directive}` blocks, frontmatter). Wrong target. It is the inverse of what TMLR needs.
- Pandoc has no MyST input reader and no Distill writer. Bridging via `mystmd → md → pandoc → md` would lose the AST that the current handlers depend on (`crossReference.identifier`, `cite.label`, `iframe.src`).
- The "use Pandoc as source of truth" route is real but means rewriting the paper in Pandoc Markdown and adopting Quarto. Not free.

## Direct answers

**Could Pandoc replace `build.mjs`?** No, not without rewriting the source.
Pandoc cannot read MyST Markdown ([User's Guide input list](https://pandoc.org/MANUAL.html#general-options) — CommonMark, GFM, Pandoc Markdown, RST, but no MyST). The closest pivot is `myst build --tex` then `pandoc tex → markdown`, but the LaTeX writer drops MyST-specific constructs (`{cite}`, `:::{tab-set}`, `iframe` directives) into raw `\textbackslash` blocks well before Pandoc ever sees the AST. Distill's `<d-cite>` and Jekyll `{{ '...' | relative_url }}` are also outside Pandoc's writer vocabulary; you would write them through a Lua filter that reconstructs what `build.mjs` already has.

**Does `myst-to-md` cover Distill output?** No.
The package is round-trip MyST→MyST, designed for `make sync` style flows. Inspecting the vendored source (`node_modules/myst-to-md/src/`):

- `roles.ts` `cite` handler emits `` {cite}`label` `` and `citeGroup` emits `` {cite:p}`a;b` `` — MyST role syntax, not `<d-cite key="">`.
- `directives.ts` emits `:::{figure}` / `:::{table}` containers; Distill needs `<figure>` HTML with kramdown `markdown="1"`.
- `references.ts` `crossReference` emits `[%s](#id)` MyST-style; `build.mjs` has equation-specific `\eqref{}` for MathJax AMS tagging.
- No `iframe` rewrite; no Jekyll `relative_url` interpolation; no algorithm-admonition CSS injection.

So `myst-to-md` is dead weight in `package.json` for the TMLR build. It would be useful if Curvenote-editor round-tripping ever needed it; otherwise drop the dep.

**What is `mdast-util-to-markdown` for, and how do we extend it?**
It is the canonical mdast → Markdown serializer in the `unified`/`syntax-tree` ecosystem (v2.1.2, Nov 2024). Two extension points:

- `options.handlers`: `{nodeType: (node, parent, state, info) => string}` — per-node serializer, overrides defaults.
- `options.extensions`: list of `{handlers, unsafe, join}` bundles. `gfmTableToMarkdown()` is one such; `myst-to-md` itself is another (it returns its `Options` object via the `unified` Compiler interface).

`build.mjs` already uses both correctly. The one historical bug (children dispatched via `handlers[type]` instead of `state.handle`) is captured in `~/.claude/projects/.../memory/feedback_state_handle_for_extensions.md` and fixed.

## Tier 1 — deep dives

### Pandoc

- **Inputs**: CommonMark, GFM, Pandoc Markdown, RST, LaTeX, HTML, DOCX, EPUB, JATS, OPML, Org, Textile, Jupyter, ~40 total. **No MyST reader.**
- **Outputs**: HTML, LaTeX, Beamer, ConTeXt, DOCX, ODT, EPUB, PDF (via LaTeX/Typst/wkhtmltopdf), JATS, AsciiDoc, RST, Typst, plus all Markdown variants and reveal.js/Slidy.
- **Filters**: Lua (in-process, fast, has `pandoc` module with `pandoc.Strong()`, `pandoc.SmallCaps()` constructors) or JSON-on-stdin (any language that can read/write JSON; libraries exist for Python `panflute`, JS, Haskell). Lua wins for repo simplicity — no extra runtime, no JSON marshalling tax.
- **Custom writers**: Lua-only. You write a function per node type that returns a string. This is the closest analogue to `build.mjs`.
- **AST**: Stable, documented, JSON-serializable (`pandoc -t json`). Same shape Lua filters see.
- **Citeproc / templates**: `--citeproc` handles bib resolution; templates (`pandoc -D html`) control surrounding HTML scaffold.
- **Maturity**: 3.9.0.2, March 2026. Universal. ~17 years old.
- **Verdict for this repo**: Wrong tool, right ecosystem. Pandoc shines when source is Pandoc Markdown and output is one of the 40 supported formats. MyST→Distill is in neither column. Adopting Pandoc means migrating off mystmd entirely, which costs the interactive figures pipeline, the candidacy SPA, and Curvenote sync.

### mystmd

- **Inputs**: MyST Markdown, Jupyter notebooks, LaTeX (limited).
- **Outputs**: HTML site (via the `myst build --site` JSON AST that `build.mjs` already consumes), Typst PDF, LaTeX/PDF, JATS, DOCX, **Markdown** (`format: md` in `exports:`). Confirmed at https://mystmd.org/guide/quickstart-static-exports.
- **Plugin model**: `myst-plugin` interface; transforms run on the mdast tree before writers. Not as developed as Pandoc filters, but enough for content rewrites.
- **AST**: mdast extended with MyST node types (`crossReference`, `cite`, `container`, `admonition`, `tabSet`, `iframe`, `block`). This is the AST `build.mjs` reads.
- **`myst-to-md` package**: round-trips to MyST-flavored Markdown. See above — wrong target for TMLR.
- **Maturity**: Active (Curvenote/jupyter-book), 1.x stable, releases roughly monthly.
- **Verdict for this repo**: Already the source-of-truth. The `_build/site/content/*.json` AST is exactly the right input for a custom Distill writer. Don't replace it; keep extending the writer.

### Quarto

- **Inputs**: Pandoc Markdown (`.qmd`), Jupyter notebooks, R Markdown.
- **Outputs**: Everything Pandoc can write — HTML, PDF, DOCX, ePub, reveal.js, Beamer, JATS, AsciiDoc, GFM/CommonMark/Hugo/Docusaurus markdown variants, ConTeXt, RTF, AsciiDoc, plus wikis (MediaWiki, DokuWiki, etc.) — list at https://quarto.org/docs/output-formats/all-formats.html.
- **Filters**: Pandoc Lua filters plus Quarto's own shortcode and project-level filters.
- **AST**: Pandoc AST (Lua filters see it directly).
- **Maturity**: 1.5.x as of 2026, Posit-funded, large ecosystem.
- **Verdict for this repo**: Plausible alternative *universe* — author in `.qmd`, render to Distill via a custom HTML format extension. Costs: lose mystmd cross-refs (`crossReference` enumerator templates), lose curve.space deploy (Quarto sites are static, not Curvenote SPAs), lose interactive Svelte figures unless you wrap them as iframe shortcodes. Not worth it for a single TMLR submission with a working Distill emitter.

## Tier 2 — concise

**unified ecosystem** — `remark` parses Markdown to mdast, `rehype` parses HTML to hast, `remark-rehype`/`rehype-remark` bridge them. The `mdast-util-to-*` family (`-markdown`, `-hast`, `-nlcst`) does cross-tree conversion. **This is exactly what `build.mjs` uses.** The right entry point for "I have an mdast and want some other markdown flavor" is `mdast-util-to-markdown` plus custom handlers — i.e., the current setup. unifiedjs.com/learn covers the patterns.

**markdown-it** — JS Markdown parser, plugin chain operates on a flat token stream (not a tree). Powers VuePress, mkdocs-material's JS bits, GitLab. Different mental model from unified; unsuited for "render mdast back to markdown" since it's parser-side.

**CommonMark.js / cmark / cmark-gfm** — reference parsers; minimal extension surface, used as embedded engines (GitHub uses cmark-gfm). Not a customization target.

**Asciidoctor** — Ruby (and Asciidoctor.js); first-class converter pipeline (HTML, PDF via `asciidoctor-pdf`, EPUB, DocBook). Mature in book/manual publishing (O'Reilly toolchain). Inputs AsciiDoc, not Markdown. Worth knowing as an alternative authoring system but irrelevant to a MyST repo.

**Typst** — typesetting system, not a Markdown converter. Custom syntax, no native Markdown reader. Production-ready for papers (Curvenote integrates it as mystmd's preferred PDF backend per `make candidacy-pdf`). It is *not* a path to obviating Markdown — it is a target you compile *to*.

## Tier 3 — reference

- **showdown.js** — old, simple JS Markdown→HTML converter; superseded by markdown-it for new work.
- **marked** — fastest JS Markdown→HTML; minimal extension API; used by Discord, OpenAI docs.
- **gray-matter** — frontmatter parser, not a converter; pairs with anything.
- **Slate** / **ProseMirror** — rich-text editor frameworks with their own document models; can serialize to Markdown but the model is editor-shaped (selection-aware), not document-shaped. Wrong layer.

## What the hand-rolled serializer doesn't do (that Pandoc would give for free)

If we ever migrate to Pandoc-Markdown source, these are bonuses:

- **Citeproc** — automatic CSL bibliography rendering. Currently the TMLR kit's Jekyll plugin handles bib via `{% bibliography %}`; Pandoc would do it at conversion time.
- **Cross-format consistency** — same source → DOCX, EPUB, ODT for free. We don't need DOCX, but reviewer-friendly DOCX would be a bonus.
- **Templates** — Pandoc HTML/LaTeX templates separate scaffold from content. `build.mjs` mixes them (the algorithm `<style>` block lives inside the admonition handler).
- **Tested writer for 30+ formats** — we maintain ~15 handler functions; Pandoc writers are battle-tested.

What we'd lose:

- MyST cross-references with enumerator templates (`Figure %s`, `Equation %s`) that resolve at AST time.
- `myst build --site` AST as ingest (the JSON includes resolved frontmatter, `parts.abstract`, TOC structure).
- Curvenote sync (`make sync` round-trips through MyST mdast).
- Interactive figure spec — Svelte builds depend on MyST containers tagging the iframe sources.

## Recommendation

Keep `build.mjs`. Two cleanups:

1. **Drop the `myst-to-md` dependency.** It is unused in `build.mjs` (grep confirms — only `mdast-util-to-markdown` and `mdast-util-gfm-table` are imported). Removing it shrinks the lockfile.
2. **Document the Distill-vocabulary decisions.** The handler list in `build.mjs:244-285` is the de-facto spec for "what MyST nodes map to what Distill HTML." A short comment block listing the 15 custom handlers and the Distill construct each emits would make the file legible to future Robert.

Don't migrate to Pandoc unless the toolchain question reopens (e.g., TMLR Beyond PDF goes away and we go back to a single PDF target, in which case Quarto becomes more attractive). The current shape — MyST mdast → 15 handlers riding `mdast-util-to-markdown` defaults — is the smallest correct architecture for this problem.
