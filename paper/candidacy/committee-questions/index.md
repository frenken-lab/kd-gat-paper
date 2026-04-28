---
title: "Candidacy Committee Questions"
subtitle: "Written portion — April 7, 2026"
---

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

While working on these questions, three common themes developed, with the overarching takeaway that an intrusion detection system should have the knowledge of when _not_ to act.

**Trust as a per-sample decision.**

**Calibration before action.**

**Heterogeneity as the common learning challenge.**

## Composition into a coherent system

The threads compose into a single decision pipeline applied to each CAN window:

- trust gates filter inputs the physics model isn't qualified to score,
- a simplex policy fuses the remaining experts,
- a safety shield bounds the physics weight by the trust gates, and
- a conformal abstain rule defers the contested cases to a human reviewer.

The pipeline diagram and per-stage discussion live in [](../proposed-research.md) §Integrative narrative.

As I approach the back-end of my PhD research, the strongest thesis-level claim is at the intersection of trust and calibration: a distribution-free, class-conditional coverage guarantee on the subset of inputs the _operational_ experts are qualified to score, with the envelope tier-conditional on signal availability — widest at tier 1 (DBC + PINN active), narrower but still defensible at tier 4 (data-driven only). That guarantee requires joint calibration of whichever of the five objects above are operational at deployment — treating them as separate concerns, which the field does, breaks the coverage claim regardless of tier. The remaining proposed work — the simplex policy, the federated extension, the curriculum analysis, the explainability sweep — provides the apparatus around that joint calibration.
