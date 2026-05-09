# Analysis Workspace

This directory is the insight layer between `graphids` exports and the published paper.

## Contract

- Use `analysis/marimo/` for reactive exploration, parameter sweeps, and claim drafting.
- Write stable outputs directly into the chapter-local generated directory that consumes them.
- Keep `paper/` focused on narrative and citations, not data wrangling.

## Shape

```text
analysis/
  marimo/     # reactive notebooks and analysis scripts
  ...         # chapter-local generated outputs live next to their consumer
```

## Workflow

1. Pull or generate the relevant `graphids` artifacts.
2. Investigate them in marimo.
3. Export the stable result to the directory that consumes it.
4. Point Quarto or the figure pipeline at that artifact.

The repo now prefers this path over ad hoc notebook state.
