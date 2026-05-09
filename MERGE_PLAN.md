# Synthesis Plan: kd-gat-paper → graphids

Collapse the two-repo split into a single `graphids/` monorepo. The HF dataset
(`buckeyeguy/graphids-kd-gat`) was the only seam paying for the split, and the
authoring stack now fits in a thin layer next to the ML code.

## Target structure inside `graphids/`

```
graphids/
  src/graphids/        ML code (existing — training, eval, models)
  data/                CSVs + schemas (single source of truth, no HF round-trip for paper-only edits)
    csv/
    schemas.yaml
  paper/               Quarto chapters (.qmd) + references/*.bib
  interactive/         Svelte figures + diagrams (unchanged)
  presentations/       Slide sources
  _static/             quarto.css
  index.qmd            Quarto book cover
  _quarto.yml          Book config
  tools/               (existing) + tables/, gsn/, slides/, migrate_to_quarto.py
  pyproject.toml       Single env (training + paper extras as optional groups)
  Makefile             Unified targets (train, eval, render, figures, tables)
  .github/workflows/   train.yml (existing) + paper.yml (paths-filtered)
```

No collisions on top-level directories except `tools/`. Merge tools/ at the
file level — none of the paper-side scripts conflict with existing graphids
ones.

## Phase 1 — Subtree merge (preserve history)

```bash
cd ~/graphids
git remote add paper ~/kd-gat-paper
git fetch paper
git subtree add --prefix=_paper-import paper/main
```

Land the paper repo intact under `_paper-import/`. CI still uses the old paths;
nothing breaks. Confirm clean working tree, push.

## Phase 2 — Hoist and integrate

1. **Move files out of `_paper-import/` to their target paths** with `git mv`
   (one PR per directory keeps history bisectable):
   - `_paper-import/paper/` → `paper/`
   - `_paper-import/interactive/` → `interactive/`
   - `_paper-import/_quarto.yml`, `index.qmd`, `_static/`, `presentations/` → repo root
   - `_paper-import/data/` → `data/` (merge with existing if present; resolve schema conflicts)
   - `_paper-import/tools/{tables,gsn,slides,migrate_to_quarto.py,validate}` → `tools/`
2. **Merge `pyproject.toml`**: paper deps move into a `paper` optional-group
   alongside existing `notebooks`/`dev`. Single `uv.lock`.
3. **Merge Makefiles**: keep training targets, append `render`, `figures`,
   `tables`, `dev`. Drop overlapping `clean`, `test` after reconciling.
4. **Drop `_paper-import/`** once empty: `git rm -r _paper-import`.
5. Verify `quarto render` still builds; verify training scripts unaffected.

## Phase 3 — Collapse the HF round-trip

The HF dataset becomes a public archive, not a build dependency.

1. Rewrite `export_paper_data.py` to write directly to `data/csv/` and
   `interactive/src/figures/data/*/data.json` in the same checkout (no upload
   step required for local renders).
2. Delete `tools/pull_data.py` and the `make data` HF fetch.
3. Keep an opt-in `make publish-data` that pushes the same outputs to HF for
   external consumers.
4. Drop `HF_TOKEN` from paper CI; keep it for the publish job only.

## What gets dropped or simplified

- Two `CLAUDE.md`, two `README.md`, two `.claude/`, two pre-commit configs.
- The HF round-trip for every paper-only tweak.
- Cross-repo coordination ("update KD-GAT, push exports, pull in paper").

## CI strategy

Two workflows in `graphids/.github/workflows/`:

- `train.yml` — runs on `src/**`, `tests/**`, `pyproject.toml` changes.
- `paper.yml` — runs on `paper/**`, `interactive/**`, `_quarto.yml`,
  `data/**`. Paths-filter prevents training PRs from blocking on paper builds
  and vice versa. Both deploy to GitHub Pages on `main` push.

## Risks + mitigations

| Risk | Mitigation |
|------|------------|
| Subtree merge inflates repo history | Use `git subtree add` (full history) once, then never re-merge; alt: `--squash` if size is a problem |
| Paper CI starts running on training PRs | Paths filter + `paths-ignore` |
| Merge conflicts on `tools/`, `pyproject.toml` | One PR per top-level dir; review per-file |
| Bisect across the merge boundary | Document the merge commit; use `git bisect skip` for the boundary if needed |

## Open questions

- Does `~/graphids` already have a `data/` or `tools/tables/` that would
  collide? Audit before Phase 2.
- Keep the Curvenote editor surface as a future option, or fully delete?
  (Currently deleted; reintroducing requires rebuilding `tools/curvenote/`.)
- Does the SLURM training pipeline need to live in the same repo, or stay
  in a sibling `graphids-train/` if monorepo CI gets too heavy?
