# Adaptive Fusion of Graph-Based Ensembles for Automotive IDS

MyST Markdown paper with interactive SveltePlot figures. Three build targets from the same source tree:

| Target        | Config               | Output                   | Deployed to                                                 |
| ------------- | -------------------- | ------------------------ | ----------------------------------------------------------- |
| **Paper**     | `myst.yml`           | TMLR Distill-layout site | [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) |
| **Candidacy** | `myst.candidacy.yml` | Superset report (web)    | [rob.curve.space](https://rob.curve.space)                  |

The candidacy build includes all paper content plus extended sections (introduction, CWD background, proposed research, broader impact, physics appendix).

## Repository Structure

```
kd-gat-paper/
  paper/               All authored content
    content/             Shared paper sections (MyST Markdown, used by both builds)
    candidacy/           Candidacy-only content + combined page wrappers
    references/          BibTeX files (topic-split)
  interactive/         Svelte figure source code + diagram library
  data/                Source CSVs + validation schemas
  tools/               Build scripts, validators, export pipelines
  _static/             Custom CSS for MyST site
  tmlr_do_not_modify/  Vendored TMLR author kit (upstream, do not edit)
  _build/              All generated output (gitignored)
    figures/              Built HTML figures (one per interactive)
    tables/               Rendered markdown tables
    submission/           TMLR submission (submission.md + assets)
    site/                 MyST site AST and HTML
```

Source directories are leaf producers or consumers of each other:

```
paper/references/   data/csv/   interactive/src/
    |             |              |
    |             v              v
    |        _build/tables/ _build/figures/
    |             |              |
    +------+------+--------------+
           |
           v
       paper/content/  (includes tables, iframes figures, cites references)
           |
           v
       myst build --> _build/site/
           |
           v
       tools/tmlr/build.mjs
           |
           v
       tmlr_do_not_modify/ (submission.md + assets/ written in place for Jekyll)
```

## Local Setup

### 1. Install prerequisites

| Tool | Why | Install |
|------|-----|---------|
| Python 3.11+ | data validation, table builder | https://www.python.org/downloads/ |
| [uv](https://docs.astral.sh/uv/) | Python package manager (fast, replaces pip) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [Bun](https://bun.sh) | JS runtime + package manager (replaces Node + npm; runs all builds, dev servers, and tests) | `curl -fsSL https://bun.sh/install \| bash` |
| Docker | TMLR Jekyll preview (`make preview`) | https://docs.docker.com/get-docker/ |
| [overmind](https://github.com/DarthSim/overmind) | optional — drives `make dev` (5-process orchestrator) | `go install github.com/DarthSim/overmind/v2@latest` |
| [entr](https://eradman.com/entrproject/) | optional — table + lint watchers used by `make dev` | `apt install entr` / `brew install entr` |
| [Vale](https://vale.sh) | optional — prose lint (`make lint`) | https://vale.sh/docs/install |

The Bun installer adds `~/.bun/bin` to your PATH on the line it prints — open a new shell or `source` that line before continuing.

### 2. Install project dependencies

```bash
# From the repo root, on each machine:
bun install -g mystmd@1.8.3        # Paper build tool (matches CI version)
cd interactive && bun install      # Figure dependencies (Svelte, Vite, SveltePlot)
cd ../tools/tmlr && bun install    # TMLR serializer dependencies (mdast-util-to-markdown, chokidar)
```

First run creates `interactive/bun.lockb` and `tools/tmlr/bun.lockb`. **Commit those lockfiles.** Existing `package-lock.json` files can be removed once `bun.lockb` is in place across machines.

### 3. (Optional) Install Vale styles

```bash
make lint-sync   # Downloads remote Vale style packages used by .vale.ini
```

### 4. Verify

```bash
make test        # Runs the TMLR serializer test suite (29 tests, ~200 ms)
make figures     # Builds all interactive figures into _build/figures/*.html
make site        # Builds the paper site into _build/site/
```

If `make test` fails with `bun: command not found`, the Bun installer didn't extend your PATH — open a fresh shell or `source ~/.bashrc`.

### 5. Day-to-day

```bash
make dev         # Five-process dev loop (myst + figures + tables + vale + Distill preview)
                 # Requires overmind + entr; falls back to instructions if missing.
make dev-myst    # Just myst start (when overmind isn't available)
```

`make dev` ports:
- `localhost:3000` — MyST paper site (HMR on .md edits)
- `localhost:5173` — figure shell (HMR on .svelte/.json edits)
- `localhost:4002` — Distill layout preview (auto-rebuilds on save, see `tools/tmlr/preview.mjs`)

## Commands

```bash
# Paper build
make site           # Build MyST paper site (depends on figures + tables)
make dev            # Orchestrated dev (overmind): myst + vite (figures HMR) + table rebuild on CSV/spec change
make dev-myst       # Myst only (prose live reload; iframes hit prod URLs); when overmind isn't installed
make tmlr           # Build TMLR Beyond PDF submission (into tmlr_do_not_modify/)
make tmlr-anon      # Build anonymous TMLR submission (into kit)
make submission-zip # Flat anonymous submission.zip for OpenReview upload

# Candidacy build
make candidacy-site # Build candidacy report site
make candidacy-dev  # Live-reload candidacy dev server

# Data + assets
make data           # Pull data from KD-GAT exports + validate
make validate       # Validate committed data only (no pull, used in CI)
make figures        # Build interactive figures --> _build/figures/*.html
make tables         # Build markdown tables --> _build/tables/*.md
make bib            # Validate bibliography

# Meta
make all            # data --> figures --> tables --> site
make clean          # rm -rf _build
make sync           # Pull Curvenote editor changes
```

## Developing Interactive Figures

Figures are split by kind under `interactive/src/figures/`:

- `data/<name>/` — data-driven plots that consume `data.json`
- `diagrams/<name>/` — SvelteFlow architecture diagrams driven by `spec.yaml`

Each figure is a self-contained Svelte app. Example:

```
interactive/src/figures/data/umap/
  App.svelte    Renderer (SveltePlot marks, no data transforms)
  data.json     Pre-computed data (from KD-GAT export pipeline)
  index.html    Entry point
  main.js       Svelte mount
```

Figures use [SveltePlot 0.12](https://svelteplot.dev) (grammar-of-graphics): `<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. Architecture diagrams use [SvelteFlow](https://svelteflow.dev/) (`@xyflow/svelte`) with [ELK](https://eclipse.dev/elk/) for orthogonal layout, driven by `spec.yaml`; the shared library is at `interactive/src/lib/flow/`.

**Dev workflow:**

```bash
cd interactive
bun run dev    # shell at localhost:5173 — pick figure from dropdown
```

The shell page keeps HMR alive across figure switches (iframe swap, not hard navigation). Works in StackBlitz.

**Build all figures:**

```bash
make figures                    # Builds all figures via build.js (sequential vite builds)
```

Each build produces a single self-contained HTML file (JS + CSS + data inlined via vite-plugin-singlefile).

**Key conventions:**

- Figures are dumb renderers. All data transforms (sampling, ROC computation, layout) happen in the KD-GAT export pipeline, not in `.svelte` files.
- Use SveltePlot marks only -- no D3 or other chart libraries.
- Handle empty data: show "Awaiting data export" when `data.json` is `[]` or `{}`.
- Diagram colors use role names (`vgae`, `gat`, `kd`) resolved via `resolve()` from the Observable 10 palette -- don't hardcode colors.

## Data Pipeline

Data flows from the [KD-GAT](https://github.com/frenken-lab/KD-GAT) evaluation artifacts:

1. `export_paper_data.py` (in KD-GAT) exports to ESS with provenance tracking
2. `make data` pulls exports, validates against `data/schemas.yaml`, writes to `data/csv/` and `interactive/src/*/data.json`
3. `make figures` builds Svelte apps into `_build/figures/*.html`
4. `make tables` renders CSVs + literature baselines into `_build/tables/*.md`
5. `myst build` assembles everything into the paper site

`data/schemas.yaml` is the single source of truth for validation -- both the KD-GAT exporter and this repo's pull script read from it.

## Deployment

| Target                                                      | What                                     | How                                            |
| ----------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) | TMLR Distill site + figures (iframe src) | Jekyll build + `deploy-pages` in CI            |
| [rob.curve.space](https://rob.curve.space)                  | Candidacy report (MyST SPA)              | `curvenote deploy` in CI                       |
| TMLR submission                                             | Anonymous self-contained folder          | `tools/tmlr/build.py`, uploaded as CI artifact |

Figures require iframe isolation (Svelte apps need `<script>` execution) and curve.space's SPA can't serve static HTML, so GitHub Pages hosts the figure files separately. The TMLR build rewrites all iframe paths to `assets/html/submission/` so no external URLs leak into the anonymous submission.

## CI Pipeline

```
validate (schemas + bib)
  └─ figures (Svelte build)
       ├─ tmlr (MyST → Distill → Jekyll → GitHub Pages)
       └─ candidacy-site (MyST → Curvenote → curve.space)
```

All jobs run on `ubuntu-latest`. Figures are shared across downstream jobs via artifacts.
