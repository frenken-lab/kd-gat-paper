# Development Setup

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Bun | latest | `curl -fsSL https://bun.sh/install \| bash` |
| Python | 3.12+ | System or `module load python/3.12` (OSC) |
| MyST | latest | `bun install -g mystmd@1.8.3` |
| Typst | latest | [typst.app/docs/installation](https://github.com/typst/typst) (PDF export only) |

Python packages:

```bash
pip install pyyaml tabulate "bibtexparser>=2.0.0b7"
```

## First-Time Setup

```bash
git clone git@github.com:frenken-lab/kd-gat-paper.git
cd kd-gat-paper
cd interactive && bun install --frozen-lockfile && cd ..
```

## Development Workflows

### Paper (TMLR submission)

```bash
make dev    # Starts MyST dev server with live reload at localhost:3000
```

This uses `myst.yml` and serves the paper content. Edits to `content/*.md` files reload automatically.

### Candidacy Report

```bash
make candidacy-dev    # MyST dev server using myst.candidacy.yml
```

Serves the candidacy superset (paper content + candidacy extensions). The candidacy TOC uses combined pages via `{include}` directives — edits to any included source file trigger a reload.

### Figures

```bash
cd interactive
bun run dev    # shell at localhost:5173 — pick figure from dropdown
```

The shell page uses an iframe so switching figures never tears down the HMR connection. Works in StackBlitz.

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
make dev-myst        # paper (myst.yml)
# or
make candidacy-dev   # candidacy superset
```

Open `http://localhost:3000` in your local browser. Closing Terminal 1 drops the tunnel.

### What reloads automatically vs. manually

| Change | Auto-reload? | Manual step |
|---|---|---|
| `.md` content files | Yes | — |
| `.svelte` figure source | No | `make figures`, then hard-refresh |
| Table spec / CSV | No | `make tables`, then refresh |
| `myst.yml` config | No | Restart `make dev-myst` (clears cache on start) |
| CSS in `_static/` | No | Hard-refresh (Ctrl+Shift+R) |

## Validation

```bash
make validate    # Checks data against schemas.yaml + validates .bib files
make bib         # Validates bibliography only
```

`tools/validate/inputs/data.py` reads `data/schemas.yaml` and checks:
- CSV files: required columns exist, minimum row count met
- JSON files (figure data): required keys present, array length constraints
