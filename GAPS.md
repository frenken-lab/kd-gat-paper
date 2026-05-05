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

## Gap 2 — Talk page is not a presentation

**Where:** `paper/slides/story.md` rendered through `myst.candidacy.yml`. The page is in the candidacy site TOC under "Talk."

**Symptom:** the page renders as a normal narrow-column MyST article with manual scrolling. The `+++ {"class": "slide-full"}` / `slide-dark` block separators do not produce panel-sized slides; content sits inside the article-theme's standard content column. Earlier sessions claimed this "worked" — it does not.

**What is in place today:**
- `_static/story.css` defines `.slide`, `.slide-full`, `.slide-dark`, `.stat` with `min-height: 90vh`, scroll-snap, dark-panel styling.
- `myst.candidacy.yml` loads the CSS via `site.options.css`.
- `paper/slides/story.md` uses `+++ {"class": "..."}` MyST cell separators, with site-frontmatter `hide_outline`, `hide_toc`, `hide_title_block` set.

**What is missing:**
1. **Container break-out.** `article-theme` wraps page content in a `max-width` article element. `.slide-full { min-height: 90vh }` is honored, but the panels are bounded by the article column's width — tall but narrow. The CSS needs `width: 100vw; margin-left: calc(50% - 50vw)` (or equivalent) on `.slide-full` to escape the article container. Verify by inspecting the rendered DOM: which ancestor is imposing the max-width, and can the slide selector reach past it.
2. **Class survives the AST.** Need to confirm `+++ {"class": "slide-full"}` actually emits a wrapper with `class="slide-full"` in the article-theme template. MyST cell metadata can drop on the floor depending on the theme. Check `_build/site/content/story.json` mdast for a `block` / `div` node carrying the class. (At time of writing, the cached `_build/site/` did not include `story.json` at all — the build that produced `_build/site/content/` predates the TOC entry. Run a fresh `make candidacy-site` first.)
3. **Keyboard navigation / no-scroll mode.** A real presentation page needs arrow-key panel-advance and a way to suppress the site chrome (header, footer, sidebar) entirely on this route. `hide_outline` / `hide_toc` thin the chrome but don't remove the article wrapper.

**Honest framing:** the slide CSS is necessary but not sufficient. Without (1) and (2) verified, the page can never render as a presentation regardless of how the panels are written. Earlier "this works" claims were unsupported.

**Next investigation step:** `make candidacy-site && bun run preview` (or open `_build/site/` in MyST start mode), inspect the rendered DOM for the `.slide-full` element and its ancestor chain, and report back which container is imposing the width constraint. Then fix CSS or switch the page to a non-article template.

**Status:** open, not started.

---

## Conventions

- One entry per observed defect. Tie each to an artifact path so a reviewer can reproduce.
- Update `Status:` (`open` / `in progress` / `fixed in <commit>` / `won't fix — <reason>`) when state changes.
- Move resolved entries to a `## Resolved` section at the bottom rather than deleting, so the history of what changed survives.
