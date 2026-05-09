# marimo Workspace

This is the primary insight driver for the repo.

## What belongs here

- Reactive data exploration over `graphids` exports.
- Parameter sweeps, ablation checks, and intermediate claim drafting.
- Lightweight plots or tables that help decide whether an insight is stable enough to publish.

## What does not belong here

- Final prose.
- Hard-coded publication figures.
- One-off notebook state that cannot be reproduced from saved Python code.

## Conventions

- Prefer pure Python cells and keep them deterministic.
- When an insight stabilizes, export it into the chapter-local generated directory that consumes it.
- If a Quarto chapter needs the result, consume that artifact rather than recomputing it inline.

## Suggested first notebooks

- `ablation_inspection.py`
- `embedding_sanity.py`
- `claim_drafts.py`
