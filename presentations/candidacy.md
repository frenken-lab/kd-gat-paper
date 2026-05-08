---
title: KD-GAT — Candidacy Talk
author: Robert Frenken
date: "2026"
theme: default
aspect_ratio: "16:9"
bibliography: paper/references/own.bib
citation_style: author-year
citation_order: auto
footer:
  left: "Robert Frenken · The Ohio State University"
  center: "{n} / {total}"
  right: "Candidacy · 2026"
---

# KD-GAT

### Adaptive Fusion of Graph-Based Ensembles for Automotive Intrusion Detection

Robert Frenken · The Ohio State University · Candidacy · 2026

---

<!-- layout: section-break -->

## Problem Statement

---

<!-- columns: 3 -->

## Motivation

```box
title: Single Model Brittleness:
tone: muted
content: |
  - individual deep learning models achieve high accuracy on known attacks but are vulnerable to unseen attack types or attacks focusing on a structural weakness of a model’s architecture
  - Axes: In vs Out of Distribution (known vs unknown)
  - Attack "surfaces": structural, distributional, and temporal
  - For supervised models, massive class imbalance (eg 927:1) makes training difficult
```

|||

```box
title: Resource Contraints:
tone: muted
content: |
  - Models developed under academic research using GPU-scaling need to significantly downsize to meet the limited onboard resources of production vehicles
  - ARM Cortex processors require <<50--100ms latency
```

|||

```box
title: Model Opaqueness:
tone: muted
content: |
  - Highly accurate models face systematic rejection in safety-critical systems because users cannot understand or verify decisions
  - Standards like ISO 26262 require verifiable failure-mode analysis — something black-box models cannot satisfy
```

---

<!-- columns: 2 -->

## CAN Bus Network

![CAN Bus Network](CAN_BUS.svg)

_CAN bus topology: ECUs broadcast on a shared bus with no sender authentication — injected messages are indistinguishable from legitimate traffic at the protocol level._

|||

![CAN Frame](CANframe.svg)

_CAN frame anatomy: 11-bit arbitration ID (attack surface), DLC, and up to 8 bytes of payload — the graph node features are computed from these fields._

---

<!-- layout: section-break -->

## Current Framework

---

---

<!-- columns: 4/6 -->
<!-- size: small -->

## VGAE Architecture

- The Variational Graph Autoencoder (VGAE) is a probabilistic model designed for unsupervised learning on graphs.

- The encoder learns the posterior distribution over the latent variables $Z = \{z_1, \ldots, z_n\}$ by assuming a Gaussian distribution for each node:

$$
q(Z|X, A) = \prod_{i=1}^{n} \mathcal{N}(z_i|\mu_i, \mathrm{diag}(\sigma_i^2))
$$

where $\mu_i \in \mathbb{R}^d$ and $\sigma_i \in \mathbb{R}^d$ are the mean and standard deviation vectors for node $i$.

|||

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/vgae.html
height: 480
title: VGAE
```

---

<!-- columns: 2 -->

## GAT Architecture

<img src="GAT.svg" alt="Graph Attention" style="width:100%;max-height:260px;object-fit:contain">

- Inspired by attention models, Graph Attention Transformer (GAT) adds a learnable attention variable $𝛼_𝑣𝑢$ to dynamically weight the importance of a node’s neighbors

$$
\alpha_{vu} = \mathrm{softmax}\left(
    \mathrm{LeakyReLU}\left(
        \mathbf{a}^\top
        \left[
            \mathbf{W}\mathbf{h}_v \| \mathbf{W}\mathbf{h}_u
        \right]
    \right)
\right)
$$

|||

**GATv2 — dynamic attention:**

$$
\alpha_{vu} = \mathrm{softmax}\left(
    \mathbf{a}^\top \mathrm{LeakyReLU}\left(
        \mathbf{W}\left[\mathbf{h}_v \| \mathbf{h}_u\right]
    \right)
\right)
$$

GATv1 applies the nonlinearity _after_ the attention parameter, making rankings query-independent. GATv2 applies it _before_, enabling truly dynamic per-node attention — critical for CAN bus graphs where adversarial injection corrupts edge structure and static attention degrades uniformly.

**Aggregation:**

$$
\mathbf{h}_v’ = \sigma\!\left(\sum_{u \in \mathcal{N}(v)} \alpha_{vu} \cdot \mathbf{W}\mathbf{h}_u\right)
$$

---

<!-- columns: 6/4 -->
<!-- size: small -->

## Fusion: MoE

**MLP Layers**

```python
layers: list[nn.Module] = []
cur = in_dim
for h in hidden:
    layers.extend([nn.Linear(cur, h), nn.ReLU(), nn.Dropout(0.2)])
    cur = h
layers.append(nn.Linear(cur, out_dim))
return nn.Sequential(*layers)
```

**Load Balancing** — $\alpha = 0.01$

```python
P = self._last_gate_weights.mean(dim=0)
K = P.numel()
return K * (P * P).sum()
```

**Loss Function** — $0 =$ collapsed · $\log K =$ uniform

```python
entropy = -(w * w.clamp_min(1e-9).log()).sum(-1).mean()
```

|||

<img src="MoE_MLP.svg" alt="MoE MLP architecture" style="width:100%;height:100%;object-fit:contain">

---

<!-- columns: 4/6 -->

## Architecture Composition

**Three-stage pipeline:**

- **Stage 1 — VGAE:** Unsupervised anomaly detection; reconstruction error $\|A - \hat{A}\|_F^2$ identifies hard normal samples for the Stage 2 curriculum
- **Stage 2 — GAT:** Supervised classification; GATv2Conv with LSTM jumping knowledge
- **Stage 3 — Fusion:** Adaptive learning per-sample. $\alpha$ weighting for DQN or Bandit over VGAE + GAT predictions from a 18-dimensional state vector.
- **Knowledge Distillation:** Each model has its smaller counterpart that would meet on-board resource requirements

|||

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/kd-gat.html
height: 480
title: KD-GAT architecture
```

---

## Ablation Results

<!-- size: small -->

_F1 macro (multiclass, pooled across test splits) · n=1 seed · bold = best in axis × dataset_

| Variant               |   hcrl_sa |    set_01 |    set_02 |    set_03 |    set_04 |
| :-------------------- | --------: | --------: | --------: | --------: | --------: |
| **Loss function**     |           |           |           |           |           |
| CE                    | **0.835** | **0.617** | **0.539** |     0.676 |     0.385 |
| Focal                 |     0.835 |     0.574 |     0.521 | **0.682** |     0.418 |
| Weighted CE           | **0.835** |     0.569 |     0.533 |     0.681 | **0.570** |
| **Sampling strategy** |           |           |           |           |           |
| None                  | **0.835** | **0.577** |     0.522 |     0.682 |     0.415 |
| Curriculum (random)   | **0.835** |         — | **0.530** | **0.683** | **0.432** |
| Curriculum (VGAE)     |     0.770 |     0.556 |     0.522 |     0.674 |     0.411 |
| **ID encoding**       |           |           |           |           |           |
| Hash                  | **0.835** | **0.574** |     0.507 | **0.685** |     0.389 |
| Lookup                |     0.760 |     0.566 | **0.536** |     0.682 | **0.426** |

---

## Main Results

<!-- size: small -->

_F1 macro (multiclass, pooled across test splits) · n=1 seed · bold = best per dataset · — = not yet run_

| Model             |   hcrl_sa |    set_01 |    set_02 |    set_03 |    set_04 |
| :---------------- | --------: | --------: | --------: | --------: | --------: |
| **Fusion**        |           |           |           |           |           |
| MoE               | **0.997** |     0.546 |     0.522 |     0.682 | **0.878** |
| MoE (no aux loss) |         — |     0.544 |     0.521 | **0.682** |     0.423 |
| DQN               |     0.993 | **0.549** |     0.404 |     0.662 |     0.440 |
| MLP               |     0.852 | **0.574** | **0.522** |     0.680 |     0.424 |
| Bandit            |     0.953 |     0.505 |     0.405 |     0.601 |     0.272 |
| Weighted avg      |     0.781 |     0.422 |     0.516 |     0.657 |     0.417 |
| **Student**       |           |           |           |           |           |
| GAT + KD          |     0.835 |         — |         — |         — |         — |
| GAT (no KD)       |     0.743 |     0.572 |     0.527 |     0.681 |     0.438 |

---

## Dimensionality (UMAP) Analysis

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/umap.html
height: 520
title: UMAP embedding analysis
```

---

## Key Result: Representational Alignment (CKA)

**What CKA measures:** Centered Kernel Alignment scores linear similarity between two sets of layer activations; 1.0 = identical representations.

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/cka.html
height: 480
title: CKA representational similarity
```

---

<!-- layout: section-break -->

## Proposed Research

---

## Proposed Work: Composition Pipeline

- **Physics-Informed Neural Network (PINN):** Encode vehicle dynamics as a physics residual loss; provide a causally-independent channel that prevents physically implausible detections and is structurally hard to spoof alongside the data-driven signal
- **Explainability (XAI):** Expose GAT attention weights and SHAP/LIME attributions as per-message attribution maps, satisfying ISO 26262 ASIL C/D auditability requirements
- **Federated Learning (FL):** Train across OEM fleets without sharing raw CAN data; address data-privacy barriers to industry adoption while preserving cross-vehicle generalization
- **Model Sizing (KD):** Map the teacher→student compression frontier systematically; answer how small the model can be before performance degrades under the ARM Cortex-A7/A53 envelope

---

<!-- columns: 2 -->

## Q1: Physics & Dynamic Controls

**When to trust physics vs. data-driven?**

Four-quadrant decision on two axes — _on/off the physics manifold_ × _in/out of training distribution_:

|                  | In distribution               | Out of distribution                                |
| ---------------- | ----------------------------- | -------------------------------------------------- |
| **On manifold**  | Both apply; trivial fusion    | Physics carries the trust                          |
| **Off manifold** | Data-driven carries the trust | Neither alone suffices — the research contribution |

**Channel orthogonality is the structural defense:** data-driven reads raw bytes; physics reads dynamics. Simultaneous corruption requires two structurally different attacks, converting a single attack surface into two independent ones.

|||

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/vehicle-pinn.html
height: 480
title: Vehicle CAN to PINN pipeline
```

---

<!-- TODO: 2 cols add another relevant visualization with description underneath each  -->

## Q2: Model Interpretability & Calibration

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/attention.html
height: 480
title: Attention weight visualization
```

---

## Q3: Federated Learning & Convergence

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fedavg-drift.html
height: 480
title: FedAvg calibration drift
```

---

<!-- columns: 2 -->

## Q4: Reinforcement Learning

**Reward shift at deployment:**

$$
\underbrace{\mathbb{E}_{p_\text{deploy}}[R_\text{true}] - \mathbb{E}_{p_\text{train}}[R_\text{train}]}_{\text{total}} = \underbrace{\Delta p(s)}_{\substack{\text{covariate} \\ \text{shift}}} + \underbrace{\Delta R}_{\substack{\text{proxy–target} \\ \text{divergence}}}
$$

- **Covariate shift:** detectable from the input distribution; importance reweighting applies
- **Proxy–target divergence:** the policy optimizes against its own confidence, which is least trustworthy exactly when the policy is most wrong — undetectable from inputs alone
- **Structural fix:** physics provides a channel decoupled from optimization pressure; simultaneous corruption requires structurally different attacks on two independent channels

|||

**Adaptive Weighting per sample:**

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fusion.html
height: 480
title: Expert fusion mechanism
```

---

<!-- columns: 4/6 -->
<!-- size: small -->

## Building towards a thesis (work in progress)

- Goal structured notation (GSN) is a grammar to structure and visualize arguments

```iframe
src: ../tables/gsn_blocks.html
height: 290
title: GSN building blocks
```

|||

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/gsn-thesis.html
height: 600
title: Draft of working thesis in GSN
```
