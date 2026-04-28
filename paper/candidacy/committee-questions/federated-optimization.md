---
title: "3. Federated Learning, Optimization, and Convergence"
---

## Question 3.1

> Knowledge distillation can be framed as a bilevel optimization problem. Discuss the relationship between teacher capacity, student capacity, and task complexity.

### Bilevel formulation

KD [@hinton2015distilling; @bucilua2006model]'s outer problem chooses a student architecture under deployment constraints; the inner problem fits its weights to a frozen teacher under a chosen distillation loss:

$$
\begin{aligned}
\text{(outer)}\quad & \mathcal{A}_S^\star = \arg\min_{\mathcal{A}_S \in \Omega}\; \mathcal{R}_{\text{val}}\bigl(f_{S}(\,\cdot\,;\,\theta_S^\star(\mathcal{A}_S),\,\mathcal{A}_S)\bigr) \\
\text{s.t.}\quad & \mathrm{FLOPs}(\mathcal{A}_S) \le C_{\text{hw}},\quad \mathrm{Latency}(\mathcal{A}_S) \le L_{\text{hw}} \\[4pt]
\text{(inner)}\quad & \theta_S^\star(\mathcal{A}_S) = \arg\min_{\theta_S}\; \underbrace{(1-\lambda)\,\mathcal{L}_{\text{hard}}(\theta_S)}_{\text{ground-truth CE}} + \underbrace{\lambda\,\mathcal{L}_{\text{KD}}(\theta_S; f_T, T)}_{\text{KL to soft teacher targets}}
\end{aligned}
$$

The inner recovers Eq. {eq}`eq-kd-total-loss` and Eq. {eq}`eq-temperature-scaling`; the outer is deployment risk under the FLOP budget Eq. {eq}`eq-flops-budget` on the ARM Cortex-A7 [@ARMCortexA7]. Three quantities couple the two levels:

- **Teacher capacity** $|f_T|$ — fixed before the bilevel program; sets the ceiling on soft-target entropy. A near-random teacher degenerates KD into label-smoothed CE.
- **Student capacity** $|f_S|$ — the outer decision variable, bounded above by $C_{\text{hw}}$ and below by the task's intrinsic dimension.
- **Task complexity** $\mathcal{T}$ — fixes the minimum student capacity that absorbs the teacher's function. Operationalised by Bayes-optimal error or by the smallest model that solo-trains to the teacher's accuracy.

### The single-level collapse is the field's pathology, not the formal problem

By the implicit-function theorem the outer-objective gradient is $\nabla_{\mathcal{A}_S} \mathcal{R}_{\text{val}} = (\partial \mathcal{R}/\partial \theta_S^\star)(\partial \theta_S^\star/\partial \mathcal{A}_S)$. Production KD does not compute it. The literature has instead accumulated three artifacts, each a post-hoc reconstruction of the un-differentiated bilevel manifold:

- The **capacity-gap inverted-U** [@Towards-Law-of-Capacity-Gap2025] — the outer surface projected onto the student-size axis. Practitioners discover it by sweeping because they cannot differentiate it.
- **Teacher-assistant chains** [@Mirzadeh-TAKD2020; @DenselyGuided-KD2019; @Gap-KD2025] — local patches around poor outer minima; each TA is approximately one Newton step a bilevel solve would have produced automatically.
- **Distillation scaling laws** [@distillation-scaling-laws] — the outer surface characterised by grid search, viable only because the outer feasible set is searchable at LLM scale.

The collapse to single-level is computational pragmatism — teachers cost millions to train and outer-architecture search on dense transformers is intractable — not a feature of the formal problem.

### Three-quantity relationship as bilevel-manifold geometry

The relationship between $|f_T|$, $|f_S|$, and $\mathcal{T}$ falls out as the geometry of the inner-optimum manifold $\theta_S^\star$:

- **Task complexity sets inner-basin curvature.** Easy tasks admit wide basins where a range of student capacities reach near-optimal $\theta_S^\star$; hard tasks have narrow basins that punish under-capacity sharply.
- **The outer surface inherits the inner basin.** Because $\mathcal{R}_{\text{val}}$ depends on $\theta_S^\star(|f_S|)$, the outer surface is the inner basin projected along the student-architecture axis. The empirical inverted-U over $|f_S|$ is the structural fingerprint of that projection.
- **Teacher capacity sets the projection's amplitude.** Larger $|f_T|$ produces higher-entropy soft targets and steepens the inner KL gradient. Past a critical ratio the student class can no longer represent the teacher's softmax; the inner gradient pushes off-manifold — the "larger teachers hurt smaller students" pathology [@distillation-scaling-laws; @Mirzadeh-TAKD2020].
- **Task complexity moves the outer peak.** Higher $\mathcal{T}$ tightens the basin, so a student on the inverted-U plateau at low $\mathcal{T}$ falls off the cliff at high $\mathcal{T}$. The viable gap $\Delta^\star_{\text{cap}}(\mathcal{T}) = |f_T|/|f_S|$ at the optimum shrinks monotonically in $\mathcal{T}$. Binary attack/benign sits at the easy end, which is why the $68\times$ ratio ([](#subsec:IntelKD)) holds; the same student would fail at $68\times$ on 9-class typing or multi-vehicle training ([](#subsec:CrossD)).

Graph KD tolerates larger compression than vision/NLP KD at matched complexity [@kdgraph_survey2023]: attention-graph computation has more redundant capacity than dense feature stacks, widening $\Delta^\star_{\text{cap}}$ for the GAT student here.

### Where this iteration sits on the manifold

The current setup is a single point on the bilevel surface:

| Bilevel role | This framework | Where |
|---|---|---|
| Outer space $\Omega$ | 33K-parameter GAT; $68\times$ compression | [](#subsec:IntelKD) |
| Hardware constraint $C_{\text{hw}}$ | $\mathrm{FLOPs}_{\max} = 2.5\times 10^6$ on ARM Cortex-A7 | Eq. {eq}`eq-flops-budget` |
| Teacher $f_T$ | Pretrained GAT teacher (frozen) | §Methodology |
| Inner objective | $\mathcal{L}_{\text{total}} = (1-\lambda)\mathcal{L}_{\text{hard}} + \lambda\mathcal{L}_{\text{KD}}$, $T=4$, $\lambda=0.7$ | Eq. {eq}`eq-kd-total-loss` |
| Inner solution evidence | F1 in §KD Effects ablation; CKA in [](#fig-cka) shows the student tracks the teacher despite 20× parameter reduction | §Ablation |

The $68\times$ ratio is permissible only because binary CAN attack/benign sits at the easy end of the $\mathcal{T}$ axis where the inner basin is wide. The proposed work walks deliberately along the manifold: the binary → 9-class typing → multi-vehicle progression is a controlled traversal of $\mathcal{T}$ with the outer choice ($|f_S|$, $T$, $\lambda$) re-optimised against the new inner basin at each step.

### The proposed sweep is the bilevel solve in this regime

Three properties of resource-constrained federated graph KD make the LLM literature's single-level shortcut unavailable here:

- **Hardware fixes the outer feasible set.** The Cortex-A7 FLOP budget makes grid search over $(|f_S|, \lambda, T)$ tractable — not true at LLM scale.
- **Task complexity is non-stationary by design.** The roadmap's sweep along $\mathcal{T}$ integrates the bilevel manifold along the axis the question asks about.
- **Federation forces outer–inner coupling.** Federated KD is genuinely bilevel: outer = (federation strategy, student capacity), and SCAFFOLD/FedProx make the inner gradient covariance an explicit function of the outer choice. The coupling cannot be separated.

The $(|f_S|, \mathcal{T})$ grid is therefore not a substitute for the bilevel solve — in a regime where architecture search on graph data is intractable and hardware closes the outer feasible set, the grid *is* the bilevel solve, sampled rather than differentiated. LLM distillation can afford to leave bilevel structure decorative; resource-constrained federated graph KD cannot, and that asymmetry is the thesis.

The asymmetry has a temporal axis: LLM bilevel is single-scale (everything resolves at training time), but fleet-IDS bilevel spans training, round, and deployment-epoch scales. Outer choices accumulate at each — architecture at training, federation strategy at round, per-vehicle personalisation at deployment-epoch — and inner solves run at each scale's natural rate. The framework's federated-body / local-head split (Q3.2) is the multi-scale decomposition.

## Question 3.2

> How could federated learning enable collaborative model improvement across a fleet of edge devices with heterogeneous, privacy-sensitive data? What convergence challenges arise from non-IID distributions in this setting?

### Why FL applies to fleet-scale IDS

Three properties of the automotive IDS setting motivate federated learning:

- **Privacy.** Per-vehicle CAN traces expose proprietary OEM signal layouts, driver behaviour, and route patterns — OEMs will not upload them. The trust paradox of Challenge 3 [@Trustworthiness; @BlackBoxRisk] applies *a fortiori* at the data layer: an explainable model that requires raw CAN upload is unacceptable.
- **Attack-diversity coverage.** No single vehicle sees more than a sliver of the attack distribution ([](#subsec:FL)). Federation pools gradient information without pooling raw data, addressing the long-tail problem on rare attacks.
- **Edge-compute constraint.** The Cortex-A7 budget Eq. {eq}`eq-flops-budget` constrains the *student*; federation amortises *teacher* training cost across the fleet.

The resulting client distributions are non-IID along three independent axes, each breaking a different optimisation property of FedAvg.

### Three axes of non-IID heterogeneity

Indexing fleet vehicles by $i \in \{1, \ldots, K\}$ with local distribution $p_i(x, y)$:

**1. Label shift — attack-exposure heterogeneity.** Different vehicles see different attack-class mixes. The base CAN-IDS imbalance is already 927:1; on a single vehicle some attack subclasses never appear:

$$
p_i(y) \;\ne\; p_j(y) \quad\text{for}\quad i \ne j, \qquad p_i(y \mid x) \;=\; p_j(y \mid x)
$$

**2. Feature shift — wear, environment, route.** Same labels, different conditional feature distributions. Cold-weather and hot-weather baselines differ; tire wear changes the dynamics signals feeding the PINN (Q1.1):

$$
p_i(x \mid y) \;\ne\; p_j(x \mid y), \qquad p_i(y) \;=\; p_j(y)
$$

**3. Concept shift — OEM-specific protocol semantics.** Two OEMs can assign the same arbitration ID to different signals — "engine RPM at byte 4" on vehicle $i$, "throttle position at byte 4" on vehicle $j$. Same input, different label:

$$
p_i(y \mid x) \;\ne\; p_j(y \mid x)
$$

These three are different in kind and need different remedies. Most FL-IDS literature collapses them into a single "non-IID" category and reports FedAvg degradation as if it were one phenomenon; the VGAE / GAT / fusion pipeline factors cleanly per stage.

### Convergence challenges of FedAvg under non-IID

FedAvg [@mcmahan2017fedavg] averages $\theta^{(t+1)} = \sum_i \frac{n_i}{n} \theta_i^{(t)}$ over $E$ local SGD steps per client. Under IID data local trajectories track the global gradient; under non-IID they *drift*, and the FedAvg update is no longer a descent direction on the global loss [@kairouz2021advances]:

$$
\text{Client drift:}\quad \delta_i^{(t)} \;=\; \nabla F_i(\theta^{(t)}) \;-\; \nabla F(\theta^{(t)})
$$

When $\sum_i \frac{n_i}{n} \|\delta_i\|^2$ is large, FedAvg converges to a stationary point of $\sum_i \frac{n_i}{n} F_i$, not of $F$. Two standard remedies:

**FedProx [@li2020fedprox] — proximal regularisation.** Each client minimises a regularised local loss:

$$
\theta_i^{(t+1)} \;=\; \arg\min_\theta \; F_i(\theta) \;+\; \tfrac{\mu}{2}\,\|\theta - \theta^{(t)}\|^2
$$

The proximal term penalises drift from $\theta^{(t)}$; FedAvg's bias decays with $\mu$, at the cost of slower local progress.

**SCAFFOLD [@karimireddy2020scaffold] — control-variate variance reduction.** Each client maintains a drift estimate $c_i$ subtracted at the local update:

$$
\theta_i^{(t+1)} \;\leftarrow\; \theta_i^{(t)} \;-\; \eta \bigl(\nabla F_i(\theta_i^{(t)}) \;-\; c_i \;+\; c\bigr)
$$

with $c = \tfrac{1}{K}\sum_j c_j$. Under bounded gradient variance, SCAFFOLD recovers IID-like rates for any $E$.

**Per-axis remedy.** Label shift (axis 1) responds to SCAFFOLD: variance reduction compensates for class-imbalance-induced gradient bias. Feature shift (axis 2) responds to FedProx: it slows client-specific overfitting. Concept shift (axis 3) cannot be handled by either — a single shared model is the wrong target — and forces *personalisation*: a shared backbone with per-client heads, which is also the answer to graph heterogeneity below.

### Why standard FL remedies miss graph heterogeneity

CAN graphs from different OEMs have different node counts (variable ECU topology), different edge structures, and different per-node feature semantics. None of the remedies above address graph heterogeneity directly: all assume a fixed parameter space across clients.

**Architectural answer: federated shared backbone + per-platform input projection and output head.**

| Component | Federated? | Rationale |
|---|---|---|
| Per-platform input projection (35-dim node feature → shared $d$-dim) | **Local only** | Absorbs OEM-specific feature semantics; cannot be shared across vehicles with different CAN signal layouts |
| Shared GAT backbone | **Federated (FedAvg/SCAFFOLD)** | Protocol-invariant features (timing anomalies, frequency deviations) generalise across vehicles |
| Per-platform output head | **Local only** (or clustered FL across OEM cohorts) | Different attack-class distributions and OEM-specific semantics |
| OOV-robust embedding (§Handling OOV IDs) | **Hash-based version federates cleanly**; lookup table does not | The $k$-probe hash variant maps every ID to bucketed shared rows by construction; the lookup-plus-UNK variant requires shared vocabulary which leaks per-OEM IDs |
| VGAE encoder/decoder | **Federated** | Reconstruction is symmetric across protocols; per-platform anomaly thresholds remain local |
| Fusion policy (DQN / Neural-LinUCB) | **Personalised local fine-tune from federated initialisation** | The fusion policy directly depends on per-vehicle confidence calibration (Q2.1) which differs across feature distributions |

The pattern — federated body, local heads — is standard for architectural heterogeneity in personalised FL. The CAN-IDS-specific contribution is *which* component goes local: the input projection (OEM-specific signal layouts) and the fusion head (per-vehicle calibration, Q2.1).

### Defending against poisoned client updates

In FedAvg a single malicious client poisons the global model unboundedly: an arbitrary $\theta_i^{(t)}$ shifts the average by $\Theta(1/K)$ per round, compounding over training. For an IDS this is a *deployment-time* attack — one compromised vehicle degrades detection for the rest. Three layers of defence:

- **Geometric-median aggregation (Krum, multi-Krum, median-of-means).** Replace the FedAvg average with a robust statistic; under bounded gradient variance and at most $f$ malicious clients, Krum's gradient is provably close to the honest average [@blanchard2017krum].
- **Norm clipping.** Bound each client update's $L_2$ norm: attackers can inject direction but not magnitude. Standard alongside DP-SGD [@abadi2016dpsgd], whose noise scale is calibrated to clipped gradients.
- **Anomaly detection on clients.** Treat client gradients as data and run a detector (FedCLEAN-style). Same VGAE+GAT pattern as the IDS itself, applied one level up.

This adds a new attack surface to the Q1.2 threat-model taxonomy. The Q1.2 defence-in-depth argument (data-driven branch structurally protected from estimator compromise) does *not* carry over: the federated GNN backbone is exactly what an attacker targets.

### Privacy under DP-SGD interacts with class imbalance

DP-SGD [@abadi2016dpsgd] adds Gaussian noise to clipped gradients with budget $(\varepsilon, \delta)$. A uniform budget over-noises minority gradients under 927:1 imbalance: the minority-class gradient norm scales with $p(\text{attack})\approx 0.1\%$, collapsing SNR. Remedies: class-conditional clipping ($C_y$ per class) or amplification by sampling, which the Q3.3 curriculum already provides. Privacy accounting under a *time-varying* curriculum distribution is an open theoretical question at the Q3.2 / Q3.3 boundary.

### FL adoption per pipeline stage

The three-stage pipeline factors cleanly along the FL boundary:

| Stage | Local | Shared | FL strategy |
|---|---|---|---|
| Stage 1: VGAE training and hard-sample selection | Per-vehicle hard-sample buffer | VGAE encoder/decoder weights | SCAFFOLD on encoder; local hard-sample mining (per-vehicle benign distribution is local) |
| Stage 2: GAT training with curriculum + KD | Per-vehicle curriculum momentum schedule, per-vehicle batch composition | GAT backbone, KD teacher logits | Federated KD with federated teacher logits; shared backbone with per-platform input projection |
| Stage 3: Adaptive fusion (DQN/bandit) | Per-vehicle calibration (Q2.1), per-vehicle reward function coefficients | Fusion-policy backbone | Federated initialisation; per-vehicle online adaptation via Neural-LinUCB (closed-form update Eq. {eq}`eq-bandit-accum` adapts locally without re-federation) |

The decomposition follows the pipeline: the VGAE+GAT teacher is the federation target (high benefit, low privacy risk — gradients aggregate), and the fusion policy is the personalisation point (per-vehicle calibrated, Q4.1 reward shift local). This dovetails with Q3.1: federated KD is genuinely bilevel — the inner problem distills a per-client student against a *federated* teacher; the outer chooses federation strategy and student capacity jointly. The bilevel also spans time scales — federated body at round-time, local head at deployment-epoch time — so the federated-body / local-head split is the multi-scale bilevel decomposition, not just architectural convenience.

## Question 3.3

> Curriculum learning modifies the training distribution over time. Does a curriculum-trained model converge to the same solution as one trained on the full distribution, and what bias might it introduce?

### Does it converge to the same solution?

**No**, not in general. Curriculum learning modifies the *effective* training distribution $p_t(x, y)$ at each step, changing the expected gradient and SGD's trajectory. Deep networks are non-convex and SGD's weights depend on initialisation *and* path; two trajectories over different distributions converge to different stationary points even when both minimise the same terminal empirical risk. @bengio2009curriculum frames the mechanism as a "continuation method" guiding SGD toward better local optima — convergence to a *different* solution than vanilla training is the claimed benefit, not a side effect.

More precisely: curriculum changes the *implicit bias* of SGD. @hacohen2019power show curriculum-trained networks converge faster and to lower final loss than shuffled-baseline training, with the gap largest on harder tasks. The @soviany2022curriculum survey catalogues the same pattern across vision, NLP, and RL: curriculum modifies both the *rate* and the *destination* of optimisation. The answer is asymmetric: for convergence *rate*, curriculum can strictly improve it; for convergence to a *specific* minimum, it generally does not.

A sufficient condition for convergence to the *same* minimum is that the schedule asymptotes to the full distribution before SGD reaches a basin and the loss is convex in that basin. Neither holds for a deep GAT.

### What bias does it introduce?

Every curriculum choice encodes a prior about which examples shape the model earliest. The effective training distribution integrated over the schedule,

$$\tilde{p}(x, y) = \frac{1}{T}\sum_{t=1}^{T} p_t(x, y),$$

is not the deployment distribution $p_{\text{nat}}(x, y)$. Three bias manifestations worth separating:

1. **Class-prior shift.** Oversampling the minority class early inflates its weight in $\tilde p$, giving a softer majority prior than the MLE on $p_{\text{nat}}$. At threshold $0.5$ this raises minority recall and lowers precision — a calibrated expression of the imbalance trade-off, not a bug.
2. **Feature-selection bias.** Because minority features are seen *first*, earliest-layer filters develop around minority-discriminative patterns. Later imbalanced exposure fine-tunes the head but leaves the representation biased toward the minority — the transfer-of-easy-example mechanism @hacohen2019power argue for.
3. **Calibration drift.** A different effective prior than $p_{\text{nat}}$ means softmax probabilities no longer match empirical frequencies at deployment. Every class-rebalancing intervention (oversampling, class-weighted loss, focal loss [@lin2017focal]) produces this miscalibration [@guo2017calibration]; curriculum is its time-varying form and inherits the pathology.

Biases (1) and (2) are features by design — the framework targets minority-attack recall under 927:1 imbalance. Bias (3) is a liability that propagates: measure it (re-enters Q2.1), correct at inference via temperature scaling on a natural-distribution split — and extend the same correction to the Q1.1 gate thresholds, which are calibration parameters fit on the same drifted distribution.

### Anti-curriculum with difficulty-aware replay

The momentum-based curriculum differs subtly from the Bengio easy-to-hard paradigm:

$$p_t = 1 - \exp(-t / \tau),\qquad B_t = (1 - p_t)\,B_{\text{bal}} + p_t\,B_{\text{nat}} + \alpha_{\text{buf}}\,B_{\text{hard}}$$

At $t=0$, batches are fully class-*balanced* ($p_t\to 0$) — the minority attack class is *oversampled*, not undersampled. As $t$ grows, the mixture exponentially blends toward the natural imbalanced distribution. The hard-sample buffer $B_{\text{hard}}$ (refreshed every 100 steps from the highest-VGAE-error samples) holds a persistent $\alpha_{\text{buf}}=0.2$ weight throughout.

This is not Bengio-style easy-to-hard — rare attacks are arguably the *hardest* examples. It is closer to *anti-curriculum with difficulty-aware replay* [@soviany2022curriculum §§ Self-Paced Learning and Hard Example Mining]. The design rationale: "This prevents premature majority bias while maintaining natural distribution awareness."

Biases this specific schedule introduces:

- **Intended:** Minority-attack recall gains (§GAT Training Strategy ablation, 927:1-imbalance motivation). The momentum schedule gives a continuous knob $\tau$ trading precision for recall.
- **Intended:** Hard-sample replay biases the learned representation toward the VGAE's error surface, coupling the two stages — curriculum-by-model rather than curriculum-by-heuristic.
- **Unintended, measurable:** Majority-class calibration drift — predicted $P(\text{attack})$ exceeds the natural $0.1\%$–$3\%$ base rate. Quantify with class-conditional ECE (Q2.1).
- **Unintended, worth testing:** Final-weight divergence from a non-curriculum baseline. Two cheap tests at $N=3$ seeds:
  - Parameter distance $\|\theta_{\text{curr}} - \theta_{\text{nat}}\|_2 / \|\theta_{\text{nat}}\|_2$ per layer.
  - Prediction disagreement on natural-distribution test data, stratified by class.
