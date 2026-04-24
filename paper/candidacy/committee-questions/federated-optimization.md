---
title: "3. Federated Learning, Optimization, and Convergence"
---

## Question 3.1

> Knowledge distillation can be framed as a bilevel optimization problem. Discuss the relationship between teacher capacity, student capacity, and task complexity.

**Thesis.** Bilevel framing: the *outer* problem picks student architecture/capacity, and the *inner* problem trains student weights to minimise the distillation loss given the frozen teacher. The three factors are coupled — as task complexity grows, the teacher–student capacity gap that still permits successful transfer *shrinks*. @distillation-scaling-laws puts the sweet spot near $2$–$3\times$ for complex tasks; simpler binary decision boundaries tolerate far more aggressive compression, which is why the current $68\times$ ratio still performs well.

**Anchors in the current framework.**

- `paper/candidacy/proposed-research.md` §Intelligent KD (lines 191–203) already lays out the scaling-law argument, flags the current 68× ratio as above the conservative $2$–$3\times$ heuristic, and ties it to the ARM Cortex-A7 FLOP budget (Eq. {eq}`eq-flops-budget`).
- Preliminary KD F1 numbers are reported in `paper/content/ablation.md` §Knowledge Distillation Effects; CKA layer-similarity analysis in [](#fig-cka) provides representational evidence that the student tracks the teacher despite the 20× parameter reduction.

**Open questions.**

- The current distillation is a *single-level* problem — student architecture is chosen by hand and the distillation loss is fixed (temperature $T=4$, $\lambda=0.7$, logit-only per `paper/content/methodology.md:109`). A genuine bilevel solution (DARTS-style) would co-optimise student width/depth with the inner distillation objective.
- No ablation varies task complexity (binary vs. multi-class attack labels) to *demonstrate* the capacity-gap curve on CAN data; this would directly empirically validate the scaling-law claim.
- Teacher quality is not explicitly separated from teacher size in the ablation; @distillation-scaling-laws argues quality dominates at the student capacity budgets of interest here.

## Question 3.2

> How could federated learning enable collaborative model improvement across a fleet of edge devices with heterogeneous, privacy-sensitive data? What convergence challenges arise from non-IID distributions in this setting?

**Thesis.** Per-vehicle data is non-IID along three axes — attack-exposure distribution (fleet-dependent), ECU topology (OEM-dependent), and wear/environment drift (vehicle-dependent). FedAvg diverges under high client drift; FedProx and SCAFFOLD-style variance reduction are the standard remedies. Graph heterogeneity demands a shared GNN backbone with platform-specific heads. Because the domain is security-critical, Byzantine-robust aggregation (e.g., Krum, median-of-means) is a baseline requirement — an attacker who controls even one client can poison FedAvg unboundedly.

**Anchors in the current framework.**

- `paper/candidacy/proposed-research.md` §Federated Learning Across Vehicles (lines 268–274) motivates FL and flags heterogeneous graph structures as the core convergence challenge; §Adversarial Robustness (lines 259–266) flags training-data poisoning as a parallel threat.
- No FL training is currently implemented. Cross-dataset evaluation is centralised — each model is trained on a single dataset then evaluated on others (`paper/content/experiments.md`).

**Open questions.**

- **Entirely proposed.** No convergence analysis, no experiments, no bib entries yet for FedProx / SCAFFOLD / DP-SGD / Krum / FedCLEAN (the last of which appears in `docs/research-directions.md` as `benghali2025fedclean` but not in the committed bib).
- **Graph heterogeneity** — variable ECU counts across OEMs — needs a concrete architectural answer: shared graph-level pooling readout with platform-specific input projections is the natural first pass but unvalidated.
- **Privacy budget** — DP-SGD noise scale interacts with class imbalance; minority-class gradients are rare and noised more aggressively relative to signal. This is the FL analogue of the curriculum question below.
- **Attacker model for poisoning** is not specified. Given the IDS context, a concrete red-team evaluation (single-client full-access, multi-client limited-access) is required.

## Question 3.3

> Curriculum learning modifies the training distribution over time. Does a curriculum-trained model converge to the same solution as one trained on the full distribution, and what bias might it introduce?

### Does it converge to the same solution?

**No**, not in general. Curriculum learning modifies the *effective* training distribution $p_t(x, y)$ at each step, which changes the expected gradient and therefore the trajectory of SGD. Because deep networks are non-convex and SGD's final weights depend on initialisation *and* path, two trajectories over different distributions converge to different stationary points — even when both minimise the same terminal empirical risk. @bengio2009curriculum, the foundational curriculum paper, explicitly frames the mechanism as "a continuation method" guiding SGD toward better local optima; convergence to a *different* solution than vanilla training is the claimed benefit, not a side effect.

The convergence literature is more precise: curriculum changes the *implicit bias* of SGD. @hacohen2019power show empirically that curriculum-trained networks converge faster and to lower final loss than the same architecture trained on the shuffled full distribution, with the gap most pronounced on harder tasks — consistent with the continuation-method intuition. The @soviany2022curriculum survey catalogues the same pattern across vision, NLP, and RL: curriculum modifies both the *rate* and the *destination* of optimisation. So the answer is asymmetric: if the research question is convergence *rate*, curriculum can strictly improve it; if the question is convergence to a *specific* minimum, curriculum generally does not.

A useful sufficient condition for convergence to the *same* minimum is that the curriculum schedule asymptotes to the full distribution before SGD reaches a basin, and that the loss is convex in the basin. Neither holds in practice for a deep GAT classifier.

### What bias does it introduce?

Every curriculum choice encodes a prior about which examples should shape the model earliest. The *effective* training distribution integrated over the schedule,

$$\tilde{p}(x, y) = \frac{1}{T}\sum_{t=1}^{T} p_t(x, y),$$

is not the deployment distribution $p_{\text{nat}}(x, y)$. The resulting bias has three manifestations worth separating:

1. **Class-prior shift.** Oversampling the minority class early inflates its effective weight in $\tilde p$, producing a model with a softer majority prior than the maximum-likelihood estimator on $p_{\text{nat}}$. At decision-threshold $0.5$ this reliably raises minority-class recall and lowers precision — a calibrated expression of the imbalance trade-off, not a bug.
2. **Feature-selection bias.** Because minority-class features are seen *first*, the network develops its earliest-layer filters around minority-discriminative patterns. Later imbalanced exposure fine-tunes the classifier head but leaves the representation layer biased toward the minority. This is analogous to the transfer-of-easy-example learning argued for by @hacohen2019power.
3. **Calibration drift.** If curriculum produces a different effective prior than $p_{\text{nat}}$, the model's softmax probabilities no longer match empirical frequencies under deployment. This is not a theoretical worry: every class-rebalancing intervention — oversampling, class-weighted loss, focal loss [@lin2017focal] — produces miscalibration relative to the natural distribution [@guo2017calibration]. Curriculum is a time-varying version of the same intervention and inherits the same pathology.

Biases (1) and (2) are features by design — this framework explicitly targets minority-attack recall under 927:1 imbalance (`paper/content/introduction.md:15`). Bias (3) is a liability that should be measured (it directly re-enters Q2.1) and corrected at inference via temperature scaling on a natural-distribution calibration split.

### How the curriculum in this framework specifically behaves

The momentum-based curriculum in `paper/content/methodology.md:93` is worth unpacking because it is subtly different from the Bengio easy-to-hard paradigm:

$$p_t = 1 - \exp(-t / \tau),\qquad B_t = (1 - p_t)\,B_{\text{bal}} + p_t\,B_{\text{nat}} + \alpha_{\text{buf}}\,B_{\text{hard}}$$

At $t=0$, batches are fully class-*balanced* ($p_t\to 0$) — meaning the minority attack class is *oversampled* rather than undersampled. As $t$ grows, the mixture exponentially blends toward the natural imbalanced distribution. The hard-sample buffer $B_{\text{hard}}$ (refreshed every 100 steps from the highest-VGAE-error samples) contributes a persistent $\alpha_{\text{buf}}=0.2$ weight throughout.

This is not "easy-to-hard" in the Bengio sense — the rare attacks are arguably the *hardest* examples. It is closer to *anti-curriculum with difficulty-aware replay* [@soviany2022curriculum §§ Self-Paced Learning and Hard Example Mining]. The design rationale in `paper/content/methodology.md:107` makes this explicit: "This prevents premature majority bias while maintaining natural distribution awareness."

The biases this specific schedule introduces are therefore:

- **Intended:** Minority-attack recall gains, documented in the ablation design of `paper/content/ablation.md` §GAT Training Strategy and the 927:1-imbalance motivation. The momentum schedule gives a continuous knob $\tau$ trading precision for recall.
- **Intended:** Hard-sample replay biases the learned representation toward the VGAE's error surface, coupling the two stages and providing a form of curriculum-by-model rather than curriculum-by-heuristic.
- **Unintended (and measurable):** Calibration drift on the majority class — predicted $P(\text{attack})$ will systematically exceed the natural $0.1\%$–$3\%$ base rate. This should be quantified with class-conditional ECE (Q2.1).
- **Unintended (and worth testing):** Final-weight divergence from a non-curriculum baseline. Two concrete tests, both cheap at $N=3$ seeds:
  - Parameter-space distance $\|\theta_{\text{curr}} - \theta_{\text{nat}}\|_2 / \|\theta_{\text{nat}}\|_2$ per layer.
  - Prediction-disagreement rate on held-out natural-distribution test data, stratified by class.

### Open questions

- **No calibration measurement under curriculum.** Directly blocking a clean answer to Q2.1 and to the "unintended" bias above.
- **No parameter-distance or disagreement experiment** between curriculum-trained and non-curriculum-trained GAT checkpoints. This is the cheapest possible empirical contribution to "same solution or not."
- **Momentum coefficient $\tau$ sensitivity** is not ablated. OFAT protocol (`paper/content/ablation.md:14`) could slot this in as a single-axis sweep.
- **Curriculum-induced implicit bias is informal here.** A theoretical contribution could cast the momentum schedule as a time-varying importance-weighted ERM and derive the resulting bias on the Bayes-optimal classifier under imbalance.
- The framework has no formal convergence analysis; this is acceptable for the engineering claim but would need to be added for a purely-theoretical submission.
