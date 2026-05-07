---
title: "Introduction"
---

## Introduction

Modern vehicles expose their Controller Area Network (CAN) bus to external attack surfaces through
OBD-II ports, Bluetooth, cellular, and V2X interfaces. CAN was designed without encryption or
authentication; injected messages are indistinguishable from legitimate traffic at the protocol
level. Intrusion detection systems (IDS) for CAN are a necessary defense layer. Despite GNN- and
VAE-based systems achieving over 97% accuracy in controlled settings, three deployment failures
block real-world adoption and remain jointly unsolved.

### Motivation: The Deployment Gap

Each failure is a form of miscalibration of model confidence under shifted or boundary-adjacent
inputs — a framing that determines what counts as a solution.

**Brittleness** is label- and input-conditional miscalibration: class-conditional confidence
collapses on minority attack classes (36:1 to 927:1 imbalance), and no single inductive bias is
competent across all attack surfaces simultaneously. Structural anomalies require relational
awareness (GAT); distributional anomalies require generative topology modeling (VGAE); temporal
anomalies require cross-window reasoning (CWD); physical implausibility requires dynamics
grounding (PINN). A model with only one of these biases produces systematically miscalibrated
confidence on the attack types it was not designed for [@OODFailures; @EnsembleLearning].

**Resource constraint** is capacity-gap miscalibration: the viable teacher-student compression
ratio is not a free parameter but a function of task complexity [@Busbridge2025]. The hardware
budget — ARM Cortex-A7/A53, under 100mW, 50–100ms latency — fixes the student ceiling at ~173K
parameters. A 68× compression ratio sits inside the feasible region for binary CAN detection but
would fall outside it for fine-grained attack typing. This cannot be corrected post-hoc.

**Opacity** is input- and cross-process miscalibration: confidence is high but unverifiable,
either because the input falls outside the apparatus's qualified regime or because independent
experts contradict each other without a principled tie-break. ISO 26262 ASIL C/D mandates
verifiable failure-mode analysis; black-box models cannot satisfy it [@ISO26262Part1]. Industry
adoption compounds this: operators choose interpretable models over accurate opaque ones even at
accuracy cost [@Trustworthiness].

These three failures are interdependent because their calibration mechanisms share an input space.
Calibrating brittleness, resource constraint, and opacity independently — on separate data splits,
with separate mechanisms — allows a conformal abstain rule and a drift detector to simultaneously
fire and suppress on the same sample, voiding operational coverage at the decision boundary under
a novel attack. The joint fix requires fitting all trust thresholds on the same held-out
natural-distribution split against a single operational rejection bound.

### Technical Approach

We propose a heterogeneous multi-expert ensemble (GAT + VGAE, extended to PINN + CWD) with a
learned fusion policy (DQN or Neural-LinUCB bandit), hardware-aware knowledge distillation, and
curriculum learning. The GAT+VGAE branch reads raw CAN bytes independently of the physics
estimation chain — _channel orthogonality_ — so inter-branch disagreement is diagnostic rather
than correlated noise. The fusion policy learns per-sample expert weights; the distilled student
is sized jointly with the hardware budget; calibration is applied jointly across all trust
mechanisms on a single split.

### Current Contributions

1. **Multi-Expert Ensemble**: GAT + VGAE with complementary inductive biases, outperforming
   single-model and averaging baselines on class-imbalanced CAN data.

2. **Adaptive Fusion (DQN + Neural-LinUCB)**: Sample-specific fusion weights, with the bandit
   formulation suited to per-window independent classification. Learned policies provide
   interpretability through weighting-pattern visualization.

3. **Hardware-Aware Knowledge Distillation**: ~20× parameter reduction to ARM Cortex-A7/A53
   constraints while retaining detection performance.

4. **Curriculum Learning for Class Imbalance**: Progressive curriculum improving minority-class
   recall at 927:1 imbalance without overall accuracy loss.

5. **Cross-Dataset Evaluation**: Six public CAN datasets including can-train-and-test
   [@Lampe2024cantrainandtest], with consistent generalization across vehicle platforms.

### Proposed Extensions

Building on the current framework, the dissertation proposes:

6. **PINN Physics Module**: Nonlinear bicycle model (Pacejka tire forces) as a fourth expert,
   providing physically-grounded anomaly scores and interpretable constraint-violation explanations.

7. **Four-Expert Adaptive Fusion**: Scaling the simplex fusion policy from N=2 to N=4 experts
   with a continuous-simplex actor, resolving the K^N action-space blowup at discrete grid size.

8. **Intelligent Knowledge Distillation**: Teacher-student design governed by the capacity-gap
   law, with teacher-assistant chains when the compression ratio exceeds the feasible region.

9. **Advanced XAI**: 2×2 confidence × explainer-agreement diagnostic (SHAP + CF-GNNExplainer)
   composing with the conformal abstain into a stricter selective-prediction rule.

10. **Cross-Domain Validation**: One out-of-domain stress test (SWaT SCADA) to validate the
    graph-IDS-with-physics-prior pattern beyond automotive CAN.

### The Methodological Thesis

The thesis-level contribution is an **operational rejection bound**: a distribution-free,
class-conditional conformal coverage guarantee on the PINN-active input subset, composing the
PINN composite trust score $\lambda_{\text{physics}}(s_t)$ with Mondrian conformal prediction.
This bound is novel because it requires joint calibration — fitting the physics trust gates,
fusion policy thresholds, and conformal predictor on the same held-out split — which the field
does not currently do. The four committee question domains stress-test the apparatus on its four
axes: Q1 (physics prior competence gates), Q2 (joint calibration apparatus and 2×2 diagnostic),
Q3 (curriculum and federation perturbations to calibration), Q4 (fusion policy reward proxy and
bandit confidence radius at deployment).

### Ensemble Architecture

Each expert targets a structurally distinct attack surface. GAT captures relational violations
(ECU message-ID transitions). VGAE detects distributional deviations from learned normal topology.
PINN enforces physical feasibility via bicycle-model residuals. CWD identifies temporal
disruptions across windows. No two-expert subset covers all four dimensions, which is the design
justification for the four-expert ensemble rather than a preference for complexity.

:::{table} Expert Coverage Across Detection Dimensions
:label: tab:ensemble_experts

| **Expert** | **Status** | **Relational** | **Distributional** | **Temporal** | **Physical** |
| ---------- | ---------- | -------------- | ------------------ | ------------ | ------------ |
| **GAT**    | Current    | ◉              | ○                  | ○            | —            |
| **VGAE**   | Current    | ◐              | ◉                  | ○            | —            |
| **PINN**   | Proposed   | ○              | ○                  | ◐            | ◉            |
| **CWD**    | Proposed   | ○              | ○                  | ◉            | —            |

◉ = primary strength, ◐ = partial coverage, ○ = weak, — = not applicable.
:::
