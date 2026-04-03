# kd-gat-paper

MyST paper: "Adaptive Fusion of Graph-Based Ensembles for Automotive IDS". Two build targets from the same source tree:

- **Paper** (`myst.yml`): TMLR submission → GitHub Pages via Jekyll
- **Candidacy** (`myst.candidacy.yml`): Superset report → rob.curve.space via `curvenote deploy`

The candidacy TOC includes all paper content plus `paper/candidacy/` extensions (merged introduction, CWD background, proposed research, broader impact, PINN appendix). Both builds share figures, tables, and references.

## Tech Stack

| Layer                 | Tool                                        | Why                                                                                                |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Paper authoring       | **MyST Markdown**                           | Cross-references, math, citations, builds to HTML                                                  |
| Interactive figures   | **SveltePlot 0.12** (grammar-of-graphics)   | Spec-driven: `<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. SVG output, Svelte-native          |
| Architecture diagrams | **SveltePlot** + **graphology**             | Spec-driven YAML → `buildFromSpec` → `flatten` → SveltePlot marks. Library in `interactive/src/lib/diagram/` |
| Build                 | **Vite 6** + `vite-plugin-singlefile`       | Each figure → self-contained HTML (JS+CSS+data inlined)                                            |
| Tables                | **spec.yaml** + `tools/tables/build.py`     | Declarative table specs, booktabs-style, literature baselines                                      |
| Validation schemas    | **`data/schemas.yaml`**                     | Single source of truth for both export and pull validation                                         |
| TMLR export           | **AST serializer** (`tools/tmlr/build.py`)  | Walks MyST AST JSON → Distill-layout markdown                                                      |
| CI/CD                 | **GitHub Actions**                          | validate → figures → deploy-figures (Pages) + build-and-deploy (curve.space)                       |

## Key Commands

```bash
make data          # Pull from ESS + validate against schemas.yaml
make validate      # Validate committed data only (no ESS, used in CI)
make figures       # cd interactive && npm run build → _build/figures/*.html
make tables        # Build markdown tables from CSV + spec.yaml
make site          # myst build (depends on figures + tables)
make dev           # myst start (live reload)
make tmlr          # Convert to TMLR Beyond PDF submission
make tmlr-anon     # Build anonymous TMLR submission
make preview       # Merge submission into author kit + Jekyll preview (Docker)
make deploy        # Merge submission into TMLR author kit (push to deploy via Pages)
make candidacy-site # myst build --config myst.candidacy.yml (superset)
make candidacy-dev  # myst start --config myst.candidacy.yml (live reload)
make candidacy-pdf  # myst build --pdf via Typst → _build/exports/candidacy-report.pdf
make sync          # Pull Curvenote editor changes into repo
make bib           # Validate paper/references/*.bib
make test          # Run pytest suite (tools/tmlr tests)
make all           # figures → tables → site (data pulled transitively)
make clean         # rm -rf _build
```

## Data Flow

```
KD-GAT eval artifacts
  → export_paper_data.py → ESS exports/paper/ (_manifest.json + _provenance.json)
  → validate_data.py (checks schemas.yaml) → data/csv/ + interactive/src/figures/*/data.json
  → npm run build → _build/figures/*.html
  → myst build → _build/ → curvenote deploy → rob.curve.space
                          → GitHub Pages (figures only) → frenken-lab.github.io/kd-gat-paper/
  → tools/tmlr/build.py (reads _build/site/ AST) → _build/submission/ (self-contained)
```

## Deployment

| Target               | What                                      | How                                                |
| -------------------- | ----------------------------------------- | -------------------------------------------------- |
| **rob.curve.space**  | Candidacy report (MyST SPA, superset)     | `curvenote deploy` in CI (config-swap to `myst.candidacy.yml`) |
| **GitHub Pages**     | TMLR Distill site + figures (iframe src)  | Jekyll build + `deploy-pages` in CI                |
| **TMLR submission**  | Self-contained folder (anonymous)         | `tools/tmlr/build.py` in CI, uploaded as artifact  |
| **Curvenote editor** | Edit on web → `make sync` to pull changes | Manual (`curvenote pull`)                          |

curve.space is an SPA that can't serve static HTML files. Figures require iframe isolation (Svelte apps need `<script>` execution). Content files use absolute GitHub Pages URLs for iframes; the TMLR build rewrites all iframe paths to `assets/html/submission/` via `_h_iframe` (extracts filename, rebuilds as relative) — no external URLs leak into the anonymous submission. `curvenote deploy` doesn't support `--config`, so CI swaps `myst.candidacy.yml` into `myst.yml` before deploying to curve.space.

## Schema Convention

`data/schemas.yaml` defines contracts for all CSV and JSON data files. Both `export_paper_data.py` (KD-GAT) and `pull_data.py` (this repo) read from it. Don't hardcode schemas elsewhere.

## Table Convention

- `tools/tables/spec.yaml` defines table specs: source CSV, columns, formatting, sort order, literature baselines
- `data/csv/literature_baselines.csv` holds comparison metrics with citation keys
- `tools/tables/build.py` renders to `_build/tables/*.md` — baselines first, user models **bolded** at bottom
- Content files use `{include}` directives to pull in generated tables

## Interactive Figure Convention

- **Dumb renderers**: Figures import `data.json` and plot it. No data transforms in `.svelte` files.
- All preprocessing (sampling, flattening, ROC computation, layout) happens in `export_paper_data.py`.
- Use SveltePlot marks (`<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`). No D3.
- Each figure: `interactive/src/figures/<name>/App.svelte` + `data.json` + `index.html` + `main.js`
- Handle empty data: show "Awaiting data export" when data is `[]` or `{}`
- Figures build one-at-a-time via `interactive/build.js` (vite-plugin-singlefile requires single entry per build)
- **Colors/fonts**: `styles.yml` is the single source of truth. Exposed at build time via `virtual:styles` (JS object) and `virtual:theme-vars.css` (CSS custom properties). Use role names (`vgae`, `gat`, `kd`) not hex colors.

## Diagram Convention

- **Library**: `interactive/src/lib/diagram/` — spec-driven YAML diagrams
- **Preferred workflow**: Write a `spec.yaml` per diagram, then `buildFromSpec(spec)` → `flatten(graph)` → SveltePlot marks. See `docs/Diagram-Authoring-Guide.md` for the full spec reference.
- **`buildFromSpec`** (spec.ts): Walks a YAML layout tree (components + layout + bridges) → graphology graph
- **`buildGraph`** (buildGraph.ts): Creates a positioned graphology graph cluster (n nodes, topology, color, labels, positions, container)
- **Composition** (compose.ts + transforms.ts): `pipeline`, `bridge`, `boxSequence`, `hstack`, `vstack` — position and connect sub-graphs
- **`flatten`** (flatten.ts): Converts graphology graph → flat arrays for SveltePlot marks (nodes, boxes, edges by type, domain)
- **`resolve`** (palette.ts): Maps role names (`vgae`, `gat`, `kd`) → stroke/fill colors from `styles.yml` palette
- **Edge types**: `structural`, `flow`, `kd`, `encoded`, `annotation` — bucketed by `flatten`, rendered as separate SveltePlot layers
- **Boxes**: Standalone boxes use explicit `x`/`y` node attributes; group-derived boxes auto-center on group bounds
- **Colors**: Defined in `styles.yml` (Observable 10 palette). Use role names, not hex values, in specs.
- Diagrams are SveltePlot figures (same build pipeline as interactive figures), not separate SVGs

## What NOT To Do

- Don't compute derived data in figure components. Move transforms to the export script.
- Don't import D3 or other chart libraries. SveltePlot only for interactive figures.
- Don't edit `_build/` — all generated output (figures, tables, submission) lives there.
- Don't hardcode schemas — validation reads `data/schemas.yaml`.
- Don't hardcode colors in diagrams — use role names (`vgae`, `gat`, `kd`) that resolve via `resolve()` from the palette.
- Don't put `<script>` tags in MyST page content — curve.space's SPA strips them.
