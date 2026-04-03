---
title: "Related Work"
---

## Related Work

Intrusion detection systems (IDS) for in-vehicle CAN networks can be classified by detection scope, data type, and underlying detection paradigm. We organize prior work along these dimensions to highlight the unique contributions of our approach.

### CAN IDS by Detection Scope

**Packet-Based Approaches.** Packet-based IDSs analyze individual CAN frames for fast, lightweight detection, but cannot capture dependencies across messages, limiting effectiveness against sophisticated attacks such as spoofing or replay. For example, @Kang applied deep neural networks to individual CAN messages using simulated data, and @Groza exploited traffic periodicity using Bloom filters. However, these methods are ineffective for aperiodic frames [@Cheng], which are common in real-world CAN buses.

**Window-Based Approaches.** Window-based IDSs analyze sequences of CAN frames, enabling better temporal correlation analysis. @Olufowobi developed timing models for real-time detection without relying on protocol specifications, but still struggled with aperiodic messages and repeated CAN IDs. Frequency and Hamming distance-based methods [@Taylor] are similarly limited against aperiodic attacks [@Bozdal; @Choi]. @Islam combined graph features with statistical tests for anomaly and replay detection, but at the cost of increased latency due to requiring larger message batches.

**Graph-Based Approaches.** Graph-based IDSs better capture ECU communication patterns by modeling message relationships. @Park proposed G-IDCS, which combines an interpretable threshold-based stage with a learnable classifier leveraging message correlation. @cangat2023 applied graph attention networks directly to CAN message graphs, demonstrating GAT's effectiveness for capturing ECU interaction patterns, but operates as a single model without fusion. GUARD-CAN [@guardcan2025] combines graph understanding with recurrent layers for temporal modeling, while CGTS [@zhou2025cgts] integrates a Graph Transformer with SVDD for one-class anomaly detection. However, these approaches typically rely on a single detection paradigm and do not adaptively combine multiple expert models.

### Deep Learning and Ensemble Methods

A recent survey [@gnnids_survey2024] catalogues the rapid adoption of GNN architectures for network IDS, identifying fusion strategies and multi-dataset evaluation as key open challenges. Most recent CAN IDS approaches are anomaly-based, learning normal behavior and flagging deviations. @CNNLSTM proposed a CNN-LSTM-attention hybrid achieving over 98% accuracy by capturing both local and temporal patterns. Graph neural network approaches, such as GIDS [@GIDS], exploit graph convolutional networks (GCNs) to model message relationships, improving detection of structural and contextual anomalies. @CANADS showed that robust feature engineering and data balancing significantly enhance supervised ML-based IDS, achieving up to 97.7% accuracy.

Ensemble methods for automotive IDS typically employ homogeneous models or sequential fusion. The BEPCD framework [@BEPCD] uses an ensemble of tree-based models (XGBoost, Random Forest) with adaptive voting. HyDL-IDS [@HyDL] sequentially fuses CNN and LSTM modules to capture spatiotemporal features, but operates as a single fixed pipeline rather than a dynamic multi-expert system. Meta-IDS [@metaids2025] uses meta-learning to adapt detection across heterogeneous CAN configurations, representing a competing approach to learned adaptation, though it operates as a single adaptive model rather than fusing multiple complementary experts.

### Knowledge Distillation for Deployment

Knowledge distillation (KD) addresses the deployment gap between high-capacity models and resource-constrained automotive hardware. A comprehensive survey of KD methods for GNNs [@kdgraph_survey2023] identifies response-based, feature-based, and relation-based distillation strategies, but notes limited application to safety-critical domains. KD-GAT [@frenken2025kdgat] demonstrated that a distilled GAT student can closely match its teacher's classification accuracy while reducing parameters by over 90%, though the resulting system still struggles with severe class imbalance. LSF-IDM [@lsfidm2024] is the closest prior work combining distillation with fusion for automotive IDS, distilling a BERT teacher into a BiLSTM student with semantic feature integration. However, LSF-IDM operates on sequential NLP-style representations rather than graph structures, limiting its ability to model ECU communication topology. A survey of deep reinforcement learning for IDS [@drlids_survey2024] reveals growing interest in RL-based detection but sparse application to CAN bus domains, motivating our DQN-based fusion agent.

### Multi-Modal and Cross-Domain Approaches

In broader cyber-physical systems (CPS) contexts, frameworks such as DGI-RBM [@DGIRBM] and GDN [@GDN] integrate physical features with GNNs for SCADA systems. However, these approaches rely on feature-level fusion, concatenating physical statistics directly into node embeddings. This static integration is brittle when modalities are missing or corrupted. Multi-view causal inference approaches [@MultiViewCausal] validate the multi-view fusion concept, but lack adaptive, reinforcement learning-based weighting strategies.

### Positioning Our Contribution

The key innovation distinguishing our work is *adaptive decision-level fusion via reinforcement learning*. Rather than static fusion strategies (voting, concatenation, or fixed weighting), we treat VGAE and GAT as independent experts with complementary strengths and use a DQN policy to learn sample-specific weights that adaptively select the most informative representation for each message context. Unlike LSF-IDM's NLP-based distillation or Meta-IDS's single-model adaptation, our approach combines heterogeneous graph experts with learned decision-level fusion and hardware-aware distillation. This enables graceful degradation when one expert is unreliable and provides interpretability through learned weighting patterns.

Additionally, our hardware-aware knowledge distillation pipeline is principally scaled to automotive constraints (ARM Cortex-A7/A53, 256--512 MB RAM, 100 mW power budget), curriculum learning for class imbalance directly addresses the severe data imbalance (up to 927:1 ratios), and multi-dataset evaluation across six publicly available benchmarks demonstrates strong generalization and transferability.

:::{table} Comparison of IDS frameworks. Columns highlight detection paradigm, evaluation breadth, and whether fusion is learned. Our approach is the only framework combining heterogeneous graph experts with adaptive fusion across six datasets.
:label: tbl-comparison

| Framework | Domain | Model | Detection | Fusion | Datasets | Adaptive | Key Gap |
|-----------|--------|-------|-----------|--------|----------|----------|---------|
| BEPCD [@BEPCD] | Auto | RF, XGB | Class. | Vote | 1 | No | Classical ML |
| HyDL [@HyDL] | Auto | CNN-LSTM | Both | Seq. pipeline | 1 | No | Fixed pipeline |
| GIDS [@GIDS] | Auto | GCN | Class. | None | 1 | No | Single model |
| G-IDCS [@Park] | Auto | GNN | Both | Static rules | 1 | No | No learned fusion |
| CAN-GAT [@cangat2023] | Auto | GAT | Class. | None | 1 | No | Single model |
| GUARD-CAN [@guardcan2025] | Auto | GNN+RNN | Anomaly | None | 2 | No | Single model |
| CGTS [@zhou2025cgts] | Auto | Graph-Trans. | Anomaly | SVDD | 1 | No | No classification |
| KD-GAT [@frenken2025kdgat] | Auto | GAT | Class. | KD | 6 | No | No fusion stage |
| LSF-IDM [@lsfidm2024] | Auto | BERT+BiLSTM | Class. | KD+Semantic | 2 | No | NLP-based, no graphs |
| Meta-IDS [@metaids2025] | Auto | Meta-learn | Both | Task-adapt. | 3 | Yes | No expert fusion |
| DGI-RBM [@DGIRBM] | CPS | Phys.+GNN | Anomaly | Feature concat | 1 | No | Static fusion |
| GDN [@GDN] | CPS | GAT | Anomaly | None | 2 | No | Single model |
| **Proposed** | Auto | GAT+VGAE | Both | DQN adaptive | 6 | Yes | *(this work)* |

:::
