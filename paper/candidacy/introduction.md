---
title: "Introduction"
---

## Introduction

Modern vehicles rely on networks of electronic control units (ECUs) to manage everything from engine functions to advanced driver assistance systems (ADAS). Communication between ECUs is typically handled by the Controller Area Network (CAN) protocol, valued for its reliability and cost-effectiveness in in-vehicle networks (IVNs). However, CAN lacks built-in security mechanisms like encryption and authentication, as it was designed under the assumption of a closed, isolated network. With the introduction of on-board diagnostics (OBD) ports and wireless connectivity (e.g., Wi-Fi, cellular, V2X), access to the CAN bus has expanded significantly, opening new attack surfaces. Attacks may now originate from both physical interfaces (OBD-II, USB) and remote channels (Bluetooth, mobile networks), allowing adversaries to inject malicious messages and potentially disrupt or take control of safety-critical vehicle systems.

To counter these threats, intrusion detection systems (IDS) for CAN have become an area of active research. Traditional IDS approaches fall into two main categories: packet-based and window-based methods. Packet-based IDSs analyze individual CAN messages for quick detection, but cannot capture context or correlations across packets, limiting their effectiveness against complex attacks such as spoofing or replay. Window-based IDSs consider sequences of packets, enabling better detection of such attack patterns, but often face challenges with detection delays and performance under low-volume or replay attacks. Recent efforts address these limitations with statistical approaches using graph models, advanced machine learning techniques such as deep convolutional neural networks (DCNNs), and lightweight classifiers. Other studies leverage temporal or dynamic graph features for high-accuracy detection of diverse attack types. Despite strong results---for example, graph neural network (GNN) and variational autoencoder (VAE)-based systems achieving over 97% accuracy---key challenges remain that prevent real-world deployment.

### Motivation: The Deployment Gap

CAN intrusion detection reveals a fundamental tension in adversarial learning: high accuracy on known attack types often correlates with brittle generalization to diverse, imbalanced, and resource-constrained settings. We identify three core challenges that motivate our work:

**Challenge 1: Model Brittleness---No Single Model Captures All Attack Patterns.** A critical vulnerability in current IDS design is the "specialist weakness" phenomenon: individual deep learning models achieve high accuracy on known attacks but are vulnerable to unseen attack types or attacks focusing on a structural weakness of a model's architecture [@OODFailures; @OODSurvey; @OODDetection]. Different attacks exploit distinct vulnerabilities requiring different detection mechanisms. Structural anomalies (e.g., message flooding) require relational awareness, where graph-based approaches excel, but can miss isolated point anomalies [@Islam]. Behavioral anomalies (e.g., signal spoofing) require learning normal signal distributions with methods such as autoencoders, but struggle with coordinated attacks [@VGAE]. Temporal anomalies (e.g., replay attacks) require understanding state transitions, which neither method alone can fully capture [@Han]. Additionally, severe class imbalance (benign-to-attack ratios of 36:1 to 927:1) compounds this problem. While weighted loss functions improve overall accuracy, they fail on minority classes when models lack diversity [@ClassImbalance; @RareEventDetection]. Single models cannot overcome this without excessive overfitting; heterogeneous ensembles with complementary inductive biases naturally handle rare events better [@EnsembleLearning].

**Challenge 2: Resource Constraints---Models Must Fit on Embedded Devices.** Models developed under academic research using GPU-scaling need to significantly downsize to meet the limited onboard resources of production vehicles. Automotive gateways allocate $<$50W total power (IDS: $<$100mW), use ARM Cortex-A7/A53 processors with 256--512 MB RAM, and require $<$50--100ms latency for real-time response [@EdgeComputing; @AutomotiveEdge; @IVNRealtimeConstraints]. Recent surveys on edge AI for autonomous vehicles document this deployment gap: while research achieves state-of-the-art accuracy, practical deployment requires 10--100x model compression without acceptable accuracy loss [@EdgeComputing; @AutomotiveEdge; @MLSystemsBook].

**Challenge 3: Model Opaqueness---Black-Box Models Reduce Trust and Adoption.** Highly accurate models face systematic rejection in safety-critical systems because users cannot understand or verify decisions. ISO 26262 (automotive functional safety) mandates verification and validation of safety-critical functions [@ISO26262Part1; @ISO26262SafetyCase]. IDS functions typically receive ASIL C/D classification, requiring comprehensive verification of failure modes, where black-box AI models on their own cannot satisfy [@ISO26262SafetyCase]. The NIST AI Risk Management Framework explicitly requires explainability as a core characteristic of trustworthy AI [@NISTAIRisk]. Beyond regulation, industry adoption faces the "trust paradox": organizations systematically choose less accurate but interpretable models over superior black-box alternatives [@Trustworthiness; @ModelInterpretability; @TrustAI]. Users like fleet operators must be able to audit unexplained decisions or distinguish genuine alerts from noise. A model that has low transparency will decrease adoption rates in industry settings [@BlackBoxRisk].

These three challenges are often addressed independently. This work takes the position that these challenges are *interdependent*: an ensemble that adaptively fuses complementary experts can be more robust (through diverse inductive biases), more efficient (through knowledge distillation scaled to hardware constraints), and more interpretable (through learned weighting patterns and component-level analysis) than a single monolithic model.

### Technical Approach

To address these challenges, we propose a multi-stage graph neural network (GNN)-based framework that combines a Variational Graph Autoencoder (VGAE) for unsupervised anomaly detection with a Graph Attention Network (GAT) for supervised attack classification. A fusion agent---evaluated as both a Deep Q-Network (DQN) and a Neural-LinUCB contextual bandit---learns to adaptively weight these experts on a per-sample basis, selecting the most informative representation for each message context. Each ensemble component (GAT, VGAE, fusion) is individually distilled into a lightweight student model via knowledge distillation, while a curriculum learning training strategy improves robustness under severe class imbalance.

Key design decisions reflect this framing:

1. **Complementary Experts**: VGAE excels at detecting structural deviations and out-of-distribution anomalies (robustness to unknown attacks), while GAT excels at learning message-level relationships and fine-grained classification (high accuracy on known attacks). Their combination mitigates the single-model brittleness problem.

2. **Sample-Specific Fusion**: Rather than fixed static fusion (e.g., averaging), the fusion agent learns when each expert is most reliable. We evaluate both a DQN and a Neural-LinUCB contextual bandit for this role. The adaptive weighting improves accuracy on imbalanced datasets and provides interpretability: the learned policy reveals which expert dominates for each attack type, enabling operators to understand model behavior.

3. **Hardware-Aware Knowledge Distillation**: The ensemble is distilled into a student model using logit-level and latent-space KD, achieving a $\sim$20$\times$ parameter reduction (designed from automotive hardware constraints) while retaining detection performance. This principled compression bridges the gap between high-accuracy models and resource-constrained automotive gateways.

4. **Curriculum Learning for Imbalance**: Progressive curriculum transitions from balanced to imbalanced sampling, improving minority-class recall without sacrificing overall performance---critical for rare-attack detection in practice.

### Current Contributions

The main contributions of this research are as follows:

1. **Robust Multi-Expert Ensemble**: We propose a two-stage framework combining VGAE and GAT with complementary strengths. VGAE performs unsupervised representation learning and anomaly scoring, while GAT refines attack classification. This combination demonstrates superior performance on class-imbalanced datasets compared to single-model or simple averaging approaches.

2. **Adaptive Decision-Level Fusion**: Unlike static fusion strategies, we introduce both a DQN-based policy and a Neural-LinUCB contextual bandit that learn sample-specific weights for VGAE and GAT, enabling graceful degradation and principled model selection. The bandit formulation is particularly suited to CAN IDS since each graph window is classified independently. The learned policies provide interpretability through visualization of weighting patterns across attack types and model inputs.

3. **Hardware-Aware Knowledge Distillation**: We develop a resource-aware KD pipeline scaled to automotive hardware constraints (ARM Cortex-A7/A53, 256--512MB RAM, 100mW power budget), achieving $\sim$20$\times$ parameter reduction while retaining strong detection performance. This principled approach to model compression bridges the research-to-practice deployment gap.

4. **Curriculum Learning for Class Imbalance**: We design a curriculum that progressively increases class imbalance during training, improving recall on minority attack classes without sacrificing overall accuracy. Experiments demonstrate particular gains on highly imbalanced datasets (927:1 benign-to-attack ratios).

5. **Comprehensive Cross-Dataset Evaluation**: We conduct extensive experiments on six publicly available CAN intrusion datasets, including the newly released can-train-and-test benchmark. Our results demonstrate consistent improvements over prior graph-based methods and strong generalization across diverse vehicle platforms and attack types [@Lampe2024cantrainandtest].

### Proposed Extensions

Building on the current framework, we propose the following extensions to address remaining open challenges:

6. **Physics-Informed Anomaly Validation ([](#subsec:PINN)):** An optional PINN module as an ensemble component that validates physical feasibility of vehicle state. Provides inherent explainability via physics constraint violations, improves learning with deep learning methods, and maintains graceful degradation when dynamics are unavailable.

7. **Modular Ensemble Scaling ([](#subsec:DQN)):** Extension of adaptive fusion (DQN or contextual bandit) from two experts (GAT+VGAE) to four experts (GAT+VGAE+PINN+CWD), with graceful operation when one or more models are unavailable at inference.

8. **Intelligent Knowledge Distillation ([](#subsec:IntelKD)):** Incorporation of automotive hardware constraints and scaling law principles to intelligently design both teacher and student models.

9. **Advanced Explainable AI ([](#subsec:XAI)):** Integration of reliable techniques like LIME [@Ribeiro2016LIME] and SHAP [@SHAP], alongside an exploration of recent XAI research including counterfactual analysis [@CounterfactualExplainability], concept activation vectors (TCAV) [@TCAV], and prototype-based learning [@PrototypeLearning].

10. **Cross-Domain Generalization ([](#subsec:CrossD)):** Validation on other network IDS datasets and environments, proving domain-agnostic effectiveness of the framework approach beyond the automotive domain.

:::{table} Contributions Addressing each Fundamental Problem
:label: tab:contributions

| **Contribution** | **Brittleness** | **Resources** | **Explainability** |
|---|---|---|---|
| *Current Framework* | | | |
| GAT + VGAE Ensemble | ◉ | | ◐ |
| Adaptive Fusion (DQN / Bandit) | ◉ | | ◉ |
| Curriculum Learning | ◉ | | |
| Knowledge Distillation | | ◉ | |
| Cross-Dataset Evaluation | ◐ | | ◐ |
| Attention & Fusion Visualization | | | ◉ |
| *Proposed Extensions* | | | |
| PINN Physics Module | ◉ | | ◉ |
| CWD Temporal Detector | ◉ | | |
| Intelligent KD (Scaling Laws) | | ◉ | |
| Advanced XAI (LIME, SHAP, TCAV) | ◐ | | ◉ |
| Cross-Domain Validation | ◉ | | ◐ |
| **Integrated Framework** | ◉ | ◉ | ◉ |

◉ = primary contribution, ◐ = secondary contribution.
:::

### Ensemble Architecture: Multi-Expert Model Selection

Automotive anomaly detection requires robust detection across diverse attack vectors distributed across temporal sequences, structural message relationships, payload dynamics, and unknown attack variants. Rather than relying on a single detection paradigm, we design a multi-expert ensemble with adaptive fusion. The current framework implements GAT and VGAE with DQN/bandit-weighted fusion; proposed extensions add PINN and CWD to form a four-expert ensemble. This section justifies each expert selection based on complementary strengths.

1. **Graph Attention Networks (GAT):** Message-ID relationships are crucial; adversarial attacks often exploit inter-node communication patterns. GAT excels at capturing structural anomalies where there are unusual transitions between ECUs. GAT's attention mechanism learns which message pairs are anomalous, providing precision against targeted injection attacks. GAT weaknesses: long time frames.
2. **Variational Graph Autoencoders (VGAE):** Beyond structure, message frequency distributions and aggregate statistics carry anomaly signals. VGAE operates on the latent generative structure of the message graph, learning a probabilistic model of "normal" CAN topology. Unlike GAT's discriminative attention, VGAE's probabilistic framework excels at detecting out-of-distribution anomalies and unknown attacks. VGAE's weakness: physical grounding, minute structural changes.
3. **Physics-Informed Neural Networks (PINN):** Vehicle dynamics follow well-understood kinematic and dynamic equations. A PINN trained on bicycle dynamics equations detects attacks violating physical laws. In addition, PINNs provide interpretability and generalization to other vehicle models. Weakness: PINN requires extracted state variables and a valid dynamics model; which may not always be available.
4. **Cross-Window Temporal Detector (CWD):** Developed in parallel work, the CWD model captures multi-scale temporal anomalies by operating on compact window-level statistics (15-D feature vector) over recent $K$ windows. CWD's transformer attention learns which time windows are anomalous relative to historical context, detecting attacks that may pass individual-window GAT/VGAE checks but create temporal inconsistencies. Weakness: Small structural attacks.
5. **Adaptive Fusion:** A DQN or contextual bandit learns sample-dependent weights, up-weighting experts based on attack type and signal quality. This adaptive weighting allows experts to contribute in their respective strengths and defer in their respective blind spots.

In summary, each expert targets a distinct attack surface: GAT captures structural violations, VGAE detects distributional anomalies, PINN enforces physical feasibility, and CWD identifies temporal disruptions.

We propose the first unified framework to reconcile the distinct paradigms of graph topology, physical dynamics, and temporal rhythm into a single coherent defense. This synthesis is both robust and trustworthy through explainability. Finally distilling the multi-expert ensemble in its lightweight form bridges the gap between high-performance deep learning and the resource constraints of edge computing.

:::{table} Expert Coverage Across Detection Dimensions
:label: tab:ensemble_experts

| **Expert** | **Status** | **Relational** | **Distributional** | **Temporal** | **Physical** |
|---|---|---|---|---|---|
| **GAT** | Current | ◉ | ○ | ○ | — |
| **VGAE** | Current | ◐ | ◉ | ○ | — |
| **PINN** | Proposed | ○ | ○ | ◐ | ◉ |
| **CWD** | Proposed | ○ | ○ | ◉ | — |

**Dimensions:** Relational = message-ID transition patterns and edge-level attention; Distributional = statistical deviations from learned normal (byte profiles, reconstruction error); Temporal = cross-window sequential patterns (replay, drift, periodicity); Physical = violations of vehicle dynamics constraints.
◉ = primary strength, ◐ = partial coverage, ○ = weak, — = not applicable.
:::

**Emergent properties.** Detection dimensions interact with deployment-relevant properties that cannot be reduced to per-expert ratings. *Generalization to unknown attacks* arises primarily from the distributional and physical dimensions: VGAE flags any deviation from learned normal topology regardless of attack mechanism, while PINN rejects physically infeasible states without requiring attack-specific training. Relational and temporal dimensions are more dependent on training coverage but contribute complementary signals when novel attacks perturb message patterns or timing. *Interpretability* similarly varies by dimension: GAT attention weights and fusion policy weights are directly inspectable, PINN provides physics-grounded explanations via constraint violations, while VGAE's latent-space anomaly scores require post-hoc analysis. The adaptive fusion agent amplifies these properties by learning *which expert to trust* for each sample, providing a decision audit trail that no single expert offers alone.


:::{figure} https://frenken-lab.github.io/kd-gat-paper/assets/images/Framework_Fig.svg 🏷️ fig-framework :width: Graph Fusion Framework :::
