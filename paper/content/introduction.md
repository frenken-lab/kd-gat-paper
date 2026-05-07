---
title: "Introduction"
---

## Introduction

Modern vehicles expose their Controller Area Network (CAN) bus to external attack surfaces through
OBD-II ports, Bluetooth, cellular, and V2X interfaces. CAN was designed without encryption or
authentication; injected messages are indistinguishable from legitimate traffic at the protocol
level, and a successful attack can disrupt safety-critical ECU functions. Intrusion detection
systems (IDS) for CAN are therefore a necessary defense layer, but three properties required for
deployment remain jointly unsolved in the literature.

**No single model covers the attack surface.** Structural anomalies (flooding) require relational
awareness; distributional anomalies (spoofing) require generative modeling of normal topology;
temporal anomalies (replay) require cross-window state reasoning. No architecture addresses all
three, and severe class imbalance (36:1 to 927:1) compounds the failure: aggregate accuracy hides
per-class miscalibration on the minority attack classes that matter most.

**Models must fit on embedded hardware.** Automotive gateways allocate under 100mW to IDS
functions on ARM Cortex-A7/A53 processors with 256–512 MB RAM and a 50–100ms latency budget.
Research-grade models require 10–100× compression to reach this envelope, and compression cannot
be applied post-hoc without principled teacher-student design.

**Black-box models are not deployable.** ISO 26262 assigns ASIL C/D to IDS functions, requiring
verifiable failure-mode analysis that black-box models cannot satisfy. Industry adoption compounds
this: operators systematically prefer interpretable models over more accurate opaque ones.

We propose a multi-expert ensemble — GAT for relational anomalies, VGAE for distributional
anomalies — with a DQN fusion policy that learns per-sample expert weights, hardware-aware
knowledge distillation, and curriculum learning for class imbalance. The key claim is that these
three properties are not independently optimizable: the fusion policy's learned weights provide
interpretability only if the underlying experts have complementary rather than correlated
inductive biases, and the distilled student retains detection performance only if teacher capacity
is designed jointly with the hardware budget.

### Contributions

1. **Multi-Expert Ensemble**: GAT + VGAE with complementary inductive biases, demonstrating
   superior performance on class-imbalanced CAN datasets over single-model and averaging baselines.

2. **Adaptive Fusion via DQN**: Sample-specific fusion weights learned by a DQN policy, providing
   both accuracy gains on imbalanced data and interpretability through learned weighting patterns.

3. **Hardware-Aware Knowledge Distillation**: KD pipeline scaled to ARM Cortex-A7/A53 constraints,
   achieving ~20× parameter reduction while retaining detection performance.

4. **Curriculum Learning for Imbalance**: Progressive curriculum from balanced to natural sampling,
   improving minority-class recall at 927:1 imbalance ratios.

5. **Cross-Dataset Evaluation**: Experiments on six public CAN datasets including
   can-train-and-test [@Lampe2024cantrainandtest], demonstrating consistent generalization across
   vehicle platforms and attack types.
