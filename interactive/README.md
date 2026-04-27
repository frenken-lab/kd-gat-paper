# Interactive Figures

Svelte + Vite project that builds each figure as a self-contained HTML file (via `vite-plugin-singlefile`) into `_build/figures/`.

## Setup

```bash
cd interactive
npm install
```

## Running a figure in dev mode

Figures live under `src/figures/` in two categories:

- **`data/`** — data-driven plots consuming `data.json`: `algorithm`, `attention`, `cka`, `fusion`, `reconstruction`, `results-table`, `umap`
- **`diagrams/`** — SvelteFlow architecture diagrams driven by `spec.yaml` (or inline graph construction): `architecture`, `composition-pipeline`, `gat`, `gat-layer`, `graph-base`, `kd-gat`, `kd-vgae`, `vgae`

Figures are served one at a time. Set the `FIGURE` env var to the directory name (category is resolved automatically from the layout):

```bash
FIGURE=umap npm run dev
```

Or copy `.env.example` to `.env` and set the value there:

```bash
cp .env.example .env
# edit .env → FIGURE=umap
npm run dev
```

## Building all figures

```bash
npm run build
# or from the repo root:
make figures
```

`build.js` walks `src/figures/{data,diagrams}/*/` for directories containing `App.svelte`, builds each one in a separate Vite pass, and writes the output to a flat `_build/figures/<name>.html`. Figure names must be unique across categories so the output filename is unambiguous. `index.html` and `main.js` are auto-generated for any figure that doesn't already have them.

## Global styles from `styles.yml`

The root `styles.yml` is the single source of truth for colors, fonts, and semantic roles shared across all figures (and also used by TikZ/Graphviz diagrams).

The Vite config exposes it via two virtual modules:

| Import                   | What you get                                                                           |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `virtual:styles`         | The full parsed YAML as a JS object                                                    |
| `virtual:theme-vars.css` | CSS custom properties (`--color-*`, `--fill-*`, `--font-*`) generated from the palette |

`src/lib/Figure.svelte` imports `virtual:theme-vars.css` automatically, so every figure that wraps its content in `<Figure>` inherits the CSS variables without any extra setup.

To use a color in a Svelte component:

```svelte
<!-- via CSS variable -->
<circle style="fill: var(--color-blue)" />

<!-- via JS (e.g. for SveltePlot / D3) -->
<script>
  import styles from 'virtual:styles';
  const blue = styles.palette.blue; // "#4E79A7"
</script>
```

Semantic role aliases (e.g. `vgae → blue`, `attack → red`) are defined under `roles:` in `styles.yml` but are resolved to hex values at the palette level — use the palette keys for CSS vars and the `roles` map for documentation/consistency.
