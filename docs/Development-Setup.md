# Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 22+ | `nvm install 22` |
| Python | 3.12+ | System or `module load python/3.12` (OSC) |
| MyST | latest | `npm install -g mystmd` |
| Typst | latest | [typst.app/docs/installation](https://github.com/typst/typst) (PDF export only) |

Python packages:

```bash
pip install pyyaml tabulate "bibtexparser>=2.0.0b7"
```

## First-Time Setup

```bash
git clone git@github.com:frenken-lab/kd-gat-paper.git
cd kd-gat-paper
cd interactive && npm ci && cd ..
```

## Development Workflows

### Paper (TMLR submission)

```bash
make dev    # Starts MyST dev server with live reload at localhost:3000
```

This uses `myst.yml` and serves the paper content. Edits to `content/*.md` files reload automatically.

### Candidacy Report

```bash
make candidacy-dev    # MyST dev server using myst.candidacy.yml
```

Serves the candidacy superset (paper content + candidacy extensions). The candidacy TOC uses combined pages via `{include}` directives — edits to any included source file trigger a reload.

### Single Figure

```bash
cd interactive
FIGURE=umap npx vite dev    # Live-reload one figure at localhost:5173
```

Replace `umap` with any figure directory name under `interactive/src/figures/`.

### PDF Export

```bash
make candidacy-pdf    # Builds _build/exports/candidacy-report.pdf via Typst
```

Requires Typst installed. Significantly faster than LaTeX.

## Project Layout

```
content/                  Shared paper sections (both builds use these)
candidacy/                Candidacy-only content + combined page wrappers
interactive/              SveltePlot figures (Svelte + Vite)
  src/figures/<name>/       One directory per figure
  src/lib/diagram/          Architecture diagram library
data/
  csv/                    Source data files
  schemas.yaml            Validation schemas
  tables/                 Table specs + build script
export/tmlr/              TMLR Beyond PDF export pipeline
references/               Split .bib files by topic
_static/                  Custom CSS
_build/                   All generated output (gitignored)
```

## Validation

```bash
make validate    # Checks data against schemas.yaml + validates .bib files
make bib         # Validates bibliography only
```

`data/validate.py` reads `data/schemas.yaml` and checks:
- CSV files: required columns exist, minimum row count met
- JSON files (figure data): required keys present, array length constraints
