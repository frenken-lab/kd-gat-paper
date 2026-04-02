# Adaptive Fusion of Graph-Based Ensembles for Automotive IDS

MyST Markdown paper with interactive SveltePlot figures. Deployed to [rob.curve.space](https://rob.curve.space).

## Repository Structure

```
kd-gat-paper/
  content/             Paper sections (MyST Markdown)
  interactive/         Svelte figure source code + diagram library
  data/                Source CSVs, validation schemas, table build script
  references/          BibTeX files (topic-split) + validation
  export/tmlr/         TMLR Beyond PDF export pipeline
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
references/   data/csv/   interactive/src/
    |             |              |
    |             v              v
    |        _build/tables/ _build/figures/
    |             |              |
    +------+------+--------------+
           |
           v
       content/  (includes tables, iframes figures, cites references)
           |
           v
       myst build --> _build/site/
           |
           v
       export/tmlr/build.py --> _build/submission/
           |
           v
       tmlr_do_not_modify/ (receives submission for Jekyll build)
```

## Quick Start

```bash
npm install -g mystmd          # Paper build tool
cd interactive && npm ci       # Figure dependencies
pip install pyyaml tabulate    # Python build deps
```

## Commands

```bash
make data       # Pull data from KD-GAT exports + validate
make validate   # Validate committed data only (no pull, used in CI)
make figures    # Build interactive figures --> _build/figures/*.html
make tables     # Build markdown tables    --> _build/tables/*.md
make site       # Build MyST site (depends on figures + tables)
make dev        # Live-reload dev server
make tmlr       # Build TMLR Beyond PDF submission
make deploy     # Merge submission into TMLR author kit
make bib        # Validate bibliography
make all        # data --> figures --> tables --> site
make clean      # rm -rf _build
```

## Developing Interactive Figures

Each figure is a self-contained Svelte app in `interactive/src/<name>/`:

```
interactive/src/umap/
  App.svelte    Renderer (SveltePlot marks, no data transforms)
  data.json     Pre-computed data (from KD-GAT export pipeline)
  index.html    Entry point
  main.js       Svelte mount
```

Figures use [SveltePlot 0.12](https://svelteplot.dev) (grammar-of-graphics): `<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. Architecture diagrams use [graphology](https://graphology.github.io/) graphs rendered through SveltePlot, with the shared library at `interactive/src/lib/diagram/`.

**Dev workflow for a single figure:**

```bash
cd interactive
FIGURE=umap npx vite dev       # Live-reload one figure at localhost:5173
```

**Build all figures:**

```bash
make figures                    # Builds all 12 via build.js (sequential vite builds)
```

Each build produces a single self-contained HTML file (JS + CSS + data inlined via vite-plugin-singlefile).

**Key conventions:**
- Figures are dumb renderers. All data transforms (sampling, ROC computation, layout) happen in the KD-GAT export pipeline, not in `.svelte` files.
- Use SveltePlot marks only -- no D3 or other chart libraries.
- Handle empty data: show "Awaiting data export" when `data.json` is `[]` or `{}`.
- Diagram colors use role names (`vgae`, `gat`, `kd`) resolved via `resolve()` from the Observable 10 palette -- don't hardcode colors.

## Data Pipeline

Data flows from the [KD-GAT](https://github.com/robertfrenken/KD-GAT) evaluation artifacts:

1. `export_paper_data.py` (in KD-GAT) exports to ESS with provenance tracking
2. `make data` pulls exports, validates against `data/schemas.yaml`, writes to `data/csv/` and `interactive/src/*/data.json`
3. `make figures` builds Svelte apps into `_build/figures/*.html`
4. `make tables` renders CSVs + literature baselines into `_build/tables/*.md`
5. `myst build` assembles everything into the paper site

`data/schemas.yaml` is the single source of truth for validation -- both the KD-GAT exporter and this repo's pull script read from it.

## Deployment

| Target | What | How |
|--------|------|-----|
| [rob.curve.space](https://rob.curve.space) | Paper (MyST SPA) | `curvenote deploy` in CI |
| GitHub Pages | Interactive figures (iframe src) | `deploy-pages` in CI |
| TMLR submission | Anonymous self-contained folder | `export/tmlr/build.py`, uploaded as CI artifact |

Figures require iframe isolation (Svelte apps need `<script>` execution) and curve.space's SPA can't serve static HTML, so GitHub Pages hosts the figure files separately. The TMLR build rewrites all iframe paths to `assets/html/submission/` so no external URLs leak into the anonymous submission.
