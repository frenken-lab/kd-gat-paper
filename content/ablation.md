---
title: "Ablation Study"
---

## Ablation Study

To assess the contribution of different model configurations, we perform ablation experiments investigating three key variables: knowledge distillation, supervised learning training strategies (curriculum learning and hard sample mining), and fusion effectiveness, comparing standalone and fused architectures.

<!-- TODO: Restore cross-refs once ablation tables are exported:
     [](#tbl-ablation-kd), [](#tbl-ablation-gat), and [](#tbl-ablation-fusion) -->

### Knowledge Distillation Effects

<!-- TODO: Wire up when ablation_kd.csv is exported from KD-GAT -->

_Awaiting data export for Knowledge Distillation ablation table._

To further characterize how knowledge transfers between teacher and student networks, we compute Centered Kernel Alignment (CKA) between all pairs of teacher and student layers. High CKA values indicate that corresponding layers learn similar representations despite the $20\times$ parameter reduction.

:::{iframe} https://robertfrenken.github.io/kd-gat-paper/assets/html/submission/cka.html
:label: fig-cka
:width: 100%
CKA similarity between teacher and student GAT layers. Hover for exact values.
:::

### GAT Training Strategy

<!-- TODO: Wire up when ablation_gat_training.csv is exported from KD-GAT -->

_Awaiting data export for GAT training strategy ablation table._

### Bandit Fusion vs. Baseline Strategies

:::{table} VGAE Anomaly Detection Threshold Analysis
:label: tbl-vgae-threshold

```{include} ../_build/tables/vgae_threshold.md
```

:::
