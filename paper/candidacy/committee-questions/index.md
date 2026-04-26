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

## Cross-cutting themes

The nine answers are not independent: they compose into five conceptual threads. Naming these explicitly helps the framework read as a coherent thesis rather than a tour of methods.

**1. Trust as a first-class primitive.** Five questions — Q1.1 (physics-prior trust), Q2.1 (output-confidence trust), Q2.2 (explanation trust), Q4.1 (reward-proxy trust), Q1.2 (estimator trust) — are versions of the same "when do I trust X?" problem with different X. The framework needs *one* trust calculus, not five independent reliability heuristics.

**2. Selective prediction / deferral as the safety primitive.** Chow's reject option appears explicitly in Q1.1 (composite trust score) and Q2.1 (selective-prediction risk-coverage), implicitly in Q4.1 (UCB deferral), and reappears in Q2.2 (low-confidence + low-agreement → abstain). One unified deferral mechanism is the natural composition.

**3. Heterogeneity as the unifying learning challenge.** Six questions — Q1.2 (sensor / extraction), Q3.1 (capacity vs. task complexity), Q3.2 (non-IID across vehicles), Q3.3 (curriculum modifies effective distribution), Q4.1 (train-vs.-deploy reward), Q4.2 (expert heterogeneity) — all reduce to a distribution-shift problem wearing different costumes. This is the unifying challenge of fleet-scale automotive IDS.

**4. Calibration as a methodological prerequisite.** Q2.1's calibration framework gates Q2.2 (the high-confidence diagnostic), Q3.3 (curriculum-induced miscalibration), Q4.1 (UCB selective-prediction calibration), and Q1.1 ($\mathcal{V}_{\text{residual}}$ as a regime-conditioned calibration claim). Measuring calibration is the highest-leverage single experiment for this framework.

**5. The composition pipeline.** Q1.1's trust gates, Q4.2's continuous-simplex policy, Q4.1's safety shield + UCB deferral, and Q2.1's conformal abstain compose into a single deployment-time decision pipeline. This composition is the integrative systems claim of the proposed thesis.

## The composition pipeline

The pipeline below is the integrative claim that pulls Q1.1, Q4.1, Q4.2, and Q2.1 together. Each stage targets a distinct failure mode; the gates compose multiplicatively. A bad input fails the trust gates; a contested input fails the conformal abstain; a brittle reward fails the UCB deferral. The final action is either *act* (high confidence on a regime-valid input) or *defer to human* (any gate or bandit confidence falls short).

```
state s_t  →  Trust gates (Q1.1)  →  Simplex policy (Q4.2)  →  Safety shield (Q4.1)
                                                              →  UCB deferral (Q4.1)
                                                              →  Conformal abstain (Q2.1)
                                                              →  {Detect / Act, Defer to Human}
```

A diagram of the composition is built at `_build/figures/composition-pipeline.html`; it is not yet embedded in this candidacy build but is available as an artifact of the paper repo.

## Consolidated deliverables

The nine answers' "Open questions" sections collectively identify ~30 distinct deliverables, grouped below by character and rough cost. Each item is tagged by the questions it spans. *Empirical (post-hoc, no retrain)* items unlock four chapters' worth of empirical claims and are the highest cost-to-information-ratio set; they should be done first.

### Empirical — post-hoc on existing checkpoints (no retrain)

| Deliverable | Spans | Defuses |
|---|---|---|
| Class-conditional ECE + per-class reliability diagrams under 927:1 imbalance | Q2.1, prerequisite for Q2.2, Q3.3, Q4.1 | "How do you know the model is calibrated?" |
| Risk-coverage curves with bootstrap bands | Q2.1, Q2.2, Q4.1 | "Is the confidence signal monotone in the tails?" |
| Parameter-space distance + prediction-disagreement test (curriculum vs. non-curriculum) | Q3.3 | "Do curriculum and non-curriculum converge to the same solution?" |
| Deletion-AUC + insertion-AUC + @adebayo2018sanity sanity checks on GAT attention | Q2.2 | "Is your attention faithful or decorative?" |
| Regime-stratified F1 by slip-angle / longitudinal-acceleration bucket (benign-only baseline) | Q1.1 | "You have a 3-gate framework but only the outer envelope" |

### Empirical — requires retraining

| Deliverable | Spans | Defuses |
|---|---|---|
| Capacity-ratio sweep $\{1/100, 1/68, 1/30, 1/10, 1/3\}$ tracing the inverted-U from @Towards-Law-of-Capacity-Gap2025 | Q3.1 | "$68\times$ ratio is unablated" |
| Task-complexity sweep at binary / 5-class / 9-class attack typing | Q3.1 | "Capacity-gap law is a claim, not an experiment" |
| Reward-coefficient $\pm 50\%$ ablation across the four reward components | Q4.1 | "How sensitive is the policy to reward design?" |
| $N \in \{2, 3, 4\}$ scaling experiment for fusion policy (discrete vs. softmax vs. Dirichlet) | Q4.2 | "Combinatorial blow-up is argued, not measured" |
| Federated baseline sweep — FedAvg / FedProx / SCAFFOLD on synthetic shards | Q3.2 | "Why should I believe SCAFFOLD beats FedProx on CAN data?" |
| Momentum-coefficient $\tau$ sensitivity (curriculum schedule) | Q3.3 | "Curriculum design is unprincipled" |
| EKF-innovation as 16th fusion-state feature (depends on PINN scaffolding) | Q1.2, Q4.1 | "How does the policy know the estimator is compromised?" |

### Methodological writeups

| Deliverable | Spans |
|---|---|
| Threat-model taxonomy table (attacker access × stage × capability × signature × defence) | Q1.2 |
| Audience-decision protocol elicitation from real fleet operators / safety engineers / OEM compliance | Q2.2 |
| Regime-conditioned plausibility bands replacing static $\pm 40°$ steering bound | Q1.1, Q1.2 |
| Composite trust score validation (product form vs. soft-min vs. learnable mixture) | Q1.1 |
| Slicing-template attestation (signed / version-controlled ByCAN templates) | Q1.2 |
| Byzantine red-team protocol for federated training | Q3.2 |
| Compliance audit-trail for federated training (ISO 26262 / NIST AI RMF) | Q3.2 |

### Engineering integrations

| Deliverable | Spans |
|---|---|
| Continuous-simplex policy prototype (DDPG- or SAC-style actor) | Q4.2 |
| Drift monitor on the proxy reward (KS / PSI on running confidence distribution) | Q4.1 |
| Innovation-sequence monitoring as meta-detector | Q1.2 |
| Online recalibration mechanism (online conformal prediction) | Q2.1, Q3.3 |
| PINN-as-shield post-hoc projection (simplex-restricted / log-barrier / hard projection) | Q4.1, Q1.1 |
| Disagreement-as-OOD selective rule (abstain on (low-conf ∪ low-agreement)) | Q2.1, Q2.2 |
| Explainer-agreement metric across abstraction levels (LIME ↔ TCAV) | Q2.2 |

### Theoretical contributions at intersections

These are higher-order research questions sitting at the intersection of two or more candidacy questions, and represent the cleanest theoretical contributions available within the framework.

| Contribution | Intersection |
|---|---|
| Federated bilevel KD — capacity-gap law under per-client task complexity | Q3.1 ∩ Q3.2 |
| DP-SGD privacy accounting under time-varying curriculum sampling | Q3.2 ∩ Q3.3 |
| Operational rejection bound — composite trust score with conformal coverage guarantee on the PINN-active subset | Q1.1 ∩ Q2.1 |
| Continuous-action regret in simplex policies under bounded reward shift (extension of @xu2022neural's $\tilde{O}(\sqrt{T})$) | Q4.2 ∩ Q4.1 |
| Hierarchical-RL meta-controller using PINN tier system as graceful-degradation primitive | Q1.1 ∩ Q4.2 |
| Curriculum as time-varying importance-weighted ERM — formal bias on the Bayes-optimal classifier under imbalance | Q3.3 |

### Comparative baselines absent from current evaluation

| Baseline | Spans | Why it matters |
|---|---|---|
| Pure observer-based detector (CADD-style [@Chen2024CADD]) at each PINN tier | Q1.1 | Isolates gain from learned correction vs. regime-aware deferral |
| Born-again / mutual learning [@furlanello2018born; @zhang2018deep] | Q3.1 | Isolates gain from capacity gap vs. soft targets per se |
| Mixture-of-Experts gating with top-$k$ | Q4.2 | Closest LM-literature parallel for the multimodal policy observed at $N=2$ |
| Bayesian / Thompson-sampling bandit variant [@riquelme2018deep] | Q4.1 | Tests whether randomised exploration helps under reward shift specifically |

## Reading order

For a committee member reviewing the written submission, the suggested reading order is:

1. This index (cross-cutting themes + composition pipeline)
2. The four topic files in numbered order
3. Returning here for the consolidated deliverables list

Each topic file is self-contained — the answers do not assume the others have been read — but cross-references between answers are dense and intentional. The thesis-level claim is the *composition*, not any single answer.
