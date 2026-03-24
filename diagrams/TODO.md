# Diagram Pipeline — Remaining Issues

Post-migration from NetworkX+matplotlib to pygraphviz. These are known
warts, not blockers.

## Dead parameters

- `graph(layout=...)`: accepted but never read inside the function. The
  layout engine is selected by `_infer_prog()` in `build-diagrams.py`
  based on whether the spec has a single organic graph component. The
  parameter is a passthrough that sits in the signature doing nothing.
- `graph(size=...)` numeric branch: `f"{float(size) / 500:.2f}"` converts
  old matplotlib node_size units. No YAML spec passes a number — they all
  use `"small"`/`"medium"`. Dead else branch.
- `gat(gap=...)` and `vgae(gap=...)`: leftover from the old pipeline where
  gap controlled `cursor_y` spacing. Graphviz handles spacing via `ranksep`
  and `nodesep`. These parameters are accepted and ignored.

## Duplication in gat() and vgae()

The "create n nodes + add intra-layer edges + rank=same subgraph" pattern
appears ~6 times across `gat()` and `vgae()`. Each instance is 4-6 lines
of direct `G.add_node`/`G.add_edge`/`G.add_subgraph` calls. Extracting a
shared helper would reduce repetition but re-introduce the thin wrapper
problem (wrapping pygraphviz API in a custom function). Current choice:
keep the repetition, no indirection.

## Architecture diagram layout

The architecture diagram uses `box` components for all pipeline stages
(teachers, students, DQN, output) rather than the full `vgae()`/`gat()`
component internals. This was a pragmatic choice — the full components
caused interleaving with `dot` layout. The detailed internals are shown in
the standalone `vgae.yaml` and `gat.yaml` diagrams. If a single combined
diagram is needed, the options are:

1. Use `fdp` engine (force-directed, cluster-aware) instead of `dot`
2. Manually pin positions with `pos` attributes and `neato -n`
3. Accept hierarchical layout from `dot` and tune with `weight`/`minlen`
