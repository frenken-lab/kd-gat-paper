---
title: "3. Federated Learning, Optimization, and Convergence"
---

## Question 3.1

> Knowledge distillation can be framed as a bilevel optimization problem. Discuss the relationship between teacher capacity, student capacity, and task complexity.

### Bilevel formulation

KD [@hinton2015distilling; @bucilua2006model]'s outer problem chooses a student architecture (capacity, depth, width) under deployment constraints; the inner problem fits the student's weights to a frozen teacher under a chosen distillation loss. Writing the student architecture as $\mathcal{A}_S$ from a search space $\Omega$, student weights as $\theta_S$, and the frozen teacher as $f_T$:

$$
\begin{aligned}
\text{(outer)}\quad & \mathcal{A}_S^\star = \arg\min_{\mathcal{A}_S \in \Omega}\; \mathcal{R}_{\text{val}}\bigl(f_{S}(\,\cdot\,;\,\theta_S^\star(\mathcal{A}_S),\,\mathcal{A}_S)\bigr) \\
\text{s.t.}\quad & \mathrm{FLOPs}(\mathcal{A}_S) \le C_{\text{hw}},\quad \mathrm{Latency}(\mathcal{A}_S) \le L_{\text{hw}} \\[4pt]
\text{(inner)}\quad & \theta_S^\star(\mathcal{A}_S) = \arg\min_{\theta_S}\; \underbrace{(1-\lambda)\,\mathcal{L}_{\text{hard}}(\theta_S)}_{\text{ground-truth CE}} + \underbrace{\lambda\,\mathcal{L}_{\text{KD}}(\theta_S; f_T, T)}_{\text{KL to soft teacher targets}}
\end{aligned}
$$

This recovers Eq. {eq}`eq-kd-total-loss` and Eq. {eq}`eq-temperature-scaling` from the background as the *inner* objective; the *outer* objective is the deployment risk under hardware constraints, which in this framework is the FLOP/latency budget Eq. {eq}`eq-flops-budget` for the ARM Cortex-A7 target [@ARMCortexA7]. Three quantities couple the two levels:

- **Teacher capacity** $|f_T|$ — fixed *before* the bilevel program; sets the ceiling on the soft-target signal entropy. A teacher near random produces flat targets and degenerates the KD loss to a label-smoothed CE.
- **Student capacity** $|f_S|$ — the outer decision variable, bounded above by $C_{\text{hw}}$ and below by the task's intrinsic dimension.
- **Task complexity** $\mathcal{T}$ — fixes the minimum student capacity that can absorb the teacher's function. Operationalised by Bayes-optimal error or, more practically, by the size of the smallest model that can solo-train to the teacher's accuracy.

Because the inner solution $\theta_S^\star(\mathcal{A}_S)$ depends on the outer choice, the gradient of the outer objective passes through the inner optimum. Most production KD pipelines (including this one) replace the bilevel solve with a single-level approximation: pick $\mathcal{A}_S$ by hand, then solve only the inner problem. Genuine bilevel approaches — gradient-based architecture search applied to KD, gradient-of-the-inner-optimum methods, or population-based co-search — are uncommon in practice but are the formally correct treatment. The proposed extension here is an empirical sweep over the (capacity-ratio, task-complexity) grid that traces the inverted-U from @Towards-Law-of-Capacity-Gap2025, not a bilevel solve.

### How task complexity coupling shrinks the viable capacity gap

Empirically, the teacher–student capacity gap that still permits successful transfer is *not* monotone in either teacher or student size; it has a sweet spot that *shrinks* as task complexity grows. Three lines of evidence:

- **Distillation scaling laws** [@distillation-scaling-laws] sweep teacher and student sizes from 143 M to 12.6 B parameters and find a compute-optimal compression ratio that flattens at $2$–$3\times$ on hard language tasks. Beyond the sweet spot, *larger teachers actively hurt smaller students* — the larger teacher's distribution becomes unrepresentable in the student's hypothesis class, and the KL-target gradient pushes the student off-manifold.
- **Capacity-gap law** [@Towards-Law-of-Capacity-Gap2025] formalises this as an inverted-U over student size: for fixed teacher and task, student accuracy after KD has a single maximum, and the location of that maximum depends on the teacher's compute-optimality on the task. The implication for design is that picking a teacher first and then a student in the conventional fashion is potentially the wrong order — the joint $(|f_T|, |f_S|)$ choice should be made against task complexity.
- **Teacher-assistant remediation** [@Mirzadeh-TAKD2020; @DenselyGuided-KD2019; @Gap-KD2025] addresses the gap directly when the architectural constraint forces an unfavourable ratio: insert one or more intermediate "TA" networks of geometrically interpolated capacity, distill teacher → TA → student. This is essentially a chain of bilevel programs whose outer choice is the *number and size of TAs* rather than a single student.

The relationship between the three quantities is therefore:

$$
\Delta^\star_{\text{cap}}(\mathcal{T}) = \frac{|f_T|}{|f_S|}\Bigg|_{\text{optimal}} \;\propto\; \frac{1}{\mathcal{T}^\beta}
$$

with empirically $\beta \in [0.3, 0.7]$ depending on architecture family [@distillation-scaling-laws] — i.e. the harder the task, the tighter the gap. *Binary* attack/benign classification on CAN traffic is the easy end of this curve, which is why the existing $68\times$ ratio ([](#subsec:IntelKD)) still performs well. The same student would almost certainly fail at $68\times$ on a 9-class attack-typing task or on multi-vehicle joint training ([](#subsec:CrossD)), where $\mathcal{T}$ is materially higher.

A complementary observation from the graph-distillation survey [@kdgraph_survey2023]: graph KD is *empirically* tolerant of larger compression ratios than vision/NLP KD on equal task complexity, because attention-graph structures expose more redundant computation than dense feature stacks. This widens $\Delta^\star_{\text{cap}}$ for the GAT student here relative to a vision baseline at the same task difficulty.

### How this framework maps onto the bilevel view

The current setup is a *single-level reduction*: the outer choice has been made by hand and the inner problem is what gets solved.

| Bilevel role | This framework | Where |
|---|---|---|
| Outer space $\Omega$ | Implicit: chosen student is a 33K-parameter GAT; 68× compression ratio | [](#subsec:IntelKD) |
| Hardware constraint $C_{\text{hw}}$ | $\mathrm{FLOPs}_{\max} = 2.5\times 10^6$ on ARM Cortex-A7 | Eq. {eq}`eq-flops-budget` |
| Teacher $f_T$ | Pretrained GAT teacher (frozen) | §Methodology |
| Inner objective | $\mathcal{L}_{\text{total}} = (1-\lambda)\mathcal{L}_{\text{hard}} + \lambda\mathcal{L}_{\text{KD}}$ with $T=4$, $\lambda=0.7$ | Eq. {eq}`eq-kd-total-loss` |
| Inner solution evidence | F1 reported in §Knowledge Distillation Effects of the ablation; CKA layer-similarity in [](#fig-cka) shows the student tracks the teacher representation despite the 20× parameter reduction | §Ablation |

The $68\times$ ratio is well above the conservative $2$–$3\times$ scaling-law sweet spot, which is permissible only because the binary CAN attack/benign task sits at the easy end of the complexity curve. The actual constraint that fixes the student size is $C_{\text{hw}}$, not statistical optimality — this is the standard automotive trade-off: hardware closes the outer optimisation before task complexity does.

## Question 3.2

> How could federated learning enable collaborative model improvement across a fleet of edge devices with heterogeneous, privacy-sensitive data? What convergence challenges arise from non-IID distributions in this setting?

### Why FL is the natural fit

Three properties of the automotive IDS setting jointly motivate federated learning:

- **Privacy.** Per-vehicle CAN traces expose proprietary OEM signal layouts, driver behaviour, and route patterns — none of which OEMs are willing to upload to a central server. The trust paradox flagged in Challenge 3 of the introduction [@Trustworthiness; @BlackBoxRisk] applies a fortiori at the *data* layer: even a perfectly explainable model is unacceptable if training requires raw CAN upload.
- **Attack-diversity coverage.** Any single vehicle observes a vanishingly small fraction of the attack distribution ([](#subsec:FL)). Federation pools gradient information across the fleet without pooling raw data, addressing the long-tail problem on rare attack types.
- **Edge-compute constraint.** The Cortex-A7 budget Eq. {eq}`eq-flops-budget` already constrains the *student* model size; federation amortises the *teacher* training cost across the fleet, which is the reason KD and FL appear in the same proposal section.

The challenge is that the resulting client distributions are non-IID along three independent axes, each of which breaks a different optimisation property of FedAvg.

### Three axes of non-IID heterogeneity

Indexing fleet vehicles by $i \in \{1, \ldots, K\}$ with local distribution $p_i(x, y)$:

**1. Label shift — attack-exposure heterogeneity.** Different vehicles see different attack-class mixes. The natural CAN-IDS class imbalance already runs at 927:1 benign-to-attack; on a single vehicle some attack subclasses may *never* appear. Formally:

$$
p_i(y) \;\ne\; p_j(y) \quad\text{for}\quad i \ne j, \qquad p_i(y \mid x) \;=\; p_j(y \mid x)
$$

**2. Feature shift — wear, environment, route.** Same attack labels, different conditional feature distributions. A vehicle in a cold-weather region exhibits different baseline CAN bytes than one in a hot-weather region; tire wear changes the dynamics signals fed to the PINN (Q1.1). Formally:

$$
p_i(x \mid y) \;\ne\; p_j(x \mid y), \qquad p_i(y) \;=\; p_j(y)
$$

**3. Concept shift — OEM-specific protocol semantics.** Two OEMs can use the same arbitration ID for different signals; an "engine RPM at byte 4" rule on vehicle $i$ is "throttle position at byte 4" on vehicle $j$. Same input bytes, different semantic labels:

$$
p_i(y \mid x) \;\ne\; p_j(y \mid x)
$$

These three are *qualitatively* different and require qualitatively different remedies. Most FL-IDS literature collapses them into a single "non-IID" category and reports FedAvg degradation as if it were one phenomenon; the framework's three-stage pipeline (VGAE / GAT / fusion) suggests a clean per-stage decomposition (below).

### Convergence challenges of FedAvg under non-IID

FedAvg [@mcmahan2017fedavg]'s per-round update is $\theta^{(t+1)} = \sum_i \frac{n_i}{n} \theta_i^{(t)}$ where $\theta_i^{(t)}$ is the result of $E$ local SGD steps on client $i$. Under IID data the local trajectories track the global gradient; under non-IID they *drift*, and FedAvg's update is no longer a descent direction on the global loss [@kairouz2021advances]. The key quantities:

$$
\text{Client drift:}\quad \delta_i^{(t)} \;=\; \nabla F_i(\theta^{(t)}) \;-\; \nabla F(\theta^{(t)})
$$

When $\sum_i \frac{n_i}{n} \|\delta_i\|^2$ is large (non-IID is severe and $E$ is large), the FedAvg iterate converges to a stationary point of $\sum_i \frac{n_i}{n} F_i$ that is not a stationary point of $F$ — the well-known "drift" pathology. Two standard remedies:

**FedProx [@li2020fedprox] — proximal regularisation on the local objective.** Each client minimises a regularised version of its local loss:

$$
\theta_i^{(t+1)} \;=\; \arg\min_\theta \; F_i(\theta) \;+\; \tfrac{\mu}{2}\,\|\theta - \theta^{(t)}\|^2
$$

The proximal term penalises drift away from the global iterate; with $\mu > 0$ the local update is constrained to a neighbourhood of $\theta^{(t)}$ and FedAvg's bias decays with $\mu$. The trade-off is convergence rate: large $\mu$ kills client drift but slows local progress.

**SCAFFOLD [@karimireddy2020scaffold] — control-variate variance reduction.** Each client maintains an estimate $c_i$ of its drift direction; the local update subtracts $c_i$ to align with the global gradient:

$$
\theta_i^{(t+1)} \;\leftarrow\; \theta_i^{(t)} \;-\; \eta \bigl(\nabla F_i(\theta_i^{(t)}) \;-\; c_i \;+\; c\bigr)
$$

with $c = \tfrac{1}{K}\sum_j c_j$ the global control variate. Under bounded gradient variance, SCAFFOLD recovers IID-like convergence rates regardless of $E$.

**Per-axis recommendation.** Label shift (axis 1) is well-handled by SCAFFOLD; the variance-reduction step exactly compensates for class-imbalance-induced gradient bias. Feature shift (axis 2) responds to FedProx because it primarily slows down client-specific overfitting. Concept shift (axis 3) cannot be handled by either — the conditional distribution mismatch means a single shared model is the wrong target. The remedy is *personalisation*: a shared backbone with per-client heads, which is also the natural answer to graph heterogeneity below.

### Graph-heterogeneity-specific challenges

CAN graphs from different OEMs have different node counts (variable ECU topology), different edge structures (transition patterns), and different per-node feature semantics. None of the three remedies above addresses graph heterogeneity directly because they all assume a fixed parameter space across clients.

**Architectural answer: federated shared backbone + per-platform input projection and output head.**

| Component | Federated? | Rationale |
|---|---|---|
| Per-platform input projection (35-dim node feature → shared $d$-dim) | **Local only** | Absorbs OEM-specific feature semantics; cannot be shared across vehicles with different CAN signal layouts |
| Shared GAT backbone | **Federated (FedAvg/SCAFFOLD)** | Protocol-invariant features (timing anomalies, frequency deviations) generalise across vehicles |
| Per-platform output head | **Local only** (or clustered FL across OEM cohorts) | Different attack-class distributions and OEM-specific semantics |
| OOV-robust embedding (§Handling OOV IDs) | **Hash-based version federates cleanly**; lookup table does not | The $k$-probe hash variant maps every ID to bucketed shared rows by construction; the lookup-plus-UNK variant requires shared vocabulary which leaks per-OEM IDs |
| VGAE encoder/decoder | **Federated** | Reconstruction is symmetric across protocols; per-platform anomaly thresholds remain local |
| Fusion policy (DQN / Neural-LinUCB) | **Personalised local fine-tune from federated initialisation** | The fusion policy directly depends on per-vehicle confidence calibration (Q2.1) which differs across feature distributions |

This pattern — federated body, local heads — is the standard answer to architectural heterogeneity in personalised FL. The CAN-IDS-specific contribution is the choice of *which* component is local: the input projection (because OEM-specific) and the fusion head (because Q2.1 calibration is per-vehicle).

### The Byzantine-robustness dimension

In FedAvg, a single malicious client can poison the global model unboundedly: by sending an arbitrary $\theta_i^{(t)}$ they can shift the average by $\Theta(1/K)$ per round, which compounds over training. For an IDS specifically, this is a *deployment-time* attack — an attacker who compromises one vehicle in the fleet can degrade detection for the rest. Three layers of defence:

- **Geometric-median aggregation (Krum, multi-Krum, median-of-means).** Replace the FedAvg average with a robust statistic; under bounded gradient variance and at most $f$ malicious clients, Krum's selected gradient is provably close to the honest average [@blanchard2017krum].
- **Norm clipping.** Bound each client update's $L_2$ norm; an attacker can still inject malicious gradient direction but cannot inflate magnitude. Standard alongside DP-SGD [@abadi2016dpsgd] because the noise scale is calibrated to clipped gradients.
- **Anomaly-detection-on-clients.** Treat client gradients as data and run an anomaly detector (the FedCLEAN line of work flagged in `docs/research-directions.md` is one example). This is the same VGAE+GAT pattern as the IDS itself, applied one level up.

This connects directly to Q1.2 — the FL setting introduces a *new* attack surface (poisoned client updates) that must be added to the threat-model taxonomy. The defence-in-depth argument from Q1.2 (data-driven branch is structurally protected from estimator compromise) does *not* carry over: the federated GNN backbone is exactly the component an attacker would target.

### Privacy under DP-SGD interacts with class imbalance

DP-SGD [@abadi2016dpsgd] adds Gaussian noise to clipped gradients with budget $(\varepsilon, \delta)$, but a uniform noise budget over-noises minority gradients under 927:1 imbalance — the minority-class gradient norm scales with $p(\text{attack})\approx 0.1\%$, so the SNR collapses without intervention. Remedies are class-conditional clipping bounds ($C_y$ per class) or amplification by sampling, which the curriculum schedule of Q3.3 already provides. The privacy accounting under amplification by a *time-varying* curriculum sampling distribution remains an open theoretical question at the Q3.2 / Q3.3 boundary.

### How this framework would adopt FL

The three-stage pipeline factors cleanly along the FL boundary:

| Stage | Local | Shared | FL strategy |
|---|---|---|---|
| Stage 1: VGAE training and hard-sample selection | Per-vehicle hard-sample buffer | VGAE encoder/decoder weights | SCAFFOLD on encoder; local hard-sample mining (per-vehicle benign distribution is local) |
| Stage 2: GAT training with curriculum + KD | Per-vehicle curriculum momentum schedule, per-vehicle batch composition | GAT backbone, KD teacher logits | Federated KD (clients receive teacher logits from a federated teacher), shared backbone with per-platform input projection |
| Stage 3: Adaptive fusion (DQN/bandit) | Per-vehicle calibration (Q2.1), per-vehicle reward function coefficients | Fusion-policy backbone | Federated initialisation, per-vehicle online adaptation via Neural-LinUCB (the closed-form linear update Eq. {eq}`eq-bandit-accum` is amenable to local adaptation without re-federation) |

This decomposition uses the existing pipeline structure: the VGAE+GAT teacher is the natural federation target (high benefit, low privacy risk because gradients are aggregated); the fusion policy is the natural personalisation point (low federation benefit because it's per-vehicle calibrated, and Q4.1 reward shift is a local phenomenon). It also dovetails with Q3.1 — federated KD is genuinely bilevel: the inner problem distills a per-client student against a *federated* teacher, and the outer problem chooses both the federation strategy and the student capacity simultaneously.

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

Biases (1) and (2) are features by design — this framework explicitly targets minority-attack recall under 927:1 imbalance. Bias (3) is a liability that should be measured (it directly re-enters Q2.1) and corrected at inference via temperature scaling on a natural-distribution calibration split.

### How the curriculum in this framework behaves

The momentum-based curriculum is worth unpacking because it is subtly different from the Bengio easy-to-hard paradigm:

$$p_t = 1 - \exp(-t / \tau),\qquad B_t = (1 - p_t)\,B_{\text{bal}} + p_t\,B_{\text{nat}} + \alpha_{\text{buf}}\,B_{\text{hard}}$$

At $t=0$, batches are fully class-*balanced* ($p_t\to 0$) — meaning the minority attack class is *oversampled* rather than undersampled. As $t$ grows, the mixture exponentially blends toward the natural imbalanced distribution. The hard-sample buffer $B_{\text{hard}}$ (refreshed every 100 steps from the highest-VGAE-error samples) contributes a persistent $\alpha_{\text{buf}}=0.2$ weight throughout.

This is not "easy-to-hard" in the Bengio sense — the rare attacks are arguably the *hardest* examples. It is closer to *anti-curriculum with difficulty-aware replay* [@soviany2022curriculum §§ Self-Paced Learning and Hard Example Mining]. The design rationale states it directly: "This prevents premature majority bias while maintaining natural distribution awareness."

The biases this specific schedule introduces are therefore:

- **Intended:** Minority-attack recall gains, documented in the §GAT Training Strategy ablation and the 927:1-imbalance motivation. The momentum schedule gives a continuous knob $\tau$ trading precision for recall.
- **Intended:** Hard-sample replay biases the learned representation toward the VGAE's error surface, coupling the two stages and providing a form of curriculum-by-model rather than curriculum-by-heuristic.
- **Unintended (and measurable):** Calibration drift on the majority class — predicted $P(\text{attack})$ will systematically exceed the natural $0.1\%$–$3\%$ base rate. This should be quantified with class-conditional ECE (Q2.1).
- **Unintended (and worth testing):** Final-weight divergence from a non-curriculum baseline. Two concrete tests, both cheap at $N=3$ seeds:
  - Parameter-space distance $\|\theta_{\text{curr}} - \theta_{\text{nat}}\|_2 / \|\theta_{\text{nat}}\|_2$ per layer.
  - Prediction-disagreement rate on held-out natural-distribution test data, stratified by class.
