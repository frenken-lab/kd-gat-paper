# Build Gaps

Known shortfalls in the rendered builds (paper, candidacy site, candidacy PDF, TMLR submission, talk). Living document — each entry is observed in an artifact, not just code review. Resolve into a fix or a `Won't Fix` with reason.

`tools/tmlr/BUGS.md` covers TMLR-serializer-specific defects. This file covers everything else, plus rendered defects that span tooling.

---

## Gap 1 — Typst PDF: iframes render as blank boxes

**Where:** `_build/exports/candidacy-report.pdf`. Every interactive figure (`<iframe src="…">`) appears as an empty rectangle.

**Why:** Typst export has no JavaScript runtime, and we deleted the static-SVG export pipeline (`tools/pdf/extract-svg.js`, removed in 6c5866b). The iframe-to-image substitution that ran via Playwright is gone.

**Restoring it:** add a Playwright pre-pass that loads each `_build/figures/*.html` headless and saves an SVG/PNG alongside, then have the Typst template reference the static asset for PDF builds while keeping the iframe for web. Was tabled as out of scope for the candidacy oral.

**Status:** open. Acceptable for the oral — iframes render fine in the curve.space site that the committee will follow during the talk.

---

## Gap 2 — Talk page renders inside the prose column instead of full-bleed

**Where:** `paper/slides/story.md` rendered through `myst.candidacy.yml`. The page is in the candidacy site TOC under "Talk."

**Symptom:** the page rendered as a normal narrow-column MyST article with manual scrolling. The `+++ {"class": "slide-full"}` / `slide-dark` block separators produced wrappers but the wrappers sat inside the article-theme's body column, so panels were tall-and-narrow rather than full-bleed.

**Root cause (verified, not speculation):**
1. `+++ {"class": "..."}` *does* emit a `<div class="...">` wrapper. Confirmed by reading `myst-theme/packages/myst-to-react/src/block.tsx`:
   ```jsx
   const cn = classNames(className, node.class, { [node.data?.class]: typeof node.data?.class === 'string' });
   return <div id={identifier} className={cn}>...</div>;
   ```
2. `article-theme` has no `full_width` / `wide_content` / `hide_title_block` option. Documented site options per `template.yml`: `hide_toc`, `hide_footer_links`, `hide_outline`, `hide_authors`, `outline_maxdepth`, `numbered_references`, `style`, plus logo/analytics knobs. Nothing widens the prose column.
3. The article-theme renders page content inside `.article-grid`, a CSS Grid with named columns: `screen-start | page-start | body-start | ... | body-end | page-end | screen-end`. The default `body` column is the prose column; everything outside is empty grid space. Confirmed by inspecting the bundled CSS at `_build/templates/site/myst/article-theme/article-theme-main/public/build/_assets/app-*.css`.
4. **MyST themes ship `col-screen`, `col-page`, `col-body`, `col-gutter-*`, `col-margin*` utility classes specifically as the escape mechanism.** `.col-screen { grid-column: screen }` makes a child span the full grid. This is the documented pattern, not a hack.

**Fix applied (3eee3e7):**
- Added `col-screen` to every `+++` block class list in `story.md` (`col-screen slide-full`, `col-screen slide-full slide-dark`, `col-screen slide`).
- Removed the `width:100vw; margin-left:-50vw` viewport-escape hack from `_static/story.css` — the grid does it natively.

**Still open:**
- **Verify on a fresh build.** No candidacy site has been built locally since the change; the deployed curve.space site needs CI to redeploy. Open the talk page after deploy and confirm panels span the viewport.
- **Page chrome above the first slide.** `hide_title_block` is silently ignored by `article-theme` (not in its options). The page header + title block still eat vertical space above the first panel. Acceptable for a candidacy talk shown in a browser tab, but if you want a true fullscreen-on-load presentation, this needs a different theme route.
- **Keyboard navigation.** No arrow-key panel-advance. CSS scroll-snap covers wheel/touch but not keyboard. JS would have to live in a custom CSS-only build trick (`tabindex` + `:focus-within`) or get added via the `style` option's companion JS — `article-theme` has no plugin hook for per-page JS. Probably defer; a presenter can use Page Down / Space.

**First fix (3eee3e7) was wrong on curve.space.** Added `col-screen` to the `+++` blocks expecting article-theme's `.article-grid` named-column CSS to handle the escape. Verified after the fact that **curve.space does not use article-theme**: it's the "scms" renderer (`curvenote/curvenote@platform/scms`), Tailwind v4 + custom design tokens, no `.article-grid`, no `col-screen` rule. The class lands in the DOM as inert.

**Real fix:** restore the theme-agnostic viewport escape (`width: 100vw; position: relative; left: 50%; margin-left: -50vw`) on `.slide` / `.slide-full` in `_static/story.css`. Works in any container regardless of theme. `col-screen` stays in `story.md` as belt-and-suspenders for article-theme local preview but is inert on curve.space.

**Lesson recorded:** any styling intended for the deployed candidacy site must work without article-theme's bundled CSS. The local `myst start` preview (article-theme) is not a faithful proxy for the deploy target. Verify against the curve.space-rendered DOM, not the local preview.

**Second fix (90e0fa5) was also incomplete.** The viewport-escape CSS in `_static/story.css` is correct, but verifying against the deployed CDN showed the stylesheet was never reaching curve.space at all. `myst.candidacy.yml` declared `site.options.css: [...]` (plural list), which is **not a valid article-theme option**. Article-theme's `template.yml` only accepts `style: <file>` (singular). curvenote/scms filters `site.options` against the theme's option list and silently drops unknowns; the deployed `config.json` at `cdn.curvenote.com/<key>/config.json` showed only `{ hide_outline: true }`. The CSS files 404'd at `https://rob.curve.space/_static/*.css`.

**Third fix (this commit):**
- Concat `_static/custom.css` + `_static/story.css` → `_static/site.bundle.css` via a Makefile rule (depends on both sources, regenerates when either changes).
- Switch `myst.candidacy.yml` to `site.options.style: _static/site.bundle.css` (the documented singular option).
- `_static/site.bundle.css` is gitignored — it's a build artifact.

**How verification was done (recorded so the next time we don't speculate):**
1. `curl https://api.curvenote.com/routers/rob.curve.space` → `{ cdn, key }` for the deployed site.
2. `curl https://cdn.curvenote.com/<key>/config.json` → see what site options actually shipped.
3. `curl https://cdn.curvenote.com/<key>/content/<slug>.json` → check the AST for class metadata.
4. `curl -I https://rob.curve.space/_static/<file>.css` (returns 429 from Vercel bot challenge but the CDN equivalent at `cdn.curvenote.com/<key>/public/_static/<file>.css` returns plain HTTP) → check whether static files are hosted.

**Status:** fix applied locally, awaiting CI deploy + visual verification on curve.space.

---

## Conventions

- One entry per observed defect. Tie each to an artifact path so a reviewer can reproduce.
- Update `Status:` (`open` / `in progress` / `fixed in <commit>` / `won't fix — <reason>`) when state changes.
- Move resolved entries to a `## Resolved` section at the bottom rather than deleting, so the history of what changed survives.
