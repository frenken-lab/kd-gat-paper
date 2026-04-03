# Fragility Audit — kd-gat-paper

Audited: 2026-04-02 (updated 2026-04-03)

## Summary

| Area | Rating | Status | Primary Risk |
|---|---|---|---|
| Data Pipeline | **MEDIUM** | partially fixed | ESS decoupled via HF dataset `buckeyeguy/GraphIDS`; 2 figures still synthetic (fusion, reconstruction) |
| TMLR Export | **LOW** | hardened | AST fallthrough warns; TOC recursive; iframe URL-parsed; `mystmd` pinned |
| Candidacy Config Swap | **MEDIUM** | fixed | `trap` cleanup added; dual TOC/articles lists still diverge manually |
| CI Pipeline | **LOW** | fixed | `mystmd@1.8.3`/`curvenote@0.14.3`/`bibtexparser==2.0.0b9` all pinned |
| Schema Validation | **LOW** | audit corrected | `literature_baselines.csv` was already validated |
| References | **LOW** | mostly fixed | 140/164 (85%) have DOIs; 24 remaining lack DOIs legitimately (USENIX, books, software, standards, not-yet-indexed) |
| Figure Build | **LOW** | hardened | try/catch per figure; missing output errors; stale cleanup; FIGURE guard |
| Diagram Library | **LOW** | hardened | Role-name typos warn; box/container drops warn; sparse topology documented+tested; 181 tests |
| Table Build | LOW | unfixed | Missing CSV is a warning not an error; bold list hardcoded |
| Docs Freshness | LOW | fixed | Stale doc detection works; comments on existing issues |

## Detail

### Data Pipeline — MEDIUM (partially fixed)

ESS dependency decoupled: `make data` now pulls from `buckeyeguy/GraphIDS` on Hugging Face (30+ files + schema contract README). 3 of 5 original data gaps resolved — `umap`, `attention`, and `cka` now have real data. 2 figures still use synthetic data: `fusion` (quantized alpha values) and `reconstruction` (smooth placeholder curves).

Schema contract (`data/schemas.yaml`) checks shape but not value ranges — all-zero metrics would pass.

### TMLR Export — LOW (was HIGH)

`tools/tmlr/build.py` (~400 lines) walks MyST AST JSON to produce Distill-layout markdown.

All five fragility points hardened (2026-04-02):

- ~~TOC traversal reads only one nesting level~~ → recursive `_collect_toc_files` handles arbitrary depth.
- ~~`mdast` handled as both dict and JSON string~~ → `.get()` with `warnings.warn` on missing key (was unguarded `KeyError`).
- ~~`HANDLERS` dispatch: unhandled AST node types silently fall through~~ → `warnings.warn` on first encounter of each unknown type.
- ~~Abstract extraction is 4 levels deep with no error~~ → warns when abstract is missing from frontmatter.
- ~~iframe `Path(url).name` breaks on query strings~~ → `urlparse` extracts path before taking filename.
- `mystmd` pinned to 1.8.3.

### Candidacy Config Swap — MEDIUM (was HIGH)

CI physically overwrites `myst.yml` with candidacy config for curve.space deploy. `trap` cleanup now restores on failure. Remaining risk: the export `articles` list and site `toc` in `myst.candidacy.yml` must be kept in sync manually.

### CI Pipeline — LOW (was MEDIUM, now fixed)

- `mystmd@1.8.3` pinned in all 3 install locations.
- `curvenote@0.14.3` pinned.
- `bibtexparser==2.0.0b9` exact pin (was loose lower bound).
- `pyyaml`, `tabulate` unpinned (low risk, stable APIs).

### References — LOW (was MEDIUM)

DOI backfill complete: 140/164 entries (85.4%) now have DOIs. 117 DOIs added (74 CrossRef, 43 arXiv/fallback). 10 year corrections, 6 metadata fixes (incl. DenselyGuided-KD2019 fabricated authors). 24 entries legitimately lack DOIs (USENIX, books, software, standards, not-yet-indexed). `--strict` can now be enabled with an allow-list for the 24 known exceptions. Full log: `paper/references/DOI_BACKFILL.md`.

### Figure Build — LOW (was MEDIUM)

`build.js` runs sequential Vite builds with `execSync`.

Hardened (2026-04-02):

- ~~First Vite failure killed the entire loop~~ → try/catch per figure; failed figures logged and loop continues.
- ~~Silent empty output (rename guard swallowed missing index.html)~~ → explicit error when Vite produces no output.
- ~~No build summary~~ → pass/fail counts printed; `process.exit(1)` on any failure.
- ~~Stale outputs from deleted figures persisted forever~~ → pre-build cleanup removes `.html` files whose stem is not in the current figure set.
- ~~`FIGURE` unset in build mode silently resolved to `src/figures/undefined/`~~ → `vite.config.js` throws on missing `FIGURE` in both serve and build modes.

### Diagram Library — LOW (was MEDIUM)

Hardened (2026-04-02):

- ~~Role-name typos silently produce invalid CSS~~ → `resolve()` warns on names that aren't a known role, palette key, or hex/rgb string.
- ~~Boxes/containers silently dropped when group has no nodes~~ → `console.warn` with node ID and group name.
- ~~Sparse topology n≤3 edge case undocumented~~ → inline comment explaining cycle-only behavior for n≤3; tests cover n=1, n=2, n=3, n=5.
- Test suite: 181 tests across 9 files covering `buildGraph`, `compose`, `flatten`, `layout`, `spatial`, `spec`, `text`, `transforms`.

### Table Build — LOW

`build.py` emits `"*No data available.*"` for missing CSVs instead of failing. `bold_models` list in `spec.yaml` is hardcoded strings that must exactly match CSV values.

### Docs Freshness — LOW (fixed)

`git log` on never-committed files returns empty string, causing silent skip (minor). Workflow now comments on existing open issues instead of creating duplicates. `Architecture-Diagrams.md` removed (superseded by `Diagram-Authoring-Guide.md`), eliminating overlapping directory sources.
