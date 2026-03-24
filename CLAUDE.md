# kd-gat-paper

MyST paper: "Adaptive Fusion of Graph-Based Ensembles for Automotive IDS". Deployed to rob.curve.space.

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Paper authoring | **MyST Markdown** | Cross-references, math, citations, builds to HTML |
| Interactive figures | **SveltePlot 0.12** (grammar-of-graphics) | Spec-driven: `<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. SVG output, Svelte-native |
| Architecture diagrams | **NetworkX + matplotlib** | YAML specs → composable graph components → SVG. Styles from `data/styles.yaml` (Observable 10 palette, shared with Svelte figures) |
| Build | **Vite 6** + `vite-plugin-singlefile` | Each figure → self-contained HTML (JS+CSS+data inlined) |
| Tables | **spec.yaml** + `scripts/tables/build.py` | Declarative table specs, booktabs-style, literature baselines |
| Validation schemas | **`data/schemas.yaml`** | Single source of truth for both export and pull validation |
| TMLR export | **AST serializer** (`scripts/tmlr/build.py`) | Walks MyST AST JSON → Distill-layout markdown |
| CI/CD | **GitHub Actions** | validate → figures → deploy-figures (Pages) + build-and-deploy (curve.space) |

## Key Commands

```bash
make data          # Pull from ESS + validate against schemas.yaml
make validate      # Validate committed data only (no ESS, used in CI)
make figures       # cd interactive && npm run build → figures/*.html
make tables        # Build markdown tables from CSV + spec.yaml
make site          # myst build (depends on figures + diagrams + tables)
make dev           # myst start (live reload)
make tmlr          # Convert to TMLR Beyond PDF submission
make deploy        # Deploy to rob.curve.space (depends on site)
make sync          # Pull Curvenote editor changes into repo
make bib           # Validate references.bib
make diagrams      # YAML specs → NetworkX/matplotlib → SVG (no texlive needed)
make all           # data → figures → diagrams → tables → site
```

## Data Flow

```
KD-GAT eval artifacts
  → export_paper_data.py → ESS exports/paper/ (_manifest.json + _provenance.json)
  → pull_data.py (validates checksums + schemas.yaml) → data/csv/ + interactive/src/*/data.json
  → npm run build → figures/*.html
  → myst build → _build/ → curvenote deploy → rob.curve.space
                          → GitHub Pages (figures only) → robertfrenken.github.io/kd-gat-paper/
  → scripts/tmlr/build.py (reads _build/site/ AST) → submission_folder/ (self-contained)
```

## Deployment

| Target | What | How |
|--------|------|-----|
| **rob.curve.space** | Paper content (MyST SPA) | `curvenote deploy` in CI |
| **GitHub Pages** | Interactive figures (iframe src) | `deploy-pages` in CI |
| **TMLR submission** | Self-contained folder (anonymous) | `scripts/tmlr/build.py` in CI, uploaded as artifact |
| **Curvenote editor** | Edit on web → `make sync` to pull changes | Manual (`curvenote pull`) |

curve.space is an SPA that can't serve static HTML files. Figures require iframe isolation (Svelte apps need `<script>` execution). GitHub Pages hosts the figure HTML files; iframes in the paper point there. The TMLR build rewrites all iframe paths to `assets/html/submission/` — no external URLs leak into the anonymous submission.

## Schema Convention

`data/schemas.yaml` defines contracts for all CSV and JSON data files. Both `export_paper_data.py` (KD-GAT) and `pull_data.py` (this repo) read from it. Don't hardcode schemas elsewhere.

## Table Convention

- `data/tables/spec.yaml` defines table specs: source CSV, columns, formatting, sort order, literature baselines
- `data/csv/literature_baselines.csv` holds comparison metrics with citation keys
- `scripts/tables/build.py` renders to `data/tables/*.md` — baselines first, user models **bolded** at bottom
- Content files use `{include}` directives to pull in generated tables

## Interactive Figure Convention

- **Dumb renderers**: Figures import `data.json` and plot it. No data transforms in `.svelte` files.
- All preprocessing (sampling, flattening, ROC computation, layout) happens in `export_paper_data.py`.
- Use SveltePlot marks (`<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`). No D3.
- Each figure: `interactive/src/<name>/App.svelte` + `data.json` + `index.html` + `main.js`
- Handle empty data: show "Awaiting data export" when data is `[]` or `{}`
- Figures build one-at-a-time via `interactive/build.js` (vite-plugin-singlefile requires single entry per build)

## Diagram Convention

- **YAML specs**: Each diagram is a `diagrams/*.yaml` file that declares components + edges
- **Composable components**: `graph()`, `box()`, `gat()`, `vgae()` in `scripts/components.py`
- **Shared styles**: All colors/sizes from `data/styles.yaml` (Observable 10 palette, same as Svelte)
- **Anchors**: Components expose `input`/`output` ports + named label anchors for edge wiring
- **Containers**: `container: {label, color, style}` on any component draws a bounding box
- **Rendering**: NetworkX graph data → matplotlib SVG. Supports per-node/edge colors, shapes, styles.
- **Edge features**: `connectionstyle` (curved edges), `arrowstyle` (head shapes), `style` (dashed/solid)
- **Label layer**: `--positions` exports node coords as JSON for future Typst math overlay
- See `diagrams/COMPONENTS.md` for full reference.

## What NOT To Do

- Don't compute derived data in figure components. Move transforms to the export script.
- Don't import D3 or other chart libraries. SveltePlot only for interactive figures.
- Don't edit `_build/`, `figures/*.html`, `figures/*.svg`, or `data/tables/*.md` — generated output.
- Don't hardcode schemas — validation reads `data/schemas.yaml`.
- Don't hardcode colors in diagram specs — use role names (`vgae`, `gat`, `kd`) that resolve from `data/styles.yaml`.
- Don't put `<script>` tags in MyST page content — curve.space's SPA strips them.
