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
| Architecture diagrams | **SvelteFlow** (`@xyflow/svelte`) + **ELK** (`elkjs`) | Spec-driven YAML → `specToFlow` → SvelteFlow nodes/edges. ELK does component-level orthogonal routing. Library in `interactive/src/lib/flow/` |
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
make dev           # myst start (prose live reload; iframes hit production URLs)
make dev-figures   # vite dev server for figures only (HMR on Svelte edits)
make dev-all       # both servers, iframes rewritten to localhost for HMR integration
make tmlr          # Build TMLR submission directly into tmlr_do_not_modify/
make tmlr-anon     # Build anonymous TMLR submission (into kit, for review-check)
make preview       # Build submission + Jekyll preview via Docker
make submission-zip # Flat anonymous submission.zip for OpenReview upload
make candidacy      # myst build --all → site + Typst PDF in one pass (uses exports: in myst.candidacy.yml)
make candidacy-site # myst build --site --config myst.candidacy.yml (superset, skip PDF)
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
  → validate_data.py (checks schemas.yaml) → data/csv/ + interactive/src/figures/data/*/data.json
  → npm run build → _build/figures/*.html
  → myst build → _build/ → curvenote deploy → rob.curve.space
                          → GitHub Pages (figures only) → frenken-lab.github.io/kd-gat-paper/
  → tools/tmlr/build.py (reads _build/site/ AST) → tmlr_do_not_modify/_under_review/submission.md (+ assets/)
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
- Figures live under `interactive/src/figures/{data,diagrams}/<name>/`. Data-driven plots go in `data/`; SvelteFlow architecture diagrams go in `diagrams/`. Each figure: `App.svelte` + `data.json` (data) or `spec.yaml` (diagrams) + `index.html` + `main.js`. Build outputs stay flat at `_build/figures/<name>.html` — names must be unique across categories.
- Handle empty data: show "Awaiting data export" when data is `[]` or `{}`
- Figures build one-at-a-time via `interactive/build.js` (vite-plugin-singlefile requires single entry per build)
- **Colors/fonts**: `styles.yml` is the single source of truth. Exposed at build time via `virtual:styles` (JS object) and `virtual:theme-vars.css` (CSS custom properties). Use role names (`vgae`, `gat`, `kd`) not hex colors.

## Diagram Convention

- **Library**: `interactive/src/lib/flow/` — spec-driven YAML diagrams rendered with SvelteFlow + ELK.
- **Preferred workflow**: Write a `spec.yaml` per diagram, then in `App.svelte` call `specToFlow(spec)` → bind the returned `{nodes, edges}` to `<DiagramCanvas>`. Diagrams without a spec.yaml inline the spec object in `App.svelte` (e.g. `graph-base`, `gat-layer`).
- **`specToFlow`** (`convert.ts`): Walks a `FigureSpec` (components + layout + bridges) → SvelteFlow `nodes`/`edges`. Builds nodes from components (graph clusters → circles on a ring; boxes; or recursively-prefixed sub-specs), generates intra-cluster structural edges from `topology`, walks the layout tree to add pipeline flow edges + layout containers, resolves bridge anchors (direct IDs, `compId__top|bottom|left|right`, sub-spec dotted refs), then runs ELK at component granularity for placement and orthogonal bend points.
- **`layoutWithELK`** (`elk.ts`): Thin wrapper over `elkjs`. Layered + ORTHOGONAL routing; returns positions + bend points per super-edge.
- **Floating edges + bend-point rendering** (`floating.ts`): Snaps edge endpoints to the cardinal side of each leaf node facing the other endpoint, and renders ELK bend points as a rounded polyline (`roundedPolylinePath`) capped at each leaf boundary.
- **`resolve`** (`palette.ts`): Maps role names (`vgae`, `gat`, `kd`) → `{stroke, fill}` from `styles.yml`.
- **Node types**: `circle`, `box`, `container` (parent group with dashed border + label).
- **Edge types**: `structural` (intra-cluster ring), `flow` (orthogonal smoothstep with optional bend points + label), `encoded` (straight, weight-modulated stroke for attention). The `kd` bridge type is a preset on `flow` (thicker dashed stroke, bold colored label offset to the right) — there is no separate KD edge component.
- **Sizes & rings**: graph component `scale` is the cluster diameter in px; circle `r` defaults to a heuristic on `scale` but can be overridden per component when you need bigger circles on a small ring.
- **Colors**: defined in `styles.yml`. Use role names in specs, never hex.
- Diagrams are full SvelteFlow apps (same build pipeline as interactive figures) — each renders a `<DiagramCanvas>` that sets node/edge type registrations and hides default handles for a clean static look.

## What NOT To Do

- Don't compute derived data in figure components. Move transforms to the export script.
- Don't import D3 or other chart libraries. SveltePlot only for interactive figures.
- Don't edit `_build/` — all generated output (figures, tables, submission) lives there.
- Don't hardcode schemas — validation reads `data/schemas.yaml`.
- Don't hardcode colors in diagrams — use role names (`vgae`, `gat`, `kd`) that resolve via `resolve()` from the palette.
- Don't put `<script>` tags in MyST page content — curve.space's SPA strips them.
