---
title: KD-GAT — Candidacy Talk
site:
  hide_outline: true
  hide_toc: true
  hide_title_block: true
---

%% 15-minute candidacy talk. ~13 panels at ~1 min each (title/headline panels run shorter).
%% Structure: hook → problem → thesis → completed work (KD-GAT) → proposed work (4 axes) → timeline → ask.
%% Each [WRITE: ...] block is a brief describing what the panel needs to do. Robert writes the prose.
%% Only figures that actually build are embedded; see _build/figures/ for the list.

+++ {"class": "col-screen slide-full slide-dark"}

# KD-GAT

### Adaptive Fusion of Graph-Based Ensembles for Automotive Intrusion Detection

Robert Frenken · Candidacy · 2026

%% [WRITE: title slide — name, advisor, committee, date. Optional one-line subtitle restating the thesis ("calibration as the unifying axis"). Keep it sparse; this panel is on screen for 10s while you introduce yourself.]

+++

+++ {"class": "col-screen slide-full"}

### The deployment gap

%% [WRITE: stakes opener (STYLE.md R1 + R6). Concrete image of the CAN bus problem — what's at risk, why now, what production IDS systems actually look like. NOT "intrusion detection is important." Pull from candidacy/introduction.md "Motivation: The Deployment Gap" but compress to 2-3 sentences delivered out loud. Land on the pain: lab models that won't survive deployment.]

+++

+++ {"class": "col-screen slide"}

**The technical gap**

%% [WRITE: left column — what the literature offers (GAT-based detectors with strong in-distribution accuracy) and what it doesn't (calibrated confidence, cross-vehicle generalization, deployable parameter budgets). Three short bullets max.]

%% [FIGURE: graph-base.html or kd-vgae.html — pick one that visually anchors "this is what graph-based IDS looks like." Right column.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/graph-base.html
:label: fig-graph-story
:::

+++

+++ {"class": "col-screen slide-full"}

### The thesis

%% [WRITE: one sentence — calibration is the unifying axis across the four committee-question domains (physics, interpretability, federated, RL). This is the load-bearing claim of the whole candidacy. Pull from introduction.md "The methodological thesis" but cut to its single sharpest sentence. This panel is the hinge of the talk; everything before motivates it, everything after delivers against it.]

+++

+++ {"class": "col-screen slide-full slide-dark"}

# Completed Work

### KD-GAT — knowledge distillation for resource-constrained CAN-bus IDS

%% [WRITE: section divider. One sentence framing what the next 3 panels show: the published method that establishes the calibration-aware distillation foundation.]

+++

+++ {"class": "col-screen slide"}

**The distillation idea**

%% [WRITE: left column — what KD-GAT does in two sentences. Teacher GAT → smaller student GAT. The non-obvious move is *what* gets transferred (attention structure, not just labels) and *why* that matters for IDS specifically (attack-relevant patterns are structural). Don't restate the architecture — that's the next panel.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/kd-gat.html
:label: fig-kdgat-story
:::

+++

+++ {"class": "col-screen slide"}

**Architecture**

%% [WRITE: one short paragraph naming the components in the figure. Don't narrate every box — name the three things the audience needs to track to follow the rest of the talk (e.g., teacher, student, distillation loss path). The figure does the work.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/architecture.html
:label: fig-arch-story
:::

+++

+++ {"class": "col-screen slide-full"}

### Headline result

%% [WRITE: the actual headline number from results.md — "average +2.09% accuracy, +16.22% F1 vs. baseline KD-GAT, with F1 gains of 55% and 31% on the most imbalanced splits (S02, S04)." Compress to a single stat-shaped line + one-sentence interpretation. The interpretation is the thing that matters — *why* class-imbalance gains are the headline (because that's where production systems break).]

%% [Use <p class="stat"> for the lead number if you want the visual punch.]

+++

+++ {"class": "col-screen slide"}

**What this taught us**

%% [WRITE: the bridge from completed → proposed. KD-GAT works, but it surfaced three open questions that organize the rest of the proposal: (1) confidence isn't calibrated under operational drift, (2) one model class can't cover the full attack surface, (3) capacity-gap law for distillation isn't characterized. Two sentences. This panel sets up the four-axis proposal.]

%% [FIGURE: optional — cka.html or umap.html as a representation-space visual that hints at "the model learns the right thing internally, but confidence calibration is separate."]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/cka.html
:label: fig-cka-story
:::

+++

+++ {"class": "col-screen slide-full slide-dark"}

# Proposed Work

### Four axes, one calibration apparatus

%% [WRITE: section divider. One sentence per axis is enough — the next four panels deliver each. Audience should leave this panel knowing the four names: physics, interpretability, federated, RL.]

+++

+++ {"class": "col-screen slide"}

**Axis 1: physics-informed dynamics**

%% [WRITE: Q1 in three lines. The PINN-as-fourth-expert claim, the trust-gate mechanism, and what "calibrated against benign training data" buys you operationally. Pull from candidacy/committee-questions/physics-dynamics.md. Stop before getting into the three-conditions structure — that's the written report's job, not the talk's.]

%% [FIGURE: composition-pipeline.html if it visually shows the gate path; otherwise no figure and let the prose carry the panel.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/composition-pipeline.html
:label: fig-pipeline-story
:::

+++

+++ {"class": "col-screen slide"}

**Axis 2: interpretability and calibration**

%% [WRITE: Q2 in three lines. The two-uncertainties decomposition (aleatoric/epistemic), the inter-branch disagreement signal as label-substitute, and what calibration under class imbalance demands that ECE-on-clean-split doesn't. Pull from interpretability-calibration.md. Land on the operational image (V1: "opposite ends of the same operating envelope").]

%% [FIGURE: attention.html — shows the explainability surface. Or skip the figure if the panel feels crowded.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/attention.html
:label: fig-attn-story
:::

+++

+++ {"class": "col-screen slide"}

**Axis 3: federated optimization & curriculum**

%% [WRITE: Q3 in three lines. Why curriculum + federated drift the calibrations off their training baselines, and what the proposed correction looks like. Pull from federated-optimization.md. The fedavg-drift figure is the one piece of preliminary evidence here — name what it shows.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fedavg-drift.html
:label: fig-fedavg-story
:::

+++

+++ {"class": "col-screen slide"}

**Axis 4: reinforcement learning for fusion**

%% [WRITE: Q4 in three lines. The bandit-based expert fusion, the reward shift problem at deployment, and the trust-score-as-pseudo-label move that lets adaptation continue without ground truth. Pull from reinforcement-learning.md. Mention that preliminary DQN results exist; don't show numbers (they're noisy and a talk isn't the place).]

%% [FIGURE: fusion.html if it shows the bandit selecting between experts.]

+++ {"type": "iframe"}

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fusion.html
:label: fig-fusion-story
:::

+++

+++ {"class": "col-screen slide-full"}

### Timeline & deliverables

%% [WRITE: a calibrated commitment, not a wishlist. Three or four milestones with rough quarters — what gets built, what gets evaluated, what gets written. Pull from proposed-research.md "Consolidated deliverables backlog." Audience question this panel answers: "is this finishable in the time you have?"]

+++

+++ {"class": "col-screen slide-full slide-dark"}

### What you should remember

%% [WRITE: three takeaways, not a summary. (1) the thesis (calibration as unifying axis), (2) the completed proof-of-concept (KD-GAT establishes the distillation + calibration foundation), (3) the contribution this proposal makes that the field doesn't have (joint-calibration apparatus across four axes). Cut to bullets. The closing sentence is your ask: committee approval to proceed.]

+++
