# Authoring Workflow Plan — Boring Tools Edition

Goal: tighten the four authoring loops (prose, figure visual, figure data, submission target) so each shows feedback within its latency budget, using off-the-shelf tools wherever possible. No custom orchestrator, no clever Python.

## Latency targets

| Loop | Edit                              | Feedback                          | Budget    |
| ---- | --------------------------------- | --------------------------------- | --------- |
| L1   | `paper/**/*.md`                   | Rendered prose, cites, figures    | <1s       |
| L2   | `interactive/src/figures/**/*`    | Updated chart in browser          | <200ms    |
| L3   | `data/csv/*.csv`, schemas         | Updated chart from new numbers    | <5s       |
| L4   | Anything                          | Distill-rendered TMLR submission  | <30s      |

## Components, in build order

### 1. Process orchestrator → `overmind` (1 hour)

Replace `make dev` / `make dev-figures` / `make dev-all` with a single `Procfile.dev`:

```
myst:    myst start
figs:    cd interactive && bun run dev
tables:  ls data/csv/*.csv data/schemas.yaml tools/tables/spec.yaml | entr -r make tables
vale:    vale --output=line paper/content/ paper/candidacy/ 2>&1 | tail -F /dev/null
```

- **Tool:** `overmind` (Go binary, single static file, runs anywhere). `mprocs` is a nicer TUI alternative; both read Procfile-style input. Pick one — they're equivalent for our needs.
- **Why not `concurrently` (an npm package)?** No clean detach, no per-process restart, prefixes are ugly. Overmind has tmux-style attach/detach, restart-one-process, output capture per process.
- **Why not Make `&` background?** No process supervision, ctrl-C orphans children, output interleaves chaotically.
- **Verification:** `overmind start -f Procfile.dev` → hit save in any of {prose, figure svelte, data csv}, see correct loop trigger.
- **Install:** `go install github.com/DarthSim/overmind/v2@latest` (binary lives in `~/go/bin`); falls back to `mprocs` (Rust, `cargo install mprocs`) if Go isn't preferred.

`make dev` becomes a one-line alias: `overmind start -f Procfile.dev`. Old `dev-figures` / `dev-all` targets get removed; one entrypoint.

### 2. Distill preview server (half day)

The biggest gap is L4 — we don't see how prose lands in Distill's two-column layout until full `make tmlr` + Jekyll Docker. Close it with a static server:

- **Tool:** `vite` (already in repo) or plain `http-server` (a JS package, installable via `bun add`). Lighter is better — no plugin chain.
- **Pipeline:**
  1. `tools/tmlr/build.mjs --watch` re-runs on `_build/site/content/*.json` change (chokidar; ~30 lines of glue).
  2. Output `_build/submission/submission.md` is rendered through a stripped Distill template (one HTML file in `tools/tmlr/preview/index.html` that loads Distill's `template.v2.js` and an iframe to the markdown rendered by `markdown-it` — same pipeline Jekyll uses without Jekyll).
  3. `http-server _build/submission --port 4001` serves it; `--watch` flag triggers livereload.
- **Why not Jekyll-in-Docker?** 30s startup, no live reload, container churn.
- **Why not full Distill build?** We don't need bibtex resolution etc. for preview — `<d-cite>` can render as `[key]` in preview mode.
- **Caveat:** preview ≠ ship. Reserve `make preview` (Docker-Jekyll) for the "before-PR" sanity check; the new preview is for *during writing*.
- **Verification:** edit a paragraph in `paper/content/methodology.md`, see Distill column-width version of that paragraph in browser within 2s.

Add to Procfile:

```
preview: cd tools/tmlr && bun run preview
```

### 3. Figure data sketch path (half day)

Today, iterating on a figure means round-tripping through `KD-GAT/export_paper_data.py` + git commit + `make data` here. Add a local override convention:

- **Convention:** if `interactive/src/figures/<kind>/<name>/data.dev.json` exists, the figure loads it instead of `data.json`. Both files live next to each other; `data.dev.json` is gitignored.
- **Implementation:** one line in each figure's data import (or a Vite alias plugin if we want zero figure changes). One line preferred.
- **Foot-gun mitigation:** pre-commit hook fails if any tracked file imports `data.dev.json`, OR if `data.dev.json` exists when `git status --short` shows the parent dir staged.
- **Verification:** drop a 5-row JSON in `interactive/src/figures/data/umap/data.dev.json`, see chart render against it; remove it, see real data.
- **Tool:** none — convention + 5 lines of gitignore + a pre-commit grep.

### 4. Editor surface for cross-refs and cites (half day, mostly install)

Already partially shipped (myst-lsp + Vale recommended in `.vscode/extensions.json`). Remaining:

- **Bibkey completion on `[@`** — `cmp-pandoc-references` or equivalent VS Code extension. The extension `notZaki.pandocciter` is already in `.vscode/extensions.json`; configure it via `pandocCiter.DefaultBib` or an array pointing at all 12 `.bib` files.
- **Vale-LS in dev loop** — Vale's LSP mode (`vale-ls` binary, separate install: `cargo install vale-ls` or download release) gives squiggles in VS Code instead of only on save. Add to `.vscode/settings.json`.
- **Verification:** type `[@` in a `.md` file, see fuzzy bibkey list. Add a banned phrase from `STYLE.md §4` (e.g. "moreover,"), see Vale squiggle inline.

### 5. Figure scaffolder (1 hour)

A small package script that adds the friction-eliminator for "should I bother making this a figure":

- **Tool:** `bun run new-figure -- name=foo kind=data` → copies a template dir, opens the new files in `$EDITOR`. Pure shell + cp; no plop/yeoman.
- **Files created:** `App.svelte`, `data.json` (empty `[]`), `index.html`, `main.js` from a `_template/data/` reference figure. For diagrams, `_template/diagrams/` with a starter `spec.yaml`.
- **Registration:** `interactive/build.js` already auto-discovers figures from filesystem (verify); if not, scaffolder appends to its list.
- **Verification:** `bun run new-figure -- name=test_chart kind=data`, see new dir + dropdown shell entry.

### 6. Output-tree split (per the previous Makefile discussion)

Already designed. Implement after #1 + #2 land — preview server in #2 needs to read from a stable per-config dir. Pairs naturally.

## What we're explicitly not building

- A custom dev orchestrator (Python script, even a small one). Overmind is one static binary; we don't add a moving part.
- A "figure preview rig" beyond Vite's existing dev server. Vite + iframe is fine.
- Bazel / nx / turbo. The Makefile is the right size for a single-paper repo (see `AUTHORING_STACK.md` rationale).
- A custom Distill renderer. The preview server is a thin wrapper; the canonical render is still Jekyll in `make preview` for ship sanity.
- LaTeX export. No venue currently demands it for this submission.

## Open questions

- **Vale-LS install on OSC**: needs Cargo / a binary. WSL desktop is fine; OSC headless might require building from release tarball. Confirm before committing to LSP mode.
- **Distill template licensing**: `template.v2.js` is from the TMLR kit (`tmlr_do_not_modify/`). Reusing it for a local preview server is fine for personal use; double-check the kit's LICENSE before publicising the preview server pattern.
- **`data.dev.json` discoverability**: how does a future-me / collaborator know the convention exists? Add a one-liner in each figure's `App.svelte` comment, or document once in `interactive/README.md`. Probably the latter — comments rot.

## Order of operations (if executing this plan)

1. **#1 orchestrator** — biggest daily-life win, smallest blast radius. Validates the boring-tools premise.
2. **#6 output-tree split** — needed before #2's preview can be reliable. Mechanical.
3. **#2 Distill preview** — the loop that changes how you write.
4. **#4 editor surface** — install-only; do whenever there's 30 minutes.
5. **#3 sketch path** — when figure-data iteration starts being slow enough to notice.
6. **#5 scaffolder** — when adding a new figure first feels annoying.

Each step is independent and skippable; this is not a waterfall.
