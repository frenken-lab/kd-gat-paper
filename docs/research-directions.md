# Research Directions: From Window Classification to Streaming Federated IDS

Research note — not part of the paper submission. Maps out the 3-paper arc beyond the current KD-GAT work.

## The Three-Paper Arc

| Paper | Core contribution | Detection model |
|-------|------------------|-----------------|
| **1 (current)** | KD pipeline: VGAE→GAT→fusion, compression for edge | Window-based graph classification |
| **2** | Node-level anomaly detection on evolving CAN bus graph | Streaming temporal GNN |
| **3** | Fleet-wide federated learning, vehicle-agnostic detection | Federated temporal GNN |

Each builds on the prior. Paper 1 proves features and KD. Paper 2 proves streaming architecture. Paper 3 proves fleet-scale generalization.

---

## Paper 2: Evolving Graph for CAN Bus IDS

### Problem with Window-Based Classification

The current approach (Paper 1) treats each CAN window graph as an independent classification instance. This creates two categories of problems:

**Engineering complexity.** Variable-size window graphs require dynamic batching (DynamicBatchSampler), node budgets, edge variance handling, and a full budget module to avoid OOM. CPU-side collation (`Batch.from_data_list()`) dominates GPU compute by 2:1 to 16:1, yielding 5-22% GPU utilization. The entire budget/batching system exists solely because windows produce variable-size graphs.

**Lost temporal signal.** Each window is classified independently — the model cannot learn that attacks span multiple windows, exhibit characteristic onset patterns, or evolve over time. The temporal module (spatial GNN + transformer across windows) was added to address this but represents a bolted-on sequence model over an inherently non-sequential architecture.

### The Evolving Graph Formulation

Reframe CAN bus IDS as **node-level anomaly detection on a single persistent graph**:

- **Nodes** = arbitration IDs (fixed set per vehicle, typically 50-100)
- **Edges** = communication patterns (updated incrementally, decayed over time)
- **Node features** = running statistics per ID (message rate, byte entropy, timing regularity)
- **Task** = per-node anomaly score at each timestep

At each timestep:
1. Update graph structure (new edges from recent messages, decay old edges)
2. Spatial aggregation via GNN (within-graph structure)
3. Temporal update via per-node memory (GRU/LSTM over history)
4. Per-node classification (anomaly score)

**Why this eliminates the engineering problems:**
- Fixed graph size (all arb IDs always present) — no variable batching, no budget module
- No collation bottleneck (single graph, constant tensor shapes)
- `torch.compile` works reliably (static shapes)
- Inference latency = update interval (sub-second), not window collection time

### Key Advantages Over Window-Based

| Dimension | Window-based | Evolving graph |
|-----------|-------------|----------------|
| Output granularity | "This window is attack" | "This node is anomalous now" |
| Temporal modeling | None (or bolted-on) | Native via per-node memory |
| Batch complexity | DynamicBatchSampler, budget module | None — fixed graph |
| GPU utilization | 5-22% (collation-dominated) | Higher (no collation) |
| Detection latency | Window size (100+ messages) | Update interval |
| Actionability | "Something is wrong" | "ECU X is compromised" |

### When Evolving Graphs Are Worse

- **Training throughput**: can't batch across independent samples; one graph per forward pass. Slower training per epoch (but faster per step due to fixed shapes).
- **Multi-entity training**: training across multiple vehicles requires batching different graph topologies — reintroduces variable batching, though at a coarser granularity.
- **Dataset restructuring**: current per-window labels must be converted to per-node, per-timestep labels. HCRL and ROAD datasets label which message IDs are injected, so the information exists.

### Related Work

**Temporal Graph Networks.** TGN [rossi2020temporal] introduced continuous-time dynamic graphs with per-node memory modules. The memory is updated via message passing on interaction events, enabling the model to remember node history without explicit sequence modeling. DyRep [trivedi2019dyrep] models temporal point processes on graphs for dynamic link prediction. TGAT [xu2020inductive] applies temporal graph attention for inductive representation learning on dynamic graphs. All three are designed for single evolving graphs — the same setting as the proposed CAN bus formulation.

**CAN Bus IDS with GNNs.** Zhang et al. [zhang2023fedgnn_can] proposed a GNN-based CAN bus anomaly detector that generates directed attributed graphs from message streams, achieving 3ms detection latency — the most directly relevant prior work, though it uses independent graph snapshots rather than a persistent evolving graph. CANShield [shahriar2023canshield] uses deep autoencoders at the signal level across multiple temporal scales. CGTS [zhou2025cgts] uses Graph Transformers with SVDD for temporal CAN patterns. GCN-2-Former [nath2025gcn2former] combines GCN with Transformer layers using sliding-window dynamic graph construction.

**Node-Level Anomaly Detection on Dynamic Graphs.** AddGraph [zheng2019addgraph] extends GCN to dynamic graphs for anomaly detection by combining structural and temporal patterns. TADDY [liu2021taddy] applies graph transformers with structural and temporal node encodings, achieving SOTA on 6 dynamic graph datasets. STRIPE [liu2024stripe] introduces spatial-temporal memory banks storing prototypes of normal node patterns, with 5.8% AUC improvement and 4.6x training speedup. NetWalk [yu2018netwalk] uses dynamic network embeddings with autoencoders for real-time anomaly detection. Ekle & Eberle [ekle2024survey] provide a comprehensive taxonomy covering node, edge, and subgraph anomaly detection on dynamic graphs.

### Open Questions

1. **Edge decay function**: exponential, sliding window, or learned? Decay rate affects how much history the graph retains.
2. **Update granularity**: per-message, per-N-messages, or time-based intervals?
3. **Node memory architecture**: GRU (cheap, sufficient for short history) vs Transformer (expensive, better for long-range)?
4. **KD for streaming models**: how to distill a large streaming GNN into a small one? Teacher and student must share the same temporal update schedule.
5. **Evaluation protocol**: per-node AUC, detection latency, localization accuracy. No established benchmark for CAN bus node-level detection.

---

## Paper 3: Federated Learning for Fleet-Wide CAN Bus IDS

### Motivation

- Vehicle CAN data is privacy-sensitive (driving behavior, location patterns)
- Cannot centralize raw data from a fleet
- Each vehicle has different ECUs, different arbitration IDs, different communication patterns
- A model trained on one vehicle doesn't transfer if tied to specific graph topology

### Why Federated Learning Fits

Each vehicle trains locally on its own evolving graph, shares only model updates with a central aggregator. GNN weights are topology-agnostic (they operate on feature vectors, not fixed node identities), so the global model works on any vehicle.

### The Vehicle-Agnostic Design

The key architectural requirement: **node features must be behavioral, not identity-based**.

Works (current features already do this):
```
node_features = [message_rate, byte_entropy, timing_regularity, payload_variance, ...]
```

Doesn't transfer:
```
node_features = [one_hot(arb_id_0x1A3), ...]  # vehicle-specific
```

The current KD-GAT preprocessing already uses statistical features — federated learning is feasible without architecture changes to the feature pipeline.

### Protocol

```
Vehicle A (50 ECUs):  local training → weight updates →
Vehicle B (80 ECUs):  local training → weight updates → FedAvg aggregator → global model
Vehicle C (65 ECUs):  local training → weight updates →
```

1. Each vehicle trains on its own evolving graph
2. GNN + temporal weights are shared (topology-agnostic)
3. Aggregator averages updates (FedAvg [mcmahan2017fedavg] or robust variants)
4. Global model deployed back — works on any vehicle topology

### Research Challenges

**Non-IID Data.** Each vehicle sees different attack distributions (or no attacks at all). Standard FL assumes roughly IID data across clients. CAN bus is heavily non-IID — some vehicles may never be attacked, others may see only specific attack types. FedProx [li2020fedprox] and SCAFFOLD [karimireddy2020scaffold] address non-IID convergence but haven't been validated on graph anomaly detection with this level of heterogeneity.

**Topology Heterogeneity.** Different graph sizes and structures per client. Most federated GNN work (FedGraphNN [he2021fedgraphnn]) assumes a shared graph or similar topologies. Federated learning over independent graphs with different topologies is underexplored. The recent FedSpectral [gurumurthy2025fedspectral] addresses non-IID heterophilic graphs with spectral GNNs + neural ODEs, suggesting spectral methods may be more robust to topology variation than spatial methods.

**Adversarial Robustness.** A compromised vehicle could poison the federated model by sending malicious weight updates. Byzantine-robust aggregation is critical since the training data itself is security-relevant:
- Krum [blanchard2017krum]: selects the update closest to others (Byzantine-tolerant)
- Trimmed mean [yin2018trimmedmean]: removes outlier updates before averaging
- FedCLEAN [benghali2025fedclean]: uses reconstruction errors from conditional VAE for client trust scoring

**Personalization vs Generalization.** Should the fleet use one global model, or personalized models per vehicle class (sedans vs trucks vs EVs)? Relevant approaches:
- FedPer [arivazhagan2019fedper]: shared base layers + personalized classification head
- Ditto [li2021ditto]: regularized personalization with global model as anchor
- pFedMe [t_dinh2020pfedme]: Moreau envelope-based personalization

### Directly Related Prior Work

Zhang et al. [zhang2023fedgnn_can] already combined federated learning with GNN for CAN bus anomaly detection (IEEE TIFS 2023). Their approach uses independent graph snapshots with FedAvg. The proposed extension would use evolving graphs (from Paper 2) with robust aggregation and personalization — addressing the non-IID and adversarial challenges they did not explore.

FedLiTeCAN [fedlitecan2024] uses a lightweight transformer in a federated CAN bus setting, achieving 98.5% accuracy. This validates the federated CAN bus IDS direction but uses sequence models rather than graph-based approaches.

### Open Questions

1. **Communication efficiency**: how often do vehicles upload updates? Bandwidth-constrained (cellular). Gradient compression, federated distillation?
2. **Attack simulation for training**: how to generate realistic attack data across a fleet for evaluation? Synthetic injection vs replay?
3. **Deployment**: on-vehicle training requires GPU or efficient CPU inference? Connects back to Paper 1's KD compression.
4. **Regulatory**: does sharing model updates (not raw data) satisfy automotive privacy regulations (UNECE WP.29, ISO/SAE 21434)?

---

## References

References below use citation keys. Those marked [*] are already in `references/candidacy.bib`; others need new bib entries.

### Temporal Graph Networks
- [*] [rossi2020temporal] Rossi et al. "Temporal Graph Networks for Deep Learning on Dynamic Graphs." ICML Workshop on Graph Representation Learning, 2020.
- [trivedi2019dyrep] Trivedi et al. "DyRep: Learning Representations over Dynamic Graphs." ICLR 2019.
- [xu2020inductive] Xu et al. "Inductive Representation Learning on Temporal Graphs." ICLR 2020.

### CAN Bus IDS
- [zhang2023fedgnn_can] Zhang, Zeng, Lin. "Federated Graph Neural Network for Fast Anomaly Detection in Controller Area Networks." IEEE TIFS, vol. 18, pp. 1566-1579, 2023.
- [shahriar2023canshield] Shahriar et al. "CANShield: Deep-Learning-Based Intrusion Detection Framework for Controller Area Networks at the Signal Level." IEEE IoT Journal, 2023.
- [zhou2025cgts] Zhou et al. "CGTS: Graph Transformer with SVDD for CAN Bus Temporal Patterns." 2025. [already cited in conclusion.md]
- [nath2025gcn2former] Nath et al. "GCN-2-Former: GCN + Transformer with Sliding-Window Dynamic Graphs." 2025. [already cited in conclusion.md]
- [fedlitecan2024] "FedLiTeCAN: A Federated Lightweight Transformer for CAN Bus IDS." arXiv:2512.24088, 2024.

### Node-Level Anomaly on Dynamic Graphs
- [zheng2019addgraph] Zheng et al. "AddGraph: Anomaly Detection in Dynamic Graph Using Attention-Based Temporal GCN." IJCAI 2019.
- [yu2018netwalk] Yu et al. "NetWalk: A Flexible Deep Embedding Approach for Anomaly Detection in Dynamic Networks." KDD 2018.
- [liu2021taddy] Liu et al. "TADDY: Anomaly Detection in Dynamic Graphs via Transformer." IEEE TKDE vol. 35, 2021. Graph transformer + structural/temporal encoding.
- [liu2024stripe] Liu et al. "STRIPE: Detecting Anomalies in Dynamic Graphs via Memory Enhanced Normality." arXiv:2403.09039, 2024. Spatial-temporal memory banks; 5.8% AUC gain + 4.6x speedup.
- [ekle2024survey] Ekle & Eberle. "Anomaly Detection in Dynamic Graphs: A Comprehensive Survey." ACM TKDD, 2024.

### Federated Learning for IDS
- [nguyen2019diot] Nguyen et al. "DIoT: A Federated Self-learning Anomaly Detection System for IoT." IEEE ICDCS 2019. First federated anomaly detection for IoT; 95.6% on Mirai.
- [agrawal2022fl_ids_survey] Agrawal et al. "FL for IDS: Concepts, Challenges and Future Directions." Computer Communications vol. 195, 2022.

### Federated GNN (additional)
- [zhang2021fedsage] Zhang et al. "FedSage+: Subgraph Federated Learning with Missing Neighbor Generation." NeurIPS 2021. Addresses cross-subgraph missing links.
- [baek2023fedpub] Baek et al. "FED-PUB: Personalized Subgraph Federated Learning." ICML 2023. Personalized sparse masks for subgraph heterogeneity.

### Federated Learning Foundations
- [mcmahan2017fedavg] McMahan et al. "Communication-Efficient Learning of Deep Networks from Decentralized Data." AISTATS 2017.
- [li2020fedprox] Li et al. "Federated Optimization in Heterogeneous Networks." MLSys 2020.
- [karimireddy2020scaffold] Karimireddy et al. "SCAFFOLD: Stochastic Controlled Averaging for Federated Learning." ICML 2020.

### Federated GNN
- [he2021fedgraphnn] He et al. "FedGraphNN: A Federated Learning System and Benchmark for Graph Neural Networks." arXiv:2104.07145, 2021.
- [gurumurthy2025fedspectral] Gurumurthy et al. "Federated Spectral Graph Transformers Meet Neural ODEs for Non-IID Graphs." arXiv:2504.11808, 2025.

### Byzantine-Robust FL
- [blanchard2017krum] Blanchard et al. "Machine Learning with Adversaries: Byzantine Tolerant Gradient Descent." NeurIPS 2017.
- [yin2018trimmedmean] Yin et al. "Byzantine-Robust Distributed Learning: Towards Optimal Statistical Rates." ICML 2018.
- [benghali2025fedclean] Ben Ghali et al. "FedCLEAN: Byzantine Defense by Clustering Errors of Activation Maps in Non-IID FL." arXiv:2501.12123, 2025.

### Personalized FL
- [arivazhagan2019fedper] Arivazhagan et al. "Federated Learning with Personalization Layers." arXiv:1912.00818, 2019.
- [li2021ditto] Li et al. "Ditto: Fair and Robust Federated Learning Through Personalization." ICML 2021.
- [t_dinh2020pfedme] T. Dinh et al. "Personalized Federated Learning with Moreau Envelopes." NeurIPS 2020.
