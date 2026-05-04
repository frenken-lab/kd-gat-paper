---
title: KD-GAT — End-of-Week Talk
site:
  hide_outline: true
  hide_toc: true
  hide_title_block: true
---

+++ {"class": "slide-full slide-dark"}

# KD-GAT
### Adaptive fusion of graph-based ensembles for automotive intrusion detection

Robert Frenken · Candidacy · 2026

+++

+++ {"class": "slide-full"}

### The tension

GATs are accurate on CAN-bus IDS. They're also expensive.
Simpler GNNs are fast and miss the patterns that matter.

Can we get both?

+++

+++ {"class": "slide"}

**Distillation transfers attention, not just labels**

The student GAT learns *how* the teacher attends —
the structural inductive bias, not just the output distribution.

```{figure} https://frenken-lab.github.io/kd-gat-paper/figures/kd-gat.html
:label: fig-kdgat-story
```

+++

+++ {"class": "slide"}

**Architecture**

```{figure} https://frenken-lab.github.io/kd-gat-paper/figures/architecture.html
:label: fig-arch-story
```

+++

+++ {"class": "slide-full"}

<p class="stat">94%</p>

### Performance recovery at 60% parameter cost

KD-GAT closes 94% of the GNN-to-GAT gap while using 40% fewer parameters.

+++

+++ {"class": "slide"}

**ROC across attack classes**

The student preserves attack-boundary precision even at reduced capacity.

```{figure} https://frenken-lab.github.io/kd-gat-paper/figures/pareto-frontier.html
:label: fig-pareto-story
```

+++

+++ {"class": "slide"}

**Representation space (UMAP)**

Teacher and student learn nearly identical latent geometry —
distillation works at the representation level, not just the output.

```{figure} https://frenken-lab.github.io/kd-gat-paper/figures/umap.html
:label: fig-umap-story
```

+++

+++ {"class": "slide"}

**Attention transfer**

```{figure} https://frenken-lab.github.io/kd-gat-paper/figures/attention-heatmap.html
:label: fig-attn-story
```

+++

+++ {"class": "slide-full"}

### Takeaways

- Distillation transfers attention structure, not just labels
- 60% parameter reduction with 94% performance recovery
- Deployable on constrained CAN-bus hardware

+++
