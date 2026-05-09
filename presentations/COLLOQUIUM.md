# Colloquium Reference

Quick reference for authoring slides in `presentations/*.md`.
Build: `make slides` → `_build/slides/<name>.html`.

## File structure

```markdown
---
title: My Talk
author: Name
date: 2026
theme: default          # only theme available
aspect_ratio: "16:9"   # or "4:3"
bibliography: path/to/refs.bib
citation_style: author-year   # or numeric
citation_order: auto
figure_captions: false
custom_css: path/to/extra.css
footer:
  left: "Left text"
  center: "Center"      # supports {n}/{total} counters
  right: "Right text"
fonts:
  heading: "Font Name"
  body: "Font Name"
---

# Title Slide          ← h1 triggers title layout automatically

Subtitle

Author · Date

---

## Content Slide       ← h2 = content layout

Body.
```

## Slide separators

- `---` on its own line = new slide
- `===` on its own line = new **row** within a slide (requires `<!-- rows: N -->`)

## Directives — `<!-- key: value -->` inside a slide

| Directive | Values | Effect |
|-----------|--------|--------|
| `layout` | see below | Override slide layout |
| `class` | CSS class names | Add to slide element |
| `style` | raw CSS | Inline style on slide |
| `notes` | text | Speaker notes |
| `align` | `left` `center` `right` | Text alignment |
| `valign` | `top` `center` `bottom` | Vertical alignment |
| `padding` | `compact` `normal` `wide` | Slide padding |
| `size` | `small` `normal` `large` | Text size |
| `columns` | `2` or `1/2` or `1/2/1` | Column grid; split content with `\|\|\|` |
| `rows` | `2` or `1/3` | Row grid; split content with `===` |
| `cite` | `key1, key2` | Citation footnote bottom-left |
| `cite-right` | `key1, key2` | Citation footnote bottom-right |
| `footnote` | text | Plain footnote bottom-left |
| `footnote-right` | text | Plain footnote bottom-right |
| `footnotes` | `left` `right` | Side for inline `^[...]` footnotes |
| `img-align` | `left` `center` `right` | Image horizontal alignment |
| `img-valign` | `top` `center` `bottom` | Image vertical alignment |
| `img-fill` | _(flag)_ | Image stretches to fill column |
| `img-overflow` | _(flag)_ | Image bleeds past cell boundary |

## Layouts

| Layout | Description |
|--------|-------------|
| `content` | Default — title + body |
| `title` | Centered title (also via `# H1`) |
| `title-left` | Title left-aligned |
| `title-sidebar` | Title with colored sidebar stripe |
| `title-banner` | Title with banner bar |
| `section-break` | Section divider, no body |
| `two-column` | Two equal columns, no `\|\|\|` needed |
| `image-left` | Full-bleed image left, text right |
| `image-right` | Full-bleed image right, text left |
| `code` | Optimized for code blocks |

## Column layout

```markdown
<!-- columns: 1/2 -->

## Slide title

Left content (1 fr)

|||

Right content (2 fr)
```

`columns: 2` = equal halves. `columns: 1/2/1` = three cols, middle double-wide.

## Row layout

```markdown
<!-- rows: 1/2 -->

## Slide title

Top row (1 fr)

===

Bottom row (2 fr)
```

Rows can contain nested columns: add `<!-- row-columns: 1/1 -->` inside a row block, then use `|||` to split.

## Built-in fenced elements

### `box` — callout box

````markdown
```box
title: Key Insight
content: |
  Markdown body. **Bold**, `code`, lists all work.
tone: accent       # accent | muted | surface  (default: accent)
align: center      # left | center | right
size: 0.85         # float em multiplier
compact: true      # tighter padding
```
````

### `chart` — Chart.js

````markdown
```chart
type: bar          # bar | line | scatter | pie | doughnut | radar
title: My Chart
data:
  labels: [A, B, C]
  datasets:
    - label: Series 1
      data: [10, 20, 30]
      color: "#0f3460"
options: {}        # Chart.js options, deep-merged
```
````

### `conversation` — chat bubbles

````markdown
```conversation
size: 0.9
messages:
  - role: system
    content: "System prompt."
  - role: user
    content: "Question?"
  - role: assistant
    model: claude-3
    content: "Answer."
```
````

### `iframe` — custom element (`presentations/_slides.py`)

````markdown
```iframe
src: https://example.com/figure.html
height: 520        # optional; default = IFRAME_DEFAULT_HEIGHT (480) in iframe.py
title: Accessible title
loading: lazy      # optional; defaults to lazy
```
````

Width is always 100%. Change `IFRAME_DEFAULT_HEIGHT` in
`presentations/_slides.py` for a global default.

## Inline syntax

| Syntax | Effect |
|--------|--------|
| `[@key]` | In-text citation |
| `[@key1; @key2]` | Multi-key citation |
| `^[Footnote text]` | Inline footnote |

## Keyboard navigation

| Key | Action |
|-----|--------|
| `→` `↓` `Space` `PageDown` | Next slide |
| `←` `↑` `PageUp` | Previous slide |
| `f` | Fullscreen |
| `Escape` | Exit fullscreen |
| Click right footer | Slide picker |
