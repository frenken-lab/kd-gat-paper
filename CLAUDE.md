# kd-gat-paper

MyST paper: "Adaptive Fusion of Graph-Based Ensembles for Automotive IDS". Deployed to rob.curve.space.

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Paper authoring | **MyST Markdown** | Cross-references, math, citations, builds to HTML |
| Interactive figures | **SveltePlot 0.12** (grammar-of-graphics) | Spec-driven: `<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. SVG output, Svelte-native |
| Architecture diagram | **TikZ** | Gold standard for ML paper diagrams, version-controllable |
| Build | **Vite 6** + `vite-plugin-singlefile` | Each figure → self-contained HTML (JS+CSS+data inlined) |
| Validation schemas | **`data/schemas.yaml`** | Single source of truth for both export and pull validation |
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
  → pull_data.py (validates checksums + schemas.yaml) → data/csv/ + interactive/src/*/data.json
  → npm run build → figures/*.html
  → myst build → _build/ → curvenote deploy → rob.curve.space
```

## Schema Convention

`data/schemas.yaml` defines contracts for all CSV and JSON data files. Both `export_paper_data.py` (KD-GAT) and `pull_data.py` (this repo) read from it. Don't hardcode schemas elsewhere.

## Figure Convention

- **Dumb renderers**: Figures import `data.json` and plot it. No data transforms in `.svelte` files.
- All preprocessing (sampling, flattening, ROC computation, layout) happens in `export_paper_data.py`.
- Use SveltePlot marks (`<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`). No D3.
- Each figure: `interactive/src/<name>/App.svelte` + `data.json` + `index.html` + `main.js`
- Handle empty data: show "Awaiting data export" when data is `[]` or `{}`

## What NOT To Do

- Don't compute derived data in figure components. Move transforms to the export script.
- Don't import D3 or other chart libraries. SveltePlot only.
- Don't edit `_build/` or `figures/*.html` — generated output.
- Don't hardcode schemas — validation reads `data/schemas.yaml`.
