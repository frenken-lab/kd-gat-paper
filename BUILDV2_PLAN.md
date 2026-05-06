# Editor: primitives and composition (buildv2.mjs — fresh rewrite)

## Context

Pushing the candidacy as ONE Content block via `fromMarkdown(body, 'full')` drops tables/iframes/figures/cites — empirical: 7 empty `<table>` shells, 0 `<iframe>`, 0 `<img>`, 0 cite tags. The editor is composition-based: `Article.version.children` is an ORDERED ARRAY of references to other blocks. Splitting source into typed primitives, uploading each to its own block, and composing via `children` is the right shape.

## Pre-step: tag MyST source files ✓ DONE

Add `+++` block separators with JSON metadata before non-prose atoms in the
candidacy source files. MyST `+++` syntax: `mystjs` parses these as
`blockBreak` nodes with `meta` = the raw string; `nestBlocks` then wraps
all content between breaks into `block` nodes with `block.meta`. Tags are
arbitrary — `{"type": "table"}`, `{"type": "figure"}`, `{"type": "iframe"}`.
Untagged blocks default to prose.

This is a one-time authoring pass on `paper/**/*.md`. It replaces all
heuristic detection in the build script with explicit intent in the source.
After this pass, atom detection is `JSON.parse(block.meta || '{}').type`.

**Completed.** All candidacy source files tagged. Files with atoms:
`results.md` (2 tables, 1 iframe), `explainability.md` (4 iframes),
`ablation.md` (1 iframe, 1 table), `introduction.md` (2 tables, 1 figure),
`proposed-research.md` (1 iframe, 6 tables), `federated-optimization.md`
(1 iframe, 1 table), `physics-dynamics.md` (1 table),
`interpretability-calibration.md` (5 tables), `background.md` (1 figure),
`related-work.md` (1 table), `candidacy/ablation.md` (1 table),
`story.md` (8 iframes), `appendix/figures.md` (12 iframes).
Files with no atoms (prose/math/wrappers only): `reinforcement-learning.md`,
`appendix/architecture.md`, `methodology.md`, `experiments.md`,
`candidacy/background.md`, `candidacy/appendix.md`,
`proposed-combined.md`, `appendix-combined.md`, `current-framework.md`,
`conclusion.md`.

## Pipeline (`tools/curvenote/buildv2.mjs`)

```
1. Auth.
2. Read TOC, expand {include} preferring .gfm.md. Assemble markdown body.
   Global sanitization on the full assembled body: strip %%, MyST anchors,
   HTML comments, cross-ref links, admonition title rewriting.
   Do NOT strip +++ — they are structure, not noise.
3. Parse blocks: tokensToMyst(assembledMd) with nestBlocks:true →
   walk root.children (all are block nodes). For each:
     meta = JSON.parse(block.meta || '{}')
     dispatch by meta.type → atom:
       "table"  → {type:'table',  gfm: serialize block children as GFM}
       "figure" → {type:'figure', url:'...', caption:'...'}
       "iframe" → {type:'iframe', url:'...', caption:'...'}
       undefined/other → {type:'prose', ast: block.children}
   No line-scanning, no fence-depth tracking, no pattern matching.
4. Bib pre-pass: walk prose atom ASTs for inlineCode nodes whose value
   matches /^cite(?::[a-z]+)?:.+/ (MyST cite role form in mdast); dedup keys.
   Regex fallback on serialized prose if needed:
   /\{cite(?::[a-z]+)?\}`([^`]+)`/g
5. Reference upload: for each cited key, find-or-create Reference block
   by name=key (idempotent). Build map: key → oxaRef.
6. For each atom, dispatch to handler → BlockRef.
   Block name = `candidacy--{section-slug}` (slug derived from TOC title or
   first heading; kebab-case, ASCII-only). Name is set on POST /blocks so
   curvenote pull can map blocks back to source files via stable OXA refs.
   Handlers:
     prose  → fromMarkdown(sanitized, 'full') → walk PM JSON, replace any
              inlineCode cite-role nodes with native cite PM nodes:
              {type:'cite', attrs:{key:oxaRef, kind:'cite', label:null,
               text:null, title:null}, content:[{type:'text',text:''}]}
              → pushContent(name)
     table  → gfmTableToPM(gfm) → pushContent(name)
     figure → fetchBytes(url) → create Content block with PM:
              {type:'figure', attrs:{align:'center',...},
               content:[{type:'image',attrs:{src:url,width:null}},
                        {type:'figcaption',content:[...caption...]}]}
              → pushContent(name)
     iframe → {type:'iframe', attrs:{src:url, align:'center', width:70}}
              (width is numeric, not string — schema default is integer)
              → pushContent(name)
7. Article composition: POST /blocks/<P>/<articleId>/versions {order, children}
8. Wire editable Article default_draft (create post-publish; bind as default_draft).
9. Cleanup: delete stale Article/Content blocks; keep References/Images.
```

## What needs block declarations

| Source primitive | Block kind | Purpose |
|---|---|---|
| Prose chunk | Content (PM JSON) | Article child |
| GFM table | Content (PM table JSON, hand-built) | Article child |
| Static figure | Image (uploaded SVG bytes) | Article child |
| Iframe | Content (PM iframe node) | Article child |
| Cited bib entry | Reference (one per key) | NOT a child; referenced from cite PM nodes via oxaRef |

(Bibliography is not a block kind; verified `~/refs/curvenote/packages/blocks/src/blocks/types/kind.ts:1-10`.)

## Critical files

**New (written from scratch):**
- `tools/curvenote/buildv2.mjs` — ~250 LOC target. `build.mjs` stays untouched as reference.
- `tools/curvenote/package.json` — add `@retorquere/bibtex-parser`.

**Modified (tagging pass):**
- `paper/**/*.md` (candidacy sources only) — add `+++ {"type": "..."}` markers before non-prose atoms. MyST site build is unaffected; `+++` is valid MyST and renders as a block break with no visual output.

**Untouched:**
- `paper/references/*.bib`.
- `tools/tables/build.py` (`.gfm.md` already emitted).

## Design patterns

Separate pure transforms from I/O. Nothing in the pure layer touches the network or filesystem.

**Pure layer** (no `await`, no side effects):
- `assembleMarkdown(toc) → string` — reads TOC, expands includes, demotes headings, concatenates
- `sanitize(md) → string` — strips %%, anchors, HTML comments, cross-refs, rewrites admonition titles; preserves `+++`
- `parseBlocks(md) → Atom[]` — `tokensToMyst(md, {nestBlocks:true})` → walk `root.children`, dispatch by `JSON.parse(block.meta).type`; no line-scanning
- `bibKeys(atoms) → string[]` — walks prose atom mdast for cite roles; deduplicates
- `atomToPM(atom, citeMap) → PMDoc` — dispatches to per-type PM builder; pure data-in data-out

**Effectful layer** (all network calls):
- `auth(token) → headers` — POST /login → session JWT
- `findOrCreate(kind, name) → BlockRef` — idempotent block lookup/create by name
- `pushContent(name, pmDoc, headers) → BlockRef` — named Content block + replace step + merge + editable draft
- `pushRef(key, headers) → oxaRef` — find-or-create Reference block by name=key → `oxa:PROJECT/BLOCK`
- `composeArticle(articleId, refs, headers)` — POST Article version + wire default_draft
- `cleanup(keep, headers)` — delete stale Article/Content blocks; keep References/Images

**Orchestrator** (`main`): calls pure layer to build atoms, then drives effectful layer in order. No business logic in `main` — just sequencing.

`gfmTableToPM`: split lines, parse `| a | b | c |` into header + rows, emit
`table > table_row > table_header/table_cell` tree. Cell content MUST be
wrapped in a `paragraph` node (schema content model is `blockOrEquation`, not
inline). Cell attrs: `{align:null, colspan:1, rowspan:1, background:null}`.
Bold text via `marks:[{type:'strong'}]` on text nodes inside the paragraph.

## PM node specs (verified from `@curvenote/schema` src)

Source: `github.com/curvenote/editor/tree/main/packages/schema/src/nodes/`

| Node | Key attrs | Notes |
|---|---|---|
| `cite` | `key` (oxaRef), `kind` ('cite'\|'fig'\|'eq'\|'table'\|'sec'\|'code'), `label`, `text`, `title` | Use for bib refs; `key` = `oxa:P/B` not raw bibtex key |
| `iframe` | `src`, `align` (default 'center'), `width` (**integer**, not string) | `build.mjs` bug: passes `'100%'` string — must be numeric |
| `figure` | `id`, `numbered`, `align` (default 'center'), `multipage`, `landscape`, `fullpage` | `isolating:true`; content = `insideFigure` (image + figcaption) |
| `image` | `src`, `alt`, `title`, `align`, `width` | Most attrs deprecated; prefer `figure > image` |
| `table` | — | Contains `table_row` nodes |
| `table_row` | — | Contains `table_header` \| `table_cell` |
| `table_header` / `table_cell` | `align`, `colspan` (1), `rowspan` (1), `background` (null) | Content model: `blockOrEquation` — must wrap text in `paragraph` |

Schema preset: always use `'full'` (includes all nodes above). `'paragraph'` is inline-only; `'comment'` excludes reactive nodes.

## Block naming and sync

Every Content block is created with `name: 'candidacy--{section-slug}'`.
Slug = TOC title or first heading, lowercased, spaces→hyphens, non-ASCII stripped.
Examples: `candidacy--introduction`, `candidacy--related-work`, `candidacy--architecture`.

This makes `curvenote pull` / `make sync` round-trip deterministic: the CLI
fetches blocks by OXA ref (`oxa:PROJECT/BLOCK`) and writes each to a local
file. Named blocks survive re-runs (idempotent via `findOrCreate(kind, name)`).
Reference blocks already use `name=bibkey` — same pattern.

Pull direction already works via CLI (`sync/pull/markdown.ts` calls
`Block.get()` + `Version.get()` + `toMyst()` on `api.curvenote.com`).
Push direction is `buildv2.mjs`. Together they form complete bidirectional sync.

## Verification

After push:

1. Console output:
   - `Reference: 155 (created N, reused M)`
   - `Image: 2 created`
   - `Atoms: prose=N, table=13, figure=2, iframe=28`
   - `Article v(K+1) with N+2 children`

2. `bun tools/curvenote/inspect.mjs`:
   - Article: 1, Content: ≈30-50, Image: 2, Reference: 155
   - HTML tag histogram in cv.content (across all Content children):
     - `<td>` > 0 (currently 0)
     - `<iframe>` = 28 (currently 0)
     - `<img>` ≥ 2 (currently 0)
     - cite-form elements > 0

3. Browser eyeball at `editor.curvenote.com` (user-side verification): tables show cells, figures load, iframes either render or fall back visibly, citations resolve.

## Risks

- **Image block POST shape unverified.** Probe live with one upload first; iterate.
- **Iframe sandbox in editor untested.** If the editor blocks cross-origin iframes, swap iframe handler to emit a paragraph link. Fall-forward, no re-architecture.
- **Reference block POST shape unverified.** Same approach: single test entry first.

## Effort

Single session. ~3-4 focused hours including empirical probing on the three unverified APIs.

## CLI deployment question (resolved)

Block tags exist (`block.meta` arbitrary JSON string, confirmed in `mystjs/dist/index.esm.js:36858`). They do not collapse deployment to the CLI. The curvenote CLI's `work push` targets `scms.curvenote.com` (Work/CDN model — publication snapshot). The editor's `Article.children` array lives on `api.curvenote.com` — a different store. No evidence the CLI reads block metadata to produce separate Article children. `buildv2.mjs` remains necessary for the editor surface.

Block tags DO eliminate the lexer: atom type is explicit in the source, so step 3 is an AST walk with a switch, not a heuristic scanner.

## Open question

None — proceed.
