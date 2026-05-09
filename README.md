# Adaptive Fusion of Graph-Based Ensembles for Automotive IDS

Quarto book — "Adaptive Fusion of Graph-Based Ensembles for Automotive Intrusion
Detection (PhD Candidacy Report)" — with interactive SveltePlot figures.

| Output    | Source     | Deployed to                                                 |
| --------- | ---------- | ----------------------------------------------------------- |
| Candidacy | `_quarto.yml` | [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) |

## Repository Structure

```
kd-gat-paper/
  _quarto.yml          Quarto book config (chapters, parts, appendices, bib)
  index.qmd            Book cover (abstract + roadmap links)
  paper/               Authored content
    content/             Shared chapters (.qmd)
    candidacy/           Candidacy-specific chapters (.qmd)
    references/          BibTeX (topic-split)
  analysis/            Reactive insight workspace
  paper/candidacy/_generated/
                      Chapter-local stable artifacts consumed by Quarto
  interactive/         Svelte figure source + diagram library
  data/                Source CSVs + validation schemas
  tools/               Build scripts, validators, slides, GSN
  _static/             Custom CSS bundled into the Quarto site
  _build/              All generated output (gitignored)
    figures/             Built HTML figures (one per interactive)
    tables/              Rendered markdown tables
    site/                Quarto book HTML
```

Source directories produce or consume each other:

```
paper/references/   data/csv/   interactive/src/
paper/candidacy/_generated/    analysis/marimo/
    |             |              |
    |             v              v
    |        _build/tables/ _build/figures/
    |             |              |
    +------+------+------+-------+
           |
           v
       paper/{content,candidacy}/  (.qmd: includes tables, iframes, cites)
           |
           v
       make build --> _build/site/
```

## Local Setup

### 1. Install prerequisites

| Tool | Why | Install |
|------|-----|---------|
| Python 3.12+ | data validation, table builder, notebook execution | https://www.python.org/downloads/ |
| [uv](https://docs.astral.sh/uv/) | Python package manager | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| [Quarto](https://quarto.org) 1.8+ | book builder | https://quarto.org/docs/get-started/ |
| [Bun](https://bun.sh) | runs interactive figure builds + ESLint | `curl -fsSL https://bun.sh/install \| bash` |
| [marimo](https://docs.marimo.io/) | primary insight notebook for analysis | `pip install marimo` or `uv add marimo` |

### 2. Install project dependencies

```bash
uv sync --extra notebooks --group dev   # Python deps incl. Quarto notebook execution; add marimo for the insight loop
cd interactive && bun install            # Figure deps (Svelte, Vite, SveltePlot)
```

### 3. Verify

```bash
make build       # data → figures → tables → slides → site
```

### 4. Day-to-day

```bash
make dev         # quarto preview — live reload on .qmd, _quarto.yml, references
make watch-tables # rebuild tables when CSVs / spec.yaml change (entr-driven)
```

## Commands

Primary:

```bash
make build           # full repo build: data → figures → tables → slides → site
make dev             # quarto preview live-reload
make data            # refresh pulled metrics + analysis artifacts
make validate        # schema + bib + GSN validation (CI entry point)
make all             # alias for build
make clean           # rm -rf _build
```

Specialized:

- `make figures` for figure-only rebuilds
- `make tables` for table-only rebuilds
- `make slides` for slide-only rebuilds

## Developing Interactive Figures

Figures live under `interactive/src/figures/`:

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

Figures use [SveltePlot](https://svelteplot.dev) (grammar-of-graphics): `<Cell>`,
`<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. Architecture diagrams use
[SvelteFlow](https://svelteflow.dev/) (`@xyflow/svelte`) with
[ELK](https://eclipse.dev/elk/) for orthogonal layout.

## Analysis Workspace

`analysis/` holds the reactive insight layer:

- `analysis/marimo/` — marimo notebooks for exploration and claim drafting
- `paper/candidacy/_generated/` — stable chapter-local artifacts written by marimo and read by Quarto

Use `make marimo` to open the workspace when you are iterating on claims or need to replace ad hoc notebook state with a reproducible artifact.

**Dev workflow:**

```bash
cd interactive
bun run dev    # shell at localhost:5173 — pick figure from dropdown
```

The shell page keeps HMR alive across figure switches.

**Build the project:**

```bash
make build   # figures + tables + slides + site
```

**Conventions:**

- Figures are dumb renderers. Data transforms (sampling, ROC computation,
  layout) happen in the export pipeline, not in `.svelte` files.
- SveltePlot marks only — no D3 or other chart libraries.
- Handle empty data: show "Awaiting data export" when `data.json` is `[]` or `{}`.
- Diagram colors use role names (`vgae`, `gat`, `kd`) resolved via
  `resolve()` from the palette — don't hardcode colors.

## Data Pipeline

Data flows from the [KD-GAT](https://github.com/frenken-lab/KD-GAT) evaluation
artifacts:

1. `export_paper_data.py` (in KD-GAT) exports to HuggingFace
   `buckeyeguy/graphids-kd-gat` with provenance tracking
2. `make data` pulls exports, validates against `data/schemas.yaml`, writes
   `data/csv/` and `interactive/src/figures/*/data.json`
3. `analysis/marimo/` explores those artifacts and writes stable outputs to
   `paper/candidacy/_generated/`
4. `make build` runs the full pipeline into `_build/site/`

`data/schemas.yaml` is the single source of truth for validation — both
the KD-GAT exporter and this repo's pull script read from it.

## Deployment

| Target | What | How |
| ------ | ---- | --- |
| [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) | Candidacy book | `make build` + `deploy-pages` in CI |

Figures require iframe isolation (Svelte apps need `<script>` execution).
The Quarto site embeds figures as iframes pointing at GitHub Pages absolute
URLs (`assets/html/submission/<figure>.html`), which the deploy job copies
in alongside the rendered book.

## CI Pipeline

Single `build` job on `ubuntu-latest`: validate → figures → tables → quarto
render → (push-to-main only) deploy to GitHub Pages.

## Migrating new content from MyST

If a chapter is authored in MyST Markdown (e.g. dropped in from another
project), `tools/migrate_to_quarto.py` performs mechanical conversion of
the directives, fenced math, includes, cross-refs, and frontmatter into
Quarto syntax. Hand-fix anything the `--check` flag flags.

```bash
python3 tools/migrate_to_quarto.py --write paper/path/to/file.md
```
