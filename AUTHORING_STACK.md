# Authoring Stack — Have / Missing

Status of the ten components a markdown-driven scientific authoring stack needs, mapped to what `kd-gat-paper` actually has today (mystmd-centric) and what's missing.

| # | Component | Have | Missing |
|---|-----------|------|---------|
| 1 | **Parser** (markdown source → tokens) | mystmd's CommonMark + roles/directives parser, invoked via `myst build`. | Nothing — this layer works. |
| 2 | **AST / IR** (structured tree downstream tools can walk) | mdast JSON dumped to `_build/site/content/*.json`. Consumed by `tools/tmlr/build.mjs` (~450 lines, run under Bun; rides on `mdast-util-to-markdown` `defaultHandlers` + `gfm-table` extension; Distill-specific overrides for `cite`/`citeGroup`, `crossReference`, `iframe`, `image` (Jekyll path), `container[figure\|table]`, `admonition[algorithm]`, `tabSet`, `details`, `inlineMath`/`math`, internal-link rewrite). Tests via `bun test` check semantic properties (29 cases, `bun:test` + `expect`). | Nothing further short-term — the swap deleted ~1300 lines of hand-rolled Python and tests. Future risk: when mystmd adds new node types, mdast-util-to-markdown's `unsafe` machinery will warn rather than silently dropping content. |
| 3 | **Cross-references** (numbered figs/tables/eqs/sections, file-spanning) | mystmd resolves `{ref}`, `{numref}`, `{eq}` across files; `_h_cross_reference` in `build.py` consumes the resolved `template`/`enumerator` injected into the AST. | Editor-side completion of label IDs. No LSP surfaces them; you grep. |
| 4 | **Citations** (BibTeX → cite roles → rendered refs) | 12 topic-split `.bib` files in `paper/references/` (own, can_ids, gnn, kd, rl, vgae, datasets, curriculum, cross_domain, infrastructure, background, loss), validated by `tools/validate_bib.py`. mystmd resolves `{cite:p}` / `[@key]`. TMLR build emits `<d-cite>` and concatenates all bibs into `submission.bib`. | Bibkey completion in editors. `cmp-pandoc-references` works on `[@key]` syntax but doesn't know `{cite:p}`. No "find unused keys" or "find missing keys" lint. STYLE.md R5 / B8 (citation hygiene) is enforced by reading, not tooling. |
| 5 | **Math** (inline + display, label refs, numbering) | mystmd handles `$...$`, `$$...$$`, eq labels + `{eq}` refs. Typst PDF renders cleanly. Serializer round-trips both via `inlineMath` / `math` handlers. | Live math preview in editor. Equation-label completion. |
| 6 | **Figures** (interactive + static, numbered, cross-refable) | SveltePlot data figures + SvelteFlow diagrams under `interactive/src/figures/`. Vite + `vite-plugin-singlefile` → self-contained HTML in `_build/figures/`. iframed into prose; TMLR build rewrites paths via `_h_iframe` (with `figure-resize.ts` for autosize). | Static raster/SVG fallback for the candidacy Typst PDF — currently iframes don't render in print, so the PDF ships placeholders. Decision deferred. |
| 7 | **PDF output** | Two paths: (a) Typst via `myst build --pdf --config myst.candidacy.yml` for candidacy; (b) Jekyll Distill HTML via TMLR kit (TMLR's "beyond PDF" target — not really a PDF). | True LaTeX export. mystmd has `myst-to-tex` but template support for TMLR/arXiv classes is thin. |
| 8 | **HTML output** (site, hosted) | Two: `myst build --site` → article-theme on GitHub Pages (paper); `curvenote deploy` → SPA on rob.curve.space (candidacy superset). Iframe isolation handled because curve.space SPA can't serve static HTML. | Self-host alternative to curve.space (tabled per memory `project_post_candidacy_hosting_revisit.md` — revisit after candidacy). |
| 9 | **Editor LSP / IDE support** | VS Code: `myst-highlight` (last release **2021-06**, syntax only). That's it. Vim/Neovim on OSC: nothing MyST-aware. | Almost everything: directive/role completion, xref-to-label completion, bibkey completion for `{cite:p}`, hover for citations, jump-to-definition. `chrisjsewell/myst-lsp` is the closest project but self-describes as in-development. **This is the largest gap.** |
| 10 | **Lint / style / prose checking** | `tools/validate_bib.py` (bib hygiene). `tools/validate_data.py` (CSV schemas). `paper/STYLE.md` is a 671-line, methodology-grounded manual checklist: 7 rules (R1–R7) with exemplar anchors + bite tests, 8 banned LLM tells (B1–B8) with before/after, image inventory + connector-verb palette as positive companions. Pre-commit hooks installable via `make pre-commit-install`. | Mechanical enforcement of STYLE.md. No Vale, no `proselint`, no `write-good`. No project-specific `Vocab` for `GAT`/`KD`/`VGAE`/etc. No `TokenIgnores` to stop linters from choking on MyST roles. STYLE.md's R4/B4/B6 banlists (`moreover`, `furthermore`, `it is important to note`, `naturally`, `clearly`, `obviously`, `notably`, `it is well known`, `as we shall see`) are mechanically checkable today and aren't checked. |

## Status (post-2026-05-04, bun-builder pass)

Closed since the original audit:

1. **Vale + STYLE.md banlists** — `.vale.ini` (incl. `TokenIgnores` for MyST roles + math, `BlockIgnores` for fenced directives), `.vale/styles/MLPaper/{B1..B8,R4}.yml`, `MLPaper/accept.txt` Vocab, `make lint` / `make lint-sync`, pre-commit hook.
2. **`mdast-util-to-markdown` adoption** — `tools/tmlr/build.mjs` replaces `build.py` (~1300 lines deleted). 29 semantic-property tests via `bun test`.
3. **Editor LSP / cite completion (workspace-level)** — `chrisjsewell.myst-lsp` + `errata-ai.vale-server` recommended in `.vscode/extensions.json`; `pandocCiter.DefaultBib` covers all 13 bib files; `kd-gat-paper.code-snippets` provides `cp`/`nr`/`eq`/`fig`/`alg`. LTeX dictionary points at MLPaper Vocab. Neovim equivalent left to dotfiles.
4. **`figures-static` drift resolved** — Makefile target + `extract-svg.js` reference removed. PDF figure story is "web-only" (placeholders in the Typst candidacy PDF).
5. **Distill preview server** — `tools/tmlr/preview.mjs` closes L4 to ~2 s. See `AUTHORING_PLAN.md`.

Remaining short-term:

- **LTeX-LS dictionary verification** — confirm the `:./.vale/styles/config/vocabularies/MLPaper/accept.txt` syntax actually loads on first `myst start` session.
- **Static fallback for Typst PDF figures** — see Component 6 above. Decision deferred until candidacy needs it.

## What's *not* on the table short-term

- Migrating off mystmd. The realistic future target is Quarto (not Sphinx); cost ≫ remaining authoring cost on this paper, and `tools/tmlr/build.py` would need to be rewritten against Pandoc JSON.
- Self-hosting curve.space (tabled until post-candidacy).
- LaTeX export path (no venue currently demands it for this submission).
