# `tools/site/` — Astro static site (MyST AST → flat HTML)

Self-hosting target for the candidacy build. Reads MyST's site-build artifacts
(`_build/site/config.json` + `_build/site/content/*.json`) and renders to flat
HTML in `_build/astro/`. Deploys to any static host (Cloudflare Pages, GitHub
Pages, Netlify) — no SPA, no Remix server.

## Architecture

```
_build/site/                       <-- produced by `myst build --site`
  config.json
  content/
    index.json                     <-- one per TOC entry, AST + frontmatter
    introduction.json
    ...

  ↓  tools/site/  (this directory)

_build/astro/                      <-- flat HTML output
  index.html
  introduction/index.html
  ...
```

## Files

- `astro.config.mjs` — points `outDir` at `_build/astro/`, `publicDir` at `_build/site/public/`.
- `src/lib/content.ts` — reads `_build/site/{config.json,content/*.json}`.
- `src/pages/[...slug].astro` — catch-all route; one page per content JSON.
- `src/components/MystNode.astro` — recursive mdast walker. One Astro component dispatches on `node.type` and recurses for children. Coverage is intentionally minimal (~20 node types). Add cases as needed.
- `src/layouts/Page.astro` — bare HTML shell. Loads `_static/custom.css` + `_static/story.css`, MathJax CDN.

## Build

```bash
make candidacy-site                # produces _build/site/ via mystmd
cd tools/site && bun install && bun run build
                                   # produces _build/astro/
```

## Deploy

Point your host at `_build/astro/`:

- **Cloudflare Pages**: build command `make candidacy-site && cd tools/site && bun install && bun run build`, output dir `_build/astro`.
- **GitHub Pages**: GitHub Action that runs the same and publishes `_build/astro`.
- **Netlify**: same shape.

Iframe figures (`_build/figures/*.html`) need to be copied into `_build/astro/figures/` in the build step so internal `<iframe src="figures/foo.html">` references resolve. Add to the build script when wiring CI.

## What this is *not*

- Not feature-complete. Math renders via MathJax (no static rendering). Citations are placeholder spans, not styled APA/numeric references. Cross-refs work for in-page anchors but don't carry a "Figure 3" template like the article-theme does. No search, no outline, no theme switcher.
- Not styled. The `_static/*.css` you already have applies, but article-theme's prose typography, grid utilities (`col-screen` etc.), and figure layouts won't be there until you port them or write new ones.
- Not a drop-in replacement for `curvenote deploy`. You lose `make sync` and the Curvenote web editor.

This is the floor. Iterate from here.

## Adding a node type

When you find a missing case in `MystNode.astro`, add a branch:

```astro
{t === 'newType' && <SomeWrapper>{children.map(c => <Astro.self node={c} />)}</SomeWrapper>}
```

If you don't know what shape a node has, dump one: `cat _build/site/content/<page>.json | jq '.. | objects | select(.type == "newType")'`.
