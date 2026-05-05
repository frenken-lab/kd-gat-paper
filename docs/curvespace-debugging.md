# Debugging the curve.space deploy target

Reference for anyone (including future-you) trying to figure out why something works locally with `myst start` but breaks on `rob.curve.space`. Distilled from a multi-hour failure chain on 2026-05-05 trying to make the talk page render as a presentation.

## What curve.space actually is

`curve.space` is Curvenote's hosting product for MyST sites. It is **not** the same as article-theme.

- **Local `myst start`** runs the article-theme Remix app from `_build/templates/site/myst/article-theme/`. That theme has a documented option list in `template.yml`, ships its own bundled CSS (Tailwind 3 + a named-column CSS Grid `.article-grid` with `col-screen` / `col-page` / `col-body` utility classes), and renders pages inside `<article class="prose">`.
- **`curvenote deploy`** uploads the build artifacts (`_build/site/`) to Curvenote's CDN and points a router record (`api.curvenote.com/routers/<host>`) at it. The site is then rendered at runtime by Curvenote's own SPA, called **scms** (Site CMS). The scms renderer source is in [`curvenote/curvenote@platform/scms/`](https://github.com/curvenote/curvenote). It uses Tailwind v4 and custom design tokens, **has no `.article-grid`, has no `col-screen` rule.** It is a different renderer with a different DOM and a different CSS architecture.

The `site.template:` field in `myst.yml` controls only the local preview. `curvenote deploy` ignores it — curve.space is always rendered by scms.

That difference is the source of every failure in the chain below.

## How to verify what's actually deployed (the recipe)

Don't guess. Don't trust the local preview. Don't trust CI's "deploy succeeded" message. Inspect the actual CDN.

```bash
# 1. Resolve the host to a CDN key.
curl -s "https://api.curvenote.com/routers/<host>" | jq
#   { "id": "rob.curve.space", "cdn": "<key>", "date_modified": "..." }

# 2. Fetch the deployed site config.
KEY=<key>
curl -s "https://cdn.curvenote.com/$KEY/config.json" | jq

# 3. Fetch a specific page's AST.
curl -s "https://cdn.curvenote.com/$KEY/content/<slug>.json" | jq

# 4. Check whether a static asset (CSS, image, etc.) was uploaded.
curl -sI "https://cdn.curvenote.com/$KEY/public/<filename>"
#   200 = uploaded, 404 = not uploaded
```

Three things this lets you answer:
- **Did my config option survive deploy?** Look at `config.json#options`. Anything not in the deployed `options` is being filtered out.
- **Did my class metadata survive transport?** Walk the AST in `content/<slug>.json` and look for the node's `class` field.
- **Did my static asset get uploaded?** `curl -I https://cdn.curvenote.com/<key>/public/<file>`.

If a piece doesn't show up here, no amount of CSS tweaking on the local preview will fix it.

## What scms supports vs ignores (observed)

These are conclusions from inspecting deployed config + CDN responses, not from reading scms's full source.

| Config option | Survives deploy? | Notes |
|---|---|---|
| `site.options.hide_outline` | Yes | In deployed config. |
| `site.options.css: [list]` | **No** | Silently dropped. Not a documented option in any MyST theme. |
| `site.options.style: <file>` | **Partial** | Lands in `config.json#options.style` as a hashed URL. The CSS file IS uploaded to `<cdn>/public/<hash>.css`. **But scms appears not to emit a `<link rel="stylesheet">` tag for it** — only article-theme does. Verify in your browser's Network tab whether the file is actually requested. |
| `site.options.hide_title_block` | Unknown | Not in `article-theme/template.yml` either; documented for `book-theme`. |
| `site.template: article-theme` | Ignored on deploy | Only affects `myst start` local preview. curve.space is always rendered by scms. |

| Block-level metadata | Survives transport? | Notes |
|---|---|---|
| `+++ {"class": "..."}` | **Yes** | The class string lands in the AST as `node.class`. Verified via `content/<slug>.json`. |
| Whether the class actually renders as `<div class="...">` | **Renderer-dependent** | article-theme does (per `myst-to-react/block.tsx`); scms behavior unconfirmed. |

## The failure chain (so we don't repeat it)

Attempting to make the talk page (`paper/slides/story.md`) render with full-bleed slide panels on rob.curve.space:

1. **First fix.** Added a CSS escape hack (`width: 100vw; margin-left: -50vw`) to `_static/story.css`, scoped to `.slide-full`. Deployed. Page rendered the same.
2. **Second fix.** Switched to `col-screen` utility class on `+++` blocks because article-theme's `template.yml` documented it as the proper grid escape. Verified the class survives in the AST. Deployed. Page rendered the same.

   *What was actually wrong:* `col-screen` is article-theme-specific. curve.space is scms — no `.article-grid`, no `col-screen` rule. The class lands as an inert string. Restored the viewport hack.

3. **Third fix.** Restored the viewport hack but discovered via CDN inspection that the CSS files were never reaching curve.space at all. The `css: [list]` option in `myst.candidacy.yml#site.options` was being filtered out — it's not a documented option in any theme.

   Switched to the documented `style: <file>` (singular) and added a Makefile rule to concat both source CSS files into one bundle. Deployed. Page rendered the same.

4. **Fourth fix.** CDN inspection showed `style:` reached the deployed config but the file 404'd. CI deploy step calls `curvenote deploy` directly, bypassing `make`, so the bundle file the Makefile rule was supposed to create never got created. Inlined the concat into the deploy step. Deployed.

   CDN now showed: `options.style: /<hash>.css` ✓, file uploaded at `<cdn>/public/<hash>.css` ✓ (200), CSS content correct ✓. Page rendered the same.

5. **Open question.** Despite the bundle being correctly uploaded and referenced in the deployed config, the rendered page on curve.space still looked unchanged. The remaining suspicion is that **scms doesn't read `options.style` to emit a `<link>` tag** — that work is article-theme's responsibility, and scms ignores the field. Verification path: browser Network tab. If the bundle URL is never requested, scms doesn't support custom CSS injection through the theme options at all.

Each layer revealed a new gate. The right way to debug this is to inspect the CDN config first, not last.

## Lessons

- **Local preview ≠ deploy target.** `myst start` uses article-theme; `curvenote deploy` uses scms. The two have different CSS, different DOM, and different supported config options. A fix verified only against `myst start` proves nothing about curve.space.
- **Theme options are filtered against the theme's `template.yml`.** Unknown keys are silently dropped on deploy. There is no warning in CI logs.
- **`curvenote deploy` does not run `make`.** Anything the Makefile generates as a build step (concat'd CSS, generated configs, etc.) must be replicated in the CI workflow's deploy job, or the file simply won't exist when curvenote scans `_build/site/` for upload.
- **The CDN is the source of truth.** When something works locally and "doesn't work" on curve.space, the first move is `curl https://api.curvenote.com/routers/<host>` followed by `curl https://cdn.curvenote.com/<key>/config.json`.
- **Empty CI deploy logs are not "deploy succeeded".** A 404 on a configured asset is a silent failure of the option, not an error. CI only logs `🚀 Website successfully deployed` after the AST upload, regardless of whether downstream consumers (scms, the browser) can actually use what was uploaded.

## When to escape curve.space

If you need anything beyond what scms exposes — custom CSS that actually loads, presentation layouts, custom routes, JS bundles, full-bleed pages, anything that fights scms's article-prose layout — the cheapest exit is to deploy a static site to a host that serves flat files (Cloudflare Pages, GitHub Pages, Netlify). The `tools/site/` directory has a minimal Astro scaffold for exactly this case: it consumes the same `_build/site/content/*.json` AST artifacts and emits flat HTML deployable anywhere. See `tools/site/README.md`.

Trade-off: you lose `make sync` / the Curvenote web editor. If nobody actually uses the editor, no loss.
