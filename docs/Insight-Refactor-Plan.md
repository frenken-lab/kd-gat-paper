# Insight Pipeline Refactor Plan

This repo already has a clean publication boundary:

- `graphids` computes and exports evaluation artifacts.
- `interactive/` renders figures and diagrams from frozen inputs.
- `paper/` publishes prose.

The missing piece is a fast, low-friction insight layer between `graphids` and the paper. The goal of this refactor is to make `marimo` the primary analysis surface, keep Jupyter as a compatibility fallback, and make every stable insight flow through an artifact file before Quarto consumes it.

## Target flow

```text
graphids
  -> exported metrics / embeddings / analysis tables
  -> analysis/marimo/ notebooks (reactive exploration)
  -> paper/candidacy/_generated/ frozen outputs
  -> interactive/ figures + diagrams
  -> paper/ prose + embedded outputs
```

## File-by-file migration plan

| Path | Change | Why |
| --- | --- | --- |
| `analysis/README.md` | Add a top-level explanation of the insight workspace and artifact rules. | Gives the repo a single place to describe the new analysis layer. |
| `analysis/marimo/README.md` | Add the marimo workspace contract and notebook conventions. | Makes marimo the default insight driver and keeps notebook state out of `paper/`. |
| `paper/candidacy/_generated/README.md` | Add the chapter-local artifact contract. | Keeps the handoff close to the prose that consumes it. |
| `paper/candidacy/_generated/ablation/leaderboard.qmd` | Hold the chart logic next to the ablation chapter instead of as a standalone notebook chapter. | Removes the extra publication surface. |
| `Makefile` | Add a `marimo` target for opening the analysis workspace. | Gives the new insight loop a first-class entry point. |
| `README.md` | Update the repo overview and setup notes to mention the analysis workspace. | Makes the new flow visible at the top level. |
| `AUTHORING.md` | Add the insight loop to the authoring model. | Documents the new latency tier between raw export and publication. |
| `docs/Data-Pipeline.md` | Insert `analysis/` into the data-to-paper flow. | Clarifies where stable insights become artifacts. |
| `docs/Development-Setup.md` | Document how to use the marimo workspace and when to refresh artifacts. | Prevents the old notebook workflow from remaining the implied default. |
| `tools/speceditor/widget.py` | Keep the anywidget editor as the canonical browser-first spec editor. | Narrows diagram editing to the faster path. |
| `tools/speceditor/editor_ipyw.py` | Mark the ipywidgets editor as fallback-only. | Avoids presenting JupyterLab as the preferred editor path. |

## Execution order

1. Create the analysis workspace and helper module.
2. Point the existing results notebook at the workspace artifact path.
3. Update authoring and data-pipeline docs so the repo narrative matches the code.
4. Keep Jupyter support only where it is still required by Quarto or legacy workflows.

## Acceptance criteria

- A new insight can be explored in `analysis/marimo/` without touching `paper/`.
- A stable result can be written to `paper/candidacy/_generated/` and consumed by Quarto.
- The results notebook no longer hardcodes the remote dataset as its only source.
- The docs describe one primary insight flow instead of multiple equal notebook paths.
