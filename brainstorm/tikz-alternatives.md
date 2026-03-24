# Diagram Tool Research: TikZ Alternatives

## The Problem

TikZ is a blind canvas — no object model, no constraint checking, no validation that edges connect to nodes. LLMs achieve 28% success rate editing TikZ (vTikZ benchmark, EASE 2025). The imperative workflow (write coordinates → compile → visually check → repeat) is slow and fragile.

What we want: declare structure, get a diagram. 80% lego blocks, 20% fine detailing.

---

## Tool Comparison

| | TikZ | Graphviz | D2 | Typst+CeTZ |
|---|---|---|---|---|
| **Edges guaranteed connected?** | No | Yes (by construction) | Yes (5 validation passes) | Depends on package |
| **Auto-layout?** | Only via `graphdrawing` (lualatex) | Yes (dot/neato/circo/fdp) | Yes (dagre/ELK) | Only tree; Graphviz via diagraph WASM |
| **Math labels?** | Full LaTeX | No | MathJax (good enough) | Full Typst math |
| **Programmability** | `\foreach` macro hell | DOT language | Classes + imports | **Real functions/loops/data structures** |
| **SVG output** | pdf→dvisvgm (2-step) | Native | Native | Native |
| **PDF output** | Native vector | Native vector | Rasterized screenshot (!) | Native vector |
| **Precise positioning** | Full control | No manual control | No manual control (auto only) | Full control |
| **Arbitrary paths/decorations** | Yes (bezier, zigzag, braces) | No | No | Limited |
| **Conference acceptance** | Universal | N/A (diagram tool) | N/A (diagram tool) | No major ML venue accepts Typst |
| **Install on OSC** | `module load texlive/2025` | Already at `/usr/bin/` | Single 48MB binary | Already at `~/.local/bin/typst` |
| **Learning curve** | Hours–days | Minutes | 10 minutes | ~1 hour |

---

## D2 (d2lang.com)

**What it is**: Declarative text → diagram language. Single Go binary (48MB), zero dependencies.

**Strengths**:
- `v1 -- v2` creates both nodes and edge atomically. Cannot produce a dangling edge.
- Auto-layout via dagre (default) or ELK. Direction control: `direction: right`.
- Classes for reusable styles. Imports for composable files.
- LaTeX math in labels via MathJax: `node: |latex x^2 + y^2|`
- 18+ node shapes, 20+ themes, colorblind-safe theme.
- Handles cycles, undirected edges (`--`), directed (`->`).
- SVG output is true vector, publication-ready.

**Limitations**:
- **No manual positioning** — auto-layout only. Can't place a node at a specific coordinate.
- **No math on edge labels** — LaTeX blocks only work on nodes.
- **No arbitrary paths** — can't draw bezier curves, braces, zigzag decorations.
- **PDF is rasterized** — screenshots SVG via Chromium, not true vector. Use SVG→PDF conversion instead.
- **No edge routing control** — can't manually route around obstacles.
- **Immature Python libraries** — py-d2 is small, missing features. Better to generate `.d2` text directly.
- **Auto-layout is non-deterministic across versions** — may shift between D2 releases.

**Best for**: Architecture/pipeline diagrams where structure matters more than exact positioning. System overviews, data flow diagrams. NOT for math-heavy figures or diagrams requiring precise spatial control.

**Install**:
```bash
curl -sL https://github.com/terrastruct/d2/releases/download/v0.7.1/d2-v0.7.1-linux-amd64.tar.gz | tar xz
cp d2-v0.7.1/bin/d2 ~/.local/bin/
```

**Example** (5-node undirected graph):
```d2
v1 -- v2
v1 -- v3
v2 -- v3
v2 -- v4
v3 -- v4
v4 -- v5
```

---

## Typst + Diagram Packages

**What it is**: Modern typesetting system with real programming (functions, loops, data structures). CeTZ is the TikZ equivalent.

**Key packages**:

| Package | Purpose | Layout |
|---------|---------|--------|
| **CeTZ** | Canvas drawing | Manual coordinates + tree only |
| **fletcher** | Flowcharts, architecture diagrams | Grid coords + auto-snapping edges |
| **diagraph** | Graphviz DOT inside Typst | Graphviz engines via WASM |
| **autograph** (v0.1.0) | Graphviz layout + fletcher rendering | Best of both, very new |

**The killer feature** — programmability:
```typst
#let kd-pipeline(stages) = diagram({
  for (i, stage) in stages.enumerate() {
    node((i, 0), stage.name, fill: stage.color)
    node((i, -1), [Teacher])
    node((i, 1), [Student])
    edge((i, -1), (i, 1), "-->", label: [KD])
    if i < stages.len() - 1 { edge((i, 0), (i + 1, 0), "->") }
  }
})
```

This is the `graph = tikz.graph(args)` API that TikZ doesn't have. Data in, diagram out.

**Strengths**:
- Real functions replace Python codegen pipelines
- Direct SVG output (`typst compile foo.typ foo.svg`). No texlive, no pdf2svg.
- Sub-second incremental compilation
- Clear error messages (vs LaTeX's cryptic logs)
- diagraph gives Graphviz layout with Typst math labels

**Limitations**:
- **No native graph auto-layout in CeTZ** — must use diagraph (Graphviz via WASM)
- **No ML conference accepts Typst** — ICML, NeurIPS, ICLR, TMLR all require LaTeX source
- **Smaller ecosystem** — CeTZ 0.4.2 vs TikZ's 20+ years
- **SVG text as glyph paths** — not selectable (minor for diagrams)

**Best for**: Programmatically generating diagram variants. The pattern `#let architecture(stages) = ...` is genuinely better than TikZ for parametric diagrams. Use as diagram tool only (`.typ` → SVG → embed in MyST), not as full document system.

---

## janosh/diagrams (diagrams.janosh.dev)

**What it is**: 131 TikZ+Typst diagrams (MIT license), covering physics, ML, math. Each is standalone with pre-built PDF/SVG/PNG.

**ML-relevant diagrams**:

| Diagram | Relevance to KD-GAT paper |
|---------|--------------------------|
| **Roost Update** | Graph convolution with attention weights (α) — nearly GAT |
| **Self Attention** (Velickovic, 52 lines) | Attention scores, weighted aggregation |
| **Random Forest** (45 lines) | Ensemble with bagging + aggregation → maps to fusion |
| **Variational Autoencoder** | Reusable `\drawNodes`/`\denselyConnectNodes` macros |
| **Regular vs Bayes NN** | Side-by-side comparison → teacher vs student pattern |
| **Skip Connection** | Residual path pattern |
| **Kohn-Sham Cycle** | Flowchart with convergence loop → pipeline pattern |
| **GNN Node Aggregation** | Message passing, multi-hop (Typst only, no .tex) |

**Not present**: knowledge distillation, CAN bus, multi-head attention.

**Code quality**: Standalone files, most use relative positioning and named `\tikzset` styles. VAE has genuinely reusable macros. No shared style library (styles duplicated per diagram).

**Component lookup workflow**:
1. Browse diagrams.janosh.dev → find relevant diagram
2. Download `.tex` from GitHub (`assets/<name>/<name>.tex`)
3. Extract patterns: styles, macros, layout structure
4. Strip document wrapper, adapt labels/colors into your component
5. Combine patterns across multiple diagrams

---

## Recommendations for This Paper

### Now: Graphviz for graphs, TikZ for architecture

- **Graph components** → Graphviz DOT → SVG/PDF. Structural correctness by construction, auto-layout, organic edges. The `graph-layout.py` script (55 lines) handles this.
- **Architecture diagram** → Keep TikZ with component structure. Use janosh/diagrams as pattern lookup for new components.
- **Interactive figures** → Already Svelte/SveltePlot. Don't change.

### For the architecture diagram specifically

Combine patterns from janosh/diagrams:
- Roost Update (GAT attention pattern)
- Random Forest (ensemble aggregation)
- Kohn-Sham Cycle (pipeline flowchart)
- Regular vs Bayes NN (teacher/student comparison)

### Future: Consider Typst for diagram-only use

The `#let architecture(stages) = diagram(...)` pattern is genuinely better than Python→TikZ codegen. When starting a new paper, try:
- `.typ` → SVG for architecture/pipeline diagrams
- Graphviz → SVG for graph structure figures
- TikZ only for math-heavy figures requiring precise spatial control (rare in practice)

### Not recommended: D2 for this paper

D2's auto-layout is great for quick sketches but lacks the precision needed for publication figures. No math on edge labels. PDF output is rasterized. Better suited for documentation than academic papers.
