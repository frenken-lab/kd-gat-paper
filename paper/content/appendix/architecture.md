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

The student-teacher pairs share each model's architectural family; the teacher differs by depth, width, or attention-head count rather than kind. Specific hyperparameters (channel widths, embedding dimensions, dropout, exploration rates) are tracked in the configs alongside the training code rather than reproduced here, since they are tuned per ablation.

#### GAT Classifier (55 K Student, 1.100 M Teacher)

Graph attention network over 35-dimensional node features and 11-dimensional edge attributes, built from GATv2Conv layers. Both student and teacher use LSTM-based Jumping Knowledge aggregation, which learns a per-node adaptive combination of layer representations and keeps the output dimension at $d$ (hidden $\times$ heads) rather than $L \times d$. The student is shallow — 2 GATv2Conv layers feeding a 2-layer FC classification head; the teacher expands to 3 GATv2Conv layers and a 4-layer FC head, providing higher representational capacity and softer knowledge targets during distillation.

#### VGAE Autoencoder (86 K Student, 1.710 M Teacher)

Variational graph autoencoder for unsupervised anomaly detection, built from GATv2Conv encoder layers and a symmetric MLP decoder. The student progressively compresses 35-dimensional node features through a 3-layer single-head encoder ($[80 \to 40 \to 16]$) into a 16-dimensional latent space; the teacher widens to a 4-head encoder ($[480 \to 240 \to 64]$) and a 64-dimensional latent space for richer representation learning. Both employ the variational reparameterization trick; the CAN ID is separately classified from the latent representation rather than passed through the same reconstruction objective as the continuous features.

#### Fusion Agent (32 K Student, 687 K Teacher)

Fusion agent for multi-model state aggregation. The state vector concatenates VGAE outputs (3 reconstruction error components — node, neighbor, CAN ID; 4 latent statistics — mean, std, max, min of $\mathbf{z}$; 1 confidence score) and GAT outputs (2 class probabilities; 4 embedding statistics — mean, std, max, min; 1 confidence score) into a combined 15-dimensional input. Both DQN and Neural-LinUCB variants share an MLP backbone — 3 hidden layers, 128 units in the student and 256 in the teacher, with LayerNorm and ReLU. The DQN variant trains with bootstrap-free TD targets ($\gamma = 0$, epsilon-greedy exploration); each graph is an independent episode, so no target network is needed. The bandit variant replaces the Q-network with per-arm ridge regression and UCB exploration. The action space $|A| = 21$ corresponds to uniformly spaced fusion weights $\alpha \in [0, 1]$.

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

The reported parameter budgets are FP32 for the deployed students. Training uses mixed precision (`16-mixed`) for the GAT and VGAE stages, and FP32 for the fusion stage, whose compute footprint is small enough that mixed precision yields no benefit. INT8 quantization on student models (providing $\approx 2.1\times$ speedup on ARM Cortex-A7) would enable approximately $2.5\times$ parameter expansion while maintaining the same 4.8 ms inference latency.
