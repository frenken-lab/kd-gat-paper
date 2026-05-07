---
title: KD-GAT — Candidacy Talk
author: Robert Frenken
date: "2026"
bibliography: paper/references/own.bib
---

# KD-GAT

### Adaptive Fusion of Graph-Based Ensembles for Automotive Intrusion Detection

Robert Frenken · The Ohio State University · Candidacy · 2026

---

<!-- columns: 3 -->

## Motivation

```box
title: Single Model Brittleness:
tone: accent
content: |
  - “specialist weakness” phenomenon: individual deep learning models achieve high accuracy on known attacks but are vulnerable to unseen attack types or attacks focusing on a structural weakness of a model’s architecture
```

|||

```box
title: Resource Contraints:
tone: accent
content: |
  - Models developed under academic research using GPU-scaling need to significantly downsize to meet the limited onboard resources of production vehicles
  - ARM Cortex processors require <<50--100ms latency
```

|||

```box
title: Model Opaqueness:
tone: accent
content: |
  -  Highly accurate models face systematic rejection in safety-critical systems because users cannot understand or verify decisions
```

---

## CAN Bus Network

![CAN Bus Network](CAN_BUS.svg)

---

## KD-GAT Architecture

<!-- TODO: three things the audience needs to track: teacher, student, distillation loss path. The figure does the work. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/kd-gat.html
height: 480
title: KD-GAT architecture
```

---

## Architecture Detail

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/architecture.html
height: 480
title: Full architecture diagram
```

---

---

## Ablation Results

<!-- TODO: Pull results from graphids empirical docs (quick) later do "pure" pull from hugging face -->

- content table here

---

---

## Main Results

<!-- TODO:  -->

- content table here

---

---

## Dimensionality (UMAP) Analysis

<!-- TODO: Pull results from graphids empirical docs (quick) later do "pure" pull from hugging face -->

- content table here

---

## Key Result: Representational Alignment (CKA)

<!-- TODO: what CKA shows — the student has learned the teacher's internal representation despite the compression. This is the empirical core of the completed work. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/cka.html
height: 480
title: CKA representational similarity
```

---

## Proposed Work: Composition Pipeline

<!-- TODO: four research axes — bandit fusion, curriculum scheduling, federated calibration, explainability. One sentence each. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/composition-pipeline.html
height: 480
title: Proposed composition pipeline
```

---

## Q1: Attention as Explanation

<!-- TODO: why attention weights are a proxy for explainability here, and the calibration gap that makes them unreliable out of the box. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/attention.html
height: 480
title: Attention weight visualization
```

---

## Q3: Federated Drift

<!-- TODO: why curriculum + federated drift the calibrations off their training baselines. The fedavg-drift figure is the one piece of preliminary evidence. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fedavg-drift.html
height: 480
title: FedAvg calibration drift
```

---

## Q2: Bandit-Based Expert Fusion

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fusion.html
height: 480
title: Bandit fusion mechanism
```

---

## Thesis Argument Structure (GSN)

<!-- TODO: walk through what's done vs what's open. The hollow diamonds are the punch list:
G1 = coverage void on CAN data (asserted, needs derivation), G3 = Mondrian abstain rate under
K7 imbalance (asserted, needs empirical bound or mechanism swap), and two composition theorems
(S-thesis: coverage + compression; S-N02-instance: Mondrian + safety shield + joint apparatus).
This slide is the segue into Timeline — the diamonds are the work the dissertation closes. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/gsn-thesis.html
height: 600
title: kd-gat thesis argument — GSN safety case
```

---

## Timeline

<!-- TODO: semester-by-semester plan. Be honest about dependencies (federated work needs federated data). -->

---

## The Ask

<!-- TODO: what you need from the committee — specific feedback on scope, the federated data question, calibration metric choice. -->
