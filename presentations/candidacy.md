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

<!-- columns: 2 -->
<!-- size: small -->

## Metrics & Split Codes

| Metric    | Measures                                                                                 | Range                 |
| --------- | ---------------------------------------------------------------------------------------- | --------------------- |
| **AUROC** | Ranking quality — P(attack scored above benign), macro-avg over classes. Threshold-free. | 0–1 · 0.5 = random    |
| **AP**    | Area under precision-recall curve, macro-avg. Penalises miscalibration more than AUROC.  | 0–1                   |
| **MCC**   | Full confusion-matrix correlation. Robust to class imbalance. Requires threshold.        | −1 to +1 · 0 = random |
| **P@95R** | Precision when recall = 0.95 — alert fatigue proxy.                                      | 0–1                   |
| **R@99P** | Recall when precision = 0.99 — high-confidence detection proxy.                          | 0–1                   |

|||

| Code       | Vehicle | Attack     | Interpretation                            |
| ---------- | ------- | ---------- | ----------------------------------------- |
| **t01-KK** | Known   | Known      | In-distribution baseline                  |
| **t02-UK** | Unknown | Known      | Vehicle covariate shift                   |
| **t03-KU** | Known   | Unknown    | Zero-shot attack type                     |
| **t04-UU** | Unknown | Unknown    | Full out-of-distribution                  |
| **t05**    | —       | Suppress   | ECU frame removal — structural blind spot |
| **t06**    | —       | Masquerade | Injected spoofed frames                   |

---

<!-- columns: 2 -->
<!-- size: small -->
<!-- footnote: val_discrimination_ratio = inter/intra-class reconstruction variance ratio · val_recon_max_gap = max gap between top normal and top anomaly scores · t02-UK = unknown vehicle · t03-KU = unknown attack type · t05 = suppress (ECU frame removal) -->

## VGAE Training — Empirical Notes

**Baseline Results (set_02)**

| Split   | AUROC | Observation                             |
| ------- | ----- | --------------------------------------- |
| t03-KU  | 0.834 | Best — unknown attack type              |
| Overall | 0.621 |                                         |
| t02-UK  | 0.488 | Near-random — vehicle shift             |
| t05     | 0.000 | Suppress — structural blind spot        |
| t06     | —     | AP 0.378 — ranking ok, calibration poor |

|||

**Training Difficulties**

- Monitor Selection: `val_discrimination_ratio` to `val_recon_max_gap` (max gap between top-scored normal and top-scored anomaly).

- Global (time horizon / aggregate metrics) vs Local (single instance / single node)

---

<!-- columns: 2 -->
<!-- size: small -->
<!-- footnote: AUROC = rank quality, threshold-free · AP = area under precision-recall curve · MCC = confusion-matrix correlation (0 = random) · R@99P = recall when precision ≥ 0.99 -->

## Ablation — Loss Function

**AUROC macro · mean(t01–t04) · seed 42**

| variant     | hcrl_sa | set_01 | set_02 | set_03 | set_04 | avg   |
| ----------- | ------- | ------ | ------ | ------ | ------ | ----- |
| none        | 0.789   | 0.691  | 0.708  | 0.679  | 0.766  | 0.727 |
| ce          | 0.797   | 0.693  | 0.683  | 0.667  | 0.766  | 0.721 |
| weighted_ce | 0.773   | 0.661  | 0.683  | 0.669  | 0.778  | 0.713 |
| focal       | 0.796   | 0.693  | 0.696  | 0.677  | 0.771  | 0.727 |

**Calibration — set_04 (timing-perturbation attacks):**

| variant     | MCC   | R@99P | AP (avg) |
| ----------- | ----- | ----- | -------- |
| ce          | 0.001 | 0.004 | 0.676    |
| weighted_ce | 0.319 | 0.032 | 0.678    |
| none        | 0.226 | 0.154 | 0.690    |
| focal       | 0.233 | 0.128 | 0.694    |

|||

AUROC spread ≤ 0.014 — within single-seed noise. The decisive signal is calibration at high-precision operating points.

`ce` collapses despite AUROC 0.766: **MCC = 0.001, R@99P = 0.004**. Timing-perturbation attacks share in-vocabulary CAN IDs; inverse-frequency weighting drives the model to a degenerate threshold that AUROC cannot detect.

`focal` avoids collapse (MCC 0.233) and leads AP across set_01–04 (0.694). The fusion stage consumes GAT probabilities as input features — a degenerate GAT output corrupts those features regardless of fusion architecture.

```box
title: Decision
tone: muted
content: |
  gat_loss = focal
```

---

<!-- columns: 2 -->
<!-- size: small -->
<!-- footnote: AUROC = rank quality, threshold-free · MCC = confusion-matrix correlation (0 = random) · R@99P = recall when precision ≥ 0.99 -->

## Ablation — Training Curriculum

**AUROC macro · mean(t01–t04) · seed 42** _(set_01/curriculum_random pending)_

| variant           | hcrl_sa | set_01 | set_02 | set_03 | set_04 | avg   |
| ----------------- | ------- | ------ | ------ | ------ | ------ | ----- |
| none              | 0.789   | 0.691  | 0.708  | 0.679  | 0.766  | 0.727 |
| curriculum_random | 0.793   | —      | 0.701  | 0.686  | 0.743  | —     |
| curriculum_vgae   | 0.800   | 0.692  | 0.709  | 0.680  | 0.733  | 0.723 |

**MCC · mean(t01–t04):**

| variant           | hcrl_sa | set_01 | set_02 | set_03 | set_04 | avg   |
| ----------------- | ------- | ------ | ------ | ------ | ------ | ----- |
| none              | 0.500   | 0.199  | 0.138  | 0.278  | 0.226  | 0.268 |
| curriculum_random | 0.500   | —      | 0.112  | 0.282  | 0.232  | —     |
| curriculum_vgae   | 0.430   | 0.187  | 0.137  | 0.267  | 0.139  | 0.232 |

|||

Neither curriculum variant improves over `none` by more than single-seed noise on AUROC.

`curriculum_vgae` **degrades MCC** (0.232 vs 0.268): VGAE scores timing-perturbation attacks as _easy_ (in-vocabulary IDs → low reconstruction error → low difficulty rank), deprioritizing them in early epochs. Set_04 AUROC drops 0.766→0.733, MCC drops 0.226→0.139.

`curriculum_random` matches `none` on AUROC but falls behind on R@99P across set_01–04 (0.125 vs 0.151).

Both variants add a VGAE scoring pass each epoch. No variant justifies the overhead.

```box
title: Decision
tone: muted
content: |
  gat_sampling = none
```

---

<!-- columns: 2 -->
<!-- size: small -->
<!-- footnote: AUROC = rank quality, threshold-free · R@99P = recall when precision ≥ 0.99 -->

## Ablation — CAN ID Encoding

**AUROC macro · mean(t01–t04) · seed 42**

| variant   | hcrl_sa | set_01 | set_02 | set_03 | set_04 | avg   |
| --------- | ------- | ------ | ------ | ------ | ------ | ----- |
| none      | 0.789   | 0.691  | 0.708  | 0.679  | 0.766  | 0.727 |
| id_hash   | 0.858   | 0.664  | 0.698  | 0.675  | 0.732  | 0.725 |
| id_lookup | 0.845   | 0.679  | 0.701  | 0.669  | 0.722  | 0.724 |

**hcrl_sa t04 — unknown vehicle + unknown attack:**

| variant   | AUROC | R@99P |
| --------- | ----- | ----- |
| none      | 0.894 | 0.499 |
| id_hash   | 0.920 | 0.499 |
| id_lookup | 0.988 | 0.707 |

|||

On set_01–04 (multi-vehicle, ~2048 unique IDs): **−0.018 / −0.019 AUROC vs baseline**. The vocabulary is too diverse for a fixed hash or lookup table to add signal beyond the learned embedding.

Using `none` also keeps GAT node features dataset-agnostic, preserving potential generalisation in future development.

```box
title: Decision
tone: muted
content: |
  id_encoding = none
```

---

<!-- columns: 2 -->
<!-- size: small -->
<!-- footnote: AUROC = rank quality, threshold-free · KK = known vehicle + known attack · UK = unknown vehicle · KU = unknown attack type · UU = unknown vehicle + unknown attack (full OOD) -->

## Ablation — Fusion Methods

**AUROC macro · set_01 · seed 42** _(t05 = 0.000 universally, excluded)_

| variant      | t01-KK | t02-UK | t03-KU | t04-UU | t06   |
| ------------ | ------ | ------ | ------ | ------ | ----- |
| mlp          | 0.980  | 0.455  | 0.523  | 0.629  | 0.970 |
| moe          | 0.969  | 0.344  | 0.569  | 0.570  | 0.983 |
| moe_noaux    | 0.973  | 0.331  | 0.563  | 0.573  | 0.985 |
| weighted_avg | 0.594  | 0.441  | 0.490  | 0.459  | 0.481 |
| bandit       | 0.914  | 0.460  | 0.570  | 0.743  | 0.978 |
| dqn          | 0.818  | 0.460  | 0.573  | 0.743  | 0.955 |

**Mean(t01–t04) AUROC across datasets:**

| variant      | set_01 | set_02 | set_03 | set_04 |
| ------------ | ------ | ------ | ------ | ------ |
| mlp          | 0.647  | 0.649  | 0.617  | 0.669  |
| moe_noaux    | 0.610  | 0.643  | 0.637  | 0.673  |
| weighted_avg | 0.496  | 0.627  | 0.602  | 0.634  |
| bandit       | 0.672  | 0.679  | 0.631  | 0.654  |
| dqn          | 0.648  | 0.690  | 0.659  | 0.610  |

|||

**MoE ≈ MLP ≈ MoE-noaux** — within ±0.015 AUROC and ±0.030 MCC across all (dataset, split) cells. MoE routing adds no systematic advantage over a plain MLP head.

**weighted_avg collapses** on set_01 t01 (0.594 AUROC vs 0.969–0.980 for moe/mlp): a fixed linear combination of VGAE + GAT scores fails to preserve attack ranking for known attacks on the known vehicle.

**bandit and dqn** reach competitive AUROC on t01/t04 but MCC remains near zero on t02–t04 across all datasets

**t02 (unknown vehicle)** is the hardest split: AUROC 0.33–0.46 on set_01 across all methods. Vehicle shift collapses detection even for attack types seen in training.

---

<!-- columns: 2 -->
<!-- size: small -->
<!-- footnote: AUROC = rank quality, threshold-free · t02-UK = unknown vehicle + known attacks · t05 = suppress (ECU frame removal) · t06 = masquerade (injected spoofed frames) -->

## Main Results

**Hardest split — t02 (unknown vehicle, known attacks):**

| method    | set_01 | set_02 | set_03 | set_04 |
| --------- | ------ | ------ | ------ | ------ |
| mlp       | 0.455  | 0.495  | 0.582  | 0.541  |
| moe_noaux | 0.331  | 0.494  | 0.565  | 0.539  |
| bandit    | 0.460  | 0.507  | 0.609  | 0.502  |
| dqn       | 0.460  | 0.510  | 0.637  | 0.544  |

Gear attack (set_01): t01 AUROC **0.976** → t02 AUROC **0.224** (−0.75 on the same attack type, different vehicle).

|||

**Structural blind spot — t05 (suppress attacks):**
AUROC = 0.000 across _every_ method and _every_ dataset. Frame suppression produces a sparser graph — the opposite of the model's anomaly signal. A complementary traffic-volume monitor is required.

**set_04 t03 reversal:**
Known vehicle + novel attacks (0.88–0.89 AUROC) outperforms known vehicle + known attacks (0.70).

<!-- Novel attack types on the trained vehicle are more anomalous to the graph structure than timing-perturbation variants seen in training.
TODO: I don't know if this is actually true
-->

**Masquerade (t06) range:** 0.30–0.985 AUROC — widest inter-method spread. Set_03/mlp fails (0.30) while moe/moe_noaux score 0.83–0.84 on the same split.

_Single seed (42): differences within ±0.01 AUROC on any (dataset, split) cell should be treated as noise. Multi-seed runs needed before definitve claims._

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

- **Physics-Informed Neural Network (PINN):** Encode vehicle dynamics as a physics residual loss; provide a causally-independent channel that prevents physically implausible detections to pair with data-driven models
- **Explainability (XAI):** Analysis of datasets, models, and metrics across different metrics, visualizations. Ability to explain and be better informed about problem surface.
- **Federated Learning (FL):** Ability to learn across datasets within domain (cross-vehicle generalization); potentially learning across domains (automotive vs networking vs cyber physical system)
- **Model Sizing (KD):** Inteligent teacher→student compressions that address constraints while minimizing degradation.

---

<!-- columns: 2 -->

## Q1: Physics & Dynamic Controls

**When to trust physics vs. data-driven?**

Four-quadrant decision on two axes — _on/off the physics manifold_ × _in/out of training distribution_:

|                  | In distribution              | Out of distribution      |
| ---------------- | ---------------------------- | ------------------------ |
| **On manifold**  | Both apply                   | Physics higher weighting |
| **Off manifold** | Data-driven higher weighting | research contribution    |

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

<!-- columns: 2 -->

## Q3 + Q4: Federated Learning, Reinforcement Learning, Convergence

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fedavg-drift.html
height: 480
title: FedAvg calibration drift
```

|||

**Reward shift at deployment:**

$$
\underbrace{\mathbb{E}_{p_\text{deploy}}[R_\text{true}] - \mathbb{E}_{p_\text{train}}[R_\text{train}]}_{\text{total}} = \underbrace{\Delta p(s)}_{\substack{\text{covariate} \\ \text{shift}}} + \underbrace{\Delta R}_{\substack{\text{proxy–target} \\ \text{divergence}}}
$$

- **Covariate shift:** detectable from the input distribution; importance reweighting applies
- **Proxy–target divergence:** the policy optimizes against its own confidence, which is least trustworthy exactly when the policy is most wrong — undetectable from inputs alone
- **Structural fix:** physics provides a channel decoupled from optimization pressure; simultaneous corruption requires structurally different attacks on two independent channels

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
