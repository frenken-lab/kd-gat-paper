# Interactive Figures

Svelte + Vite project that builds each figure as a self-contained HTML file (via `vite-plugin-singlefile`) into `_build/figures/`.

## Setup

```bash
cd interactive
npm install
```

## Running a figure in dev mode

Figures are served one at a time. Set the `FIGURE` env var to the directory name under `src/figures/`:

```bash
FIGURE=umap npm run dev
```

Or copy `.env.example` to `.env` and set the value there:

```bash
cp .env.example .env
# edit .env → FIGURE=umap
npm run dev
```

Available figures: `algorithm`, `architecture`, `attention`, `cka`, `dqn`, `fusion`, `gat`, `gat-layer`, `graph-base`, `kd-gat`, `kd-vgae`, `reconstruction`, `results-table`, `umap`, `vgae`.

## Building all figures

```bash
npm run build
# or from the repo root:
make figures
```

`build.js` iterates over every directory in `src/figures/` that contains an `App.svelte`, builds each one in a separate Vite pass, and writes the output to `_build/figures/<name>.html`. `index.html` and `main.js` are auto-generated for any figure that doesn't already have them.

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
