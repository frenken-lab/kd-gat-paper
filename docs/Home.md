# kd-gat-paper Wiki

Development guides for the **Adaptive Fusion of Graph-Based Ensembles for Automotive IDS** paper repository.

## Pages

- [Development Setup](Development-Setup.md) — Prerequisites, local dev environment, quick start, OSC SSH tunnel
- [Login Node Resources](Login-Node.md) — Resource impact of live builds, `salloc` for compute nodes, two-hop SSH tunnel
- [Figure Authoring](Figure-Authoring.md) — Creating and modifying interactive SveltePlot figures
- [Diagram Authoring Guide](Diagram-Authoring-Guide.md) — Spec-driven YAML diagrams: format, layout tree, `type: spec` embedding, tuning
- [Data Pipeline](Data-Pipeline.md) — How data flows from KD-GAT experiments to the paper
- [Table Authoring](Table-Authoring.md) — Declarative table specs and the build script

For deployment, CI, TMLR export, and candidacy-vs-paper build differences, see `CLAUDE.md` (canonical) and `tools/tmlr/README.md`. The dedicated wiki pages were removed (2026-05-02) because they had drifted out of sync with the unified TMLR Distill / GitHub Pages pipeline.

## Build Targets

| Target | Config | Deployed to |
|--------|--------|-------------|
| Paper | `myst.yml` | Built locally via `make tmlr` (CI suppressed) |
| Candidacy | `myst.candidacy.yml` | [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) via CI |

## Quick Reference

```bash
make dev            # Paper live-reload (overmind: myst + vite + table watcher)
make candidacy-dev  # Candidacy live-reload
make build          # Full pipeline: data → figures → tables → slides → site
```
