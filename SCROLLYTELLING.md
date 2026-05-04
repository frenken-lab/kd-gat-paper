# Scrollytelling Presentation Page

**Goal:** ship one scrollable page that *is* the end-of-week presentation. No
SliDev, no Reveal.js, no separate build path. Same MyST build as the candidacy
report; deploys via `curvenote deploy` to rob.curve.space.

The page reads top-to-bottom like a slide deck: each `+++` block is a
viewport-height panel, you scroll panel-to-panel, the embedded interactive
figures animate themselves. Pure CSS scroll-snap, ~40 lines of CSS, one new
`.md` file.

---

## Why this approach

- **Zero new tooling.** `+++` blocks already render through MyST. The Distill
  preview, the Vale lint, the candidacy build — nothing changes.
- **Same source as the paper.** `{include}` directives pull from
  `paper/content/*.md`, so the talk doesn't drift from the paper.
- **The figures already work.** They're built into `_build/figures/*.html` by
  `make figures` and embed via iframe. They handle their own animation; the
  scroll page just places them.
- **One URL to share.** Open it on any laptop or phone, send the link in chat.

What you give up vs. SliDev / Reveal: presenter mode, speaker notes, slide
transitions, click-to-advance keybinding. Acceptable for a research-talk web
page; not for a podium presenter deck. If a podium version is needed later,
that's a separate path — out of scope here.

---

## File layout

```
paper/slides/
  story.md          ← scrollytelling page (new)
_static/
  story.css         ← ~40 lines (new)
myst.candidacy.yml  ← add story.md to toc + style hook
```

Use the candidacy config (not `myst.yml`) — rob.curve.space is the deploy
target and the candidacy build already has the SPA wiring set up.

---

## `_static/story.css`

```css
/* Each +++ block is a viewport-height panel. */
.slide {
  scroll-snap-align: start;
  min-height: 90vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
  padding: 4rem 3rem;
  border-bottom: 1px solid var(--color-border-tertiary);
}

/* Single-column title / transition slides. */
.slide-full {
  scroll-snap-align: start;
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 4rem 6rem;
  border-bottom: 1px solid var(--color-border-tertiary);
}

/* Iframe figures fill the right column. */
.slide iframe,
.slide figure {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 8px;
}

/* Dark title slide. */
.slide-dark           { background: #0f0f0f; color: #f5f5f4; }
.slide-dark h1, .slide-dark h2,
.slide-dark h3, .slide-dark p { color: #f5f5f4; }

/* Big stat callout. */
.stat {
  font-size: 4rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-text-info);
}

/* Page-level scroll-snap. */
.story-page article {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}
```

---

## `paper/slides/story.md` skeleton

Adjust slide ordering to match the talk arc. Figure paths reference the built
files in `_build/figures/`; iframes resolve via the same path-rewrite the
candidacy site uses for inline figures.

```markdown
---
title: KD-GAT — Adaptive Fusion of Graph Ensembles for Automotive IDS
site:
  hide_outline: true
  hide_toc: true
  hide_title_block: true
  classes: story-page
---

+++ {"class": "slide-full slide-dark"}

# KD-GAT
### Adaptive fusion of graph-based ensembles \
### for automotive intrusion detection

Robert Frenken · Candidacy · 2026

+++

+++ {"class": "slide-full"}

### The tension

GATs are accurate on CAN-bus IDS. They're also expensive.
Simpler GNNs are fast and miss the patterns that matter.

Can we get both?

+++

+++ {"class": "slide"}

**Distillation transfers attention, not just labels**

The student GAT learns *how* the teacher attends —
the structural inductive bias, not just the output distribution.

```{include} ../content/background.md
:start-at: "### Knowledge Distillation"
:end-before: "### Graph Attention"
```

```{figure} ../../_build/figures/kd-gat.html
:label: fig-kdgat-story
```

+++

+++ {"class": "slide"}

**Architecture**

```{figure} ../../_build/figures/architecture.html
:label: fig-arch-story
```

+++

+++ {"class": "slide-full"}

<p class="stat">94%</p>

### Performance recovery at 60% parameter cost

KD-GAT closes 94% of the GNN-to-GAT gap
while using 40% fewer parameters.

+++

+++ {"class": "slide"}

**ROC across attack classes**

The student preserves attack-boundary precision
even at reduced capacity.

```{figure} ../../_build/figures/pareto-frontier.html
:label: fig-pareto-story
```

+++

+++ {"class": "slide"}

**Representation space (UMAP)**

Teacher and student learn nearly identical latent geometry —
distillation works at the representation level, not just the output.

```{figure} ../../_build/figures/umap.html
:label: fig-umap-story
```

+++

+++ {"class": "slide"}

**Attention transfer**

```{figure} ../../_build/figures/attention-heatmap.html
:label: fig-attn-story
```

+++

+++ {"class": "slide-full"}

### Takeaways

- Knowledge distillation transfers attention structure, not just labels
- 60% parameter reduction with 94% performance recovery
- Deployable on constrained CAN-bus hardware

+++
```

Pick whichever 6–8 figures from `interactive/src/figures/{data,diagrams}/`
land the talk arc. The slide list above is a starting set; swap in
`composition-pipeline`, `attention-heatmap`, `pareto-frontier`,
`fedavg-drift`, `cka`, etc. as the talk takes shape.

---

## Wire into `myst.candidacy.yml`

```yaml
project:
  toc:
    - file: paper/index.md
    - title: Story
      file: paper/slides/story.md
    # ... existing entries ...

site:
  options:
    style:
      - _static/custom.css
      - _static/story.css
```

---

## End-of-week checklist

1. Create `paper/slides/story.md` from the skeleton above.
2. Create `_static/story.css`.
3. Add the toc entry + style hook to `myst.candidacy.yml`.
4. `make figures` (rebuild any figures used in the talk that have stale data).
5. `make candidacy-dev` — open `localhost:3000/paper/slides/story` and walk it.
6. Iterate on slide content / figure choice. Each `+++` block is one
   `myst start` save away.
7. `make candidacy-site` then `curvenote deploy` (or push and let CI run) to
   share the URL.

The whole thing is one `.md` + one `.css` + one yml edit. Most of the work is
deciding which figures land which beats — not infrastructure.

---

## If you want progressive figure reveal later

Drop a 20-line scrollama hook at the bottom of `story.md` — converts
scroll-snap panels into sticky-figure-with-scrolling-text panes. Out of scope
for end-of-week; revisit if the static page lands flat.

```html
<script src="https://unpkg.com/scrollama@3/build/scrollama.min.js"></script>
<script>
  const scroller = scrollama();
  scroller
    .setup({ step: '.slide', offset: 0.5, progress: true })
    .onStepProgress(({ element, progress }) => {
      const fig = element.querySelector('figure, iframe');
      if (fig) fig.style.opacity = Math.min(1, progress * 3);
    });
  window.addEventListener('resize', scroller.resize);
</script>
```
