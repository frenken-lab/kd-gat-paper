# curve.space Custom CSS — Investigation Plan

The premise of the original plan (article-theme `site.options` is the
right surface to tune) was incomplete. The deploy pipeline puts
`curvenote deploy` between `myst.yml` and rob.curve.space, and that
program's config-reading behavior is what determines whether custom CSS
actually lands on the deployed site. This document tracks what is
verified, what is unknown, and what to read next.

## What deploys to rob.curve.space

From `.github/workflows/paper.yml:144-169` (`candidacy-site` job):

```yaml
- run: |
    cp myst.yml myst.yml.paper
    cp myst.candidacy.yml myst.yml          # 1. swap config
    trap 'mv myst.yml.paper myst.yml' EXIT
    python tools/tables/build.py
    cat _static/custom.css _static/story.css > _static/site.bundle.css   # 2. build CSS bundle
    bun install -g mystmd@1.8.3
    bunx -y curvenote@0.14.3 deploy --yes   # 3. CURVENOTE CLI uploads
```

`curvenote deploy` — not `myst build` — is the program that uploads to
curve.space. Whatever validation/transform it does is the gate.

## Verified facts

- Upstream `themes/article/template.yml` declares only `style: file`
  (verified at
  `https://raw.githubusercontent.com/jupyter-book/myst-theme/main/themes/article/template.yml`).
- mystmd.org docs list only `style` as the site-level CSS hook for both
  book-theme and article-theme.
- `myst build --site` accepts `style: _static/custom.css` without
  validation errors (tested locally 2026-05-05).
- `myst.yml:53` (paper config) had `css: [- _static/custom.css]` — an
  invalid key for article-theme; replaced with `style:
  _static/custom.css` (commit pending). This affects the GH Pages
  paper build, *not* curve.space.
- Curvenote's official "Deploying from GitHub" doc
  (`curvenote/docs/content/publish/deploying-myst-from-github.md`)
  instructs users to commit a **`curvenote.yml`** at the repo root.
  This repo has **no `curvenote.yml`** — only `myst.yml` and
  `myst.candidacy.yml`.

## Open questions (what I cannot answer without reading more)

1. Does `curvenote deploy` (v0.14.3) read `site.options.style` from
   `myst.yml`, or does it expect a separate `curvenote.yml` for
   branding / styling?
2. If `myst.yml` is sufficient, does `curvenote deploy` actually upload
   `_static/site.bundle.css` as part of its static-asset bundle? Or
   does it require the file under a specific path (e.g. `public/`,
   `assets/`)?
3. Is the `curvenote.yml` referenced in the deploy doc still required
   in current curvenote (0.14.x), deprecated, or optional?

## Next steps (in order)

1. **Read the `curvenote.yml` config reference** on docs.curvenote.com
   (the deploy-from-github page does not specify CSS handling — it just
   names the file).
2. **Read curvenote.com/docs/web/themes** and "Logo & Branding" — these
   pages were surfaced by search and may name the actual customization
   surface curvenote uses.
3. **Inspect `curvenote/action-deploy@v1` source** to see what
   `curvenote deploy` does with site config and static assets.
4. **Verify on the live site**: open rob.curve.space in DevTools, check
   whether `_static/site.bundle.css` (or any URL containing those
   styles) is in the loaded resources. If yes, the current setup works
   and the original investigation was looking for a problem that
   doesn't exist. If no, follow the missing config trail.

## Action items

- [ ] Decide which Curvenote doc page to read next (see Next steps).
- [ ] DevTools check on rob.curve.space — is `site.bundle.css`
      actually loading?
- [ ] If a `curvenote.yml` is required, draft one based on the doc
      reference and add a CI step that uses it instead of (or
      alongside) the `myst.yml` swap.
- [ ] Keep the `myst.yml` `css:` → `style:` fix; it is correct for the
      GH Pages paper build regardless of curve.space outcome.

## What is *not* the problem (rule out)

- iframe URL strategy — already correct (absolute GH Pages URLs in
  content; rewritten for anonymous TMLR submission via
  `tools/tmlr/build.mjs:87`). See CLAUDE.md.
- article-theme `site.options` surface — verified complete from
  upstream `template.yml`; nothing missing on that side.
- The `_static/site.bundle.css` build step — already correct in CI
  (`paper.yml:167`), confirmed before the curvenote deploy call.
