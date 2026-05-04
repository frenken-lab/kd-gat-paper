# Append: Presentation Authoring

## The honest answer: MyST has no native web-slide target

MyST's presentation story today has two paths, neither of which is SliDev:

| Path | Mechanism | Output | State |
|------|-----------|--------|-------|
| Beamer | `+++` block syntax → LaTeX frames | PDF slides | Stable |
| "web slides" | Does not exist natively | — | No roadmap item |

The `+++` block delimiter is the MyST primitive for slides. In a Beamer export,
each `+++`-delimited block becomes a `\begin{frame}...\end{frame}`. In the web
renderer that same block is just a content block with no slide semantics — there
is no Reveal.js or SliDev renderer in the MyST engine.

SliDev is therefore not replaceable by MyST today for a full-screen presenter
deck. That is the correct honest baseline.

---

## But the question you actually asked is more interesting

"Half presentation, half webpage" is a real pattern and MyST can do it — just
not with a slide-mode renderer. The pattern is: a **scrollytelling page** that
reads like a presentation but lives in a browser, shares source with the paper,
and embeds interactive figures.

MyST gives you four primitives to build this:

### 1. Content blocks + CSS classes (`+++`)

The `+++` block delimiter attaches arbitrary metadata and CSS classes to sections
of a page. Combined with the custom CSS hook in `myst.yml`:

```markdown
+++ {"class": "slide-frame"}
### Knowledge Distillation on Graphs

Key result: KD-GAT closes 94% of the GNN-to-GAT performance gap
at 60% of the parameter count.

+++ {"class": "slide-frame slide-figure"}
```{figure} ../_build/figures/umap.html
:label: fig-umap-slide
```
+++
```

`_static/slides.css`:
```css
/* Full-viewport sections on scroll */
.slide-frame {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 3rem;
  border-bottom: 1px solid var(--color-border-tertiary);
}
.slide-figure iframe {
  width: 100%;
  height: 60vh;
}
```

`myst.yml`:
```yaml
site:
  options:
    style: ./_static/slides.css
  hide_outline: true
  hide_toc: true
```

This gives you a scrollable page where each `+++` block is a viewport-height
section — the experience of swiping through slides, but it's a normal URL you
can link to, embed, and it shares every figure, citation, and cross-reference
with the paper.

### 2. Landing page blocks

MyST's experimental landing page blocks (`split-image`, `justified`, `centered`)
are designed for exactly a "title card + figure + callout" structure. These are
the closest thing to a slide layout in the current renderer:

```markdown
---
title: KD-GAT Results
site:
  hide_outline: true
  hide_toc: true
  hide_title_block: true
---

+++ {"kind": "justified"}

KD-GAT · TMLR 2025

### 94% performance recovery at 60% parameter cost

Graph neural network compression via knowledge distillation
for automotive intrusion detection.

{button}`Read the paper <./paper/index.html>`

+++ {"kind": "split-image"}

```{figure} ./_build/figures/roc.html
```

### ROC curves across 6 attack classes

The ensemble distillation preserves boundary precision even
at 0.4× teacher capacity.
```

Note: landing page blocks are marked **experimental** in the MyST docs —
syntax may change. Acceptable for a one-off talk page, not for the paper itself.

### 3. `{include}` for shared source

The real win over SliDev: talk content is `{include}`-d from the paper, not
duplicated. A result slide that says "KD-GAT achieves X" can pull directly from
the methodology section's result block:

```markdown
+++ {"class": "slide-frame"}
```{include} paper/content/results.md
:start-at: "## Main Results"
:end-before: "## Ablation"
```
+++
```

The figure, the table, and the equation all render from the same labeled AST
nodes. Change the result in the paper; the slide updates.

### 4. Light/dark mode per section

MyST's Tailwind classes work per-block:

```markdown
+++ {"class": "slide-frame dark:bg-slate-900"}
...
+++
```

For a dark-background title slide inside an otherwise light page.

---

## The SliDev comparison — where it actually loses

SliDev wins on: presenter mode (speaker notes + timer + next-slide preview),
slide transitions, `---` syntax simplicity, and PDF export via Playwright that
matches what you see.

MyST's scrollytelling page has none of those. If you're standing at a podium
clicking through slides, you need SliDev (or Quarto + Reveal.js).

The gap is: there is no `format: slides` export in MyST. This is a real missing
target.

---

## Practical recommendation for kd-gat-paper

Three-tier authoring, single source:

```
paper/content/         ← canonical source (paper + candidacy)
paper/slides/          ← thin .md files that {include} from content/
  talk-neurips.md      ← scrollytelling page, one per venue
  talk-candidacy.md
```

`talk-neurips.md` is a MyST page with `+++` blocks, landing-page CTAs, and
`{include}` pulls. It deploys as a URL (GitHub Pages or curve.space) you can
open on any laptop or phone, share with collaborators, and link from the paper.
It is not a presenter deck.

For the actual defense / talk: keep SliDev as a separate tool, but source its
content from the same figures and data. The SliDev `.md` can `![](../../_build/figures/umap.png)`
(static exports from Gap 1 in GAPS.md, once that's resolved) rather than
re-authoring the visuals.

The two-tool split is not a failure of MyST — it is the correct separation:
MyST owns the canonical web-first document; SliDev owns the presenter UX. The
key discipline is that SliDev consumes MyST artifacts, not the other way around.

---

## What would close the gap inside MyST

If you wanted to eliminate SliDev entirely, the minimal MyST-native path is a
custom Reveal.js renderer plugin. The AST already has everything needed:

```js
// tools/reveal/plugin.mjs — ~150 lines
// Walks the MyST AST, treats each block node as a <section>,
// wraps in Reveal.js boilerplate, inlines figures.
// Registered in myst.yml as a plugin.
import { RemarkPlugin } from 'myst-common';
```

MyST's plugin architecture supports executable transforms and custom renderers.
A `+++`-block → `<section>` mapper is a single-layer transform. This is the
"easy extension" case — the AST is already the right primitive, the renderer
just needs a new consumer. Estimated effort: half a day. Worth it if you give
talks frequently from the same content; not worth it for a one-off.

---

## Addition to GAPS.md execution order

| # | Gap | Effort | Unblocks |
|---|-----|--------|---------|
| 8 | Create `paper/slides/` with `{include}`-based talk page | 2 h | Shareable web talk page |
| 9 | (Optional) Reveal.js renderer plugin | half day | Eliminate SliDev dependency |

Gap 8 depends on Gap 1 (figures-static / PDF story) only if you want static
figure embeds in the talk page. For the web version the existing iframes work.
