# kd-gat-paper Wiki

Development guides for the **Adaptive Fusion of Graph-Based Ensembles for Automotive IDS** paper repository.

## Pages

- [Development Setup](Development-Setup.md) — Prerequisites, local dev environment, quick start
- [Figure Authoring](Figure-Authoring.md) — Creating and modifying interactive SveltePlot figures
- [Diagram Authoring Guide](Diagram-Authoring-Guide.md) — Spec-driven YAML diagrams: format, layout tree, `type: spec` embedding, tuning
- [Data Pipeline](Data-Pipeline.md) — How data flows from KD-GAT experiments to the paper
- [Table Authoring](Table-Authoring.md) — Declarative table specs and the build script

For deployment, CI, TMLR export, and candidacy-vs-paper build differences, see `CLAUDE.md` (canonical) and `tools/tmlr/README.md`. The dedicated wiki pages were removed (2026-05-02) because they had drifted out of sync with the unified TMLR Distill / GitHub Pages pipeline.

## Build Targets

| Target | Config | Deployed to |
|--------|--------|-------------|
| Paper | `myst.yml` | [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) |
| Candidacy (web) | `myst.candidacy.yml` | [rob.curve.space](https://rob.curve.space) |
| Candidacy (PDF) | `myst.candidacy.yml` | CI artifact |

## Quick Reference

```bash
make dev            # Paper live-reload (overmind: myst + vite + table watcher)
make candidacy-dev  # Candidacy live-reload
make candidacy-pdf  # Typst PDF
make figures        # Build all interactive figures
make all            # Full pipeline: data → figures → tables → site
```
