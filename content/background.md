---
title: "Background"
---

## Background

This section covers fundamental concepts of the CAN protocol, GNNs, VGAE, DQN, and knowledge distillation.

### CAN Bus Protocol

The CAN is a robust serial protocol enabling real-time communication between ECUs in vehicles. In a CAN bus, nodes broadcast messages, while receivers filter and process relevant ones. Each CAN data frame includes a Start-of-Frame, Arbitration, Control, Data, CRC, Acknowledgment, and End-of-Frame field.

### Graph Neural Networks

A graph is a data structure consisting of a set of nodes $V$ and a set of edges $E$ that connect pairs of nodes. A graph can be defined as $G = (V,E)$, where $V = \{v_1, v_2, ..., v_n\}$ is a node set with $n$ nodes, and $E = \{e_1, e_2, ..., e_m\}$ is an edge set with $m$ edges.

Given this graph structure, a GNN looks to find meaningful relationships and insights of the graph. The most common way to accomplish this is through the message passing framework [@gilmer2017mpnn; @scarselli2009gnn], where at each iteration, every node aggregates information from its local neighborhood. Across iterations, node embeddings contain information from further parts of the graph. This update rule can be explained through the following equation:

```{math}
:label: eq-message-passing
\mathbf{h}_v^{(k)} = \phi\big(\mathbf{h}_v^{(k-1)},\ \oplus_{u \in \mathcal{N}(v)} \psi(\mathbf{h}_v^{(k-1)}, \mathbf{h}_u^{(k-1)}, \mathbf{e}_{vu})\big)
```

where $\mathbf{h}$ is the node feature embedding, $\phi$ is the node update function, $\psi$ the message function, $\mathbf{e}_{vu}$ the edge feature, $\oplus$ an aggregation (sum/mean), and $\mathcal{N}(v)$ the neighbors of $v$.

GAT [@velickovic2018gat] builds upon GNNs by introducing an attention mechanism. This allows each node in the message passing framework to dynamically assign weight contributions to their neighbors. For node $v$, the attention coefficient $\alpha_{vu}$ for neighbor $u$ is computed as:

```{math}
:label: eq-gat-attention
\alpha_{vu} = \mathrm{softmax}\left(
    \mathrm{LeakyReLU}\left(
        \mathbf{a}^\top
        \left[
            \mathbf{W}\mathbf{h}_v \| \mathbf{W}\mathbf{h}_u
        \right]
    \right)
\right)
```

where $\mathbf{a}$ is the learnable attention parameter vector, $\mathbf{W}$ is a shared weight matrix, and $\|$ denotes concatenation of the projected node feature vectors.

The attention function computes a scalar weight for each neighbor of node $v_i$, denoted by $\alpha_{ij}$, which reflects the importance or relevance of node $v_j$ for node $v_i$.

```{math}
:label: eq-gat-update
\mathbf{h}_v^{(k)} = \sigma\left(
    \sum_{u \in \mathcal{N}(v)}
    \alpha_{vu} \mathbf{W} \mathbf{h}_u^{(k-1)}
\right)
```

where $\sigma$ is the activation function, normally ELU or ReLU.

The Jumping Knowledge (JK) module [@xu2018jk] enhances GATs by aggregating intermediate layer representations. In this work, we adopt LSTM-based JK aggregation, where a bidirectional LSTM with attention processes the sequence of per-layer embeddings and produces a single adaptive combination per node. Let $\mathbf{h}_v^{(l)}$ denote the representation of node $v$ at layer $l \in \{1, \dots, L\}$. The LSTM reads the layer sequence and outputs a weighted combination:

```{math}
:label: eq-jk-lstm
\mathbf{h}_v^{\text{final}} = \text{LSTM-Attn}\!\left( \mathbf{h}_v^{(1)}, \mathbf{h}_v^{(2)}, \dots, \mathbf{h}_v^{(L)} \right)
```

Unlike concatenation-mode JK, which applies the same linear combination to all nodes and increases the output dimension to $L \times d$, LSTM-mode JK learns a per-node adaptive combination. This allows each CAN node (ECU) to draw information from the most informative depth while keeping the output dimension at $d$, reducing parameters in the downstream classifier.

### Variational Graph Autoencoder

The Variational Graph Autoencoder (VGAE) [@kipf2016variational] is a probabilistic model designed for unsupervised learning on graphs. Given a graph $G=(V, E)$ with adjacency matrix $A$ and node features $X$, VGAE approximates the posterior distribution of latent variables $Z$ using a multi-layer graph convolutional network (GCN) encoder.

The encoder approximates the posterior distribution over the latent variables $Z = \{z_1, \ldots, z_n\}$ by assuming a Gaussian distribution for each node:

```{math}
:label: eq-vgae-encoder
q(Z|X, A) = \prod_{i=1}^{n} \mathcal{N}(z_i|\mu_i, \mathrm{diag}(\sigma_i^2))
```

where $\mu_i \in \mathbb{R}^d$ and $\sigma_i \in \mathbb{R}^d$ are the mean and standard deviation vectors for node $i$. These are parameterized by two separate GCN layers:

```{math}
:label: eq-vgae-gcn-params
\mu = \mathrm{GCN}_\mu(X, A), \quad \log \sigma = \mathrm{GCN}_\sigma(X, A)
```

which capture both local topology and node features. The outputs of these GCNs define the variational posterior $q(Z|X, A)$.

The decoder attempts to reconstruct the graph structure by computing the probability of edge existence between any two nodes $i$ and $j$ as:

```{math}
:label: eq-vgae-decoder
p(A|Z) = \prod_{i=1}^{n} \prod_{j=1}^{n} \sigma(z_i^\top z_j)
```

where $\sigma(\cdot)$ here denotes the sigmoid function (distinct from the activation in Eq. {eq}`eq-gat-update`) and $z_i^\top z_j$ measures similarity in latent space. This inner product decoder encourages connected nodes to have similar embeddings.

The training objective is to maximize the variational evidence lower bound (ELBO), which consists of a reconstruction term and a regularization term:

```{math}
:label: eq-elbo
\mathcal{L} = \mathbb{E}_{q(Z|X, A)}[\log p(A|Z)] - \mathrm{KL}[q(Z|X, A) \| p(Z)]
```

where the first term encourages accurate reconstruction of the observed adjacency matrix, and the second term is the Kullback-Leibler divergence between the approximate posterior and the prior $p(Z) = \prod_{i=1}^{n} \mathcal{N}(z_i|0, I)$, promoting regularization and disentangled latent representations.

While VGAE effectively captures global graph structure, its full-graph decoding may be suboptimal for detecting localized anomalies, especially in sparse or noisy graphs. To address this, @zhou2023gadnr introduced GAD-NR, which replaces full adjacency reconstruction with localized neighborhood prediction. This modification enhances sensitivity to topological deviations at the node-level, making it suitable for intrusion detection in systems like CAN networks. Inspired by this, our architecture adopts neighborhood-level reconstruction via masked decoding over the graph of each CAN window.

(sec-dqn)=
### Deep Q-Network

Deep Q-Networks (DQNs) combine Q-learning with neural networks to handle high-dimensional state spaces [@mnih2013playingatarideepreinforcement]. In traditional Q-learning, an agent learns a Q-table mapping with a (state, action) pair and is given a reward after an action. DQNs replace the Q-table with a neural network that approximates Q-values, enabling learning in more complex environments.

In this framework, the DQN agent learns an optimal weighting policy $\pi(s)$ that dynamically assigns importance scores $\alpha = [\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}]$ to each expert model based on the current CAN message state $s_t$. The state $s_t$ is defined as the concatenation of anomaly scores and confidence scores from both experts. At each step $t$, the agent selects an action $a_t$ corresponding to a weight vector adjustment to minimize the detection loss. The network is trained by minimizing the temporal difference error using the Bellman equation:

```{math}
:label: eq-bellman
L(\theta) = \mathbb{E}_{(s,a,r,s') \sim \mathcal{D}} \left[ \left( r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta) \right)^2 \right]
```

where $\mathcal{D}$ is the experience replay buffer, $\theta$ represents the current network weights, $\theta^-$ are the target network weights, $\gamma$ is the discount factor, and $r$ is the reward derived from correct anomaly classification. Because each CAN window graph is classified independently—the fusion decision for one window does not affect the next—the discount factor is set to $\gamma = 0$, reducing the Bellman target to $r$ alone (pure reward maximization with no bootstrapping). This simplification is appropriate when there is no sequential dependency between fusion decisions; temporal extensions that introduce inter-window state transitions would restore $\gamma > 0$. This formulation allows the ensemble to adaptively prioritize the most reliable expert for specific attack patterns (e.g., up-weighting VGAE for fuzzy attack vs. up-weighting GAT for gear attack), maximizing detection F1-score across diverse scenarios.

### Knowledge Distillation

Knowledge Distillation (KD), popularized by @hinton2015distilling, is a widely adopted model compression technique where a small, efficient student model is trained to reproduce the behavior of a large, accurate teacher model. The soft target probabilities output by a teacher model encode rich relational information between classes that is often not captured by hard labels alone. Training a student model to match these softened outputs enables it to learn a more informative function approximation than training with one-hot labels alone.

Concretely, given an input $x$, the teacher produces a vector of logits $s^t(x)$, which are converted into a softened distribution $\tilde{p}^t_k(x)$ via temperature scaling $\tau$:

```{math}
:label: eq-temperature-scaling
\tilde{p}^t_k(x) = \frac{\exp(s^t_k(x)/\tau)}{\sum_j \exp(s^t_j(x)/\tau)}
```

The student is trained to match these probabilities by minimizing the Kullback-Leibler divergence between teacher and student distributions (distillation loss), alongside the standard supervised classification loss:

```{math}
:label: eq-kd-total-loss
\mathcal{L}_{\text{total}} = (1 - \lambda) \cdot \mathcal{L}_{\text{hard}} + \lambda \cdot \mathcal{L}_{\text{KD}}
```

where $\lambda$ balances the contribution of teacher supervision ($\mathcal{L}_{\text{KD}}$) and ground truth ($\mathcal{L}_{\text{hard}}$). Higher $\lambda$ places more weight on the soft targets from the teacher.
