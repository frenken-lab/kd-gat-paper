---
title: "Methodology"
---

## Methodology Overview

The proposed framework employs a three-stage pipeline for robust intrusion detection in Controller Area Network (CAN) bus systems. Stage 1 uses a Variational Graph Autoencoder (VGAE) to identify hard examples; Stage 2 trains a Graph Attention Network (GAT) with curriculum learning on filtered samples; Stage 3 leverages a Deep Q-Network (DQN) to learn dynamic fusion weights combining VGAE and GAT predictions. The workflow supports both training (sequential stages) and inference (parallel GAT/VGAE outputs fused by DQN).

### Graph Construction

CAN messages are broadcast by Electronic Control Units (ECUs); CAN IDs identify message types and are not unique per packet---multiple ECUs can transmit the same ID, and any ECU can receive all messages. This broadcast model underpins the graph representation, capturing sequential dependencies within the CAN stream.

(alg-graph-construction)=
:::{admonition} Algorithm 1: Graph Construction from CAN Stream
:class: algorithm

|   |   |   |
|--:|---|---|
|   | **Input:** CAN stream $M = \{m_t = (\text{ID}_t, \text{payload}_t)\}$, window size $W$ |   |
|   | **Output:** Graphs $\mathcal{G} = \{G_t = (V_t, E_t, X_t, y_t)\}$ |   |
| . | **for** $t = W$ **to** $\lvert M \rvert$ **do** |   |
| . | $\quad W_t \leftarrow M[t\!-\!W\!+\!1 : t]$ | extract window |
| . | $\quad \text{source} \leftarrow W_t[:, -3]$; $\text{target} \leftarrow W_t[:, -2]$ | CAN IDs |
| . | $\quad \text{edges} \leftarrow \text{stack}(\text{source}, \text{target})$ |   |
| . | $\quad (\text{unique\_edges}, \text{counts}) \leftarrow \text{unique}(\text{edges})$ | transitions |
| . | $\quad V_t \leftarrow \text{unique}(\text{source} \cup \text{target})$ | unique nodes |
| . | $\quad \text{node\_map} \leftarrow \{v \mapsto \text{idx} \mid v \in V_t\}$ | node indexing |
| . | $\quad E_t \leftarrow [(\text{node\_map}[\text{src}], \text{node\_map}[\text{tgt}])$ for $(\text{src}, \text{tgt}) \in \text{unique\_edges}]$ |   |
| . | $\quad$ Compute node features: $X_t \in \mathbb{R}^{\lvert V_t \rvert \times 35}$ |   |
| . | $\quad$ Compute edge features: $F_t \in \mathbb{R}^{\lvert E_t \rvert \times 11}$ |   |
| . | $\quad y_t \leftarrow 1$ if any attack ID $\in W_t$ else $0$ | label |
| . | **end for** |   |

:::

Node features (35 dimensions) are computed via Polars group-by aggregation over each node's message occurrences within the window. They comprise: per-byte statistics (mean, standard deviation, and range for each of 8 payload bytes; 24 features), temporal and statistical summaries (message count, mean Shannon entropy, skewness, kurtosis; 4 features), graph-structural properties (clustering coefficient, split-half ratio, change rate; 3 features), inter-arrival time statistics (mean and standard deviation; 2 features), and degree (in-degree, out-degree; 2 features). Edge features (11 dimensions) comprise: inter-arrival time between the source and target messages, per-byte absolute differences across 8 payload bytes, a bidirectionality flag indicating whether the reverse edge exists, and edge frequency (transition count). Window size $W=100$ balances temporal context and computational efficiency. Graphs are directed and weighted by transition counts; self-loops occur for consecutive identical IDs.

### Handling Out-of-Vocabulary Arbitration IDs

Each node in the graph is identified by its 11- or 29-bit CAN arbitration ID, which we treat as a categorical feature with a learnable embedding concatenated to the 35-dimensional statistical node vector. Naive use of a per-split identity-lookup embedding is unsafe in the CAN IDS setting: the dominant threat models in every public benchmark---injection, fuzzing, and spoofing---inject previously unseen arbitration IDs as the core attack signal [@rajapaksha2022aiidssurvey]. The ROAD dataset specifically includes fuzzing attacks that transmit random IDs chosen to disrupt CAN operation [@verma2024road]; CAN-MIRGU contains physically verified attacks on 13 previously unseen IDs recorded from a moving vehicle [@rajapaksha2024canmirgu]; and can-train-and-test partitions attacks into seen/unseen splits precisely to benchmark generalization to novel IDs [@Lampe2024cantrainandtest]. A vocabulary constructed from the training split alone therefore under-sizes the embedding table at inference time and raises an `IndexError` on the first attack-injected ID.

To close this hole we (i) construct a single shared vocabulary from the union of all source directories across train, validation, and every test subdirectory at cache-construction time, persist it as an invariant alongside the cache metadata, and (ii) reserve index 0 of the embedding table as a learnable UNK slot that absorbs any genuinely unseen ID encountered at deployment. The three-option design space---informed by 2021--2026 industrial recsys practice for sparse categorical features---trades off gradient coverage against collision control:

- **Lookup + untrained UNK (baseline).** A shared vocabulary with a designated but never-activated UNK row. Routes attack-injected IDs through a zero-gradient embedding; documents the silent-failure mode common in prior CAN IDS work [@rajapaksha2022aiidssurvey; @CANShield].
- **Lookup + stochastic UNK-drop (design-decision control).** During training, each node's arbitration ID is remapped to the UNK slot with probability $p$, forcing gradient through the OOV row on benign traffic so that unseen IDs at inference land in a *trained* slot. The mechanism mirrors Monolith's low-frequency-ID filtering, which routes rare IDs to shared buckets in ByteDance's production recommender [@liu2022monolith].
- **$k$-probe hash embedding (primary, evidence-backed).** Every arbitration ID---seen or unseen---is deterministically mapped to $k$ rows of a bucketed table by complementary hash functions and the per-bucket vectors are combined by a learned aggregation, following the binary-code hash embedding of [@yan2021binaryhash] and the multi-probe "unified embedding" formulation of [@coleman2023unified]. Because all IDs, including attack-injected novel IDs, hit trained buckets by construction, no special OOV token is needed.

The recsys literature has converged on hashed or multiplexed embedding tables as the default treatment for large or dynamic vocabularies; two independent 2023 surveys taxonomize the design space across hash, compositional, and learned-hash families and frame pure identity-lookup embeddings as a legacy choice that does not survive dynamic vocabularies [@zhao2023embedsurvey; @li2023embedcompressurvey]. To our knowledge this recipe has not been transferred into the CAN IDS literature: neither CAN-BERT [@alkhatib2022canbert], CANShield [@CANShield], nor the GAT-based CAN IDS of [@cangat2023] trains a learnable OOV embedding or uses hash-based ID encoding, despite every modern CAN-attack benchmark requiring novel-ID robustness. Explicitly adopting one of the three options above---and ablating them on ROAD, CAN-MIRGU, and can-train-and-test split by "ID seen at training" versus "ID unseen at training"---is a methodological contribution of this work.

### Training Paradigm

#### Stage 1: VGAE Training and Hard Sample Selection

(alg-hard-sample)=
:::{admonition} Algorithm 2: VGAE-Based Hard Sample Selection
:class: algorithm

|   |   |   |
|--:|---|---|
|   | **Input:** Trained VGAE model on normal graphs |   |
|   | **Output:** Hard-selected training dataset for Stage 2 |   |
| . | Train VGAE on normal graphs until convergence |   |
| . | **for each** normal graph $G_i$ **do** |   |
| . | $\quad R_i \leftarrow \lVert \mathbf{A}_i - \hat{\mathbf{A}}_i \rVert_F^2 / \lvert V_i \rvert^2$ | reconstruction error |
| . | **end for** |   |
| . | Rank by $R_i$ descending; select top-$k$ as hard negatives |   |
| . | Combine hard normal samples with all attack samples |   |

:::

High reconstruction error indicates ambiguous or boundary-proximate normal samples. Selective undersampling preserves discriminative hard examples while reducing majority class dominance.

:::{dropdown} Architectural Enhancements to VGAE
:open:

*GATv2 Attention.* All graph convolution layers use GATv2Conv [@brody2022attentive] rather than the original GATConv. GATv2 reorders the attention computation to apply the nonlinearity before the attention parameter, resolving the *static attention* limitation where GATv1 produces the same attention ranking regardless of the query node. This is critical for CAN bus anomaly detection: adversarial messages inject noise into graph structure, and dynamic attention can adaptively down-weight noisy edges while static attention degrades uniformly.

*GraphNorm.* Normalization layers use GraphNorm [@cai2021graphnorm] instead of BatchNorm. BatchNorm normalizes across all nodes in a batch, mixing statistics from different graphs and introducing batch-dependent noise. GraphNorm normalizes per-graph with a learnable shift parameter, preserving graph-level distributional information that is essential for anomaly scoring.

*Masked Feature Reconstruction.* Following GraphMAE [@hou2022graphmae], a configurable fraction ($\rho = 0.3$ by default) of continuous node features are randomly masked to zero before encoding. The reconstruction loss is then computed only on masked positions:

```{math}
:label: eq-masked-recon
\mathcal{L}_{\text{recon}} = \frac{1}{|\mathcal{M}|} \sum_{(i,j) \in \mathcal{M}} (x_{ij} - \hat{x}_{ij})^2
```

where $\mathcal{M}$ is the set of masked (node, feature) positions. This prevents the encoder from trivially copying features through message passing and forces it to learn structural patterns, improving sensitivity to anomalous reconstruction errors at inference time. CAN ID features (column 0) are never masked, preserving the discrete identity structure.

:::

#### Stage 2: GAT Training with Curriculum Learning

**Curriculum Learning:** Momentum-based scheduler transitions from balanced to imbalanced sampling:

```{math}
:label: eq-curriculum-momentum
p_t = 1 - \exp(-t / \tau)
```

Batch composition blends three sources:

```{math}
:label: eq-batch-composition
B_t = (1 - p_t) B_{\text{bal}} + p_t B_{\text{nat}} + \alpha_{\text{buf}} B_{\text{hard}}
```

where $B_{\text{bal}}$ is class-balanced, $B_{\text{nat}}$ reflects natural imbalance, $B_{\text{hard}}$ contains highest-error samples from VGAE buffer ($\alpha_{\text{buf}} = 0.2$), and buffer is refreshed every 100 steps. This prevents premature majority bias while maintaining natural distribution awareness.

**Knowledge Distillation:** Student GAT mimics the pre-trained teacher via logit-level distillation (Eq. {eq}`eq-kd-total-loss`), using temperature-scaled soft targets (Eq. {eq}`eq-temperature-scaling`) with $T=4$ and mixing coefficient $\lambda=0.7$. No intermediate feature distillation is applied.

:::{dropdown} Architectural Enhancements to GAT
:open:

*GATv2 Attention.* As with the VGAE encoder, all GAT convolution layers use GATv2Conv [@brody2022attentive] with dynamic attention. GATv2Conv additionally accepts edge features via the `edge_dim` parameter, incorporating the 11-dimensional edge attributes (inter-arrival time, per-byte differences, bidirectionality, edge frequency) into the attention computation. This enables attention-weighted message passing that is conditioned on both node and edge information.

*LSTM Jumping Knowledge.* Layer outputs are aggregated via LSTM-based Jumping Knowledge (Eq. {eq}`eq-jk-lstm`) rather than concatenation, enabling per-node adaptive depth selection while keeping the output dimension at $d$.

*GPS Graph Transformer (Ablation).* As an ablation, the local GATv2Conv layers can be replaced with GPS layers [@rampasek2022gps], which combine local message passing with global multi-head self-attention and a feed-forward network in each layer. For CAN bus graphs (20--50 nodes), the global attention component is computationally inexpensive and captures long-range message dependencies that multi-hop local attention may miss. GPS layers are selectable via `conv_type="gps"` in the pipeline configuration.

:::

#### Stage 3: Adaptive Fusion

After Stages 1--2, a fusion agent learns optimal fusion weights combining VGAE and GAT predictions. Training uses ground truth labels to compute reward signals. We evaluate two fusion formulations---a Deep Q-Network (DQN) and a Neural-LinUCB contextual bandit---that share the same state space, action space, reward function, and MLP backbone architecture, differing only in their exploration and update mechanisms.

**State Space:** 15-dimensional feature vector aggregating VGAE and GAT outputs: VGAE reconstruction errors (node, neighbor, CAN ID levels), latent space statistics (mean, std, max, min), VGAE confidence; GAT class probabilities (class 0, class 1), embedding statistics (mean, std, max, min), GAT confidence. All features normalized and clipped to $[0,1]$.

**Action Space:** $K=21$ discrete fusion weights linearly spaced in $[0,1]$. Policy semantics: $\alpha = 0.5$ (equal weighting), $\alpha < 0.5$ (favor VGAE), $\alpha > 0.5$ (favor GAT). Fused anomaly score: $\sigma = (1 - \alpha) \cdot \text{VGAE}_{\text{anomaly}} + \alpha \cdot \text{GAT}_{\text{prob}}$; final prediction $\hat{y} = \mathbb{1}[\sigma > 0.5]$.

**Reward Function:** Directly tied to classification accuracy using ground truth labels:

```{math}
:label: eq-reward
R(\hat{y}, y_{\text{true}}, \mathbf{s}, \alpha) = \begin{cases}
    +3.0 + r_{\text{agree}} + r_{\text{conf}} & \text{if } \hat{y} = y_{\text{true}} \\
    -3.0 + r_{\text{disagree}} + r_{\text{overconf}} & \text{if } \hat{y} \neq y_{\text{true}}
\end{cases}
```

where $r_{\text{agree}}$ measures alignment between VGAE and GAT (model agreement bonus), $r_{\text{conf}}$ rewards high confidence on correct predictions, $r_{\text{disagree}}$ penalizes misalignment on errors, $r_{\text{overconf}}$ penalizes overconfidence on incorrect predictions, and an implicit balance bonus discourages extreme $\alpha$ values. Both DQN and bandit use this identical reward.

**Shared Backbone:** Both agents use an MLP backbone $f_\theta: \mathbb{R}^{15} \to \mathbb{R}^d$ (3 hidden layers, 128 units each, LayerNorm + ReLU + Dropout) that transforms the normalized state vector into a learned representation $\mathbf{z} = f_\theta(\mathbf{s})$.

##### DQN Fusion

The DQN extends the backbone with a linear output layer producing $K$ Q-values, one per discrete fusion weight. Because each CAN window graph is classified independently---the fusion decision for one window does not affect the next---the discount factor is set to $\gamma = 0$. This reduces the Bellman target (Equation {eq}`eq-bellman`) to pure reward maximization:

```{math}
:label: eq-dqn-loss
\mathcal{L}_{\text{DQN}}(\theta) = \mathbb{E}_{(s,a,r) \sim \mathcal{D}} \left[ \text{SmoothL1}\!\left( Q(s, a; \theta),\; r \right) \right]
```

where $\mathcal{D}$ is an experience replay buffer (capacity 50K) and SmoothL1 loss provides robustness to reward outliers.

**Exploration:** Epsilon-greedy with decaying exploration rate:

```{math}
:label: eq-epsilon-greedy
a_t = \begin{cases}
    \arg\max_{a} Q(s_t, a; \theta) & \text{with probability } 1 - \epsilon \\
    \text{Uniform}(\{1, \ldots, K\}) & \text{with probability } \epsilon
\end{cases}
```

where $\epsilon$ decays as $\epsilon \leftarrow \max(\epsilon_{\min},\; \epsilon \cdot \delta)$ after each episode ($\epsilon_0 = 0.2$, $\delta = 0.995$, $\epsilon_{\min} = 0.01$).

**Target Network:** A separate target network $Q(s, a; \theta^-)$ is hard-copied from $\theta$ every 100 training steps to stabilize updates (Double DQN). With $\gamma = 0$ the target network's role is reduced to providing stable reward baselines during minibatch updates.

##### Neural-LinUCB Contextual Bandit Fusion

Because the fusion decision for each graph is independent, the sequential MDP assumption underlying DQN is unnecessary. Neural-LinUCB [@xu2022neural] decomposes the fusion problem into *deep representation learning* (the shared backbone) and *shallow exploration* (per-arm ridge regression with UCB). This removes the target network, discount factor, and replay-based gradient updates from the decision loop.

**UCB Arm Selection:** Given the backbone representation $\mathbf{z} = f_\theta(\mathbf{s})$, each arm's score combines a reward estimate with an uncertainty bonus:

```{math}
:label: eq-bandit-ucb
a^* = \arg\max_{a \in \{1, \ldots, K\}} \left( \boldsymbol{\theta}_a^\top \mathbf{z} + \beta \sqrt{\mathbf{z}^\top \mathbf{A}_a^{-1} \mathbf{z}} \right)
```

where $\boldsymbol{\theta}_a = \mathbf{A}_a^{-1} \mathbf{b}_a$ are the per-arm weight vectors, $\mathbf{A}_a = \sum_{t: a_t = a} \mathbf{z}_t \mathbf{z}_t^\top + \lambda \mathbf{I}$ is the regularized design matrix, $\mathbf{b}_a = \sum_{t: a_t = a} r_t \mathbf{z}_t$ accumulates observed rewards, and $\beta$ controls exploration magnitude.

**Closed-Form Linear Update:** After observing reward $r_t$ for action $a_t$, the linear model is updated without gradient computation. The reward accumulator and precision matrix are updated jointly:

```{math}
:label: eq-bandit-accum
\mathbf{b}_{a_t} \leftarrow \mathbf{b}_{a_t} + r_t \, \mathbf{z}_t, \qquad \boldsymbol{\theta}_{a_t} \leftarrow \mathbf{A}_{a_t}^{-1} \mathbf{b}_{a_t}
```

The precision matrix inverse $\mathbf{A}_a^{-1}$ is maintained incrementally via the Sherman-Morrison formula:

```{math}
:label: eq-sherman-morrison
\mathbf{A}_{a_t}^{-1} \leftarrow \mathbf{A}_{a_t}^{-1} - \frac{(\mathbf{A}_{a_t}^{-1} \mathbf{z}_t)(\mathbf{A}_{a_t}^{-1} \mathbf{z}_t)^\top}{1 + \mathbf{z}_t^\top \mathbf{A}_{a_t}^{-1} \mathbf{z}_t}
```

This runs in $O(d^2)$ per sample with no gradient computation, making online updates substantially cheaper than DQN's minibatch SGD.

**Backbone Retraining:** Periodically (every $N = 50$ episodes), the backbone parameters $\theta$ are updated via gradient descent on the replay buffer to improve the learned representation. After retraining, the linear models ($\mathbf{A}_a^{-1}$, $\mathbf{b}_a$, $\boldsymbol{\theta}_a$) are reset since the representation space has shifted.

**Theoretical Motivation:** Unlike epsilon-greedy exploration (which explores uniformly at random), the UCB term provides *directed* exploration---arms with high uncertainty receive higher scores, and this uncertainty shrinks as $O(1/\sqrt{n_a})$ with the number of times arm $a$ is pulled. Neural-LinUCB achieves $\tilde{O}(\sqrt{T})$ cumulative regret [@xu2022neural], matching full NeuralUCB [@zhou2020neural] at a fraction of the computational cost since exploration is confined to the last layer. Empirical comparisons between bandit, DQN, and supervised baselines (MLP, weighted average) [@riquelme2018deep] determine whether principled exploration provides genuine benefit over simpler approaches.

### Inference Pipeline

At inference, VGAE and GAT execute in parallel to minimize latency. Their outputs are concatenated into the 15D state vector and passed to the fusion agent for dynamic weight determination and final prediction. Parallelization of VGAE and GAT ensures both models evaluate concurrently, while the fusion agent adds minimal overhead (single forward pass through a small fully-connected network). This design enables real-time deployment in resource-constrained CAN bus environments with sub-millisecond inference latency. Temporal extensions that introduce inter-window state transitions are discussed as future work.
