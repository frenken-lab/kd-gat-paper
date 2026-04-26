---
title: "3. Federated Learning, Optimization, and Convergence"
---

## Question 3.1

> Knowledge distillation can be framed as a bilevel optimization problem. Discuss the relationship between teacher capacity, student capacity, and task complexity.

### Bilevel formulation made explicit

Knowledge distillation [@hinton2015distilling; @bucilua2006model] is naturally a *bilevel* program. The outer problem chooses a student architecture (capacity, depth, width) under deployment constraints; the inner problem fits the student's weights to a frozen teacher under a chosen distillation loss. Writing the student architecture as $\mathcal{A}_S$ from a search space $\Omega$, student weights as $\theta_S$, and the frozen teacher as $f_T$:

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

Because the inner solution $\theta_S^\star(\mathcal{A}_S)$ depends on the outer choice, the gradient of the outer objective passes through the inner optimum. Most production KD pipelines (including this one) replace the bilevel solve with a single-level approximation: pick $\mathcal{A}_S$ by hand, then solve only the inner problem. Genuine bilevel approaches — gradient-based architecture search applied to KD, gradient-of-the-inner-optimum methods, or population-based co-search — are uncommon in practice but are the formally correct treatment.

### How task complexity coupling shrinks the viable capacity gap

Empirically, the teacher–student capacity gap that still permits successful transfer is *not* monotone in either teacher or student size; it has a sweet spot that *shrinks* as task complexity grows. Three lines of evidence:

- **Distillation scaling laws** [@distillation-scaling-laws] sweep teacher and student sizes from 143 M to 12.6 B parameters and find a compute-optimal compression ratio that flattens at $2$–$3\times$ on hard language tasks. Beyond the sweet spot, *larger teachers actively hurt smaller students* — the larger teacher's distribution becomes unrepresentable in the student's hypothesis class, and the KL-target gradient pushes the student off-manifold.
- **Capacity-gap law** [@Towards-Law-of-Capacity-Gap2025] formalises this as an inverted-U over student size: for fixed teacher and task, student accuracy after KD has a single maximum, and the location of that maximum depends on the teacher's compute-optimality on the task. The implication for design is that picking a teacher first and then a student in the conventional fashion is potentially the wrong order — the joint $(|f_T|, |f_S|)$ choice should be made against task complexity.
- **Teacher-assistant remediation** [@Mirzadeh-TAKD2020; @DenselyGuided-KD2019; @Gap-KD2025] addresses the gap directly when the architectural constraint forces an unfavourable ratio: insert one or more intermediate "TA" networks of geometrically interpolated capacity, distill teacher → TA → student. This is essentially a chain of bilevel programs whose outer choice is the *number and size of TAs* rather than a single student.

The relationship between the three quantities is therefore:

$$
\Delta^\star_{\text{cap}}(\mathcal{T}) = \frac{|f_T|}{|f_S|}\Bigg|_{\text{optimal}} \;\propto\; \frac{1}{\mathcal{T}^\beta}
$$

with empirically $\beta \in [0.3, 0.7]$ depending on architecture family [@distillation-scaling-laws] — i.e. the harder the task, the tighter the gap. *Binary* attack/benign classification on CAN traffic is the easy end of this curve, which is why the existing $68\times$ ratio (`paper/candidacy/proposed-research.md` §Intelligent KD) still performs well. The same student would almost certainly fail at $68\times$ on a 9-class attack-typing task or on multi-vehicle joint training (`paper/candidacy/proposed-research.md` §Multi-Dataset Joint Training), where $\mathcal{T}$ is materially higher.

A complementary observation from the graph-distillation survey [@kdgraph_survey2023]: graph KD is *empirically* tolerant of larger compression ratios than vision/NLP KD on equal task complexity, because attention-graph structures expose more redundant computation than dense feature stacks. This widens $\Delta^\star_{\text{cap}}$ for the GAT student here relative to a vision baseline at the same task difficulty.

### How this framework specifically maps onto the bilevel view

The current setup is a *single-level reduction*: the outer choice has been made by hand and the inner problem is what gets solved.

| Bilevel role | This framework | Where |
|---|---|---|
| Outer space $\Omega$ | Implicit: chosen student is a 33K-parameter GAT (`paper/content/methodology.md:109`); 68× compression ratio | `paper/candidacy/proposed-research.md` §Intelligent KD lines 195–197 |
| Hardware constraint $C_{\text{hw}}$ | $\mathrm{FLOPs}_{\max} = 2.5\times 10^6$ on ARM Cortex-A7 | Eq. {eq}`eq-flops-budget` |
| Teacher $f_T$ | Pretrained GAT teacher (frozen) | `paper/content/methodology.md:109` |
| Inner objective | $\mathcal{L}_{\text{total}} = (1-\lambda)\mathcal{L}_{\text{hard}} + \lambda\mathcal{L}_{\text{KD}}$ with $T=4$, $\lambda=0.7$ | Eq. {eq}`eq-kd-total-loss` |
| Inner solution evidence | F1 reported in `paper/content/ablation.md` §Knowledge Distillation Effects; CKA layer-similarity in [](#fig-cka) shows the student tracks the teacher representation despite the 20× parameter reduction | `paper/content/ablation.md:30, :39` |

The $68\times$ ratio is well above the conservative $2$–$3\times$ scaling-law sweet spot, which is permissible only because the binary CAN attack/benign task sits at the easy end of the complexity curve. The actual constraint that fixes the student size is $C_{\text{hw}}$, not statistical optimality — this is the standard automotive trade-off: hardware closes the outer optimisation before task complexity does.

### Open questions

- **Genuine bilevel solve.** Co-optimising student width/depth with the inner distillation loss — gradient-based architecture search applied to KD, or population-based co-search — has not been attempted. The cheap version of this is a sweep over $\{|\theta_S| / |\theta_T|\} \in \{1/100,\, 1/68,\, 1/30,\, 1/10,\, 1/3\}$ at fixed task; this empirically traces the inverted-U from @Towards-Law-of-Capacity-Gap2025 on CAN data and is a clean OFAT axis (`paper/content/ablation.md:14`).
- **Task-complexity sweep.** Repeating the above curve at three task difficulties — binary detection, 5-class attack typing, 9-class fine-grained typing — would *empirically* verify the $\Delta^\star_{\text{cap}}(\mathcal{T})$ relationship on CAN data and is, to our knowledge, not in the literature for graph-IDS distillation.
- **Teacher-quality vs. teacher-size separation.** @distillation-scaling-laws argues quality dominates size at small student budgets; the current ablation does not vary teacher quality independently of size. A teacher trained to comparable F1 with half the parameters should produce a stronger student than the current teacher, all else equal.
- **TA chain for higher-complexity extensions.** If multi-vehicle joint training (`paper/candidacy/proposed-research.md` §Multi-Dataset Joint Training) materialises, the existing $68\times$ ratio will likely exit the viable gap. Inserting a single TA at $\sqrt{68}\approx 8\times$ between teacher and student [@Mirzadeh-TAKD2020; @Gap-KD2025] is the cheapest remediation and a natural deferred contribution.
- **Born-again / mutual learning baselines.** Same-size student-to-student distillation [@furlanello2018born] and deep mutual learning [@zhang2018deep] are absent from the comparison and would isolate how much of the KD gain comes from the *capacity gap* versus from soft targets per se.

## Question 3.2

> How could federated learning enable collaborative model improvement across a fleet of edge devices with heterogeneous, privacy-sensitive data? What convergence challenges arise from non-IID distributions in this setting?

### Why FL is the natural fit

Three properties of the automotive IDS setting jointly motivate federated learning:

- **Privacy.** Per-vehicle CAN traces expose proprietary OEM signal layouts, driver behaviour, and route patterns — none of which OEMs are willing to upload to a central server. The trust paradox flagged in `paper/candidacy/introduction.md` Challenge 3 [@Trustworthiness; @BlackBoxRisk] applies a fortiori at the *data* layer: even a perfectly explainable model is unacceptable if training requires raw CAN upload.
- **Attack-diversity coverage.** Any single vehicle observes a vanishingly small fraction of the attack distribution (`paper/candidacy/proposed-research.md` §Federated Learning Across Vehicles). Federation pools gradient information across the fleet without pooling raw data, addressing the long-tail problem on rare attack types.
- **Edge-compute constraint.** The Cortex-A7 budget Eq. {eq}`eq-flops-budget` already constrains the *student* model size; federation amortises the *teacher* training cost across the fleet, which is the reason KD and FL appear in the same proposal section.

The challenge is that the resulting client distributions are non-IID along three independent axes, each of which breaks a different optimisation property of FedAvg.

### Three axes of non-IID heterogeneity, formalised

Indexing fleet vehicles by $i \in \{1, \ldots, K\}$ with local distribution $p_i(x, y)$:

**1. Label shift — attack-exposure heterogeneity.** Different vehicles see different attack-class mixes. The natural CAN-IDS class imbalance from `paper/content/introduction.md:15` already runs at 927:1 benign-to-attack; on a single vehicle some attack subclasses may *never* appear. Formally:

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
| OOV-robust embedding (`paper/content/methodology.md` §Handling OOV IDs) | **Hash-based version federates cleanly**; lookup table does not | The $k$-probe hash variant maps every ID to bucketed shared rows by construction; the lookup-plus-UNK variant requires shared vocabulary which leaks per-OEM IDs |
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

Differential privacy via DP-SGD [@abadi2016dpsgd] adds Gaussian noise to clipped gradients with budget $(\varepsilon, \delta)$. The interaction with the framework's 927:1 imbalance is the central obstacle:

$$
\frac{\text{signal}}{\text{noise}} \;\sim\; \frac{\|\bar{g}_{\text{minority}}\|}{\sigma\sqrt{d/B}}, \quad \text{where } \|\bar{g}_{\text{minority}}\| \propto p(\text{attack}) \approx 0.1\%
$$

The minority-class gradient signal is an order of magnitude weaker than the majority-class signal at any batch, so a uniform noise budget over-noises minority gradients relative to signal. The remedies are *class-conditional clipping bounds* (different $C_y$ per class) or *amplification by sampling* (oversampling minority-class examples per batch, which the curriculum mechanism from Q3.3 already does). Pairing the curriculum schedule with DP-SGD is non-obvious and unstudied; the curriculum modifies the effective sampling distribution and changes the privacy accounting, which has not been worked out for any class-imbalanced application.

### How this framework specifically would adopt FL

The three-stage pipeline factors cleanly along the FL boundary:

| Stage | Local | Shared | FL strategy |
|---|---|---|---|
| Stage 1: VGAE training and hard-sample selection | Per-vehicle hard-sample buffer (`paper/content/methodology.md:55`) | VGAE encoder/decoder weights | SCAFFOLD on encoder; local hard-sample mining (per-vehicle benign distribution is local) |
| Stage 2: GAT training with curriculum + KD | Per-vehicle curriculum momentum schedule, per-vehicle batch composition | GAT backbone, KD teacher logits | Federated KD (clients receive teacher logits from a federated teacher), shared backbone with per-platform input projection |
| Stage 3: Adaptive fusion (DQN/bandit) | Per-vehicle calibration (Q2.1), per-vehicle reward function coefficients | Fusion-policy backbone | Federated initialisation, per-vehicle online adaptation via Neural-LinUCB (the closed-form linear update Eq. {eq}`eq-bandit-accum` is amenable to local adaptation without re-federation) |

This decomposition uses the existing pipeline structure: the VGAE+GAT teacher is the natural federation target (high benefit, low privacy risk because gradients are aggregated); the fusion policy is the natural personalisation point (low federation benefit because it's per-vehicle calibrated, and Q4.1 reward shift is a local phenomenon). It also dovetails with Q3.1 — federated KD is genuinely bilevel: the inner problem distills a per-client student against a *federated* teacher, and the outer problem chooses both the federation strategy and the student capacity simultaneously.

### Open questions

- **Empirical baseline sweep.** Run FedAvg, FedProx, and SCAFFOLD on a synthetic federated CAN setup constructed by sharding the existing centralised datasets (CAR-Hacking, ROAD, can-train-and-test) by attack-class mix to simulate axis-1 non-IID. Report convergence-rate vs. local-step count $E$. This is the cheapest empirical entry point and tests the per-axis recommendation table above.
- **Architectural ablation for graph heterogeneity.** Compare: (a) global per-feature projection, (b) per-platform input projection with shared backbone, (c) per-platform input *and* output heads. Hypothesis: (b) is sufficient when concept shift is small (intra-OEM) and (c) is required across OEMs.
- **DP-SGD × curriculum interaction.** The curriculum schedule from Q3.3 changes the effective sampling distribution per batch; the privacy accounting [@abadi2016dpsgd] under amplification-by-sampling needs to be re-derived for the time-varying $p_t$. This is a clean theoretical contribution at the intersection of Q3.2 and Q3.3.
- **Byzantine red-team protocol.** The threat-model taxonomy from Q1.2 needs to be extended with poisoned-client attacks: single-client full-access, multi-client limited-access, gradient-inversion attacks against DP-SGD. Without a concrete attacker, the Byzantine-robust aggregation choice cannot be motivated empirically.
- **Federated KD as bilevel.** Composing Q3.1's bilevel formulation with FL — outer problem is shared, inner problem is per-client — has not been written down formally. The interaction between the capacity-gap law [@Towards-Law-of-Capacity-Gap2025] and per-client task-complexity heterogeneity is a genuine open research question.
- **Compliance under FL.** ISO 26262 [@ISO26262Part1; @ISO26262SafetyCase] and the NIST AI RMF [@NISTAIRisk] both require traceability of the trained model to its training data. Federated training breaks naive auditability; whether per-client gradient logs satisfy the audit requirement is a regulatory question the framework should address before any FL deployment.

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
