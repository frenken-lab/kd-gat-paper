# tools/validate

Validators for the paper build, organized by the contract they enforce. See `AUTHORING.md` for the architectural rationale.

## Layout

```
tools/validate/
  validate_inputs.py              Layer 1 driver — CSV/JSON + BibTeX input contract
  semantic/                      Layer 2 — semantic contract over the mdast (Bun, unist-util-visit)
    no-dangling-xrefs.mjs          Fails on crossReference nodes with resolved !== true
    citations-exist.mjs            Fails on cite keys missing from paper/references/*.bib;
                                   warns on unused bib entries
  lint.mjs                       Layer 2 driver: loads AST, runs plugins, reports
  package.json                   Bun deps (unist-util-visit, vfile, vfile-reporter)
```

`make validate` runs both layers. Layer-3 (artifact contract — anonymization, submission shape) lives in `tools/tmlr/build.test.mjs` for now.

## Running

```bash
make validate                      # all layers
make validate-inputs               # Layer 1 only (Python)
make validate-semantic             # Layer 2 only (depends on built mdast JSON from the site build)
```

Exit code is non-zero if any message is `fatal`.

## Adding a plugin

1. Drop a `.mjs` file in `semantic/`. It exports a default function that returns `(tree, file) => { ... }`.
2. Use `unist-util-visit` to walk the tree. Use `file.message(text, node)` to report. Set `msg.fatal = true` on hard failures, leave it falsy for warnings. Set `msg.ruleId` and `msg.source` so the reporter groups properly.
3. Wire it into `lint.mjs` (`plugins` array). Corpus-level plugins (e.g. unused-bib) take `{ isLastFile }` and flush on the final page.

## Why not `unified-engine`?

The engine's job is parser/stringifier orchestration over source files. Our input is already-parsed JSON, so we instantiate `vfile` + run visitors directly — fewer moving parts, same reporter. If a future plugin needs source-file globbing or `--watch`, revisit.
