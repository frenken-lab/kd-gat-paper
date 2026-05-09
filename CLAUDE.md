# kd-gat-paper

Quarto book: "Adaptive Fusion of Graph-Based Ensembles for Automotive
Intrusion Detection (PhD Candidacy Report)". Single output target, the
candidacy report deployed to GitHub Pages.

- **Config**: `_quarto.yml` (book project, parts: Current Framework /
  Proposed Research / Committee Questions, plus appendices).
- **Cover page**: `index.qmd` at the project root (Quarto convention).
- **Chapters**: `paper/content/*.qmd` (shared sections) and
  `paper/candidacy/*.qmd` (candidacy-specific).

## Tech Stack

| Layer                 | Tool                                        | Why                                                                                                |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Authoring             | **Quarto** (`.qmd`)                         | Cross-references, math, citations, executable Python cells, builds to HTML                         |
| Interactive figures   | **SveltePlot** (grammar-of-graphics)        | Spec-driven: `<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`. SVG output, Svelte-native          |
| Architecture diagrams | **SvelteFlow** (`@xyflow/svelte`) + **ELK** (`elkjs`) | Spec-driven YAML → `specToFlow` → SvelteFlow nodes/edges. ELK does orthogonal routing.    |
| Build (figures)       | **Vite** + `vite-plugin-singlefile`         | Each figure → self-contained HTML (JS+CSS+data inlined)                                            |
| Build (book)          | **Quarto** 1.8+                             | `quarto render` → `_build/site/` (matches the GitHub Pages deploy path)                            |
| Tables                | **spec.yaml** + `tools/tables/build.py`     | Declarative table specs, booktabs-style, literature baselines                                      |
| Validation schemas    | **`data/schemas.yaml`**                     | Single source of truth for both export and pull validation                                         |
| CI/CD                 | **GitHub Actions**                          | validate → figures → deploy-pages (quarto render → GitHub Pages)                                   |

## Key Commands

```bash
make data            # Pull from HuggingFace + validate against schemas.yaml
make validate        # Validate committed data + bib + GSN (CI entry point)
make figures         # cd interactive && bun run build → _build/figures/*.html
make tables          # Build markdown tables from CSV + spec.yaml → _build/tables/
make render          # quarto render (figures + tables prerequisite) → _build/site/
make dev             # quarto preview — live reload on .qmd / _quarto.yml / references
make watch-tables    # rebuild tables when CSVs / spec.yaml change (entr-driven)
make bib             # Validate paper/references/*.bib
make all             # data → figures → tables → render
make clean           # rm -rf _build
```

## Data Flow

```
KD-GAT eval artifacts (HuggingFace: buckeyeguy/graphids-kd-gat)
  → tools/pull_data.py (validates schemas.yaml) → data/csv/ + interactive/src/figures/data/*/data.json
  → bun run build → _build/figures/*.html
  → tools/tables/build.py → _build/tables/*.md
  → quarto render → _build/site/ → GitHub Pages → frenken-lab.github.io/kd-gat-paper/
```

## Deployment

| Target           | What                                   | How                                                |
| ---------------- | -------------------------------------- | -------------------------------------------------- |
| **GitHub Pages** | Candidacy book (Quarto HTML)           | `quarto render` + `deploy-pages` in CI             |

Figures require iframe isolation (Svelte apps need `<script>` execution).
Chapters embed figures as iframes pointing at the GitHub Pages absolute URLs
(`assets/html/submission/<name>.html`); the deploy step copies the built
figures into that path.

## Schema Convention

`data/schemas.yaml` defines contracts for all CSV and JSON data files. Both
`export_paper_data.py` (in KD-GAT) and `tools/pull_data.py` (this repo) read
from it. Don't hardcode schemas elsewhere.

## Table Convention

- `tools/tables/spec.yaml` defines table specs: source CSV, columns,
  formatting, sort order, literature baselines.
- `data/csv/literature_baselines.csv` holds comparison metrics with citation
  keys.
- `tools/tables/build.py` renders to `_build/tables/<name>.md` — baselines
  first, user models **bolded** at bottom.
- Chapters pull tables in via `{{< include ../../_build/tables/<name>.md >}}`
  inside a `:::{#tbl-X}` Quarto figure-style div.

## Interactive Figure Convention

- **Dumb renderers**: Figures import `data.json` and plot it. No data
  transforms in `.svelte` files. All preprocessing happens in the export
  pipeline.
- Use SveltePlot marks (`<Cell>`, `<RectY>`, `<Line>`, `<Dot>`, `<Arrow>`).
  No D3.
- Figures live under `interactive/src/figures/{data,diagrams}/<name>/`.
  Data-driven plots in `data/`; SvelteFlow architecture diagrams in
  `diagrams/`. Each: `App.svelte` + `data.json` (data) or `spec.yaml`
  (diagrams) + `index.html` + `main.js`. Build outputs stay flat at
  `_build/figures/<name>.html` — names must be unique across categories.
- Handle empty data: show "Awaiting data export" when data is `[]` or `{}`.
- **Colors/fonts**: `styles.yml` is the single source of truth. Use role
  names (`vgae`, `gat`, `kd`) not hex.

## Diagram Convention

- **Library**: `interactive/src/lib/flow/` — spec-driven YAML diagrams
  rendered with SvelteFlow + ELK.
- **`specToFlow`** walks a `FigureSpec` (components + layout + bridges) →
  SvelteFlow `nodes`/`edges`. ELK runs at component granularity for
  placement and orthogonal bend points.
- **Node types**: `circle`, `box`, `container`. **Edge types**:
  `structural`, `flow`, `encoded`. The `kd` bridge type is a preset on
  `flow` (thicker dashed stroke).
- **Colors**: defined in `styles.yml`. Use role names in specs, never hex.

## Quarto-specific Notes

- **Cross-refs**: `@fig-X`, `@tbl-X`, `@eq-X`, `@sec-X` (heading must end
  with `{#sec-X}` and `crossref: chapters: true` in `_quarto.yml`).
- **Iframes**: wrap in `:::{#fig-X}\n```{=html}\n<iframe ...></iframe>\n```\n\nCaption\n:::`.
- **Includes**: `{{< include path >}}` shortcode (path is relative to the
  including file). The included file should be frontmatter-free or its
  YAML will leak into the chapter.
- **Algorithm boxes**: `:::{.algorithm}\n**Title**\n\n...\n:::` with the
  `.algorithm` class styled by `_static/quarto.css` (border + caption font).
- **Code cells**: `\`\`\`{python}\n#| echo: false\n...\n\`\`\``. Quarto
  picks up `QUARTO_PYTHON` to choose the kernel — Makefile pins it to
  `.venv/bin/python` so notebook cells run in the project env.

## What NOT To Do

- Don't compute derived data in figure components. Move transforms to the
  export script.
- Don't import D3 or other chart libraries. SveltePlot only for interactive
  figures.
- Don't edit `_build/` — all generated output (figures, tables, site) lives
  there.
- Don't hardcode schemas — validation reads `data/schemas.yaml`.
- Don't hardcode colors in diagrams — use role names (`vgae`, `gat`, `kd`)
  that resolve via `resolve()` from the palette.

## Migrating new MyST content

If a chapter is dropped in from a MyST source, `tools/migrate_to_quarto.py`
does the mechanical conversion: directives, fenced math, includes,
cross-refs, frontmatter. The `--check` flag flags any unconverted MyST-only
syntax that survives. Hand-fix what it reports.

```bash
python3 tools/migrate_to_quarto.py --write --check paper/path/to/file.md
```
