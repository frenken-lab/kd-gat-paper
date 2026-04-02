# Fragility Audit — kd-gat-paper

Audited: 2026-04-02

## Summary

| Area | Rating | Status | Primary Risk |
|---|---|---|---|
| Data Pipeline | **HIGH** | broken | ESS data lake in flux; `~/KD-GAT` export path broken; HF bucket considered |
| TMLR Export | **HIGH** | partially fixed | AST coupling fragile; `mystmd` now pinned |
| Candidacy Config Swap | **MEDIUM** | fixed | `trap` cleanup added; dual TOC/articles lists still diverge manually |
| CI Pipeline | **LOW** | mostly fixed | `mystmd`/`curvenote` pinned; `bibtexparser` lower bound still loose |
| Schema Validation | **LOW** | audit corrected | `literature_baselines.csv` was already validated |
| References | **MEDIUM** | unfixed | ~140/164 entries lack DOIs; `--strict` can't enable until backfilled |
| Figure Build | MEDIUM | unfixed | Fragile rename in `build.js`; silent empty output |
| Diagram Library | MEDIUM | unfixed | Silent role-name typos; silent box drops |
| Table Build | LOW | unfixed | Missing CSV is a warning not an error; bold list hardcoded |
| Docs Freshness | LOW | unfixed | Minor edge cases |

## Detail

### Data Pipeline — HIGH (broken)

`make data` calls `~/KD-GAT/scripts/data/paper_sync.py`, a file in a separate repo not pinned or versioned here. KD-GAT exports to `fs/ess/PAS1266` but the data lake structure is in flux. If KD-GAT restructures, the entire figure pipeline breaks silently. Committed CSV/JSON files are the current source of truth.

Schema contract (`data/schemas.yaml`) checks shape but not value ranges — all-zero metrics would pass.

**Potential fix:** Push/pull from HF dataset (`buckeyeguy/kd-gat-paper`) to decouple from ESS.

### TMLR Export — HIGH

`export/tmlr/build.py` (~360 lines) walks MyST AST JSON to produce Distill-layout markdown.

- TOC traversal reads only one nesting level from `config.json` — if MyST changes serialization, pages silently disappear.
- `mdast` handled as both dict and JSON string — dual-format suggests instability.
- `HANDLERS` dispatch: unhandled AST node types silently fall through to `_C` (recurse children). No warning logged.
- Abstract extraction is 4 levels deep with no error on missing keys.
- `mystmd` now pinned to 1.8.3 (was unpinned).

### Candidacy Config Swap — MEDIUM (was HIGH)

CI physically overwrites `myst.yml` with candidacy config for curve.space deploy. `trap` cleanup now restores on failure. Remaining risk: the export `articles` list and site `toc` in `myst.candidacy.yml` must be kept in sync manually.

### CI Pipeline — LOW (was MEDIUM)

- `mystmd@1.8.3` pinned in all 3 install locations.
- `curvenote@0.14.3` pinned.
- `bibtexparser>=2.0.0b7` pre-release lower bound still loose.
- `pyyaml`, `tabulate` unpinned (low risk, stable APIs).

### References — MEDIUM

`references/validate.py` catches duplicates and missing required fields. `--strict` mode exists but can't be enabled — ~140 of 164 entries lack DOIs. Warnings accumulate silently in CI.

### Figure Build — MEDIUM

`build.js` runs sequential Vite builds with `execSync`. Fragile `index.html` → `<fig>.html` rename. When `FIGURE` env is unset during build, `vite.config.js` silently falls through. Auto-generated entry points mean a missing figure produces no error.

### Diagram Library — MEDIUM

`palette.ts` `resolve()` does `roles[name] || name` — typos like `'vage'` instead of `'vgae'` produce invalid CSS with no error. `unpack.ts` silently drops boxes missing group membership. `buildGraph` sparse topology has undocumented 3-node edge case.

### Table Build — LOW

`build.py` emits `"*No data available.*"` for missing CSVs instead of failing. `bold_models` list in `spec.yaml` is hardcoded strings that must exactly match CSV values.

### Docs Freshness — LOW

`git log` on never-committed files returns empty string, causing silent skip. Monday-only cron creates new issues instead of reopening stale ones. Overlapping directory sources between figure and diagram docs.
