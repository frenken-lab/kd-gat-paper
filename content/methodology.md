---
title: "Methodology"
---

## Methodology Overview

The proposed framework employs a three-stage pipeline for robust intrusion detection in Controller Area Network (CAN) bus systems. Stage 1 uses a Variational Graph Autoencoder (VGAE) to identify hard examples; Stage 2 trains a Graph Attention Network (GAT) with curriculum learning on filtered samples; Stage 3 leverages a Deep Q-Network (DQN) to learn dynamic fusion weights combining VGAE and GAT predictions. The workflow supports both training (sequential stages) and inference (parallel GAT/VGAE outputs fused by DQN).

### Graph Construction

CAN messages are broadcast by Electronic Control Units (ECUs); CAN IDs identify message types and are not unique per packet---multiple ECUs can transmit the same ID, and any ECU can receive all messages. This broadcast model underpins the graph representation, capturing sequential dependencies within the CAN stream.

:::{admonition} Algorithm 1: Graph Construction from CAN Stream
:class: algorithm
:label: alg-graph-construction

**Require:** CAN stream $M = \{m_t = (\text{ID}_t, \text{payload}_t)\}$, window size $W$
**Ensure:** Graphs $\mathcal{G} = \{G_t = (V_t, E_t, X_t, y_t)\}$

1. **for** $t = W$ **to** $|M|$ **do**
    a. $W_t \leftarrow M[t-W+1 : t]$ $\triangleright$ extract window
    b. $\text{source} \leftarrow W_t[:, -3]$; $\text{target} \leftarrow W_t[:, -2]$ $\triangleright$ CAN IDs
    c. $\text{edges} \leftarrow \text{stack}(\text{source}, \text{target})$
    d. $(\text{unique\_edges}, \text{counts}) \leftarrow \text{unique}(\text{edges})$ $\triangleright$ transitions
    e. $V_t \leftarrow \text{unique}(\text{source} \cup \text{target})$ $\triangleright$ unique nodes
    f. $\text{node\_map} \leftarrow \{v \mapsto \text{idx} \mid v \in V_t\}$ $\triangleright$ node indexing
    g. $E_t \leftarrow [(\text{node\_map}[\text{src}], \text{node\_map}[\text{tgt}])$ for $(\text{src}, \text{tgt}) \in \text{unique\_edges}]$
    h. Compute node features: $X_t \in \mathbb{R}^{|V_t| \times 31}$
    i. Compute edge features: $F_t \in \mathbb{R}^{|E_t| \times 12}$
    j. $y_t \leftarrow 1$ if any attack ID $\in W_t$ else $0$ $\triangleright$ label
2. **end for**

:::

Node features (31 dimensions) include: CAN ID, normalized payload bytes (mean across occurrences), occurrence count, temporal position, and statistical moments (mean, std, skewness, kurtosis) computed via Polars group-by aggregation over each node's message occurrences within the window. Edge features (12 dimensions) comprise: frequency count, relative frequency, mean/std inter-arrival intervals, regularity score, temporal position metrics (first, last, spread), reverse-edge indicator, degree product, and degree ratio. Window size $W=100$ balances temporal context and computational efficiency. Graphs are directed and weighted by transition counts; self-loops occur for consecutive identical IDs.

### Training Paradigm

#### Stage 1: VGAE Training and Hard Sample Selection

:::{admonition} Algorithm 2: VGAE-Based Hard Sample Selection
:class: algorithm
:label: alg-hard-sample

**Require:** Trained VGAE model on normal graphs
**Ensure:** Hard-selected training dataset for Stage 2

1. Train VGAE on normal graphs until convergence
2. **for each** normal graph $G_i$ **do**
    a. $R_i \leftarrow \|A_i - \hat{A}_i\|_F^2 / |V_i|^2$ $\triangleright$ reconstruction error
3. **end for**
4. Rank by $R_i$ in descending order; select top-$k$ as hard negatives
5. Combine hard normal samples with all attack samples

:::

High reconstruction error indicates ambiguous or boundary-proximate normal samples. Selective undersampling preserves discriminative hard examples while reducing majority class dominance.

**Architectural Enhancements to VGAE:**

*GATv2 Attention.* All graph convolution layers use GATv2Conv {cite}`brody2022attentive` rather than the original GATConv. GATv2 reorders the attention computation to apply the nonlinearity before the attention parameter, resolving the *static attention* limitation where GATv1 produces the same attention ranking regardless of the query node. This is critical for CAN bus anomaly detection: adversarial messages inject noise into graph structure, and dynamic attention can adaptively down-weight noisy edges while static attention degrades uniformly.

*GraphNorm.* Normalization layers use GraphNorm {cite}`cai2021graphnorm` instead of BatchNorm. BatchNorm normalizes across all nodes in a batch, mixing statistics from different graphs and introducing batch-dependent noise. GraphNorm normalizes per-graph with a learnable shift parameter, preserving graph-level distributional information that is essential for anomaly scoring.

*Masked Feature Reconstruction.* Following GraphMAE {cite}`hou2022graphmae`, a configurable fraction ($\rho = 0.3$ by default) of continuous node features are randomly masked to zero before encoding. The reconstruction loss is then computed only on masked positions:

```{math}
:label: eq-masked-recon
\mathcal{L}_{\text{recon}} = \frac{1}{|\mathcal{M}|} \sum_{(i,j) \in \mathcal{M}} (x_{ij} - \hat{x}_{ij})^2
```

where $\mathcal{M}$ is the set of masked (node, feature) positions. This prevents the encoder from trivially copying features through message passing and forces it to learn structural patterns, improving sensitivity to anomalous reconstruction errors at inference time. CAN ID features (column 0) are never masked, preserving the discrete identity structure.

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

**Knowledge Distillation:** Student GAT mimics pre-trained teacher via logit-level distillation:

```{math}
:label: eq-kd-loss
\mathcal{L}_{\text{KD}} = (1 - \lambda) \mathcal{L}_{\text{CE}} + \lambda T^2 \text{KL}(p_{\text{student}} \| p_{\text{teacher}})
```

where $T$ is temperature (softening factor) and $\lambda$ is mixing coefficient. No intermediate feature distillation applied.

**Architectural Enhancements to GAT:**

*GATv2 Attention.* As with the VGAE encoder, all GAT convolution layers use GATv2Conv {cite}`brody2022attentive` with dynamic attention. GATv2Conv additionally accepts edge features via the `edge_dim` parameter, incorporating the 12-dimensional edge attributes (frequency, temporal intervals, bidirectionality, degree products) into the attention computation. This enables attention-weighted message passing that is conditioned on both node and edge information.

*LSTM Jumping Knowledge.* Layer outputs are aggregated via LSTM-based Jumping Knowledge {cite}`xu2018jk` rather than concatenation. Concatenation-mode JK (`mode="cat"`) applies the same linear combination of layer representations to all nodes, and output dimensionality grows linearly with depth. LSTM-mode JK learns a per-node adaptive combination via a bidirectional LSTM with attention over the sequence of layer outputs, allowing each CAN node (ECU) to draw information from the most informative depth. This also reduces the classifier input dimension from $L \times d$ to $d$ (where $L$ is the number of layers and $d$ is the hidden dimension), decreasing parameters in the fully connected head.

*GPS Graph Transformer (Ablation).* As an ablation, the local GATv2Conv layers can be replaced with GPS layers {cite}`rampasek2022gps`, which combine local message passing with global multi-head self-attention and a feed-forward network in each layer. For CAN bus graphs (20--50 nodes), the global attention component is computationally inexpensive and captures long-range message dependencies that multi-hop local attention may miss. GPS layers are selectable via `conv_type="gps"` in the pipeline configuration.

#### Stage 3: DQN-Based Adaptive Fusion

After Stages 1--2, a Deep Q-Network learns optimal fusion weights combining VGAE and GAT predictions via supervised reinforcement learning. Training uses ground truth labels to compute reward signals.

**State Space:** 15-dimensional feature vector aggregating VGAE and GAT outputs: VGAE reconstruction errors (node, neighbor, CAN ID levels), latent space statistics (mean, std, max, min), VGAE confidence; GAT logits (class 0, class 1), embedding statistics (mean, std, max, min), GAT confidence. All features normalized and clipped to $[0,1]$.

**Action Space:** $N=21$ discrete fusion weights linearly spaced in $[0,1]$. Policy semantics: $\alpha = 0.5$ (equal weighting), $\alpha < 0.5$ (favor VGAE), $\alpha > 0.5$ (favor GAT). Fused anomaly score: $\sigma = (1 - \alpha) \cdot \text{VGAE\_anomaly} + \alpha \cdot \text{GAT\_prob}$; final prediction $\hat{y} = \mathbb{1}[\sigma > 0.5]$.

**Reward Function:** Directly tied to classification accuracy using ground truth labels (supervised RL):

```{math}
:label: eq-reward
R(\hat{y}, y_{\text{true}}, s, \alpha) = \begin{cases}
    +3.0 + r_{\text{agree}} + r_{\text{conf}} & \text{if } \hat{y} = y_{\text{true}} \\
    -3.0 + r_{\text{disagree}} + r_{\text{overconf}} & \text{if } \hat{y} \neq y_{\text{true}}
\end{cases}
```

where $r_{\text{agree}}$ measures alignment between VGAE and GAT (model agreement bonus), $r_{\text{conf}}$ rewards high confidence on correct predictions, $r_{\text{disagree}}$ penalizes misalignment on errors, $r_{\text{overconf}}$ penalizes overconfidence on incorrect predictions, and implicit balance bonus discourages extreme $\alpha$ values.

#### Stage 3 (Alternative): Neural-LinUCB Contextual Bandit Fusion

Because each graph is classified independently---the fusion decision for one CAN window does not affect the next---the sequential MDP assumption underlying DQN is unnecessary. We therefore provide an alternative fusion agent based on contextual bandits {cite}`xu2022neural`, which treats each graph as an independent context-action-reward tuple.

**Algorithm:** Neural-LinUCB {cite}`xu2022neural` decomposes the fusion problem into *deep representation learning* and *shallow exploration*. A neural backbone $f_\theta: \mathbb{R}^{15} \to \mathbb{R}^d$ transforms the raw state vector into a learned representation $\mathbf{z} = f_\theta(\mathbf{s})$. Per-arm ridge regression models then estimate the expected reward for each discrete fusion weight $\alpha_a$, while an upper confidence bound (UCB) term drives exploration:

```{math}
:label: eq-bandit-ucb
a^* = \arg\max_{a \in \{1, \ldots, K\}} \left( \boldsymbol{\theta}_a^\top \mathbf{z} + \beta \sqrt{\mathbf{z}^\top \mathbf{A}_a^{-1} \mathbf{z}} \right)
```

where $\boldsymbol{\theta}_a = \mathbf{A}_a^{-1} \mathbf{b}_a$ are the per-arm weight vectors, $\mathbf{A}_a = \sum_{t: a_t = a} \mathbf{z}_t \mathbf{z}_t^\top + \lambda \mathbf{I}$ is the regularized design matrix, $\mathbf{b}_a = \sum_{t: a_t = a} r_t \mathbf{z}_t$ accumulates observed rewards, and $\beta$ controls exploration magnitude.

**State and Action Spaces:** Identical to DQN---the 15-dimensional state vector and $K=21$ discrete fusion weights are shared across both fusion methods.

**Reward Function:** The same shaped reward as DQN (Equation {eq}`eq-reward`), ensuring a fair comparison between the RL and bandit formulations.

**Linear Update (Closed-Form):** After observing rewards, the per-arm precision matrices $\mathbf{A}_a^{-1}$ are updated incrementally via the Sherman-Morrison formula:

```{math}
:label: eq-sherman-morrison
\mathbf{A}_a^{-1} \leftarrow \mathbf{A}_a^{-1} - \frac{(\mathbf{A}_a^{-1} \mathbf{z})(\mathbf{A}_a^{-1} \mathbf{z})^\top}{1 + \mathbf{z}^\top \mathbf{A}_a^{-1} \mathbf{z}}
```

This requires no gradient computation and runs in $O(d^2)$ per sample.

**Backbone Retraining:** Periodically (every $N$ episodes), the backbone parameters $\theta$ are updated via gradient descent on the replay buffer to improve the learned representation. After retraining, the linear models are reset since the representation space has shifted.

**Theoretical Motivation:** Unlike epsilon-greedy exploration (which explores uniformly at random), the UCB term provides *directed* exploration---arms with high uncertainty receive higher scores, and this uncertainty shrinks as $O(1/\sqrt{n_a})$ with the number of times arm $a$ is pulled. Neural-LinUCB achieves $\tilde{O}(\sqrt{T})$ cumulative regret {cite}`xu2022neural`, matching full NeuralUCB {cite}`zhou2020neural` at a fraction of the computational cost since exploration is confined to the last layer.

**Comparison with DQN:** The bandit formulation removes the target network, discount factor $\gamma$, and Double DQN machinery, replacing them with principled uncertainty-driven exploration. Empirical comparisons between bandit and supervised baselines (MLP, weighted average) {cite}`riquelme2018deep` determine whether the RL formulation provides genuine benefit over simpler approaches.

### Inference Pipeline

At inference, VGAE and GAT execute in parallel to minimize latency. Their outputs are concatenated into the 15D state vector and passed to the DQN for dynamic weight determination and final prediction. Parallelization of VGAE and GAT ensures both models evaluate concurrently, while the DQN adds minimal overhead (single forward pass through a small fully-connected network). This design enables real-time deployment in resource-constrained CAN bus environments with sub-millisecond inference latency.
