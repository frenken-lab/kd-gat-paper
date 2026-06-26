# kd-gat-paper Wiki

Development guides for the **Adaptive Fusion of Graph-Based Ensembles for Automotive IDS** paper repository.

## Pages

- [Development Setup](Development-Setup.md) — Prerequisites, local dev environment, quick start, OSC SSH tunnel
- [Login Node Resources](Login-Node.md) — Resource impact of live builds, `salloc` for compute nodes, two-hop SSH tunnel
- [Figure Authoring](Figure-Authoring.md) — Creating and modifying interactive SveltePlot figures
- [Diagram Authoring Guide](Diagram-Authoring-Guide.md) — Spec-driven YAML diagrams: format, layout tree, `type: spec` embedding, tuning
- [Data Pipeline](Data-Pipeline.md) — How data flows from KD-GAT experiments to the paper
- [Table Authoring](Table-Authoring.md) — Declarative table specs and the build script

For deployment and CI, see the root `README.md`, `_quarto.yml`, and `.github/workflows/paper.yml`.

## Build Targets

| Target | Config | Deployed to |
|--------|--------|-------------|
| Candidacy | `_quarto.yml` | [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) via CI |

## Quick Reference

```bash
make dev            # Quarto live-reload
make build          # Full pipeline: data → figures → tables → slides → site
```
