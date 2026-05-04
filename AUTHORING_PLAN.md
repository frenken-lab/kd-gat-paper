# Authoring Workflow Plan — Boring Tools Edition

Goal: tighten the four authoring loops (prose, figure visual, figure data, submission target) so each shows feedback within its latency budget, using off-the-shelf tools wherever possible. No custom orchestrator, no clever Python.

## Latency targets

| Loop | Edit                              | Feedback                          | Budget    | Status |
| ---- | --------------------------------- | --------------------------------- | --------- | ------ |
| L1   | `paper/**/*.md`                   | Rendered prose, cites, figures    | <1s       | ✓ MyST `start` |
| L2   | `interactive/src/figures/**/*`    | Updated chart in browser          | <200ms    | ✓ Vite HMR |
| L3   | `data/csv/*.csv`, schemas         | Updated chart from new numbers    | <5s       | partial — needs `data.dev.json` (open) |
| L4   | Anything                          | Distill-rendered TMLR submission  | <30s      | ✓ `tools/tmlr/preview.mjs` (~2s) |

## Shipped

- **Overmind orchestrator + `Procfile.dev`.** Five processes: `myst`, `figs` (bun), `tables` (entr-driven), `vale` (entr-driven), `preview` (bun). `make dev` runs `overmind start -f Procfile.dev`. `make dev-myst` is the no-overmind fallback.
- **Distill preview server.** `tools/tmlr/preview.mjs` watches `_build/site/content/*.json`, re-runs `build.mjs`, serves through a stripped Distill shell at `localhost:4002` with SSE livereload. Replaces the 30s Jekyll-Docker round-trip for layout judgment. Jekyll preview stays as the canonical pre-PR render via `make preview`.
- **Editor surface (workspace-level).** `pandocCiter.DefaultBib` configured in `.vscode/settings.json` covering all 13 bib files. `kd-gat-paper.code-snippets` provides `cp` / `nr` / `eq` / `fig` / `alg` triggers. `chrisjsewell.myst-lsp` and `errata-ai.vale-server` recommended in `.vscode/extensions.json`.
- **Vale + STYLE.md banlists.** `.vale.ini` with proper `TokenIgnores` (MyST inline roles, inline math) and `BlockIgnores` (fenced directives, display math). `MLPaper/B1..B8` and `MLPaper/R4` rules ship with the repo. `make lint` / `make lint-sync` / pre-commit hook.
- **TMLR serializer ported to bun.** `tools/tmlr/build.mjs` (~450 lines) replaces the Python builder; rides on `mdast-util-to-markdown` defaults plus Distill-flavored handler overrides. 29 semantic-property tests via `bun test`.

## Open

### Figure data sketch path — `data.dev.json` convention

Iterating a figure's data still requires `KD-GAT/export_paper_data.py` + `make data`. Closes L3 from "minutes" to <200ms.

- **Convention:** if `interactive/src/figures/<kind>/<name>/data.dev.json` exists, the figure loads it instead of `data.json`. `data.dev.json` is gitignored; pre-commit blocks any staging.
- **Implementation:** ~10 lines total (one-line import change per figure, `.gitignore` entry, pre-commit grep). Detail in `GAPS.md` Gap 6.
- **Discoverability:** one-liner in `interactive/README.md` (comments in figure files rot).
- **Pay off only when** figure-data iteration becomes the daily bottleneck. Cheap to add later.

### Output-tree split (paper vs candidacy)

Both builds currently write to `_build/site/`, so switching between `make site` and `make candidacy-site` clobbers the previous output. The Distill preview server reads from `_build/site/content/*.json` — fine while building one config at a time, foot-gun once both are active in CI.

- **Fix:** route MyST output through `--output _build/<config>/site/`, update Make targets, update `preview.mjs`'s `SITE_CONTENT` constant.
- **Mechanical;** maybe an hour. Defer until the conflict actually bites — currently the CI job sequence avoids it.

### Figure scaffolder (`bun run new-figure`)

Lowest priority. A small `interactive/scripts/new-figure.ts` that copies a `_template/{data,diagrams}/` skeleton and opens the new files in `$EDITOR`.

- Pure shell + cp; no plop/yeoman.
- Pay off only when adding a figure feels annoying. Currently rare.

## What we're explicitly not building

- A custom dev orchestrator. Overmind is one static binary; we don't add a moving part.
- A custom figure preview rig beyond Vite. Vite + iframe is fine.
- Bazel / nx / turbo. Makefile is right-sized for a single-paper repo (see `AUTHORING_STACK.md`).
- A custom Distill renderer. The preview server is a thin wrapper; canonical render is still Jekyll via `make preview`.
- LaTeX export. No venue currently demands it for this submission.

## Open questions (still relevant)

- **Vale-LS install on OSC.** `make lint` works (CLI). LSP-mode squiggles in VS Code need the `vale-ls` binary — fine on WSL desktop, requires a release tarball or Cargo on OSC. Unblocked since `make lint` covers the CI need; defer until the in-editor latency bites.
- **Distill template licensing in `preview.mjs`.** The preview server pulls `template.v2.js` and `main.css` from `tmlr_do_not_modify/assets/`. Local-only use is fine; double-check the kit's LICENSE before publicising the pattern.
