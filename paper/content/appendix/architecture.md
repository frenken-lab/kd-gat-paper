---
title: "Appendix"
---

## Experimental Setup

### Implementation Details

80% of the dataset was utilized for training, 20% for validation, and a distinct test set was compiled by the dataset providers. All experiments were conducted using PyTorch and PyTorch Geometric. Model training and evaluation were performed on GPU clusters provided by the Ohio Supercomputer Center (OSC) [@OhioSupercomputerCenter1987]. Each CAN message carries a CAN ID and 8 data bytes; the graph construction pipeline ([Algorithm 1](#alg-graph-construction)) aggregates windowed messages into 35-dimensional node features and 11-dimensional edge features per graph.

(sec-model-sizing)=
## Model Sizing for Cascading Knowledge Distillation Ensemble

This section provides specific parameter budgets for the three-model student ensemble (GAT classifier, VGAE autoencoder, DQN fusion) derived from the CAN bus latency constraints, with unequal allocation reflecting architectural complexity and inference cost trade-offs.

### Total Parameter Budget

From the CAN bus latency constraint (7 ms hard limit [@ARM-Cortex-A7-TRM]), the total onboard parameter budget is:

$$
N_{\text{onboard, total}} = 173\text{ K parameters (FP32)}
$$

Using the empirical distillation scaling law with target compression ratio $\kappa \approx 20$:

$$
N_{t,\text{model}} \approx 20 \times N_{s,\text{model}} \quad \text{for each model}
$$

### Heterogeneous Model Allocation

Student ensemble members are not equally sized. The GAT classifier and VGAE autoencoder perform primary detection tasks and receive larger parameter budgets, while the DQN fusion model aggregates their outputs and receives reduced allocation:

:::{table} Parameter Budget Allocation Across Student and Teacher Ensembles
:label: tbl-model-allocation

| Model | Student | Teacher | Compression |
|-------|---------|---------|-------------|
| GAT Classifier | 55 K | 1.100 M | $20\times$ |
| VGAE Autoencoder | 86 K | 1.710 M | ${\approx}20\times$ |
| Fusion Agent | 32 K | 687 K | ${\approx}21\times$ |
| **Total (Onboard)** | **173 K** | --- | --- |
| **Total (Offline)** | --- | **3.497 M** | --- |

:::

### Model Architecture Details

[](#tbl-teacher-student) details the architectural parameters for all teacher and student models across the three ensemble members. Each model follows a teacher-student distillation framework with $\approx 20\times$ compression ratio.

:::{table} Teacher and Student Model Parameters for Classifier and Autoencoder
:label: tbl-teacher-student

```{include} ../../../_build/tables/model_parameters.md
```

:::

#### GAT Classifier (55 K Student, 1.100 M Teacher)

Graph attention network over 35 node features with GATv2Conv layers and 11-dimensional edge attributes. Both student and teacher use LSTM-based Jumping Knowledge aggregation, which learns a per-node adaptive combination of layer representations and keeps the output dimension at $d$ (hidden $\times$ heads) rather than $L \times d$. The student model uses 2 GATv2Conv layers with 4 attention heads, 24 hidden channels, 8-dimensional CAN ID embeddings, and a 32-dimensional feature projection, feeding into a 2-layer FC classification head. The teacher expands to 3 GATv2Conv layers with 4 attention heads, 64 hidden channels, 8-dimensional embeddings, and a 48-dimensional feature projection, with a 4-layer FC head for higher representational capacity and softer knowledge targets during distillation.

#### VGAE Autoencoder (86 K Student, 1.710 M Teacher)

Variational graph autoencoder for unsupervised anomaly detection with GATv2Conv layers and 11-dimensional edge attributes. The student model compresses 35-dimensional input features (with a 32-dimensional feature projection) through a 3-layer GATv2Conv encoder (single attention head, progressive schedule $[80 \to 40 \to 16]$) to a 16-dimensional latent space, with 4-dimensional CAN ID embeddings and a symmetric decoder for reconstruction. The teacher uses a deeper encoder with 4 attention heads and a progressive schedule $[480 \to 240 \to 64]$ to a 64-dimensional latent space, with 32-dimensional CAN ID embeddings and a 48-dimensional feature projection for richer representation learning. Both models employ the variational reparameterization trick and masked feature reconstruction ($\rho = 0.3$).

#### Fusion Agent (32 K Student, 687 K Teacher)

Fusion agent for multi-model state aggregation, combining features from the VGAE autoencoder (8D: 3 reconstruction error components, 4 latent statistics, 1 confidence score) and GAT classifier (7D: 2 class probabilities, 4 embedding statistics, 1 confidence score) into a combined 15D input state vector. Both DQN and Neural-LinUCB variants share the same MLP backbone architecture: the student uses 3 hidden layers (128 units each) with LayerNorm, ReLU, and 0.2 dropout; the teacher expands to 3 hidden layers (256 units each). The DQN variant adds a target network ($\gamma = 0$, epsilon-greedy exploration); the bandit variant replaces it with per-arm ridge regression and UCB exploration. The action space $|A| = 21$ corresponds to uniformly spaced fusion weights $\alpha \in [0, 1]$.

### GAT Architecture

| Parameter | Teacher (1.100 M) | Student (55 K) |
|---|---|---|
| GATv2Conv layers | 3 | 2 |
| Attention heads | 4 | 4 |
| Hidden channels | 64 | 24 |
| CAN ID embeddings | 8-d | 8-d |
| Feature projection | 48-d | 32-d |
| JK aggregation | LSTM | LSTM |
| FC head layers | 4 | 2 |
| Dropout | 0.11 | 0.1 |

### VGAE Architecture

Our VGAE encoder progressively compresses the input through multiple GATv2Conv layers.

| Parameter | Teacher (1.710 M) | Student (86 K) |
|---|---|---|
| Input features | 35-d (48-d projection) | 35-d (32-d projection) |
| CAN ID embeddings | 32-d | 4-d |
| Attention heads | 4 | 1 |
| Encoder schedule | $480 \to 240 \to 64$ | $80 \to 40 \to 16$ |
| Latent dim ($\mathbf{z}$) | 64 | 16 |
| Decoder | mirror ($[64, 240, 480]$) | mirror ($[16, 40, 80]$) |
| Neighborhood decoder | MLP | compact MLP |

Both models employ the variational reparameterization trick and masked feature reconstruction ($\rho = 0.3$). The CAN ID is separately classified from the latent representation.

### Fusion Agent Architecture

Both DQN and bandit variants take a 15-dimensional state vector (8 VGAE features + 7 GAT features): VGAE features (8D) comprise 3 reconstruction error components (node, neighbor, CAN ID), 4 latent statistics (mean, std, max, min of $\mathbf{z}$), and 1 confidence score; GAT features (7D) comprise 2 class probabilities, 4 embedding statistics (mean, std, max, min), and 1 confidence score.

| Parameter | Teacher (687 K) | Student (32 K) |
|---|---|---|
| Hidden layers | 3 $\times$ 256 | 3 $\times$ 128 |
| Normalization | LayerNorm | LayerNorm |
| Dropout | 0.2 | 0.2 |
| Actions ($|A|$) | 21 | 21 |
| DQN target updates | every 100 steps | every 100 steps |
| DQN $\gamma$ | 0 | 0 |
| DQN exploration | — | $\epsilon = 0.2$, decay $= 0.995$, $\epsilon_{\min} = 0.01$ |
| Bandit exploration | UCB ($\beta = 1.0$) | UCB ($\beta = 1.0$), retrain every 50 ep. |

## Distillation Training

The GAT and VGAE students train using knowledge distillation from their respective teachers. The distillation loss is a weighted combination of the task loss and the KD loss:

```{math}
:label: eq-appendix-kd-loss
L_{\text{total}} = \alpha \, L_{\text{KD}} + (1 - \alpha) \, L_{\text{task}}
```

where $\alpha = 0.7$ and $L_{\text{KD}}$ employs temperature-scaled softmax with temperature $T = 4.0$:

$$
L_{\text{KD}} = T^{2} \cdot \text{KL}\!\left( \frac{\log \hat{y}_{s}}{T} \;\middle\|\; \frac{\hat{y}_{t}}{T} \right)
$$

For the VGAE, distillation combines latent-space alignment and reconstruction matching:

$$
L_{\text{KD}}^{\text{VGAE}} = 0.5 \, L_{\text{latent}} + 0.5 \, L_{\text{recon}}
$$

where $L_{\text{latent}}$ is the MSE between student and teacher latent representations (with a learned projection when dimensions differ) and $L_{\text{recon}}$ is the MSE between continuous output reconstructions.

## Inference Cost

Combined student ensemble inference (all three models):

$$
\text{FLOPs}_{\text{inference}} = (55\text{ K} + 86\text{ K} + 32\text{ K}) \times 2 = 346\text{ K FLOPs}
$$

$$
\text{Latency}_{\text{inference}} = \frac{346 \text{ K FLOPs}}{50 \text{ MFLOP/s}} \times 0.7 \text{ (sparsity factor)} = 4.8\text{ ms}
$$

This provides $\approx 2.2$ ms safety margin within the 7 ms CAN message cycle (100 Hz), accounting for context switches, cache misses, and interrupt handling.

## Reproducibility

This work used FP32 for training stability, model interpretability, and benchmark reproducibility. INT8 quantization on student models (providing $\approx 2.1\times$ speedup on ARM Cortex-A7) would enable approximately $2.5\times$ parameter expansion while maintaining the same 4.8 ms inference latency. Current work focuses on FP32.
