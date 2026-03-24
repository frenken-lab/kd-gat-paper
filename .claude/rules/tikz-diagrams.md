# TikZ Diagram Workflow

LLMs have near-zero spatial awareness (vTikZ benchmark: 3-28% success on layout tasks). These rules compensate.

## Render-in-the-Loop (mandatory)

Every TikZ edit must be visually verified before proceeding:

```
write .tikz → compile → convert to PNG → Read the image → fix → repeat
```

Compile command (OSC):
```bash
bash -lc 'module load texlive/2025 && pdflatex -interaction=nonstopmode -output-directory=/tmp file.tex && convert /tmp/file.pdf /tmp/preview.png'
```

For `graphdrawing` diagrams, use `lualatex` instead of `pdflatex`.

Read `/tmp/preview.png` after every compile. Do NOT proceed to the next step without visual verification.

## Build Order (strictly sequential)

1. **Mermaid sketch** — use `mcp__claude_ai_Mermaid_Chart__validate_and_render_mermaid_diagram` to establish topology and flow direction. Agree on structure before any TikZ.
2. **Components** — build each logical group (e.g., one pipeline stage) as a separate `.tikz` file. Render and verify each in isolation.
3. **Skeleton** — compose components into main diagram with nodes only, no styling. Render and verify positions.
4. **Edges** — add arrows between nodes. Render and check for crossings.
5. **Styling** — colors, shapes, fonts, backgrounds.
6. **Labels/annotations** — edge labels, math notation, legends. Most likely to need nudging.

## Component Architecture

Diagrams use a component structure under `tikz/`:

```
tikz/
  styles.tikz          # shared colors, \tikzset styles (loaded by all)
  components/
    vgae-stage.tikz    # one file per logical group
    gat-stage.tikz
    fusion-stage.tikz
  architecture.tikz    # main diagram — \input{} components + compose with positioning
```

Each component:
- Defines a `pic` or a scoped group with a named anchor node
- Can be rendered standalone with a minimal wrapper for verification
- Uses only relative positioning internally

The main diagram uses relative positioning between component anchors (e.g., `right=2.5cm of vgae-anchor`).

## Positioning Rules

### Always use (zero coordinate math)

| Pattern | Library | Best for | Compiler |
|---------|---------|----------|----------|
| `graphdrawing` + `layered layout` | `graphs,graphdrawing` | DAGs, architecture overviews | lualatex |
| `matrix of nodes` | built-in | Grid/table layouts | pdflatex |
| `chains` + `on chain` + `join` | `chains` | Sequential pipelines | pdflatex |
| `right=Xcm of node` | `positioning` | Simple relative layouts | pdflatex |

### Never use

- **Absolute coordinates**: `\node at (3.5, 2.7)` — guaranteed wrong
- **Computed positions in `\foreach`** — spatial errors compound
- **Mixed absolute + relative** in the same diagram
- **Guessing distances** — start with library defaults, adjust only after seeing the render

## Shared Styles

All diagrams source `tikz/styles.tikz` for colors and node/arrow styles. Do not redefine colors or base styles in individual component files.

## Build Integration

`make diagrams` loads `texlive/2025` automatically and runs `scripts/build-tikz.sh`. The script:
- Wraps each `.tikz` in a standalone document class
- Compiles with pdflatex (or lualatex if `\usegdlibrary` is detected)
- Converts PDF to SVG via `dvisvgm` (preferred) or `pdf2svg`
- Outputs to `figures/*.svg`

## Useful TikZ Libraries

Already loaded in `architecture.tikz`: `arrows.meta`, `positioning`, `shapes.geometric`, `fit`, `backgrounds`, `calc`.

Additional for auto-layout (require lualatex):
```latex
\usetikzlibrary{graphs,graphdrawing}
\usegdlibrary{layered,trees,force}
```
