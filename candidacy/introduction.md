---
title: "Introduction (Candidacy-Unique)"
---

## Current Roadblocks in Intrusion Detection Systems

1. **Model Brittleness -- No Single Model Captures All Attack Patterns.** A critical vulnerability in current IDS design is the "specialist weakness" phenomenon: individual deep learning models achieve high accuracy on known attacks but are vulnerable to unseen attack types or attacks focusing on a structural weakness of a model's architecture {cite}`OODFailures`, {cite}`OODSurvey`, {cite}`OODDetection`. Different attacks exploit distinct vulnerabilities requiring different detection mechanisms. Structural anomalies (e.g., message flooding) require relational awareness, where graph-based approaches excel, but can miss isolated point anomalies {cite}`Islam`. Behavioral anomalies (e.g., signal spoofing) require learning normal signal distributions with methods such as autoencoders, but struggles with coordinated attacks {cite}`VGAE`. Temporal anomalies (e.g., replay attacks) require understanding state transitions, which neither method alone can fully capture {cite}`Han`. Additionally, severe class imbalance (benign-to-attack ratios of 36:1 to 927:1) compounds this problem. While weighted loss functions improve overall accuracy, they fail on minority classes when models lack diversity {cite}`ClassImbalance`, {cite}`RareEventDetection`. Single models cannot overcome this without excessive overfitting; heterogeneous ensembles with complementary inductive biases naturally handle rare events better {cite}`EnsembleLearning`.
2. **Resource Constraints -- Models Must Fit on Embedded Devices.** Models developed under academic research using GPU-scaling need to significantly downsize to meet the limited onboard resources of production vehicles. Onboard models must be: power efficient, memory efficient, and have low latency. Automotive gateways allocate $<$50W total power (IDS: $<$100mW), use ARM Cortex-A7/A53 processors with 256-512 MB RAM, and require $<$50-100ms latency for real-time response {cite}`EdgeComputing`, {cite}`AutomotiveEdge`, {cite}`IVNRealtimeConstraints`. Recent surveys on edge AI for autonomous vehicles document this deployment gap: while research achieves state-of-the-art accuracy, practical deployment requires 10-100x model compression without acceptable accuracy loss {cite}`EdgeComputing`, {cite}`AutomotiveEdge`, {cite}`MLSystemsBook`.
3. **Model Opaqueness -- Black-Box Models Reduce Trust and Adoption** Highly accurate models face systematic rejection in safety-critical systems because users cannot understand or verify decisions. ISO 26262 (automotive functional safety) mandates verification and validation of safety-critical functions {cite}`ISO26262Part1`, {cite}`ISO26262SafetyCase`. IDS functions typically receive ASIL C/D classification, requiring comprehensive verification of failure modes, where black-box AI models on their own cannot satisfy {cite}`ISO26262SafetyCase`. The NIST AI Risk Management Framework explicitly requires explainability as a core characteristic of trustworthy AI {cite}`NISTAIRisk`. Beyond regulation, industry adoption faces the "trust paradox": organizations systematically choose less accurate but interpretable models over superior black-box alternatives {cite}`Trustworthiness`, {cite}`ModelInterpretability`, {cite}`TrustAI`. Users like fleet operators must be able to audit unexplained decisions or distinguish genuine alerts from noise. A model that has low transparency will decrease adoption rates in industry settings {cite}`BlackBoxRisk`.

## Proposed Contributions

5. **Physics-Informed Anomaly Validation ([](#subsec:PINN)):** Optional PINN module as ensemble component validating physical feasibility of vehicle state. Provides inherent explainability via physics constraint violations, improves learning with deep learning methods, and maintains graceful degradation when dynamics unavailable.
6. **Modular DQN Ensemble Scaling ([](#subsec:DQN)):** Adaptive weighting of multiple specialist models through DQN gating. Able to operate if one or more models unavailable at inference.
7. **Intelligent Knowledge Distillation ([](#subsec:IntelKD)):** Incorporation of automotive hardware constraints and scaling law principles to intelligently design both teacher and student models.
8. **Advanced Explainable AI ([](#subsec:XAI)):** Integration of reliable techniques like LIME {cite}`Ribeiro2016LIME` and SHAP {cite}`SHAP`. In addition, an exploration of recent XAI research including counterfactual analysis {cite}`CounterfactualExplainability`, concept activation vectors (TCAV) {cite}`TCAV`, and prototype-based learning {cite}`PrototypeLearning`.
9. **Cross-Domain Generalization ([](#subsec:CrossD)):** Validation on other network IDS datasets and environments, proving domain-agnostic effectiveness of framework approach beyond automotive domain.

:::{table} Contributions Addressing each Fundamental Problem
:label: tab:contributions

| **Contribution** | **Problem 1** *Brittleness* | **Problem 2** *Resources* | **Problem 3** *Explainability (Trust)* |
|---|---|---|---|
| *Current Framework* | | | |
| GAT + VGAE Ensemble | ✓ | | ✓ |
| Knowledge Distillation (KD) | | ✓ | |
| Multi-level Visuals | | | ✓ |
| CWD | ✓ | | |
| *Proposed Extensions* | | | |
| PINN Physics Module | ✓ | | ✓ |
| DQN Adaptive Weighting | ✓ | | ✓ |
| Intelligent KD | | ✓ | ✓ |
| Advanced XAI | | | ✓ |
| Cross-Domain Validation | ✓ | | |
| **Integrated Framework** | ✓ | ✓ | ✓ |
:::

## Ensemble Architecture: Multi-Expert Model Selection

Automotive anomaly detection requires robust detection across diverse attack vectors distributed across temporal sequences, structural message relationships, payload dynamics, and unknown attack variants. Rather than relying on a single detection paradigm, we employ a four-expert ensemble (GAT, VGAE, PINN, CWD) with DQN-weighted fusion. This section justifies each expert selection based on complementary strengths.

1. **Graph Attention Networks (GAT):** Message-ID relationships are crucial; adversarial attacks often exploit inter-node communication patterns. GAT excels at capturing structural anomalies where there's unusual transitions between ECUs. GAT's attention mechanism learns which message pairs are anomalous, providing precision against targeted injection attacks. GAT weaknesses: long time frames.
2. **Variational Graph Autoencoders (VGAE):** Beyond structure, message frequency distributions and aggregate statistics carry anomaly signals. VGAE operates on the latent generative structure of the message graph, learning a probabilistic model of "normal" CAN topology. Unlike GAT's discriminative attention, VGAE's probabilistic framework excels at detecting out-of-distribution anomalies and unknown attacks. VGAE's weakness: physical grounding, minute structural changes.
3. **Physics-Informed Neural Networks (PINN):** Vehicle dynamics are governed by physical laws: throttle position correlates with acceleration, steering angle bounds yaw rate. A PINN trained on bicycle dynamics equations detects attacks violating physical laws. In addition, PINNs provide interpretability and generalization to other vehicle models. Weakness: PINN requires extracted state variables and a valid dynamics model; which may not always be available.
4. **Cross-Window Temporal Detector (CWD):** Developed in parallel work, the CWD model captures multi-scale temporal anomalies by operating on compact window-level statistics (15-D feature vector) over recent $K$ windows. CWD's transformer attention learns which time windows are anomalous relative to historical context, detecting attacks that may pass individual-window GAT/VGAE checks but create temporal inconsistencies. Weakness: Small structural attacks.
5. **DQN-Weighted Fusion:** The Deep Q-Network learns sample-dependent weights, up-weighting experts based on attack type and signal quality. This adaptive weighting allows for experts to up-weight in their respective strength, and down-weight in their respective blind spots.

In summary, each expert targets a distinct attack surface: GAT captures structural violations, VGAE detects distributional anomalies, PINN enforces physical feasibility, and CWD identifies temporal disruptions.

We propose the first unified framework to reconcile the distinct paradigms of graph topology, physical dynamics, and temporal rhythm into a single coherent defense. This synthesis is both robust and increases trustworthiness through explainability. Finally distilling the multi-expert ensemble in its lightweight form bridges the gap between high-performance deep learning and the resource constraints of edge computing.

:::{table} Ensemble Expert Strengths Across Attack Vectors
:label: tab:ensemble_experts

| **Expert** | **Primary Strength** | **Temporal** | **Structural** | **Physics** | **UnkAtk** |
|---|---|---|---|---|---|
| **GAT** | Message-ID patterns | - | ++ | X | $\sim$ |
| **VGAE** | Distributional | $\sim$ | + | X | ++ |
| **PINN** | Physical feasibility | + | $\sim$ | ++ | $\sim$ |
| **CWD** | Temporal rhythm | ++ | - | X | $\sim$ |
| **DQN** | Fusion | ++ | ++ | ++ | ++ |

**Column Legend:** Temporal = Temporal anomaly detection, Structural = ID-to-ID patterns, Physics = Physics constraints, UnkAtk = Unknown attack robustness.
**Value Legend:** ++ = excellent, + = strong, $\sim$ = moderate, -- = weak, X = N/A.
:::
