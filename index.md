---
title: "Adaptive Fusion of Graph-Based Ensembles for Automotive Intrusion Detection"
subtitle: "Multi-Stage Knowledge Distillation with DQN-Based Expert Fusion"
abstract: |
  Controller Area Network (CAN) intrusion detection in modern vehicles must operate under diverse attack types, severe class imbalance, and strict hardware constraints. We propose a multi-stage, multi-expert ensemble graph framework that models CAN traffic using structural, temporal, and distributional cues. A Variational Graph Autoencoder (VGAE) learns normal graph structure and guides targeted training of a Graph Attention Network (GAT) classifier. A Deep Q-Network adaptively fuses experts per sample. To enable deployment, a resource-aware intelligent knowledge-distillation (KD) pipeline compresses the ensemble into lightweight students, while curriculum imbalance training enhances rare-attack detection.
---

This paper presents a three-stage framework for robust intrusion detection on the Controller Area Network (CAN) bus. Subsequent sections detail the [background](content/background.md), [methodology](content/methodology.md), [experimental setup](content/experiments.md), [results](content/results.md), and [ablation studies](content/ablation.md) that validate our approach across six publicly available CAN intrusion datasets.
