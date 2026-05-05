# tools/validate

Semantic-layer validators (Layer 2 of the validation architecture in `AUTHORING_GAPS.md`). Plugins walk the pre-built mdast in `_build/site/content/*.json` and emit messages through `vfile-reporter`.

## Layout

```
tools/validate/
  lint.mjs                       Driver: loads AST, runs plugins, reports
  semantic/
    no-dangling-xrefs.mjs        Fails on crossReference nodes with resolved !== true
    citations-exist.mjs          Fails on cite keys missing from paper/references/*.bib;
                                 warns on unused bib entries
  package.json                   Bun deps (unist-util-visit, vfile, vfile-reporter)
```

## Running

```bash
make site                          # produce _build/site/content/*.json
make validate-semantic             # or: cd tools/validate && bun install && bun lint.mjs
```

Exit code is non-zero if any message is `fatal`.

## Adding a plugin

1. Drop a `.mjs` file in `semantic/`. It exports a default function that returns `(tree, file) => { ... }`.
2. Use `unist-util-visit` to walk the tree. Use `file.message(text, node)` to report. Set `msg.fatal = true` on hard failures, leave it falsy for warnings. Set `msg.ruleId` and `msg.source` so the reporter groups properly.
3. Wire it into `lint.mjs` (`plugins` array). Corpus-level plugins (e.g. unused-bib) take `{ isLastFile }` and flush on the final page.

## Why not `unified-engine`?

The engine's job is parser/stringifier orchestration over source files. Our input is already-parsed JSON, so we instantiate `vfile` + run visitors directly — fewer moving parts, same reporter. If a future plugin needs source-file globbing or `--watch`, revisit.
