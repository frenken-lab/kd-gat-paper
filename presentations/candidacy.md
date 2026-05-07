---
title: KD-GAT — Candidacy Talk
author: Robert Frenken
institution: The Ohio State University
bibliography: paper/references/own.bib
figure_captions: false
---

# KD-GAT

### Adaptive Fusion of Graph-Based Ensembles for Automotive Intrusion Detection

Robert Frenken · Candidacy · 2026

---

## Motivation

<!-- TODO: stakes opener — CAN bus problem, what's at risk, why now. Pull from candidacy/introduction.md "Motivation: The Deployment Gap". Land on the pain: lab models that won't survive deployment. -->

---

## The Problem: Graph-Based IDS on CAN

<!-- TODO: current framework — VGAE anomaly detector + GAT classifier. What works, where it breaks under deployment shift. -->

```iframe
src: https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/graph-base.html
height: 480
title: Graph base — CAN bus graph structure
```

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

## Timeline

<!-- TODO: semester-by-semester plan. Be honest about dependencies (federated work needs federated data). -->

---

## The Ask

<!-- TODO: what you need from the committee — specific feedback on scope, the federated data question, calibration metric choice. -->
