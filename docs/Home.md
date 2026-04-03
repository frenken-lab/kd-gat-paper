# kd-gat-paper Wiki

Development guides for the **Adaptive Fusion of Graph-Based Ensembles for Automotive IDS** paper repository.

## Pages

- [Development Setup](Development-Setup.md) — Prerequisites, local dev environment, quick start
- [Figure Authoring](Figure-Authoring.md) — Creating and modifying interactive SveltePlot figures
- [Architecture Diagrams](Architecture-Diagrams.md) — Using the graphology → SveltePlot diagram library
- [Diagram Authoring Guide](Diagram-Authoring-Guide.md) — Spec-driven YAML diagrams: format, layout tree, `type: spec` embedding, tuning
- [Data Pipeline](Data-Pipeline.md) — How data flows from KD-GAT experiments to the paper
- [Table Authoring](Table-Authoring.md) — Declarative table specs and the build script
- [Candidacy Build](Candidacy-Build.md) — Candidacy report vs paper build, combined pages, PDF export
- [Deployment and CI](Deployment-and-CI.md) — CI pipeline, GitHub Pages, curve.space, TMLR submission
- [TMLR Export](TMLR-Export.md) — How the MyST AST serializer produces the Distill-layout submission

## Build Targets

| Target | Config | Deployed to |
|--------|--------|-------------|
| Paper | `myst.yml` | [GitHub Pages](https://frenken-lab.github.io/kd-gat-paper/) |
| Candidacy (web) | `myst.candidacy.yml` | [rob.curve.space](https://rob.curve.space) |
| Candidacy (PDF) | `myst.candidacy.yml` | CI artifact |

## Quick Reference

```bash
make dev            # Paper live-reload
make candidacy-dev  # Candidacy live-reload
make candidacy-pdf  # Typst PDF
make figures        # Build all interactive figures
make all            # Full pipeline: data → figures → tables → site
```
