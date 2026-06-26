# Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Bun | latest | `curl -fsSL https://bun.sh/install \| bash` |
| Python | 3.12+ | System or `module load python/3.12` (OSC) |
| uv | latest | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| Quarto | 1.8+ | [quarto.org/docs/get-started](https://quarto.org/docs/get-started/) |

Python packages:

```bash
uv sync --extra notebooks --group dev
```

## First-Time Setup

```bash
git clone git@github.com:frenken-lab/kd-gat-paper.git
cd kd-gat-paper
uv sync --extra notebooks --group dev
cd interactive && bun install --frozen-lockfile && cd ..
```

## Development Workflows

### Quarto site

```bash
make dev    # Starts Quarto preview with live reload
```

This uses `_quarto.yml` and serves the candidacy book. Edits to `.qmd` source files reload automatically.

### Figures

```bash
cd interactive
bun run dev    # shell at localhost:5173 — pick figure from dropdown
```

The shell page uses an iframe so switching figures never tears down the HMR connection. Works in StackBlitz.

For the normal repo build, use `make build` and let the orchestrator rebuild figures, tables, slides, and the site together.

### Spec editor / anywidget

```bash
make speceditor      # build the widget bundle for stable use on OSC
```

Use the built bundle on OSC when you want to open and edit diagrams. That is the normal path.

### Insight loop

```bash
make marimo   # open analysis/marimo/ as the primary insight workspace
```

Use marimo for reactive inspection and claim drafting. Save stable results into `paper/candidacy/_generated/`, then point Quarto or notebook wrappers at those files.

## Project Layout

```
paper/                    All authored content
  content/                  Shared paper sections (both builds use these)
  candidacy/                Candidacy-only content + combined page wrappers
  references/               Split .bib files by topic
interactive/              SveltePlot figures + SvelteFlow diagrams (Svelte + Vite)
  src/figures/data/<name>/       Data-driven plots (consume data.json)
  src/figures/diagrams/<name>/   Architecture diagrams (spec.yaml → SvelteFlow)
  src/lib/flow/                  Shared SvelteFlow + palette helpers
data/
  csv/                    Source data files
  schemas.yaml            Validation schemas
tools/                    Build scripts, validators, export pipelines
_static/                  Custom CSS
_build/                   All generated output (gitignored)
```

## OSC (Headless) Development via SSH Tunnel

No browser on a login node — forward the dev server port to your local machine.

### One-time SSH config (local `~/.ssh/config`)

```
Host pitzer* pitzer-login01.hpc.osc.edu
    User rf15
    ServerAliveInterval 60
    ServerAliveCountMax 5
```

`ServerAliveInterval` prevents the login node from killing idle sessions.

### Workflow

**Terminal 1 — open tunnel (local machine, keep open):**

```bash
ssh -L 3000:localhost:3000 pitzer-login01.hpc.osc.edu
```

**Terminal 2 — start dev server (on OSC):**

```bash
cd ~/kd-gat-paper
make dev
```

Open `http://localhost:3000` in your local browser. Closing Terminal 1 drops the tunnel.

### What reloads automatically vs. manually

| Change | Auto-reload? | Manual step |
|---|---|---|
| `.qmd` content files | Yes | — |
| `.svelte` figure source | No | `make build`, then hard-refresh |
| Table spec / CSV | No | `make build`, then refresh |
| `analysis/marimo/*` | No | save artifact to `paper/candidacy/_generated/`, then refresh the consumer |
| `_quarto.yml` config | No | Restart `make dev` |
| CSS in `_static/` | No | Hard-refresh (Ctrl+Shift+R) |

If you do not want to think about which layer changed, run `make build` and refresh once.

## Validation

```bash
make validate    # Checks data against schemas.yaml + validates .bib files
make bib         # Validates bibliography only
```

`tools/validate_inputs.py --data-only` reads `data/schemas.yaml` and checks:
- CSV files: required columns exist, minimum row count met
- JSON files (figure data): required keys present, array length constraints
