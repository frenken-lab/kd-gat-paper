# Scrollytelling / Story Page in MyST — How It's Done

## What actually exists vs what you have to build

MyST has no native scrollytelling renderer equivalent to Quarto's Closeread
extension. Closeread is the current best-in-class option for the "sticky figure,
scrolling text" pattern — it is a Quarto extension backed by scrollama.js with
zoom, pan, highlight, and OJS variable bindings. It has 40+ production examples
and an active gallery. It is genuinely good. It is also Quarto-only.

What MyST *does* have that makes a story page achievable without leaving the
ecosystem:

| Primitive | What it does | Relevant doc |
|-----------|--------------|--------------|
| `+++` block syntax | Divides a page into named structural sections | `mystmd.org/guide/blocks` |
| `+++ {"class": "..."}` | Attaches arbitrary CSS classes to a block | `mystmd.org/guide/website-style` |
| `site.options.style` | Loads a custom CSS file into the built site | `myst.yml` options |
| `+++ {"kind": "..."}` | Landing-page CTA blocks (experimental) | `mystmd.org/guide/website-landing-pages` |
| `{include}` directive | Pulls content from another `.md` file | `mystmd.org/guide/embed` |
| `{div}` / `{span}` | HTML-like containers with class/style | `mystmd.org/guide/blocks#div-and-span` |
| Tailwind classes | Dark mode, responsive visibility | `mystmd.org/guide/website-style` |

The pattern: `+++` blocks become the scroll sections; CSS turns them into
viewport-height panels; `{include}` pulls from the paper so nothing is
duplicated.

---

## The two patterns, honestly compared

### Pattern A — CSS scroll-snap (pure MyST, ~30 lines of CSS)

Each `+++` block becomes a full-viewport section. No JS. Scrolls like slides.

**What you get:** viewport-height blocks, sticky figure layout, works in any
browser, deploys from existing `myst build --site`.

**What you don't get:** figure zoom/pan on scroll, text-highlight-as-you-scroll,
scroll-position-driven animation. Those require JS (scrollama.js or GSAP).

**Fits kd-gat-paper because:** your interactive figures already run in iframes.
You don't need MyST to animate them — they animate themselves. The story page
just needs to put the right figure beside the right text at the right scroll
position.

### Pattern B — MyST page + scrollama.js injected via raw HTML block

Add `scrollama.js` via a `{raw:html}` block and wire scroll events to iframe
visibility/opacity. Brings you close to Closeread's trigger model.

**What you get:** scroll-triggered figure swapping, progressive reveal.

**What you don't get:** a maintained abstraction. You are maintaining the JS
yourself.

**Honest assessment:** start with Pattern A. If the static scroll-snap version
of the story page is good enough (it usually is for a research talk), ship it.
Pattern B is a future iteration if you find you need animated transitions.

---

## Pattern A — Complete worked example for kd-gat-paper

### File structure

```
paper/
  slides/
    story.md          ← new file (the story page)
_static/
  story.css           ← new file (~40 lines)
myst.candidacy.yml    ← add story.md to toc + style hook
```

### `_static/story.css`

```css
/* Scroll-snap container — applied to the article wrapper MyST generates */
.story-page article {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}

/* Each +++ block becomes a viewport-height panel */
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

/* Single-column title/transition slides */
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

/* Figure panels: iframe fills the right column */
.slide iframe,
.slide figure {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 8px;
}

/* Dark title slide */
.slide-dark {
  background: #0f0f0f;
  color: #f5f5f4;
}
.slide-dark h1, .slide-dark h2, .slide-dark h3,
.slide-dark p { color: #f5f5f4; }

/* Accent number — big stat callout */
.stat {
  font-size: 4rem;
  font-weight: 600;
  line-height: 1;
  color: var(--color-text-info);
}

/* Progress dots (optional) — fixed bottom center */
.story-progress {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.5rem;
  z-index: 100;
}
.story-progress span {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-border-secondary);
}
.story-progress span.active { background: var(--color-text-primary); }
```

### `paper/slides/story.md`

```markdown
---
title: KD-GAT — Adaptive Fusion of Graph Ensembles
kernelspec: {}
site:
  hide_outline: true
  hide_toc: true
  hide_title_block: true
  classes: story-page
---

+++ {"class": "slide slide-dark"}

KD-GAT · TMLR 2025

### Automotive intrusion detection \
needs both accuracy and efficiency

Graph neural network compression via knowledge distillation
for in-vehicle network anomaly detection.

{button}`Read the full paper <../content/index.html>`
{button}`Candidacy report <https://rob.curve.space>`

+++

+++ {"class": "slide-full"}

### The core tension

Modern IDS on CAN bus: GATs are accurate but expensive.
Simpler GNNs are fast but miss complex attack patterns.
Can we get both?

+++

+++ {"class": "slide"}

**The distillation idea**

KD-GAT trains a lightweight student GNN to mimic
a GAT teacher's attention-weighted representations —
not just its labels.

The student learns *how* the teacher attends,
not just *what* it predicts.

```{include} ../content/background.md
:start-at: "### Knowledge Distillation"
:end-before: "### Graph Attention"
```

<div>
```{figure} ../../_build/figures/architecture.html
:label: fig-arch-story
```
</div>

+++

+++ {"class": "slide"}

**Dataset: OTIDS + extended CAN traces**

```{include} ../content/datasets.md
:start-at: "## Dataset"
:end-before: "## Experimental"
```

<div>
```{figure} ../../_build/figures/dataset_overview.html
:label: fig-data-story
```
</div>

+++

+++ {"class": "slide-full"}

<p class="stat">94%</p>

### Performance recovery at 60% parameter cost

KD-GAT closes 94% of the GNN-to-GAT gap
while using 40% fewer parameters.

+++

+++ {"class": "slide"}

**ROC across 6 attack classes**

The student preserves attack-boundary precision
even at reduced capacity. Fuzzy and replay attacks
are the hardest; distillation helps most there.

<div>
```{figure} ../../_build/figures/roc.html
:label: fig-roc-story
```
</div>

+++

+++ {"class": "slide"}

**UMAP: representation space**

Teacher and student learn nearly identical
latent geometry. The distillation loss
is working at the representation level, not just output.

<div>
```{figure} ../../_build/figures/umap.html
:label: fig-umap-story
```
</div>

+++

+++ {"class": "slide"}

**Ablation: what matters most**

```{include} ../content/ablation.md
:start-at: "## Ablation"
:end-before: "## Conclusion"
```

<div>
```{figure} ../../_build/figures/ablation.html
:label: fig-ablation-story
```
</div>

+++

+++ {"class": "slide-full"}

### Takeaways

- Knowledge distillation transfers attention structure, not just labels
- 60% parameter reduction with 94% performance recovery
- Deployable on constrained CAN bus hardware

{button}`Read the paper <../content/index.html>`
{button}`Code + data <https://github.com/frenken-lab/KD-GAT>`

+++
```

### Wire into `myst.candidacy.yml`

```yaml
version: 1
project:
  # ... existing config ...

site:
  options:
    style: ./_static/story.css
  nav:
    - title: Story page
      url: /paper/slides/story
  # ... existing nav ...
```

Add to the candidacy toc:
```yaml
# In the toc section of myst.candidacy.yml:
- file: paper/slides/story
  title: Story
```

---

## Closeread as the honest comparison point

Closeread (Quarto extension) does the sticky-panel pattern natively — text
scrolls in a left column, the figure stays pinned in a right column until the
next trigger fires. The MyST Pattern A above produces a *different* but valid
UX: each panel is its own viewport unit, you scroll from panel to panel, the
figure is in the same frame as the text. This is closer to a slide deck than
to NYT-style scrollytelling.

For an ML research talk the distinction rarely matters. What matters is:

- Can I share a URL? ✓ (both)
- Does it embed my interactive SveltePlot figures? ✓ (MyST Pattern A via iframe)
- Does it update when the paper updates? ✓ (MyST via `{include}`)
- Does it work in the same build? ✓ (MyST — same `myst build --site`)
- Does it require learning a new tool? ✗ (Closeread requires Quarto install)

The one thing Closeread does that Pattern A doesn't: text scrolls *past* a
pinned sticky. If you want "I scroll through three paragraphs of explanation
while the UMAP figure stays on screen", you need either Pattern B (scrollama.js)
or Closeread. For a five-minute talk summary page, Pattern A is sufficient.

---

## If you want Pattern B later: 20-line scrollama.js hook

This can be added to `story.md` as a raw HTML block at the bottom of the file.
It converts the CSS scroll-snap page into a sticky-panel layout:

```html
<script src="https://unpkg.com/scrollama@3/build/scrollama.min.js"></script>
<script>
// Each .slide block gets a sticky figure (right col) and scrolling text (left col)
// This is a 20-line wiring; the CSS above already handles the layout.
const scroller = scrollama();
scroller
  .setup({ step: '.slide', offset: 0.5, progress: true })
  .onStepProgress(({ element, progress }) => {
    // fade figure in on entry
    const fig = element.querySelector('figure, iframe');
    if (fig) fig.style.opacity = Math.min(1, progress * 3);
  });
window.addEventListener('resize', scroller.resize);
</script>
```

Wire this only if you want progressive figure reveal. The scroll-snap CSS
already gives you a clean page without it.

---

## What's missing from MyST that Closeread has

| Feature | Closeread | MyST Pattern A | MyST Pattern B |
|---------|-----------|----------------|----------------|
| Sticky figure while text scrolls | ✓ | ✗ (per-panel) | ✓ (with scrollama) |
| Text highlight on scroll | ✓ | ✗ | ✓ (manual) |
| Figure zoom/pan on scroll | ✓ | ✗ | ✓ (manual) |
| OJS variable binding | ✓ | ✗ | ✗ |
| Same build as paper | ✗ | ✓ | ✓ |
| `{include}` from paper source | ✗ | ✓ | ✓ |
| Interactive iframe figures | partial | ✓ | ✓ |
| Maintained abstraction | ✓ | CSS only | You own it |

For kd-gat-paper: start with Pattern A. It is 40 lines of CSS and one new `.md`
file. It deploys in the same CI job that already builds the candidacy site.
The interactive figures already handle their own animation — you don't need
scroll-triggered reveal to make a UMAP or ROC curve compelling.
