# kd-gat-paper

MyST paper: "Adaptive Fusion of Graph-Based Ensembles for Automotive IDS". Two build targets from the same source tree:

- **Paper** (`myst.yml`): TMLR submission → CI artifact only
- **Candidacy** (`myst.candidacy.yml`): Superset report → GitHub Pages via `myst build --html`

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
| TMLR export           | **AST serializer** (`tools/tmlr/build.mjs`) | mdast-util-to-markdown defaults + Distill overrides (cite, iframe, image, container, admonition)   |
| CI/CD                 | **GitHub Actions**                          | validate → figures → deploy-pages (candidacy → GitHub Pages) + build (TMLR artifact)               |

## Key Commands

```bash
make data          # Pull from ESS + validate against schemas.yaml
make validate      # Validate committed data only (no ESS, used in CI)
make figures       # cd interactive && bun run build → _build/figures/*.html
make tables        # Build markdown tables from CSV + spec.yaml
make site          # myst build (depends on figures + tables)
make dev           # overmind orchestrator: myst start + vite (figures HMR) + entr-driven `make tables`
make dev-myst      # myst start alone (no figure HMR, no table watcher) — fallback when overmind isn't installed
make tmlr          # Build TMLR submission directly into tmlr_do_not_modify/
make tmlr-anon     # Build anonymous TMLR submission (into kit, for review-check)
make preview       # Build submission + Jekyll preview via Docker
make submission-zip # Flat anonymous submission.zip for OpenReview upload
make candidacy-site # myst build --site --config myst.candidacy.yml (superset)
make candidacy-dev  # myst start --config myst.candidacy.yml (live reload)
make sync          # Pull Curvenote editor changes into paper/from-editor/ (DESTRUCTIVE — see "Editor sync")
make bib           # Validate paper/references/*.bib
make test          # Run TMLR serializer tests (bun test in tools/tmlr/)
make all           # figures → tables → site (data pulled transitively)
make clean         # rm -rf _build
```

## Data Flow

```
KD-GAT eval artifacts
  → export_paper_data.py → ESS exports/paper/ (_manifest.json + _provenance.json)
  → tools/validate/inputs/data.py (checks schemas.yaml) → data/csv/ + interactive/src/figures/data/*/data.json
  → bun run build → _build/figures/*.html
  → myst build --html → _build/html/ → GitHub Pages → frenken-lab.github.io/kd-gat-paper/
  → tools/tmlr/build.mjs (reads _build/site/ AST) → tmlr_do_not_modify/_under_review/submission.md (+ assets/)
```

## Deployment

| Target               | What                                      | How                                                |
| -------------------- | ----------------------------------------- | -------------------------------------------------- |
| **GitHub Pages**     | Candidacy report (MyST site, superset)    | `myst build --html` + `deploy-pages` in CI (config-swap to `myst.candidacy.yml`) |
| **TMLR submission**  | Self-contained folder (anonymous)         | `tools/tmlr/build.mjs` in CI, uploaded as artifact |
| **Curvenote editor** | Edit on web → `make sync` to pull changes | Manual (`curvenote pull`)                          |

Figures require iframe isolation (Svelte apps need `<script>` execution). Content files use absolute GitHub Pages URLs for iframes; the TMLR build rewrites all iframe paths to `assets/html/submission/` via `_h_iframe` (extracts filename, rebuilds as relative) — no external URLs leak into the anonymous submission. CI sets `BASE_URL: /${{ github.event.repository.name }}` so MyST resolves assets correctly at the `/kd-gat-paper` subpath.

## Editor sync (curvenote.com → repo)

One-way pull: edits authored on curvenote.com flow back into `paper/from-editor/`. The repo is the source of truth for everything else; the curvenote.com Project is a side surface for in-browser writing and co-author edits.

**Architecture choice.** The Project lives at `https://editor.curvenote.com/@<user>/<slug>` and is bound by `paper/from-editor/curvenote.yml` (with `id:` + `remote:`). Sync runs from inside that subfolder, **not** the repo root. Reason: `bunx curvenote work push / clone / pull` writes back to every `myst*.yml` it finds in the project root and silently strips fields it doesn't recognize (`committee:`, custom `exports:` configs). The swap-trap pattern Recipe A in `CURVENOTE_SYNC_PLAN.md` proposed corrupted `myst.candidacy.yml` on the first attempt; project memory `project_curvenote_cli_writeback.md` has the incident notes.

**One-time setup** (web UI for the create + a single `clone` from a dev machine with `bun`):

1. Generate an API token at https://curvenote.com/profile?settings=true&tab=profile-api. Store as `CURVENOTE_TOKEN` in `~/.env.local`.
2. On `editor.curvenote.com/@<user>`, click **+ New Project** (lower-right), pick a template, name it, set visibility Public, **CREATE PROJECT**. Note the resulting URL `https://curvenote.com/@<user>/<slug>`.
3. From repo root: `bunx -y curvenote@0.14.3 clone https://curvenote.com/@<user>/<slug> paper/from-editor/`. This writes `paper/from-editor/curvenote.yml` with both `id:` and `remote:` bound to the Project.
4. Commit `paper/from-editor/curvenote.yml` so the binding survives across machines.

**Day-to-day:**

- Edit content on `editor.curvenote.com`.
- `make sync` — runs `bunx curvenote pull --yes` from inside `paper/from-editor/`. **DESTRUCTIVE** in scope: overwrites files in `paper/from-editor/`, leaves the rest of the repo alone. Refuses to run on a dirty working tree; commit or stash first.

**Local → remote push** uses `tools/curvenote/push.mjs`, which talks directly to api.curvenote.com (`/blocks` + `/drafts/.../steps` + `/blocks/<A>/versions` with a body). The curvenote CLI's `work push` does NOT do this — it pushes to the public CDN as a Work snapshot, which is a different object that doesn't surface in the editor. The editor reads Block content from a different store, and the only path is the API.

**Critical API gotchas** (every one of these silently produces blank-rendered articles when you get it wrong):

1. **The editor renders from `Article version.children`, not `Article draft.children`.** Calling `POST /blocks/<A>/versions {}` with an empty body publishes v1 with `children: {}` — pages exist, body never renders. You must include the children in the body: `POST /blocks/<A>/versions {"order": [<childId>], "children": {<childId>: {"id": <childId>, "src": {"project": <P>, "block": <ContentBlock>, "version": 1, "draft": null}, "style": null}}}`.
2. **Article drafts must be created *after* the Article has a published version.** A draft POSTed when `latest_version` is null is born with `parent: null, id.version: null` — the editor refuses to render orphan drafts. Order: `POST /blocks` (Article) → `POST /blocks/<A>/versions {...children...}` → `POST /drafts/<A>` → `PATCH /blocks/<A> {default_draft: <new>}`.
3. **Content drafts use ProseMirror collab steps**, not PATCH. `POST /drafts/<P>/<C>/<D>/steps` with `{client: <int>, version: <next_step>, steps: [<PM step>]}`. PATCH on `data.content` returns 200 but is silently a no-op.
4. **Merging a Content draft empties `data.content`** (it moves into the version). To keep an editable surface after publishing, create a new draft: `POST /drafts/<P>/<C>` returns a fresh draft with `parent: 1` that inherits v1's PM JSON. Wire the Article child's `src.draft` at this fresh draft, not the merged one.
5. The `client` field on steps must be an `int` (not a UUID/string). 42 is fine.

`tools/curvenote/push.mjs` encodes all five. Don't reinvent — extend it.

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
