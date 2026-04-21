---
title: "Ablation Study"
---

## Ablation Study

To assess the contribution of different model configurations, we perform ablation experiments investigating three key variables: knowledge distillation, supervised learning training strategies (curriculum learning and hard sample mining), and fusion effectiveness, comparing standalone and fused architectures.

<!-- TODO: Restore cross-refs once ablation tables are exported:
     [](#tbl-ablation-kd), [](#tbl-ablation-gat), and [](#tbl-ablation-fusion) -->

### Experimental Design

We adopt a **one-factor-at-a-time (OFAT)** design [@montgomery2017design]: each ablation axis varies across its candidate values while every other axis is held at a fixed *reference condition*. The reference condition is `conv_type=gatv2` [@brody2022attentive], `loss_fn=focal`, `sampler=default` (non-curriculum), and the supervised baseline for fusion uses VGAE pretraining with the focal-GAT downstream model. This isolates each axis's marginal effect over a single, consistent baseline rather than a moving target that drifts as earlier axes' winners propagate forward.

OFAT is efficient under a constrained GPU budget: across five axes the screening consumes $5 \times (|\text{axis}|) \approx 16$ variants per seed, compared to $3 \cdot 3 \cdot 3 \cdot 3 \cdot 4 = 324$ for a full factorial design. The trade-off is that OFAT cannot detect interaction effects between axes [@box2005statistics]---for example, if `conv_type=gps` and `loss_fn=weighted_ce` happen to combine super-additively, that joint effect is invisible to our screening. We report interaction follow-ups, when motivated, as a targeted factorial over the top-2 candidates of each axis rather than a full grid expansion.

### Seed Variance and Statistical Framing

We run each ablation variant across $N = 3$ seeds (42, 123, 777). This is a deliberately screening-stage budget: @bouthillier2021accounting show that detecting moderate effects in ML benchmarks under $\gamma = 0.75$ and $\alpha = \beta = 0.05$ requires $N \approx 29$ seeds per condition, which is not feasible for a 16-variant sweep on our allocation. We therefore frame screening results as *effect estimates with uncertainty*, not null-hypothesis tests.

For each axis, we report:

- **Cohen's $d$** of the variant against the reference condition, computed on the test-phase metric (F1 for classifier variants, AUROC for reconstruction-flavor variants).
- **95% bootstrap confidence interval** on Cohen's $d$ over the 3 seeds, following @bouthillier2021accounting's recommendation against $p$-values at small $N$.
- **Expected-max performance** across seeds, which captures the "best-of-$N$" bias that seed-tuned hyperparameter comparisons quietly rely on.

Variants whose 95% CI on $d$ excludes zero *and* whose expected-max gap relative to the reference exceeds a pre-registered threshold are promoted to a confirmatory run with additional seeds. This two-stage protocol is standard practice for ablations under compute constraints and makes the transition from screening to confirmation explicit.

### Knowledge Distillation Effects

<!-- TODO: Wire up when ablation_kd.csv is exported from KD-GAT -->

_Awaiting data export for Knowledge Distillation ablation table._

To further characterize how knowledge transfers between teacher and student networks, we compute Centered Kernel Alignment (CKA) between all pairs of teacher and student layers. High CKA values indicate that corresponding layers learn similar representations despite the $20\times$ parameter reduction.

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/cka.html
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

```{include} ../../_build/tables/vgae_threshold.md
```

:::
