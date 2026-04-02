# Deployment and CI

## CI Pipeline

All CI runs via `.github/workflows/paper.yml`. The job graph:

```
validate (schemas + bib)
  └─ figures (Svelte build → artifact)
       │
       ├─ build (MyST AST + TMLR export → tmlr-site artifact)
       │    └─ deploy-pages (Jekyll → GitHub Pages)
       │
       ├─ candidacy-pdf (MyST → Typst → PDF artifact)
       │
       └─ candidacy-site (Curvenote → curve.space)
```

### Job Details

| Job | Trigger | What it does |
|-----|---------|-------------|
| **validate** | push + PR | Runs `data/validate.py` + `references/validate.py` |
| **figures** | after validate | `cd interactive && npm ci && npm run build`, uploads `figures` artifact |
| **build** | after figures | `myst build --site`, TMLR export (public + anonymous), uploads `tmlr-site` + `tmlr-submission` artifacts |
| **deploy-pages** | main push only | Downloads `tmlr-site`, builds Jekyll, deploys to GitHub Pages |
| **candidacy-pdf** | main push only | Installs Typst, runs `myst build --pdf --config myst.candidacy.yml`, uploads `candidacy-pdf` artifact |
| **candidacy-site** | main push only | Runs `curvenote deploy` to push candidacy build to curve.space |

The three deploy jobs (`deploy-pages`, `candidacy-pdf`, `candidacy-site`) run **in parallel** after their dependencies complete.

## Deployment Targets

### GitHub Pages

**URL**: https://frenken-lab.github.io/kd-gat-paper/

Hosts the TMLR Distill-layout site (paper content) and interactive figure HTML files (used as iframe sources by both the paper and candidacy builds).

The site is built via Jekyll from the TMLR author kit (`tmlr_do_not_modify/`). The TMLR export serializer (`export/tmlr/build.py`) walks the MyST AST and outputs Distill-compatible markdown.

### curve.space

**URL**: https://rob.curve.space

Hosts the candidacy report as a MyST SPA via Curvenote. Requires `CURVENOTE_TOKEN` repo secret.

Since `curvenote deploy` doesn't support `--config`, CI swaps `myst.candidacy.yml` into `myst.yml` before deploying, then restores it.

### TMLR Submission

Anonymous self-contained submission folder, uploaded as CI artifact (`tmlr-submission`). All iframe paths are rewritten to `assets/html/submission/` — no external URLs leak into the anonymous submission.

### Candidacy PDF

Typst-rendered PDF, uploaded as CI artifact (`candidacy-pdf`). Download from Actions tab → latest run → Artifacts.

## Secrets

| Secret | Used by |
|--------|---------|
| `CURVENOTE_TOKEN` | `candidacy-site` job — authenticates `curvenote deploy` |

## Manual Deployment

```bash
make deploy         # Merge TMLR submission into author kit (then push to trigger CI)
make sync           # Pull Curvenote editor changes into repo
```

## Caching

- **npm**: Cached via `actions/setup-node` with `cache-dependency-path: interactive/package-lock.json`
- **pip**: Cached via `actions/setup-python` with `cache: pip`
