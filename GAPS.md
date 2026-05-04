# kd-gat-paper — Gap Analysis & Simplification Plan

Grounded in the live repo, `AUTHORING_STACK.md`, and `AUTHORING_PLAN.md`.
Items are ordered by friction cost, not by difficulty.

---

## The argument for "easy extension"

MyST's composability promise is: the AST is the stable interface. Any extension
touches exactly one layer — a transformer, a renderer handler, or a directive —
and nothing else changes. Your `build.mjs` already proves this: the ~450-line
Node file is pure handler registration against a typed AST, not a re-implementation
of a parser. Each gap below is fixable at exactly one layer.

---

## Gap 1 — `figures-static` target is broken and undecided

**What:** `make figures-static` calls `node tools/pdf/extract-svg.js`, which was
deleted in `6c5866b`. The Makefile `.PHONY` declaration and `figures-static: figures`
rule still exist. `make candidacy-pdf` does not call `figures-static`, so the Typst
PDF currently has no path to interactive figure content.

**Why it matters:** This is a silent failure at submission time, not a dev-time
annoyance. If anyone runs `make candidacy-pdf` and expects figures, they get
iframes Typst cannot render — blank boxes with no warning.

**Fix (choose one, commit to it):**

Option A — Restore static export via Playwright (correct long-term):
```bash
# tools/pdf/extract-svg.js replacement — ~40 lines
import { chromium } from 'playwright';
const figures = glob('_build/figures/*.html');
for (const f of figures) {
  const page = await browser.newPage();
  await page.goto(`file://${f}`);
  await page.waitForSelector('[data-ready]');   // add this attr to App.svelte on mount
  const svg = await page.$eval('svg', el => el.outerHTML);
  fs.writeFileSync(f.replace('.html', '.svg'), svg);
}
```
Then in Typst template: `#image("figures/umap.svg")` instead of iframe.

Option B — Remove the dead target cleanly (acceptable if PDF figures are placeholders):
```makefile
# Delete from Makefile:
# figures-static: figures
#     node tools/pdf/extract-svg.js
# Remove figures-static from .PHONY
```
Add a comment in `myst.candidacy.yml` noting interactive figures are web-only.

**Do not leave the current state.** The drift is a trap.

---

## Gap 2 — L4 loop is 30 s, should be 2 s

**What:** Seeing prose in Distill's two-column layout requires `make tmlr` → Jekyll
Docker. `AUTHORING_PLAN.md §2` designed the fix; it has not shipped.

**Why it matters:** You cannot judge line length, figure sizing, or column fit
while writing. The 30 s loop means you check layout infrequently and discover
problems late.

**Fix — 3 files, ~60 lines total:**

`tools/tmlr/preview.mjs` — watch mode wrapper (add `--watch` flag to existing
`build.mjs`; `chokidar` is already in the Node ecosystem):
```js
// ~30 lines: watch _build/site/content/*.json, re-run build.mjs on change
import chokidar from 'chokidar';
chokidar.watch('_build/site/content').on('change', () => runBuild());
```

`tools/tmlr/preview/index.html` — stripped Distill shell:
```html
<!-- Load distill template.v2.js from tmlr_do_not_modify/, point at submission.md,
     render with markdown-it. No BibTeX resolution needed for layout preview.
     d-cite renders as [key]. Width must match Distill's 55ch column exactly. -->
```

`Procfile.dev` addition:
```
preview: cd tools/tmlr && node preview.mjs
```

This closes L4 to ~2 s. The Jekyll Docker `make preview` stays as the "before PR"
canonical render — not the inner loop.

---

## Gap 3 — No editor completion for `{cite:p}`, `{ref}`, `{numref}`, `{eq}`

**What:** `myst-highlight` last released June 2021 — syntax only, no completion,
no hover, no jump-to-definition. `chrisjsewell/myst-lsp` exists but is unstable.
`notZaki.pandocciter` is in `.vscode/extensions.json` but not configured for the
12 split `.bib` files.

**Why it matters:** You pay this friction on every cite and every cross-reference.
With ~12 bib files and dozens of labels across files, grepping is the current
workflow.

**Fix (installable today, no waiting for myst-lsp):**

`.vscode/settings.json` — configure pandocciter:
```json
"pandocCiter.DefaultBib": [
  "paper/references/own.bib",
  "paper/references/gnn.bib",
  "paper/references/kd.bib",
  "paper/references/rl.bib",
  "paper/references/vgae.bib",
  "paper/references/datasets.bib",
  "paper/references/curriculum.bib",
  "paper/references/cross_domain.bib",
  "paper/references/infrastructure.bib",
  "paper/references/background.bib",
  "paper/references/loss.bib",
  "paper/references/can_ids.bib"
],
"pandocCiter.RootFile": "paper/content/index.md"
```

`.vscode/kd-gat-paper.code-snippets` — directive snippets as LSP stand-in:
```json
{
  "cite-p":    { "prefix": "cp",  "body": "{cite:p}\`$1\`" },
  "numref":    { "prefix": "nr",  "body": "{numref}\`$1\`" },
  "eq-ref":    { "prefix": "eq",  "body": "{eq}\`$1\`" },
  "figure":    { "prefix": "fig", "body": "```{figure} $1\n:label: fig-$2\n:caption: $3\n```" },
  "algorithm": { "prefix": "alg", "body": "```{admonition} Algorithm $1\n:class: algorithm\n$2\n```" }
}
```

For label completion (xrefs): add a `.vscode/tasks.json` task that runs
`rg --only-matching '\(fig-[^)]+\)|\(eq-[^)]+\)|\(tab-[^)]+\)' paper/` on
demand — not LSP quality but one keybind away.

---

## Gap 4 — Vale `TokenIgnores` probably chokes on MyST roles

**What:** Vale rules are shipped (`MLPaper/*.yml`) but MyST role syntax
(`{cite:p}\`key\``, `{ref}\`label\``) is not in `TokenIgnores`. Vale will flag
role content as prose and fire false positives on bibkeys, label strings, and
directive arguments.

**Why it matters:** False positives in lint = lint gets ignored. A ignored linter
is worse than no linter.

**Fix — `.vale.ini` additions:**
```ini
[*.md]
TokenIgnores = (\{[a-z:]+\}`[^`]+`) \
               (```\{[a-z-]+\}[\s\S]*?```) \
               (\$[^$\n]+\$) \
               (\$\$[\s\S]+?\$\$)
```

This covers: inline roles, fenced directives, inline math, display math.
Verify with `vale --output=line paper/content/introduction.md` — zero false
positives on role syntax is the acceptance criterion.

---

## Gap 5 — `overmind` / `Procfile.dev` is designed but not confirmed shipped

**What:** `AUTHORING_PLAN.md §1` designed a `Procfile.dev` with four processes.
The Makefile has `make dev` calling `overmind start -f Procfile.dev` with a guard,
which implies the file exists — but the repo root doesn't show it in the file tree.

**Why it matters:** If `Procfile.dev` is missing, `make dev` fails immediately.
If it exists but the `preview` process from Gap 2 isn't in it yet, the inner loop
is still fragmented.

**Fix — verify and complete `Procfile.dev`:**
```
myst:    myst start
figs:    cd interactive && npm run dev
tables:  find data/csv data/schemas.yaml tools/tables/spec.yaml | entr -r make tables
vale:    vale --output=line --watch paper/content/ paper/candidacy/
preview: cd tools/tmlr && node preview.mjs   # add after Gap 2 ships
```

---

## Gap 6 — No `data.dev.json` convention for figure sketch path

**What:** Iterating on a figure's data requires a round-trip through
`KD-GAT/export_paper_data.py` + `make data`. This is a >5 s loop for a visual
question that should have a <200 ms answer.

**Why it matters:** The convention designed in `AUTHORING_PLAN.md §3` has not
shipped. When figure-data iteration is slow, figures get iterated less, and you
discover layout/scale problems late.

**Fix — 3 changes, ~10 lines total:**

Each figure's data import (e.g. `interactive/src/figures/umap/App.svelte`):
```js
// One line change per figure
const data = (await import('./data.dev.json', { assert: { type: 'json' } })
  .catch(() => import('./data.json', { assert: { type: 'json' } }))).default;
```

`.gitignore`:
```
interactive/src/figures/**/data.dev.json
```

`pre-commit` hook (`.pre-commit-config.yaml` addition):
```yaml
- id: no-dev-data-staged
  name: Block staged data.dev.json
  language: system
  entry: bash -c 'git diff --cached --name-only | grep -q "data\.dev\.json" && echo "data.dev.json staged — remove before commit" && exit 1 || exit 0'
  pass_filenames: false
```

---

## Gap 7 — `build.mjs` has no `--watch` mode

**What:** `tools/tmlr/build.mjs` is a one-shot runner. The Distill preview (Gap 2)
and the `tables` watcher pattern both need a watch mode. Currently there is no path
from "save a `.md` file" to "Distill output updated" without re-running the full
`make tmlr`.

**Fix:** The watch wrapper in Gap 2 (`preview.mjs`) covers this. The existing
`build.mjs` needs one export change — extract the build logic into a callable
function so `preview.mjs` can invoke it:
```js
// build.mjs — add at bottom
export { build };   // existing logic wrapped in async function build(opts)

// preview.mjs — imports and calls it
import { build } from './build.mjs';
```
This is a 5-line refactor of `build.mjs`, no logic changes.

---

## What is explicitly not a gap

These items from `AUTHORING_STACK.md` are closed or not actionable now:

- `mdast-util-to-markdown` adoption — shipped, 1300 lines deleted, 29 tests.
- Vale + STYLE.md banlists — shipped (pending Gap 4 verification).
- `overmind` orchestrator — Makefile has the guard; verify `Procfile.dev` exists.
- LaTeX export — no venue demands it; not on the table.
- Self-hosted curve.space alternative — tabled post-candidacy.
- Migrating off MyST — cost exceeds remaining authoring cost on this paper.

---

## Execution order

| # | Gap | Effort | Unblocks |
|---|-----|--------|---------|
| 1 | Resolve `figures-static` drift | 1 h (option B) / half day (option A) | Honest PDF story |
| 4 | Fix Vale `TokenIgnores` | 15 min | Lint is trustworthy |
| 3 | Configure pandocciter + snippets | 30 min | Cite/ref friction daily |
| 5 | Verify / complete `Procfile.dev` | 15 min | Single dev entrypoint |
| 7 | Export `build` fn from `build.mjs` | 15 min | Enables Gap 2 |
| 2 | Ship Distill preview server | half day | L4 loop closes |
| 6 | `data.dev.json` sketch convention | 1 h | L2/L3 figure iteration |

Gaps 1, 4, 3, 5 can all be done in a single sitting before any writing session.
Gaps 7 + 2 are the one meaningful half-day investment. Gap 6 pays off only when
figure data iteration starts being the bottleneck.
