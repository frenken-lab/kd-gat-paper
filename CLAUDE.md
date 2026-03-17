# kd-gat-paper

MyST paper: "Adaptive Fusion of Graph-Based Ensembles for Automotive IDS". Deployed to rob.curve.space.

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Paper authoring | **MyST Markdown** | Cross-references, math, citations, builds to HTML |
| Interactive figures | **SveltePlot 0.12** (grammar-of-graphics) | Spec-driven: `<Cell>`, `<RectY>`, `<Line>` — not imperative D3. SVG output, Svelte-native |
| UMAP scatter | **D3.js** (imperative) | Simple scatter — D3 is fine for direct SVG control on one figure |
| Attention graph | **SveltePlot** marks + **d3-force** | `<Arrow>`/`<Dot>` for rendering, d3-force for layout |
| Architecture diagram | **TikZ** | Gold standard for ML paper diagrams, version-controllable |
| Build | **Vite 6** + `vite-plugin-singlefile` | Each figure → self-contained HTML (JS+CSS+data inlined) |
| Validation schemas | **`data/schemas.json`** | Single source of truth for both export and pull validation |
| CI/CD | **GitHub Actions** | validate → figures → build+deploy (3 jobs) |

## Key Commands

```bash
make data          # Pull from ESS + validate against schemas.json
make validate      # Validate committed data only (no ESS, used in CI)
make figures       # cd interactive && npm run build → figures/*.html
make site          # myst build (depends on figures + diagrams)
make dev           # myst start (live reload)
make tmlr          # Convert to TMLR Beyond PDF submission
make deploy        # Push to rob.curve.space (depends on site)
make bib           # Validate references.bib
make diagrams      # TikZ → SVG (needs module load texlive)
make all           # data → figures → diagrams → site
```

## Data Flow

```
KD-GAT eval artifacts
  → export_paper_data.py → ESS exports/paper/ (_manifest.json + _provenance.json)
  → pull_data.py (validates checksums + schemas.json) → data/csv/ + interactive/src/*/data.json
  → npm run build → figures/*.html
  → myst build → _build/ → curvenote deploy → rob.curve.space
```

## Schema Convention

`data/schemas.json` defines column names, types, and constraints for all CSV and JSON data files. Both `export_paper_data.py` (KD-GAT) and `pull_data.py` (this repo) read from it. Don't hardcode schemas elsewhere.

## Figure Convention

- **Spec-driven**: Use SveltePlot marks (`<Cell>`, `<RectY>`, `<Line>`, `<Dot>`). No imperative D3 for standard chart types.
- Each figure: `interactive/src/<name>/App.svelte` + `data.json` + `index.html` + `main.js`
- Handle empty data: show "Awaiting data export" when `data` is `[]` or `{}`

## What NOT To Do

- Don't write imperative D3 for heatmaps, histograms, or line charts. Use SveltePlot.
- Don't edit `_build/` or `figures/*.html` — generated output.
- Don't hardcode data or schemas — figures read `data.json`, validation reads `schemas.json`.
- Don't add validation logic without updating `data/schemas.json`.
