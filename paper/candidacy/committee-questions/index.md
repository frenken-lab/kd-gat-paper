---
title: "Candidacy Committee Questions"
subtitle: "Written portion — April 7, 2026"
---

The four topics address specific concerns about ensemble-based intrusion detection on the CAN bus.

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

## Three threads across the four answers

The four answers return to one idea: a CAN intrusion detector should know when *not* to act. Three threads develop it.

**Trust as a per-sample decision.** The physics expert (PINN) is reliable inside the linear-tire regime with clean signal extraction; outside that envelope it sees its own model error, not attack signal. The data-driven experts have analogous failure modes. The fusion policy needs to reweight per sample, not by a fixed mixture — Q1.1 develops the gates, Q4.2 develops the policy that consumes them.

**Calibration before action.** Under 927:1 attack imbalance, raw model confidences are not actionable. Q2.1 argues that calibration (Mondrian conformal prediction, class-conditional reliability) is a prerequisite for any selective-prediction or abstain rule downstream. Q1.1, Q2.2, and Q4.1 all depend on this — they propose to defer based on confidence signals, which only works once those signals mean something.

What "calibration" covers here is broader than the classifier softmax. Five objects across the four questions share a calibration state and need joint correction on a single held-out natural-distribution split:

| Object | Where | What it fits | Against what |
|---|---|---|---|
| Classifier logits / softmax | Q2.1 | Class-conditional probability $P(y\mid x)$ | Held-out natural distribution |
| Per-expert competence gates (PINN: $\tau_{\text{model}},\,\tau_{\text{signal}},\,\tau_{\text{ood}}$ at tier 1; VGAE: reconstruction-error threshold; GAT: abstain threshold) | Q1.1, Q2.1 | False-rejection rate $\alpha$ per expert | Benign baseline per modality |
| Inter-branch disagreement | Q2.1, Q4.2 | Disagreement distribution under benign deployment | Held-out fusion-state |
| UCB confidence radius $\beta$ | Q4.1 (Neural-LinUCB) | Coverage of true reward | Bandit replay |
| Reward proxy $\hat R$ | Q4.1 | Estimator of $R_{\text{true}}$ | Held-out outcome distribution |

Each row is a parameter that drifts under deployment shift (Q3.3 curriculum, Q3.2 cross-vehicle, Q4.1 reward) and is currently an isolated concern in its own subfield. The claim is that they share a single calibration apparatus, fit on one held-out split, recalibrated on one cadence — joint correction is what makes the coverage guarantee below defensible. The vector is tier-conditional: only one of the five rows (PINN's competence gates) requires the physics chain. At tier 4 (failed extraction), the remaining four rows still produce a defensible coverage claim on the data-driven envelope alone — graceful degradation is preserved, the spine doesn't collapse with the chain.

**Heterogeneity as the common learning challenge.** The rare-attack curriculum (Q3.3), the federated extension (Q3.1–Q3.3), and the simplex policy generalization (Q4.2) all reduce to handling distribution shift — across attack types, client environments, or operating regimes. The three answers treat it as one problem rather than three separate engineering efforts.

## Composition into a deployment pipeline

The threads compose into a single decision pipeline applied to each CAN window: trust gates filter inputs the physics model isn't qualified to score, a simplex policy fuses the remaining experts, a safety shield bounds the physics weight by the trust gates, and a conformal abstain rule defers the contested cases to a human reviewer. The pipeline diagram and per-stage discussion live in [](../proposed-research.md) §Integrative narrative.

The thesis-level claim is at the intersection of trust and calibration: a distribution-free, class-conditional coverage guarantee on the subset of inputs the *operational* experts are qualified to score, with the envelope tier-conditional on signal availability — widest at tier 1 (DBC + PINN active), narrower but still defensible at tier 4 (data-driven only). That guarantee requires joint calibration of whichever of the five objects above are operational at deployment — treating them as separate concerns, which the field does, breaks the coverage claim regardless of tier. The remaining proposed work — the simplex policy, the federated extension, the curriculum analysis, the explainability sweep — provides the apparatus around that joint calibration.
