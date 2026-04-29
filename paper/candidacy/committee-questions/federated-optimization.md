---
title: "3. Federated Learning, Optimization, and Convergence"
---

## Question 3.1

> Knowledge distillation can be framed as a bilevel optimization problem. Discuss the relationship between teacher capacity, student capacity, and task complexity.

Knowledge distillation is typically presented as a pragmatic problem — use of a big model's soft outputs to improve a small model. That framing hides the nested structure: the architecture choice (which student to build) and the fitting problem (how to train it) are coupled but solved at different timescales. Applying the bilevel structure first used for differentiable architecture search [@DARTS2019]: the outer problem picks a student architecture under hardware constraints; the inner problem fits its weights to the frozen teacher:

$$
\begin{aligned}
\text{(outer)}\quad & \mathcal{A}_S^\star = \arg\min_{\mathcal{A}_S \in \Omega}\; \mathcal{R}_{\text{val}}\bigl(f_{S}(\,\cdot\,;\,\theta_S^\star(\mathcal{A}_S),\,\mathcal{A}_S)\bigr) \\
\text{s.t.}\quad & \mathrm{FLOPs}(\mathcal{A}_S) \le C_{\text{hw}},\quad \mathrm{Latency}(\mathcal{A}_S) \le L_{\text{hw}} \\[4pt]
\text{(inner)}\quad & \theta_S^\star(\mathcal{A}_S) = \arg\min_{\theta_S}\; \underbrace{(1-\lambda)\,\mathcal{L}_{\text{hard}}(\theta_S)}_{\text{ground-truth CE}} + \underbrace{\lambda\,\mathcal{L}_{\text{KD}}(\theta_S; f_T, T)}_{\text{KL to soft teacher targets}}
\end{aligned}
$$

Standard KD fixes the student architecture and solves only the inner problem; the bilevel frame is applied here to make the architecture-selection decision and its dependencies on the three shaping parameters explicit:

- **Teacher capacity** $|f_T|$: fixed before the bilevel program runs; sets the ceiling on soft-target entropy. A near-random teacher degenerates KD into label-smoothed CE.
- **Student capacity** $|f_S|$: the outer decision variable, bounded above by the hardware budget and below by the task's intrinsic dimension.
- **Task complexity** $\mathcal{T}$: fixes the minimum student capacity that can absorb the teacher's function. Typically represented as Bayes-optimal error or the smallest model that solo-trains to the teacher's accuracy.

The outer objective cannot be differentiated directly. By the implicit-function theorem, $\nabla_{\mathcal{A}_S} \mathcal{R}_{\text{val}} = (\partial \mathcal{R}/\partial \theta_S^\star)(\partial \theta_S^\star/\partial \mathcal{A}_S)$, where the second factor requires back-propagating through the inner optimum — a full inner re-solve per outer gradient step. At LLM scale this is intractable by cost; at graph-IDS scale, re-running the inner loop to convergence for every architecture candidate is equally prohibitive under the ARM Cortex-A7 FLOPs budget. Production KD treats the student architecture as a fixed choice and skips the outer solve.

The three parameters fill in for the missing gradient. Together $|f_T|$, $|f_S|$, and $\mathcal{T}$ describe the shape of $\mathcal{R}_{\text{val}}(|f_S|)$ through the inner optimum $\theta_S^\star(|f_S|)$. Four structural properties give a working map of the surface without solving the bilevel:

- **Task complexity sets inner-basin curvature.** Easy tasks admit wide basins where a range of student sizes reach near-optimal solutions; hard tasks have narrow basins that punish under-capacity sharply.
- **The outer surface inherits the inner basin.** Because validation risk depends on $\theta_S^\star(|f_S|)$, the outer surface is the inner basin projected along the student-architecture axis. The empirical inverted-U over student size is the structural fingerprint of that projection.
- **Teacher capacity sets the projection's amplitude.** Larger $|f_T|$ produces higher-entropy soft targets and steepens the inner KL gradient. Past a critical ratio the student can no longer represent the teacher's softmax — the "larger teachers hurt smaller students" pathology [@distillation-scaling-laws; @Mirzadeh-TAKD2020].
- **Task complexity moves the outer peak.** Higher $\mathcal{T}$ tightens the basin, so a student on the plateau at low complexity falls off the cliff at high complexity. The viable capacity gap $\Delta^\star_{\text{cap}}(\mathcal{T}) = |f_T|/|f_S|$ at the optimum shrinks monotonically in $\mathcal{T}$.

The field reconstructs this surface empirically through three approaches, each a partial read-off of the geometry above:

- The **capacity-gap inverted-U** [@Towards-Law-of-Capacity-Gap2025] — the outer surface projected onto the student-size axis, discovered by sweeping because nobody can differentiate it.
- **Teacher-assistant chains** [@Mirzadeh-TAKD2020; @DenselyGuided-KD2019; @Gap-KD2025] — local patches around poor outer minima; each TA is approximately one Newton step a bilevel solve would have produced automatically.
- **Distillation scaling laws** [@distillation-scaling-laws] — the outer surface characterised by grid search, viable only because the outer feasible set is searchable at LLM scale.

That last point is why the $68\times$ compression ratio in this framework ([](#subsec:IntelKD)) is defensible: binary CAN attack/benign sits at the easy end of the $\mathcal{T}$ axis, where the inner basin is wide and large compression ratios are tolerable. The same student would fail at $68\times$ on 9-class fine-grained typing (the nine attack scenarios in can-train-and-test [@Lampe2024cantrainandtest]: DoS, fuzzing, systematic, spoofing variants, standstill, interval) or multi-vehicle training ([](#subsec:CrossD)), where the basin narrows. Graph KD also tolerates larger compression than vision/NLP KD at matched complexity [@kdgraph_survey2023] — attention-graph computation has more redundant capacity than dense feature stacks, which further widens the viable gap here.

### Where this framework sits and where it's going

The current framework occupies a single point on the outer surface — the outer search was replaced by a hardware-budget constraint. Table 1 maps each component onto the bilevel abstraction, making explicit what was solved (inner KD objective) versus fixed by fiat (student architecture):

| Bilevel role                        | This framework                                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Outer space $\Omega$                | 33K-parameter GAT; $68\times$ compression                                                                                  |
| Hardware constraint $C_{\text{hw}}$ | $\mathrm{FLOPs}_{\max} = 2.5\times 10^6$ on ARM Cortex-A7                                                                  |
| Teacher $f_T$                       | Pretrained GAT teacher (frozen)                                                                                            |
| Inner objective                     | $\mathcal{L}_{\text{total}} = (1-\lambda)\mathcal{L}_{\text{hard}} + \lambda\mathcal{L}_{\text{KD}}$, $T=4$, $\lambda=0.7$ |
| Inner solution evidence             | F1 in §KD Effects ablation; CKA shows student tracks teacher despite 20× parameter reduction                               |

The proposed binary → 9-class fine-grained typing → multi-vehicle progression traverses the $\mathcal{T}$ axis: at each step the outer choice is re-optimised against the new task's inner basin. Sampling the surface — rather than differentiating it — is tractable here for three reasons: the ARM Cortex-A7 FLOPs budget closes the outer feasible set to an exhaustible range of student sizes; task complexity is varied by design, so each level is a controlled data point; and federation couples the two levels — SCAFFOLD control variates and FedProx proximal terms live in the student parameter space, so re-sizing the student changes the inner federated objective, not just its scale. The $(|f_S|, \mathcal{T})$ grid _is_ the bilevel solve, sampled rather than differentiated.

---

## Question 3.2

> How could federated learning enable collaborative model improvement across a fleet of edge devices with heterogeneous, privacy-sensitive data? What convergence challenges arise from non-IID distributions in this setting?

A global model trained on any single vehicle's CAN traces would miss attacks that vehicle never encountered. Federation solves coverage without data pooling — gradient information crosses OEM boundaries, raw CAN traces do not. But the fleet properties that make federation necessary also break the standard algorithm.

Three constraints force federation in this setting:

- OEMs will not upload raw CAN traces. They expose proprietary signal layouts, driver behaviour, and route patterns; a model requiring raw data upload is a non-starter regardless of accuracy.
- No single vehicle sees more than a sliver of the attack distribution. Rare attack subclasses (systematic spoofing, standstill variants) require fleet-scale gradient pooling to reach viable coverage.
- The ARM Cortex-A7 FLOP budget constrains the student; federation amortises teacher training cost across the fleet rather than paying it per vehicle.

The resulting client distributions are non-IID along three independent axes — and each axis breaks a different convergence guarantee of FedAvg.

### Three axes of non-IID heterogeneity

Indexing fleet vehicles by $i \in \{1, \ldots, K\}$ with local distribution $p_i(x, y)$:

- **Label shift** ($p_i(y) \ne p_j(y)$, conditionals match) — attack-exposure heterogeneity. The base 927:1 imbalance is amplified per vehicle; some attack subclasses never appear locally.
- **Feature shift** ($p_i(x \mid y) \ne p_j(x \mid y)$, marginals match) — wear, weather, route. Tire wear changes the dynamics signals feeding the PINN from Q1.1.
- **Concept shift** ($p_i(y \mid x) \ne p_j(y \mid x)$) — OEM-specific protocol semantics. Two OEMs can assign the same arbitration ID to different signals; same input, different label.

Most FL-IDS literature collapses these into a single "non-IID" category and reports degradation as if it were one phenomenon. The pipeline here factors cleanly along each axis, which matters because the fixes are different. Each axis maps to a distinct gradient-variance pathology: label shift amplifies per-client gradient variance in class-imbalanced directions; feature shift causes client-specific overfitting that accumulates as parameter drift; concept shift drives per-client gradients to point in structurally opposite directions for the same input — no amount of averaging converges to a shared function that works across OEMs.

### Convergence under FedAvg and what breaks

FedAvg [@mcmahan2017fedavg] averages $\theta^{(t+1)} = \sum_i \frac{n_i}{n} \theta_i^{(t)}$ over $E$ local SGD steps per client. Under IID data, local trajectories track the global gradient. Under non-IID, the per-client drift $\delta_i^{(t)} = \nabla F_i(\theta^{(t)}) - \nabla F(\theta^{(t)})$ accumulates, and FedAvg converges to a stationary point of $\sum_i \frac{n_i}{n} F_i$ rather than $F$ [@kairouz2021advances].

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/fedavg-drift.html
:label: fig-fedavg-drift
:width: 100%
Each client arrow shows where that client's iterate lands after $E$ local SGD steps, pulled toward its own local minimum. The three fleet axes pull in incompatible directions; their FedAvg aggregate (thick grey) drifts rightward — away from the global minimum $\theta^*$ — while SCAFFOLD's control variates (purple) correct the aggregate toward the true gradient direction.
:::

Two standard remedies handle two of the three axes:

- **FedProx** [@li2020fedprox] adds a proximal term $\frac{\mu}{2}\|\theta - \theta^{(t)}\|^2$ to each client's local loss, penalising drift from the round's anchor. Right primitive for feature shift (axis 2), which manifests as client-specific overfitting.
- **SCAFFOLD** [@karimireddy2020scaffold] subtracts a control variate $c_i - c$ from each local gradient. Under bounded gradient variance, it recovers IID-like rates for any $E$. Right primitive for label shift (axis 1), where class-imbalance-induced gradient variance is the failure.

Concept shift (axis 3) is not handled by either. A single shared model is the wrong target when the same input maps to different labels across clients. The answer there is personalisation — a shared backbone with per-client heads — which is also the architectural answer to graph heterogeneity.

### Federated body, local heads

CAN graphs from different OEMs have different node counts, edge structures, and per-node feature semantics. None of the per-axis remedies above address this because they all assume a fixed parameter space across clients. The architectural answer is to federate the shared substrate and localise the OEM-specific pieces:

| Stage / Component             | Local                                                                                        | Shared (federated)            | Strategy                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| Stage 1 — VGAE                | Per-vehicle anomaly thresholds, hard-sample buffer                                           | Encoder + decoder weights     | SCAFFOLD on the encoder; reconstruction is symmetric across protocols, thresholds remain vehicle-specific |
| Stage 2 — GAT backbone        | Per-platform input projection (OEM-specific signal layouts), per-vehicle curriculum schedule | GAT layers, KD teacher logits | FedAvg/SCAFFOLD on backbone; federated KD with federated teacher logits                                   |
| Stage 2 — OOV embedding       | Hash-bucket variant (lookup+UNK leaks per-OEM ID vocabulary)                                 | Hash-bucket shared rows       | $k$-probe hash maps every ID to shared rows by construction                                               |
| Stage 2 — Classification head | Per-platform output head (different attack-class distributions, OEM-specific semantics)      | —                             | Local only, or clustered FL across OEM cohorts                                                            |
| Stage 3 — Fusion policy       | Per-vehicle calibration (Q2.1), reward coefficients (Q4.1)                                   | Policy backbone               | Federated initialisation; per-vehicle online adaptation via Neural-LinUCB                                 |

The CAN-IDS-specific contribution is _which_ components go local: the per-platform input projection and the per-vehicle fusion head. This connects to Q3.1: federated body runs at round-time, local head at deployment-epoch time — federated-body / local-head is the multi-scale bilevel decomposition.

### Defending against poisoned updates

In FedAvg a single malicious client poisons the global model unboundedly — an arbitrary $\theta_i^{(t)}$ shifts the average by $\Theta(1/K)$ per round, compounding over training. For an IDS this is a deployment-time attack: one compromised vehicle degrades detection for the whole fleet. Three layers of defence:

- **Geometric-median aggregation** (Krum, multi-Krum, median-of-means). Replace the FedAvg average with a robust statistic; under bounded gradient variance and at most $f$ malicious clients, Krum's gradient is provably close to the honest average [@blanchard2017krum].
- **Norm clipping.** Bound each client update's $L_2$ norm — attackers can inject direction but not magnitude. Standard alongside DP-SGD [@abadi2016dpsgd].
- **Anomaly detection on clients.** Treat client gradients as data and run a detector. Same VGAE+GAT pattern as the IDS itself, applied one level up.

This adds a new attack surface to the Q1.2 threat taxonomy. The Q1.2 defence-in-depth argument — data-driven branch structurally protected from estimator compromise — does _not_ carry over: the federated GNN backbone is exactly what an attacker targets.

### Privacy under DP-SGD interacts with class imbalance

DP-SGD [@abadi2016dpsgd] adds Gaussian noise to clipped gradients with budget $(\varepsilon, \delta)$. A uniform budget over-noises minority gradients under 927:1 imbalance: the minority-class gradient norm scales with $p(\text{attack})\approx 0.1\%$, collapsing SNR. Remedies are class-conditional clipping ($C_y$ per class) or amplification by sampling — which the Q3.3 curriculum already provides. Privacy accounting under a time-varying curriculum distribution is an open theoretical question at the Q3.2/Q3.3 boundary.

### Per-axis remedy validation

The empirical signature of uncorrected non-IID is per-class F1 degradation on rare attacks as federated rounds increase, while benign-class precision holds. Label shift (axis 1) is the primary driver: clients with zero attack exposure in a given round push the shared gradient toward all-benign predictions. SCAFFOLD's control variate should close this gap; the test is per-class F1 on a natural-distribution held-out split, FedAvg vs. SCAFFOLD, sweeping $E$ local steps.

Feature shift (axis 2) surfaces as per-vehicle calibration gap: class-conditional ECE (Q2.1) on wear-affected dynamics signals degrades for high-wear vehicles but not others. FedProx's proximal term should tighten it; measure per-vehicle-cluster ECE before and after adding $\frac{\mu}{2}\|\theta - \theta^{(t)}\|^2$.

Concept shift (axis 3) is structurally irreducible — no round budget closes a shared head's gap on cross-OEM data. The right test is negative: the per-platform head in the table above should outperform a shared head on a cross-OEM held-out split, and that gap should persist regardless of training duration.

The curriculum coupling from Q3.3 adds one interaction worth isolating: the hard-sample buffer biases local gradients toward VGAE-error-sorted minority samples, which overlaps with SCAFFOLD's minority-gradient correction. Whether they compose constructively or redundantly is measurable by comparing minority-class recall at matched round budgets across four conditions: FedAvg baseline, SCAFFOLD only, curriculum only, and combined.

---

## Question 3.3

> Curriculum learning modifies the training distribution over time. Does a curriculum-trained model converge to the same solution as one trained on the full distribution, and what bias might it introduce?

Curriculum learning by design diverges from training on the full dataset, though this divergent solution is grounded in practical realities of class imbalanced problems.

### Does it converge to the same solution?

No, not in general. Curriculum learning modifies the effective training distribution $p_t(x, y)$ at each step, changing the expected gradient and SGD's trajectory. Deep networks are non-convex and SGD's weights depend on both initialisation and path — two trajectories over different distributions converge to different stationary points even when both minimise the same terminal empirical risk. @bengio2009curriculum frames the mechanism as a continuation method guiding SGD toward better local optima. Therefore, the convergence to a different solution from vanilla training is an intentional decision.

More precisely: curriculum changes the implicit bias of SGD. @hacohen2019power show curriculum-trained networks converge faster and to lower final loss than shuffled-baseline training, with the gap largest on harder tasks. The @soviany2022curriculum survey finds the same pattern across vision, NLP, and RL. The answer is asymmetric: for convergence _rate_, curriculum can strictly improve it; for convergence to a _specific_ minimum, it generally does not.

A sufficient condition for convergence to the same minimum is that the schedule asymptotes to the full distribution before SGD reaches a basin, and that the loss is convex in that basin. Neither holds for a deep GAT.

### What bias does it introduce?

Every curriculum choice encodes a prior about which examples shape the model earliest. The effective training distribution integrated over the schedule,

$$\tilde{p}(x, y) = \frac{1}{T}\sum_{t=1}^{T} p_t(x, y),$$

is not the deployment distribution $p_{\text{nat}}(x, y)$. Three bias manifestations worth separating:

1. **Class-prior shift.** Oversampling the minority class early inflates its weight in $\tilde p$, giving a softer majority prior than MLE on $p_{\text{nat}}$. At threshold 0.5 this raises minority recall and lowers precision — a calibrated expression of the imbalance trade-off, not a bug.
2. **Feature-selection bias.** Because minority features are seen first, earliest-layer filters develop around minority-discriminative patterns. Later imbalanced exposure fine-tunes the head but leaves the representation biased toward the minority — the transfer-of-easy-example mechanism @hacohen2019power argue for.
3. **Calibration drift.** A different effective prior than $p_{\text{nat}}$ means softmax probabilities no longer match empirical frequencies at deployment. Every class-rebalancing intervention produces this miscalibration [@guo2017calibration]; curriculum is its time-varying form and inherits the pathology.

Biases (1) and (2) are features by design — the framework targets minority-attack recall under 927:1 imbalance. Bias (3) is a liability that propagates: measure it with class-conditional ECE from Q2.1, correct at inference via temperature scaling on a natural-distribution split, and extend the same correction to the Q1.1 gate thresholds, which are calibration parameters fit on the same drifted distribution.

### This schedule is closer to anti-curriculum than Bengio

The momentum-based schedule here is:

$$p_t = 1 - \exp(-t / \tau),\qquad B_t = (1 - p_t)\,B_{\text{bal}} + p_t\,B_{\text{nat}} + \alpha_{\text{buf}}\,B_{\text{hard}}$$

At $t=0$, batches are fully class-balanced — the minority attack class is _oversampled_, not undersampled. As $t$ grows, the mixture blends exponentially toward the natural imbalanced distribution. The hard-sample buffer $B_{\text{hard}}$ (refreshed every 100 steps from the highest-VGAE-error samples) holds a persistent $\alpha_{\text{buf}}=0.2$ weight throughout.

Rare attacks are arguably the _hardest_ examples, so starting with them overrepresented is not Bengio-style easy-to-hard — it's closer to anti-curriculum with difficulty-aware replay [@soviany2022curriculum]. The hard-sample buffer couples the two stages by design: curriculum-by-model rather than curriculum-by-heuristic.

The biases this specific schedule introduces, separated by intent:

- **Intended:** Minority-attack recall gains. The momentum schedule gives a continuous knob $\tau$ trading precision for recall.
- **Intended:** Hard-sample replay biases the learned representation toward the VGAE's error surface, coupling detection stages.
- **Unintended, measurable:** Majority-class calibration drift — predicted $P(\text{attack})$ exceeds the natural 0.1%–3% base rate. Quantify with class-conditional ECE (Q2.1).
- **Unintended, worth testing:** Final-weight divergence from a non-curriculum baseline. Two cheap tests at $N=3$ seeds: parameter distance $\|\theta_{\text{curr}} - \theta_{\text{nat}}\|_2 / \|\theta_{\text{nat}}\|_2$ per layer, and prediction disagreement on natural-distribution test data stratified by class.
