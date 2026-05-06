# Authoring Stack

The paper build is a typed-source → AST → multi-shape-artifact pipeline. This doc holds the three lenses you need to reason about it: the latency loops you author against, the component inventory of what library does what, and the validation architecture that gates each contract.

```
SOURCES                 AST                  ARTIFACTS
data/csv/        →      _build/site/    →    _build/submission/    (TMLR Distill)
data/*.bib              content/*.json       _build/site/           (paper site)
images/                 (mdast)
paper/**/*.md
              ↑                       ↑
   semantic contract        output contract
   (refs resolve,           (artifact shape,
    cites back to bib,       anonymization,
    labels unique,           paths bundled)
    math parses)
       ↑
input contract
(schemas.yaml, bib structure,
 asset hygiene, alt-text)
```

Three contracts, three validation layers, three corresponding subdirs of `tools/validate/` (see [Validation architecture](#validation-architecture) below).

---

## Authoring loops

Four loops. Each has a latency budget; the dev orchestration is shaped to hit them.

| Loop | Edit                              | Feedback                          | Budget    | Status |
| ---- | --------------------------------- | --------------------------------- | --------- | ------ |
| L1   | `paper/**/*.md`                   | Rendered prose, cites, figures    | <1s       | ✓ MyST `start` |
| L2   | `interactive/src/figures/**/*`    | Updated chart in browser          | <200ms    | ✓ Vite HMR |
| L3   | `data/csv/*.csv`, schemas         | Updated chart from new numbers    | <5s       | partial — needs `data.dev.json` (open) |
| L4   | Anything                          | Distill-rendered TMLR submission  | <30s      | ✓ `tools/tmlr/preview.mjs` (~2s) |

`make dev` orchestrates the lot via overmind + `Procfile.dev` (5 processes: `myst`, `figs`, `tables`, `vale`, `preview`). `make dev-myst` is the no-overmind fallback.

---

## Stack inventory

Ten components a markdown-driven scientific authoring stack needs, mapped to what this repo actually has.

| # | Component | Have | Missing |
|---|-----------|------|---------|
| 1 | **Parser** | mystmd CommonMark + roles/directives, via `myst build` | — |
| 2 | **AST / IR** | mdast JSON in `_build/site/content/*.json`, consumed by `tools/tmlr/build.mjs` (rides `mdast-util-to-markdown` defaults + `gfm-table`; ~15 Distill-flavored handler overrides) and `tools/validate/lint.mjs` | — |
| 3 | **Cross-references** | mystmd resolves `{ref}`/`{numref}`/`{eq}` across files; resolution surfaces as `crossReference.resolved` in the AST | Editor-side label completion |
| 4 | **Citations** | 12 topic-split `.bib` files in `paper/references/`, validated by `tools/validate/inputs/bib.py`. mystmd resolves `[@key]`. TMLR build emits `<d-cite>`. | Bibkey completion that knows `{cite:p}` |
| 5 | **Math** | mystmd handles inline + display + label refs. AMS tagging in TMLR via `\eqref{}`. Round-trips via `inlineMath` / `math` handlers. | Live math preview, equation-label completion |
| 6 | **Figures** | SveltePlot data figures + SvelteFlow diagrams under `interactive/src/figures/`. Vite + `vite-plugin-singlefile` → self-contained HTML. iframed; TMLR rewrites paths via `_h_iframe`. | — |
| 7 | **PDF output** | Distill HTML for TMLR (Beyond PDF). Candidacy PDF removed 2026-05-06 — see commit log. | True LaTeX export (not currently demanded); print-quality candidacy PDF if needed later |
| 8 | **HTML output** | `myst build --site` → article-theme on GitHub Pages (paper); `curvenote deploy` → SPA on rob.curve.space (candidacy) | Self-host alternative to curve.space (tabled until post-candidacy) |
| 9 | **Editor LSP** | VS Code: `chrisjsewell.myst-lsp` + `errata-ai.vale-server` recommended; `pandocCiter.DefaultBib` covers all bibs; `kd-gat-paper.code-snippets` provides `cp`/`nr`/`eq`/`fig`/`alg` | Neovim equivalents (deferred to dotfiles) |
| 10 | **Lint / style** | Vale + STYLE.md banlists (`MLPaper/B1..B8`, `MLPaper/R4`), `make lint`, pre-commit hook. Validation see below. | LTeX-LS dictionary verification |

---

## Validation architecture

Three contracts → three layers → three drivers. All off-the-shelf — none of these are hand-rolled frameworks.

| Layer | Contract | Driver | Lives in |
|-------|----------|--------|----------|
| 1 — Inputs | schemas.yaml ✓, bib structure ✓, asset hygiene ✗, alt-text ✗ | Python (library-driven: `pyyaml`, `bibtexparser`) | `tools/validate/inputs/` |
| 2 — Semantic | refs resolve, cites match bib, labels unique, math parses, links live | Bun + `unist-util-visit` plugins reporting via `vfile-reporter` | `tools/validate/lint.mjs` + `tools/validate/semantic/` |
| 3 — Artifacts | submission shape, anonymization, paths bundled | `bun:test` (semantic-property tests over `_build/submission/submission.md`) | `tools/tmlr/build.test.mjs` (handler-level today; submission-level missing) |

Top-level rollup: `make validate` runs Layers 1+2. Layer 3 runs separately as `make test`.

### Layer 1 — Inputs (Python)

- **`inputs/data.py`** (was `tools/validate_data.py`): CSVs match `data/schemas.yaml`; required columns present; min-row constraints met. JSON figure-data files match declared keys/shape.
- **`inputs/bib.py`** (was `tools/validate_bib.py`): every `.bib` entry has the required fields for its type (`article` needs `author/title/journal/year`, etc.); duplicate keys fail; missing DOI on articles/proceedings warns.

Missing here: **asset hygiene** (set diff between `images/` and image refs in `paper/`) and **alt-text presence** (walk `:::{figure}` blocks). Both are mechanical Python additions; defer until they bite.

### Layer 2 — Semantic (Bun)

`tools/validate/lint.mjs` reads pre-built mdast JSON from `_build/site/content/*.json`, runs each plugin against every page, reports through `vfile-reporter`, exits 1 on fatal.

Why not `unified-engine`? The engine's value is parser/stringifier orchestration over source files. Our input is already-parsed JSON, so engine adds nothing — `vfile` + visitors direct is fewer moving parts. Revisit if `--watch` or source-file globbing becomes load-bearing.

Plugins live, each a `unist-util-visit` walker that calls `file.message`:

- **`semantic/no-dangling-xrefs.mjs`** — fails on `crossReference.resolved !== true`. mystmd already resolves; this just promotes its silent warnings to errors so dead "Figure 3" / "Eq. (5)" text can't ship.
- **`semantic/citations-exist.mjs`** — fails on `cite` keys missing from `paper/references/*.bib`; warns on unused bib entries (corpus-level, flushed on the last page).

Plugins planned per the original gap audit, in priority order:

1. **Math syntax** (chktex over `math` and `inlineMath` node values) — catches `\eqaution` typos and unmatched braces.
2. **Heading & structure linting** — no skipped levels, max section length, required-section presence per page kind. Borrow `remark-lint-*` where it covers the case.
3. **Link checker** (lychee, nightly cron rather than per-PR) — bib DOIs/URLs, GH-Pages iframe sources, internal anchor refs.

### Layer 3 — Artifacts (`bun:test`)

`tools/tmlr/build.test.mjs` exists today with handler-level snapshot tests against synthetic ASTs (37 cases). It catches handler-shape regressions but never inspects a real built `submission.md`.

Missing:

- **Submission snapshot tests.** Parse `_build/submission/submission.md` after `make tmlr`; assert: source-table count matches built `<figure id="tbl-*">` count, labeled math has `<a id="eq-*">` anchors, eq refs emit `\eqref`, no raw `:::` boundaries leaked, all iframe paths relative. Requires `make tmlr` to run before this job in CI.
- **Anonymization & format compliance.** No-leakage scan (`frenken`, `osu`, `OSU`) in anon mode; required sections present; page-count estimate. Run as `make tmlr-check` before submission deadlines.
- **Visual regression for figures.** Playwright screenshots of `_build/figures/*.html` + pixelmatch against committed PNGs. Heaviest of the three; defer until a figure regression bites.

---

## Open work

- **Figure data sketch path — `data.dev.json` convention.** Iterating a figure's data still requires `KD-GAT/export_paper_data.py` + `make data`, closing L3 from "minutes" to <200ms. Convention: if `interactive/src/figures/<kind>/<name>/data.dev.json` exists, the figure loads it instead of `data.json`. Gitignored, blocked by pre-commit. ~10 lines total. Pay off only when figure-data iteration becomes the daily bottleneck.

- **Output-tree split (paper vs candidacy).** Both builds currently write to `_build/site/`, so switching between `make site` and `make candidacy-site` clobbers the previous output. The Distill preview server reads from `_build/site/content/*.json` — fine while building one config at a time, foot-gun once both are active in CI. Fix: route MyST output through `--output _build/<config>/site/`. Mechanical; defer until the conflict bites.

---

## Not building

- A custom dev orchestrator. Overmind is one static binary; we don't add a moving part.
- A custom figure preview rig beyond Vite. Vite + iframe is fine.
- Bazel / nx / turbo. Makefile is right-sized for a single-paper repo.
- A custom Distill renderer. The preview server is a thin wrapper; canonical render is still Jekyll via `make preview`.
- A custom validator framework. `unified-engine` exists; `vfile-reporter` exists; `bun:test` exists. We don't write our own.
- LaTeX export. No venue currently demands it.
- Migrating off mystmd. Quarto-via-Pandoc would mean rewriting `tools/tmlr/build.mjs` against Pandoc JSON and losing curve.space + the Svelte figure pipeline + Curvenote sync. See `tools/tmlr/CONVERTERS.md` for the full survey.
- Self-hosting curve.space. Tabled until post-candidacy.
