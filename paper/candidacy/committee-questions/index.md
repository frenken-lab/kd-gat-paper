---
title: "Candidacy Committee Questions"
subtitle: "Written portion — April 7, 2026"
---

Each topic below pertains to a specific concern in the domain of intrusion detection using ensemble models for a networked system. Each question is addressed in its own section, with a focus on how it adds value to the solution proposed for this research.

**Candidacy Committee**

- Professor Qadeer Ahmed, Advisor
- Professor Anish Arora
- Professor Kevin (Jia) Liu
- Professor Andrew Perrault

**Topics**

1. [Physics and Dynamic Controls](physics-dynamics.md) — Q1.1, Q1.2
2. [Model Interpretability and Calibration](interpretability-calibration.md) — Q2.1, Q2.2
3. [Federated Learning, Optimization, and Convergence](federated-optimization.md) — Q3.1, Q3.2, Q3.3
4. [Reinforcement Learning](reinforcement-learning.md) — Q4.1, Q4.2

## Cross-cutting themes and composition pipeline

The nine answers compose into four cross-cutting threads — *trust as a first-class primitive* (Q1.1, Q1.2, Q2.1, Q2.2, Q4.1), *selective prediction as the safety primitive* (Q1.1, Q2.1, Q2.2, Q4.1), *heterogeneity as the unifying learning challenge* (Q1.2, Q3.1, Q3.2, Q3.3, Q4.1, Q4.2), and *calibration as a methodological prerequisite* (Q2.1 gating Q1.1, Q2.2, Q3.3, Q4.1) — and one integrative claim, the deployment-time composition pipeline that fuses Q1.1's trust gates, Q4.2's simplex policy, Q4.1's safety shield + UCB deferral, and Q2.1's conformal abstain into a single decision pipeline. The full articulation, the pipeline diagram, and the per-stage failure-mode mapping are in [](../proposed-research.md) §Integrative narrative; the deliverables grounded in those threads follow.

## Deliverables

The nine answers identify ~25 distinct deliverables. Below they are ordered by *priority* — what grounds the thesis claim, what builds the deployable apparatus around it, what strengthens specific subclaims, and what is documented but not run as an experiment. The *Cost* column reads as a column-level filter: a committee member who wants to know "what could you run before the defence?" reads only the *post-hoc* rows.

**Cost legend.** *post-hoc* — runnable on existing checkpoints, no retraining; *retrain* — requires a fresh training run; *engineering* — code change, no experiment per se; *methodology* — writeup or design recommendation; *theory* — derivation.

### Primary thesis claim — minimum-viable deliverables

These five experiments ground the operational rejection bound (Q1.1 ∩ Q2.1, the primary thesis claim — see [](../proposed-research.md) §Integrative narrative). All but one are post-hoc; together they convert the bound from theorem to evidenced contribution.

| Deliverable | Cost | Spans | Defuses |
|---|---|---|---|
| Class-conditional ECE + per-class reliability diagrams under 927:1 imbalance | post-hoc | Q2.1 | "How do you know the model is calibrated?" |
| Mondrian conformal coverage gap (empirical − nominal) on PINN-active subset | post-hoc | Q1.1 ∩ Q2.1 | The bound itself |
| Risk-coverage curves with bootstrap bands | post-hoc | Q2.1, Q4.1 | "Is the confidence signal monotone in the tails?" |
| Regime-stratified F1 by slip-angle / longitudinal-acceleration bucket (benign baseline) | post-hoc | Q1.1 | "You have a 3-gate framework but only the outer envelope" |
| Composite trust score validation (product vs. soft-min vs. learnable mixture) | methodology | Q1.1 | Specifies what "PINN-active" means operationally |

### Applied composition pipeline

The deployment pipeline of [](../proposed-research.md) §Integrative narrative requires these extensions to the current $N=2$ fusion. Most are engineering with one retraining experiment to verify scaling.

| Deliverable | Cost | Spans |
|---|---|---|
| Continuous-simplex policy prototype (DDPG- or SAC-style actor) | engineering | Q4.2 |
| $N \in \{2, 3, 4\}$ scaling experiment (discrete vs. softmax vs. Dirichlet) | retrain | Q4.2 |
| PINN-as-shield post-hoc projection (simplex-restricted / log-barrier / hard projection) | engineering | Q1.1, Q4.1 |
| Reward-coefficient $\pm 50\%$ ablation across four reward components | retrain | Q4.1 |
| Drift monitor on proxy reward (KS / PSI on running confidence distribution) | engineering | Q4.1 |

### Supporting empirical work

These strengthen specific Q-level claims but are not load-bearing for the primary thesis. The post-hoc rows can run alongside the primary deliverables; the retrain rows compete for the same training budget.

| Deliverable | Cost | Spans | Defuses |
|---|---|---|---|
| Faithfulness sanity checks ([@adebayo2018sanity]) + deletion/insertion-AUC on GAT attention | post-hoc | Q2.2 | "Is your attention faithful or decorative?" |
| Disagreement-as-OOD selective rule (low-conf ∪ low-agreement, SHAP + CF-GNN) | engineering | Q2.1, Q2.2 | XAI primary contribution |
| Lipschitz stability bounds on attention against graph-structural perturbations | post-hoc | Q2.2, Q1.2 | "Stability is unmeasured" |
| Parameter-distance + prediction-disagreement test (curriculum vs. non-curriculum) | post-hoc | Q3.3 | "Do curriculum and non-curriculum converge to the same solution?" |
| Capacity-ratio sweep $\{1/100, 1/68, 1/30, 1/10, 1/3\}$ tracing the inverted-U | retrain | Q3.1 | "$68\times$ ratio is unablated" |
| Task-complexity sweep at binary / 5-class / 9-class attack typing | retrain | Q3.1 | "Capacity-gap law is a claim, not an experiment" |
| Federated baseline sweep — FedAvg / FedProx / SCAFFOLD on synthetic shards | retrain | Q3.2 | "Why SCAFFOLD over FedProx on CAN data?" |
| Momentum-coefficient $\tau$ sensitivity (curriculum schedule) | retrain | Q3.3 | "Curriculum design is unprincipled" |
| EKF-innovation as 16th fusion-state feature | retrain | Q1.2, Q4.1 | "How does the policy know the estimator is compromised?" |
| Innovation-sequence monitoring as meta-detector | engineering | Q1.2 | Slow-drift attack defence |
| Online recalibration mechanism (online conformal prediction) | engineering | Q2.1, Q3.3 | Operational drift handling |

### Theoretical contributions

The first row is the primary thesis claim, repeated here for completeness. The remainder are supporting theoretical contributions at Q-pair intersections.

| Contribution | Cost | Intersection |
|---|---|---|
| **Operational rejection bound — composite trust score with conformal coverage guarantee on the PINN-active subset (primary thesis claim)** | theory + post-hoc | **Q1.1 ∩ Q2.1** |
| DP-SGD privacy accounting under time-varying curriculum sampling | theory | Q3.2 ∩ Q3.3 |
| Continuous-action regret in simplex policies under bounded reward shift | theory | Q4.1 ∩ Q4.2 |
| Curriculum as time-varying importance-weighted ERM — Bayes-optimal-classifier bias under imbalance | theory | Q3.3 |

### Methodological writeups and missing baselines

These are documented but not run as experiments. Methodological writeups capture design recommendations that don't appear in prior CAN-IDS literature; the baselines are the comparison runs that isolate where each component's gain comes from.

| Item | Type | Spans |
|---|---|---|
| Threat-model taxonomy (attacker access × stage × capability × signature × defence) | methodology | Q1.2 |
| Regime-conditioned plausibility bands replacing static $\pm 40°$ steering bound | methodology | Q1.1, Q1.2 |
| Slicing-template attestation (signed / version-controlled ByCAN templates) | methodology | Q1.2 |
| Byzantine red-team protocol for simulated federation | methodology | Q3.2 |
| Pure observer-based detector (CADD-style [@Chen2024CADD]) at each PINN tier | baseline | Q1.1 |
| Born-again / mutual learning [@furlanello2018born; @zhang2018deep] | baseline | Q3.1 |
| Mixture-of-Experts gating with top-$k$ | baseline | Q4.2 |
| Bayesian / Thompson-sampling bandit variant [@riquelme2018deep] | baseline | Q4.1 |

## Reading order

For a committee member reviewing the written submission, the suggested reading order is:

1. This index (cross-cutting themes + deliverables tables)
2. [](../proposed-research.md) §Integrative narrative — primary thesis claim and composition pipeline
3. The four topic files in numbered order

Each topic file is self-contained — the answers do not assume the others have been read — but cross-references between answers are dense and intentional. **The thesis-level claim is the operational rejection bound (Q1.1 ∩ Q2.1)**; the composition pipeline is the applied apparatus that turns the bound into a deployable system.
