# Authoring Tooling Gaps

## What's being built

The repo is a paper build system: typed sources flow through an AST into multi-shape artifacts.

```
SOURCES                 AST                  ARTIFACTS
data/csv/        →      _build/site/    →    _build/submission/
data/*.bib              content/*.json       _build/site/
images/                 (mdast)              _build/exports/
paper/**/*.md
              ↑                       ↑
   semantic contract        output contract
   (refs resolve,           (artifact shape,
    cites back to bib,       anonymization,
    labels unique,           paths bundled,
    math parses)             no leaked dev URLs)
       ↑
input contract
(schemas.yaml ✓ done
 bib structure ✓ done
 asset hygiene ✗
 alt-text ✗)
```

Three layers, three contracts. Every gap below is a missing validator at one of them. The semantic layer is the [unified.js](https://unifiedjs.com/) plugin pipeline — mystmd already produces mdast, so plugins drop in unchanged. [`remark-lint`](https://github.com/remarkjs/remark-lint) is the canonical example: dozens of validators, one shape. Not invented here.

The shape of a unified validator:

```js
import { visit } from 'unist-util-visit';
export default function noDanglingRefs() {
  return (tree, file) => {
    const defs = new Set();
    visit(tree, (node) => { if (node.identifier) defs.add(node.identifier); });
    visit(tree, 'crossReference', (node) => {
      if (!defs.has(node.identifier)) {
        file.message(`Dangling reference: ${node.identifier}`, node);
      }
    });
  };
}
```

A driver loads the AST JSON, runs the plugin chain, and prints with `vfile-reporter`:

```js
import { unified } from 'unified';
import { reporter } from 'vfile-reporter';
const file = await unified().use(noDanglingRefs).use(/* ... */).process(astJson);
console.log(reporter(file));
process.exit(file.messages.some(m => m.fatal) ? 1 : 0);
```

Already present at the input layer: `validate_data.py` (schemas.yaml) and `validate_bib.py` (BibTeX structure). The artifact layer already has `tools/tmlr/build.test.mjs` for handler-level snapshot tests via `bun:test`.

---

## Layer 1 — Input contract

**Guarantees** (if all validators pass): every CSV matches its schema, every .bib entry has required fields and unique keys, every referenced asset exists on disk, every figure has alt-text.

**Existing**: `tools/validate_data.py` (Pandera-style schema check against `data/schemas.yaml`); `tools/validate_bib.py` (duplicates, required fields, DOI presence).

### Missing — Asset hygiene

Set diff between files in `images/` and image refs in `paper/`. Unreferenced files warn; missing-from-disk fails. Python with pathlib + grep over content; lives next to `validate_data.py`.

### Missing — Alt-text presence

Walk `:::{figure}` blocks, flag any without `:alt:` or `alt=`. TMLR cares; accessibility cares. Python over source files, or migrate to a unified plugin against the AST once that layer exists.

---

## Layer 2 — Semantic contract

**Guarantees**: cross-references resolve to defined targets, citations match bib keys, labels are unique, math parses, links don't rot.

**Existing**: nothing. mystmd warns on dangling refs but doesn't fail; warnings drown in 200-line build logs.

This is where every bug from this session and from `tools/tmlr/BUGS.md` lived. Stand this layer up first; once the driver and `vfile-reporter` are wired, plugins 2-N are nearly free.

### Missing — Cross-reference integrity

Walk `_build/site/content/*.json`, collect identifiers defined by `target`/`label`/heading/figure/table/math nodes, set-diff against identifiers referenced by `crossReference` and `link` (when `url` matches `#foo`). Fail on missing target; warn on never-referenced labels. Catches the dead "Figure 3" / "Eq. (5)" text class from BUGS.md (B2, B3). Unified plugin, `unist-util-visit`, `file.message`.

### Missing — Citation ↔ bib reconciliation

Two-way diff: `[@key]` citations in AST vs entries in `paper/references/*.bib`. Missing key fails; unused entry warns. Reading citations from the AST avoids the false positives a grep over source produces (email addresses, code snippets). Unified plugin paired with a tiny bibtexparser load.

### Missing — Math syntax validation

`chktex` against the LaTeX inside `$...$` and `$$...$$`. Catches unmatched braces, typos like `\eqaution`, missing `\end`. Today these survive as raw source rendered by MathJax. Either run chktex on `_build/submission/submission.md` directly, or extract math nodes via a unified plugin and pipe them through chktex per-block.

### Missing — Link checker

Lychee over source + built site. Bib DOIs/URLs, GH-Pages iframe sources after path renames, internal anchor refs. Nightly job, not per-PR — external rot is noisy. Open issues on regression, don't gate.

### Missing — Heading & structure linting

No skipped heading levels, max section length, required-section presence per page kind. Unified plugin (or borrow `remark-lint-no-heading-content-indent` and friends; the ecosystem already has most of these). Mostly matters when collaborators write sections.

---

## Layer 3 — Output contract

**Guarantees**: every source `:::{table}` produced a `<figure id="tbl-*">`; every labeled `{math}` produced an anchor; cross-refs render as `\eqref` or markdown links; no `:::` boundaries leaked; iframe paths bundled under `assets/html/submission/`; no `frenken`/`osu`/`OSU` strings in anonymous mode.

**Existing**: `tools/tmlr/build.test.mjs` (29 tests against synthetic ASTs). Catches handler-shape regressions but never inspects a real built `submission.md`.

### Missing — Submission snapshot tests

Parse `_build/submission/submission.md` after `make tmlr`, assert structural invariants from BUGS.md: source-table count matches built `<figure id="tbl-*">` count, labeled math has `<a id="eq-*">`, equation refs emit `\eqref`, no raw `:::`, all iframe paths relative. `bun:test` next to `build.test.mjs`. Requires a built submission, so CI runs `make tmlr` before this job.

### Missing — Anonymization & format compliance

No-leakage scan (`frenken`, `osu`, `OSU`) in anon mode, required sections present (ethics statement etc.), page-count estimate. `bun:test` over the built file. Run as `make tmlr-check` before submission deadlines.

### Missing — Visual regression for figures

Playwright screenshots of every `_build/figures/*.html` fed real `data.json`, pixelmatch against committed reference PNGs. Catches styles.yml changes and SveltePlot version bumps that silently corrupt rendering. Heavier than the rest; defer until a figure regression bites.

---

## Cross-cutting

### MyST-aware formatter

Pre-commit script that normalizes directive boundaries (`:::` spacing, frontmatter key ordering, trailing whitespace). Prettier mangles MyST; dprint same. Stay focused on visible directive shape — don't try to be Prettier.

### Spelling (cspell)

Technical-dictionary at `.cspell.json` (CAN, GAT, VGAE, ECU, KD, ...). Faster and more focused than Vale's prose lint.

### Dependency drift surveillance

Renovate or Dependabot across `interactive/package.json`, `tools/tmlr/package.json`, `pyproject.toml`, plus the mystmd version pin. mystmd AST shape changes break the TMLR serializer; isolate the version bump from the PR that breaks builds.

### AST inspector

`bun tools/inspect.mjs <page-stem> [--type=math]` pretty-prints the mdast for one page. Same observability layer as the validators — uses `unist-util-visit` with the same shape. This session's bug investigation was a hand-rolled walk of `_build/site/content/*.json`; pays for itself the second time.

---

## Driver

Two layers of driver, both off-the-shelf.

**Top-level rollup**: `make`. One target per layer plus a meta-target:

```make
validate-inputs:    # Python: existing validate_data + validate_bib + new asset/alt-text
validate-semantic:  # unified-engine via npx unified-args (or a 30-line wrapper)
validate-artifacts: # bun test tools/validate/artifacts/
validate: validate-inputs validate-semantic validate-artifacts
```

**Semantic-layer driver**: [`unified-engine`](https://github.com/unifiedjs/unified-engine) — the same engine that powers `remark-cli`, `retext-cli`, `rehype-cli`. Don't hand-roll. It handles file globbing, config discovery, severity levels, parallel processing, `vfile-reporter` integration, and exit codes. With [`unified-args`](https://github.com/unifiedjs/unified-args) on top, you also get `--quiet`, `--report=json`, `--watch` for free. A complete driver:

```js
import { engine } from 'unified-engine';
import { unified } from 'unified';
import noDanglingRefs from './semantic/no-dangling-refs.mjs';
import citationsExist from './semantic/citations-exist.mjs';

engine({
  processor: unified(),
  files: ['_build/site/content/*.json'],
  pluginPrefix: 'myst-validate',
  defaultConfig: { plugins: [noDanglingRefs, citationsExist] },
}, (err, code) => process.exit(code));
```

**Cross-language local-dev orchestration**: `pre-commit` (already wired via `make pre-commit-install`). Run all three layer-targets via `pre-commit run -a` so contributors get the same validators on commit that CI gates on. Two surfaces, same Make targets underneath.

CI gates `validate` between `figures` and `tmlr`. The semantic layer requires `_build/site/` to exist (depends on `make site`); the artifact layer requires `_build/submission/` (depends on `make tmlr`).

---

## Implied directory layout

New work lands under `tools/validate/`. Existing `tools/*.py` stays put for now — this doc is gaps, not migrations.

```
tools/
  generate/      (eventual rename: pull_data, build_tables, etc.)
  validate/
    inputs/      (Python: assets, alt-text — joins validate_data.py / validate_bib.py)
    semantic/    (Bun: unified plugins — refs, cites, labels, math, links, structure)
    artifacts/   (Bun test: submission shape, anonymization)
    lint.mjs     (semantic-layer driver: unified().use(...).process(file))
  inspect/       (AST debugger — same unified ecosystem)
  lib/           (shared utilities)
```

---

## What to actually do first

Stand up the semantic layer: the `lint.mjs` driver plus two or three plugins (cross-reference integrity, citation reconciliation, math syntax). Reasons:

1. Every bug this session — and most of `tools/tmlr/BUGS.md` — lived in this layer. Highest catch rate per validator.
2. The driver, AST loading, and `vfile-reporter` wiring are shared infrastructure. Once they exist, each subsequent plugin is a visitor + a few `file.message` calls.
3. The input layer already works; extending it is mechanical. The artifact layer needs a built submission, which adds CI plumbing before any value lands.

The MyST LSP, a more robust MyST parser, and a first-class MyST linter are larger separate efforts (the LSP especially). The validators above buy most of the LSP's CI-time value without the editor-integration cost.
