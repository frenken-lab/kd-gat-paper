---
title: "Proposed Research"
---

## Proposed Research

(subsec:Integrative)=
### Integrative narrative

The thesis-level contribution is a single theoretical result — an **operational rejection bound** at the intersection of [](#subsec:PINN) and [](#subsec:Calibration): a distribution-free, class-conditional conformal coverage guarantee on the PINN-active subset, derived by composing the regime-aware composite trust score $\lambda_{\text{physics}}(s_t)$ with Mondrian conformal prediction. The bound is the formally novel contribution; the surrounding subsections supply the empirical apparatus that turns it from theorem to certified system, composed into the deployment-time decision pipeline below.

:::{iframe} https://frenken-lab.github.io/kd-gat-paper/assets/html/submission/composition-pipeline.html
:label: fig-composition-pipeline
:width: 100%
Deployment-time decision pipeline applied to each CAN-window state $s_t$. Each stage is owned by one or two subsections and defuses a distinct failure mode (table below). The output is either *act* (high confidence on a regime-valid input) or *defer to human* (any gate or bandit confidence falls short).
:::

:::{table} Pipeline stages — owner subsection and the failure mode each stage defuses.
:label: tab:pipeline-stages

| Stage | Owned by | Defuses |
|---|---|---|
| Trust gates ($\lambda_{\text{tier}} \cdot \mathcal{V}_{\text{regime}}\mathcal{V}_{\text{signal}}\mathcal{V}_{\text{residual}}$) | [](#subsec:PINN) | Bad input under regime mismatch or estimator drift |
| Simplex policy ($\boldsymbol{\alpha} \in \Delta^{N-1}$) | [](#subsec:DQN) | Combinatorial action-space blow-up at $N{=}4$ |
| Safety shield ($\alpha_{\text{PINN}} \le \lambda_{\text{physics}}(s_t)$) | [](#subsec:PINN), [](#subsec:DQN) | Brittle reward proxy at deployment |
| UCB deferral (Neural-LinUCB on logits) | [](#subsec:DQN) | Stale per-arm estimator on shifted state distribution |
| Conformal abstain (Mondrian, class-conditional) | [](#subsec:Calibration) | Contested input near the decision boundary |

:::

Four cross-cutting threads bind the otherwise-independent subsections — *trust as a first-class primitive*, *selective prediction as the safety primitive*, *heterogeneity as the unifying learning challenge*, and *calibration as a methodological prerequisite* — and are mapped to per-question deliverables in [](committee-questions/index.md).

(subsec:PINN)=
### Physics-Informed Neural Network (PINN)

#### Prior work and comparison to classical baselines

Physics-informed machine learning encodes physical laws as ODE/PDE residual penalties [@Wu2024PIMLReview], with established cyber-physical precedents (PIConvAE for power-grid FDI [@Nandanoori2023PIConvAE]; PIGCRN for chemical processes [@Wu2025PIGCRN]) and one direct vehicular precedent — the HPINN of @Vyas2023HPINN, limited to longitudinal CACC dynamics on simulated platoon data. The proposed PINN extends to the *full* nonlinear bicycle model with lateral dynamics and Pacejka tire forces, operates on reverse-engineered CAN signals rather than V2X cooperative data, and integrates as a third expert in the DQN-weighted ensemble rather than acting standalone. Against the classical-baseline alternative — CADD's pure analytical bicycle-model residuals [@Chen2024CADD] (>96% recall, <0.5% FPR on ROAD with OBD-II ground truth) — the PINN buys nonlinear corrections beyond the linear-tire region, a differentiable physics loss that regularises GAT/VGAE during joint training, and graceful degradation when extracted signals are missing (CADD requires OBD-II and cannot operate without it). Following @Ozdemir2024IVNSurvey's observer-based vs. data-driven taxonomy of IVN anomaly detection, the PINN bridges both paradigms.

#### PINN architecture and training

The PINN is a compact MLP trained on vehicle dynamics from ByCAN-extracted [@ByCAN] CAN signals plus EKF state estimation. The architecture, training objective, and anomaly score are specified in [](#tab:pinn-arch); inputs are temporal windows $\mathbf{x}_{t-\tau:t} \in \mathbb{R}^{\tau\times 5}$ of $(v_x, v_y, \dot{\psi}, \delta, a_x)$, outputs are the predicted next state $[\hat{v}_x, \hat{v}_y, \hat{\dot{\psi}}]^{t+1}$, and the physics term decomposes as $L_{\text{physics}} = L_{v_x} + L_{v_y} + L_{\dot{\psi}}$ — each subterm a bicycle-model ODE residual (full derivation in Appendix [](#app:pinn-physics)).

:::{table} PINN Module Specification
:label: tab:pinn-arch

| Component | Specification |
|---|---|
| Architecture | 3-layer MLP (64 $\rightarrow$ 128 $\rightarrow$ 64 $\rightarrow$ 3) with GELU activation |
| Input | Temporal window of $\tau=10$ vehicle states ($v_x, v_y, \dot{\psi}, \delta, a_x$) |
| Output | Predicted next state $[\hat{v}_x^{t+1}, \hat{v}_y^{t+1}, \hat{\dot{\psi}}^{t+1}]$ |
| Physics model | Nonlinear bicycle model with Pacejka tire forces (see [](#app:pinn-physics)) |
| Training | Joint optimization: $L_\text{total} = L_\text{detection} + \lambda_\text{physics} \cdot L_\text{physics}$ |
| Anomaly score | $\ell_2$ residual between predicted and observed states, sigmoid-normalized |

:::

**Adaptive $\lambda_{\text{physics}}$ weighting.** Static $\lambda_{\text{physics}}$ under-trains either the data or physics branch (NTK analysis [@Wang2022NTK]); we use the self-adaptive weighting of [@McClenny2023SAPINN] with a tier-dependent upper bound. Full motivation, including the gradient-balancing comparison [@Bischof2024MultiObj], is in `committee-questions/physics-dynamics.md` (Q1.1).

The PINN's anomaly score is the sigmoid-normalised $\ell_2$ residual between predicted and observed states:

```{math}
:label: eq-physics-score
\text{Physics\_Score}_t = \sigma\left(\left\|\mathbf{x}_t^{\text{measured}} - \hat{\mathbf{x}}_{t+1}^{\text{predicted}}\right\|_2\right)
```

Large residuals yield interpretable signals like "yaw rate impossible given steering angle and velocity"; the DQN learns to up-weight the PINN during normal driving and down-weight it during aggressive maneuvers where nonlinear tire dynamics dominate.

(pinn-trust-gates)=
#### Trust gates and composite trust score

The PINN's deployment-time influence is conditioned by three runtime gates — regime validity ($\mathcal{V}_{\text{regime}}$), signal reliability ($\mathcal{V}_{\text{signal}}$), and residual uncertainty tightness ($\mathcal{V}_{\text{residual}}$) — combined with the tier-based outer envelope into a composite trust score $\lambda_{\text{physics}}(s_t) = \lambda_{\text{tier}} \cdot \mathcal{V}_{\text{regime}} \cdot \mathcal{V}_{\text{signal}} \cdot \mathcal{V}_{\text{residual}}$. The full derivation of each gate, the threshold semantics under tier-3 ByCAN bias, and the Chow-style reject-option interpretation [@geifman2017selective] are in `committee-questions/physics-dynamics.md` (Q1.1). The composite score also serves as the *safety shield* in the deployment-time composition pipeline ([](#subsec:Integrative)): the simplex policy of [](#subsec:DQN) is post-hoc projected so that $\alpha_{\text{PINN}} \le \lambda_{\text{physics}}(s_t)$, with the remaining mass redistributed across $\{\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}, \alpha_{\text{CWD}}\}$. Under tier-3 the PINN's role narrows from detector to training-time regulariser (Q1.1 §Signal reliability).

**Evaluation protocol.** Three deliverables operationalise the gates.

- **Regime-stratified F1.** Bucket the existing test set by slip angle and longitudinal acceleration; report a 2D histogram of PINN residual vs. (regime bucket, attack flag). Benign-regime residuals should be tight; high-slip benign residuals wide.
- **Composite-aggregator ablation.** Compare the product form $\lambda_{\text{tier}} \cdot \prod_i \mathcal{V}_i$ against soft-minimum and learnable-mixture alternatives, isolating the marginal value of each gate.
- **Pure-observer baseline.** Run a CADD-style analytical-residual detector [@Chen2024CADD] at each tier to isolate the gain attributable to learned correction (the PINN) versus regime-aware deferral (the gates).

(pinn-graceful-degradation)=
#### Graceful degradation under signal loss

Per-tier $\lambda_{\text{physics}}^{(0)}$ initialisation and $\lambda_{\max}$ caps are tabulated in Q1.1 §Mapping the deployment tiers. The integrative claim here is that the inner gates condition $\lambda_{\text{physics}}$ sample-by-sample within each tier, while the outer tier sets the ceiling. When extraction fails outright, $\lambda_{\text{physics}} = 0$ and the framework reverts to GAT+VGAE.

#### Where PINN inputs come from

PINN inputs come from ByCAN reverse engineering [@ByCAN] (80.21% slicing accuracy on byte-level CAN payloads, outperforming READ at 51.99% and CAN-D at 63.88%) followed by EKF state estimation. If extraction fails on a given dataset, $\lambda_{\text{physics}} = 0$ and the framework reverts to GAT+VGAE only. The signal-quality risks (slicing-induced systematic bias, plausibility-band attestation) and the DBC $\succ$ OBD-II $\succ$ ByCAN fallback hierarchy [@Pese2019LibreCAN; @Chen2024CADD] are catalogued under the threat model in [](#subsec:Adversarial) (deliverables 2 and 4).

(subsec:DQN)=
### Dynamic Expert Fusion

The framework implements two formulations for learning dynamic fusion weights: a Deep Q-Network (DQN) [@mnih2013playingatarideepreinforcement] and a Neural-LinUCB contextual bandit [@xu2022neural]. Both operate on the same 15-dim state (anomaly + confidence scores from each expert) and $K=21$ discrete fusion settings, but the bandit eliminates the sequential-MDP assumption (discount, target network, replay) that the DQN inherits without strictly needing — each CAN window is classified independently, so the fusion decision for one window does not affect the next. Both currently fuse two experts (GAT, VGAE); the proposed extension scales to four (GAT + VGAE + PINN + CWD) under either formulation. The DQN Bellman update (Eq. {eq}`eq-dqn-loss`) and bandit update equations (Eqs. {eq}`eq-bandit-ucb`, {eq}`eq-bandit-accum`) are in §Methodology.

#### Preliminary DQN results

Table [](#tab:ablation_DQN) reports initial DQN results on training data against GAT-only and equal-weighting baselines. The DQN policy is at or above both across all four splits (S04 the largest gap: 88.60 vs. 67.93 for equal-weighting). Figure [](#fig:2x2) plots the GAT and VGAE scores with the learned $\alpha$ policy as hue: the policy leans toward GAT when GAT makes confident predictions near 0 and 1, and up-weights VGAE near the 0.5 decision boundary. The disagreement protocol of [](#subsec:XAI) operationalises this further.

:::{table} Ablation Study Results (F1-Scores)
:label: tab:ablation_DQN

| **Dataset** | **GAT** | **E.W.** | **DQN** |
|-------------|---------|----------|---------|
| S01         | 97.07   | 97.43    | **98.49** |
| S02         | **99.54** | 99.51  | **99.53** |
| S03         | 94.71   | 95.83    | **97.32** |
| S04         | 64.81   | 67.93    | **88.60** |

**Column Legend:** GAT = GAT-only, E.W = Equal Weighting to GAT and VGAE, DQN = Dynamic Weighting from DQN model.
:::

#### Scaling fusion from $N=2$ to $N=4$ experts

The $N=2$ implementation collapses the simplex constraint to a scalar; at $N=4$ (GAT + VGAE + PINN + CWD) the discrete grid blows up to $K^N \approx 1.94 \times 10^5$ at $K=21$. The proposed extension lifts the action representation to a continuous simplex via softmax or Dirichlet parameterisation, replacing the $\sqrt{K^N}$ regret penalty with a continuous-action LinUCB rate $\tilde{O}(d\sqrt{T})$ where $d=O(N)$. The action-space derivation, the regret-bound argument, the empirical motivation (DQN at $N=2$ already converges to ~5 discrete operating modes [](#fig-fusion)), and the per-component architectural deltas (state dim, DQN head, bandit head, reward) are in `committee-questions/reinforcement-learning.md` (Q4.2 §Approach comparison and §Scaling to $N=4$).

#### Reward shift and safe adaptation under deployment

At deployment the training reward — which depends on ground-truth labels — must be replaced by an *estimator* $\hat{R}(s, a)$, typically the model's own confidence. Optimising against this self-referential proxy is the classical Goodhart pathology. The decomposition into state-distribution shift and proxy–target divergence, the five safe-adaptation strategies (domain randomisation, UCB deferral, conservative offline updates, safety shielding, Bayesian/Thompson reward), and the implementation-status table are in `committee-questions/reinforcement-learning.md` (Q4.1). Two of those strategies are framework-specific compositions: the Neural-LinUCB UCB bonus already implements implicit deferral by widening when recently-seen states fall outside the column space spanned by $\mathbf{A}_a$, and the PINN composite trust score from [](#subsec:PINN) serves as the safety shield — the simplex policy is post-hoc projected so $\alpha_{\text{PINN},t} \le \lambda_{\text{physics}}(s_t)$ before renormalisation. The composition of these stages with the conformal abstain of [](#subsec:Calibration) is the deployment pipeline of [](#subsec:Integrative).

#### Evaluation protocol for fusion scaling and reward robustness

Four deliverables anchor the fusion-policy extensions:

1. **$N \in \{2, 3, 4\}$ scaling experiment.** Compare discrete-grid DQN, softmax-actor DQN, and Dirichlet-actor at fixed task and dataset, measuring sample efficiency (regret to reach 95% of best F1) and final F1. Verifies the regret-bound argument empirically.
2. **Continuous-simplex prototype.** Replace the 21-output Q-head with an $N$-dim actor (DDPG/SAC-style) atop the existing shared backbone. Required pre-scaling milestone: verify no regression at $N=2$ before adding PINN/CWD.
3. **Reward-coefficient $\pm 50\%$ ablation.** Sweep each of $c_{\text{agree}}, c_{\text{conf}}, c_{\text{disagree}}, c_{\text{overconf}}$ and report F1 stability — the cheapest empirical handle on robust-MDP and a clean OFAT axis.
4. **PINN-as-shield formalisation.** Compare simplex-restricted softmax, log-barrier penalty, and hard projection [@alshiekh2018shielding]; the choice has implications for gradient flow during the Neural-LinUCB backbone retraining and for the $\tilde{O}(\sqrt{T})$ continuous-action regret bound under bounded reward shift.

(subsec:IntelKD)=
### Resource-Aware Knowledge Distillation

Conventional teacher-student ratios (2×, 5×, 10×, 100×) ignore the binding constraints here: a hardware ceiling and the task-dependent capacity-gap law. Both shape the feasible student size.

Automotive deployment requires <50 ms inference latency on ARM Cortex-A7 processors, with a safe throughput of 50–75 MFLOP/s (accounting for memory overhead) [@ARMCortexA7]. This latency constraint sets the computational budget for anomaly detection inference.

The maximum FLOPs available within a 50ms latency budget is:

```{math}
:label: eq-flops-budget
\begin{aligned}
\text{FLOPs}_{\max} &= \text{Latency} \times \text{Throughput} = 50 \text{ ms} \times 50 \text{ MFLOP/s} = 2.5 \times 10^6 \text{ FLOPs} \\
\text{Max parameters} &= \frac{2.5 \times 10^6 \text{ FLOPs}}{2 \text{ FLOP/param}} = 1.25\times 10^6 \text{ parameters}
\end{aligned}
```

As an example, the current student GAT model is composed of linear layers and graph attention networks, where with an estimate of computational complexity using documented ratios is:

```{math}
:label: eq-gat-flops
\begin{aligned}
\text{Linear layers:} \quad &2 \text{ FLOPs per parameter} \\
\text{GAT attention:} \quad &O(n^2 \cdot d) \text{ per layer (where } n \text{ = nodes, } d \text{ = embedding dimension)} \\
\text{GAT attention FLOPs} &= 37^2 \times 16 \times 4 = 87,616 \text{ FLOPs} \\
\text{Linear layers ( 33K params)} &= 33,000 \times 2 = 66,000 \text{ FLOPs} \\
\text{Total forward pass} &\approx 1.54 \times 10^5 \text{ FLOPs}
\end{aligned}
```

for a CAN graph with $n=37$ signals and $d=16$ embedding dimension across $4$ attention heads. Margin against the $1.25 \times 10^6$-parameter ceiling is roughly $8\times$ at current GAT scale; the ratio sweep deliverable below stress-tests it.

#### Capacity-gap law and the inner KD loss

Student capacity is fixed by hardware constraint Eq. {eq}`eq-flops-budget`; only the inner KD loss Eq. {eq}`eq-kd-total-loss` is solved. The capacity-gap law — viable ratio $\Delta^\star_{\text{cap}}(\mathcal{T}) \propto 1/\mathcal{T}^\beta$ on a task-complexity-dependent inverted-U [@distillation-scaling-laws; @Towards-Law-of-Capacity-Gap2025], graph-KD compression tolerance [@kdgraph_survey2023], teacher-assistant remediation [@Mirzadeh-TAKD2020; @Gap-KD2025] — is derived in `committee-questions/federated-optimization.md` (Q3.1). Binary attack/benign classification on CAN traffic sits at the easy end of the complexity curve, which is why the current $68\times$ ratio still performs well; the same student would almost certainly fail at $68\times$ on a 9-class typing task.

#### Evaluation protocol

Five deliverables operationalise the bilevel view:

1. **Capacity-ratio sweep** $\{|\theta_S| / |\theta_T|\} \in \{1/100,\, 1/68,\, 1/30,\, 1/10,\, 1/3\}$ at fixed binary task — empirically traces the inverted-U from @Towards-Law-of-Capacity-Gap2025 on CAN data; clean OFAT axis.
2. **Task-complexity sweep** at three difficulties — binary detection, 5-class attack typing, 9-class fine-grained typing — empirically verifying $\Delta^\star_{\text{cap}}(\mathcal{T})$ on CAN data; not in the literature for graph-IDS distillation to our knowledge.
3. **Teacher-quality vs. teacher-size separation.** A teacher trained to comparable F1 with half the parameters should produce a stronger student than the current teacher, all else equal [@distillation-scaling-laws].
4. **Born-again / mutual-learning baselines** [@furlanello2018born; @zhang2018deep]. Same-size student-to-student distillation isolates how much of the KD gain comes from the *capacity gap* versus from soft targets per se.
5. **Teacher-Assistant chain** [@Mirzadeh-TAKD2020; @Gap-KD2025]. Inserting a single TA at $\sqrt{68}\approx 8\times$ between teacher and student is the cheapest remediation if multi-vehicle joint training (see [](#subsec:CrossD)) pushes the existing $68\times$ ratio outside the viable gap.

(subsec:Calibration)=
### Calibration and Selective Prediction

The trust gates ([](#subsec:PINN)) and deferral mechanisms ([](#subsec:DQN), [](#subsec:XAI)) only deliver if the underlying confidences are calibrated — reported confidence matching empirical accuracy, and the conformal abstain delivering its nominal coverage. Calibration is a *prerequisite* for every "high confidence" claim downstream. The aleatoric/epistemic decomposition [@kendall2017uncertainties], the class-conditional ECE failure mode under 927:1 imbalance, the Mondrian conformal prediction recipe [@angelopoulos2023conformal] for distribution-free per-class coverage, the risk-coverage framing of selective prediction [@geifman2017selective], and the operational-drift mechanisms (population stability index, Kolmogorov–Smirnov on confidence histograms, online conformal recalibration) are derived in `committee-questions/interpretability-calibration.md` (Q2.1). The Mondrian conformal abstain is the final stage of the deployment-time composition pipeline ([](#subsec:Integrative)); online conformal recalibration is the natural pairing with [](#subsec:Streaming).

#### Evaluation protocol

Five deliverables operationalise the calibration apparatus on *existing* checkpoints (post-hoc, no retrain):

1. Temperature-scale the fused ensemble output on a held-out calibration split.
2. Report class-conditional ECE, class-conditional Brier score, and per-class reliability diagrams.
3. Plot risk-coverage curves with 95% bootstrap bands over seeds.
4. Fit a Mondrian conformal predictor per-class on the calibration split and report the *coverage gap* (empirical $-$ nominal) on held-out test data, broken out per class.
5. Sanity-check explanation faithfulness via the @adebayo2018sanity model- and data-randomisation tests as a prerequisite for the explainer-disagreement protocol of [](#subsec:XAI).

These are the highest cost-to-information items in the consolidated deliverables list — none requires retraining and each unlocks downstream claims. Class-conditional ECE alone gates the trust calculus, the disagreement protocol of [](#subsec:XAI), the curriculum-induced miscalibration analysis ([](#subsec:Curriculum)), and the UCB selective-prediction calibration ([](#subsec:DQN)).

(subsec:Curriculum)=
### Curriculum Convergence and Induced Bias

The framework's momentum-based curriculum (§Training) modifies the *effective* training distribution $p_t(x, y)$ at each step via $p_t = 1 - \exp(-t/\tau)$, blending class-balanced and natural batches with persistent hard-sample replay. Curriculum learning generally does not converge to the same solution as full-distribution training [@bengio2009curriculum; @hacohen2019power; @soviany2022curriculum]; it changes both the rate and the destination of optimisation. The schedule introduces three induced biases — class-prior shift (intended), feature-selection bias (intended), and calibration drift (liability) — and the framework's specific schedule is anti-curriculum with difficulty-aware replay rather than the Bengio easy-to-hard paradigm. The convergence analysis, the formalisation of each bias, and the schedule's relation to importance-weighted ERM are in Q3.3 ([](committee-questions/federated-optimization.md)). The calibration-drift liability is the methodological link to [](#subsec:Calibration); it should be measured there and corrected at inference via temperature scaling on a natural-distribution calibration split.

#### Evaluation protocol

Four deliverables operationalise the curriculum-convergence question:

1. **Parameter-space distance + prediction-disagreement test.** Train two GATs to identical seed-controlled checkpoints, one with curriculum and one with shuffled full-distribution sampling. Report $\|\theta_{\text{curr}} - \theta_{\text{nat}}\|_2 / \|\theta_{\text{nat}}\|_2$ per layer and prediction-disagreement rate on held-out natural-distribution test data, stratified by class. Cheapest possible "same solution or not" measurement.
2. **Class-conditional ECE under curriculum** (depends on [](#subsec:Calibration)). Quantifies bias (3) and unblocks the disagreement protocol of [](#subsec:XAI).
3. **Momentum-coefficient $\tau$ sensitivity.** OFAT sweep on a single axis; not currently ablated. Trades precision for recall by changing how fast the schedule asymptotes.
4. **Time-varying importance-weighted ERM theory.** Cast the momentum schedule as importance-weighted ERM with weights $w_t(y) = p_t(y) / p_{\text{nat}}(y)$ and derive the bias on the Bayes-optimal classifier under imbalance. Theoretical contribution; complements the empirical (1)–(3).

(subsec:XAI)=
### Explainable Artificial Intelligence

The XAI contribution of the dissertation is **not** "we applied five off-the-shelf explainers." The contribution is the **2×2 confidence × explainer-agreement diagnostic** introduced in `committee-questions/interpretability-calibration.md` (Q2.2): a selective-prediction rule that uses *disagreement* between explainers as a signal rather than noise, composing with the calibration-based abstain of [](#subsec:Calibration) into a stricter rule (low-confidence ∪ low-agreement) than either alone. This diagnostic is novel within the CAN-IDS XAI literature and is the methodological deliverable.

To run the diagnostic the framework needs *two* explainers spanning different abstractions — a feature-level attribution method and a structural one — plus the existing native attribution layers (GAT attention, VGAE composite reconstruction error). Three off-the-shelf explainers (LIME, TCAV, ProtoPNet) are explicitly **out of dissertation scope**: applying additional methods does not strengthen the disagreement diagnostic and is not the contribution.

:::{table} XAI methods integrated into the framework
:label: tab:xai-methods

| Method | Abstraction | Role in the diagnostic | Reference |
|---|---|---|---|
| SHAP | Shapley feature attributions with local-accuracy guarantees | Feature-level vote in the 2×2 | @SHAP |
| CF-GNNExplainer | Counterfactual perturbation respecting graph structure | Structural vote in the 2×2 | @CFGNNExplainer; @CounterfactualExplainability |
| GAT attention (existing) | Native graph attribution | Faithfulness sanity-check target [@adebayo2018sanity] | §Explainability |
| VGAE reconstruction error (existing) | Reconstruction-based attribution | Independent epistemic signal | §Explainability |

:::

#### Trust criteria and disagreement protocol

A useful explanation must satisfy three independent criteria — *faithfulness* (does it track what the model actually uses, measured via deletion-/insertion-AUC and the @adebayo2018sanity model- and data-randomisation sanity checks), *stability* (does it persist under small structured perturbations, measured via Lipschitz bounds against the [](#subsec:Adversarial) perturbation set), and *audience fit* (does the abstraction level match the consumer's decision). The formal definitions of each criterion, the deletion-/insertion-AUC formulas, the 2×2 confidence × explainer-agreement diagnostic that turns disagreement from noise into signal, and the audience-explainer mapping (fleet operator / developer / safety engineer / ISO 26262 auditor / NIST AI RMF) are in `committee-questions/interpretability-calibration.md` (Q2.2). The disagreement protocol composes with [](#subsec:Calibration): low-confidence + low-agreement is a stricter abstain rule than either signal alone.

#### Evaluation protocol

Four deliverables, ordered by priority:

1. **Disagreement-as-OOD selective rule (primary contribution).** Compose with [](#subsec:Calibration): abstain on (low-conf $\cup$ low-agreement) using SHAP and CF-GNNExplainer as the two explainers in the 2×2 diagnostic. Empirically compare the abstain rate, accuracy on the accepted subset, and risk-coverage curve against the low-conf-alone baseline. Not previously studied in the calibration literature; this is the dissertation's XAI contribution.
2. **Sanity-check existing layers.** Apply the @adebayo2018sanity model- and data-randomisation tests to GAT attention, VGAE composite reconstruction error, and UMAP. An attention visualisation that survives model randomisation is *decorative* and must be rejected — required prerequisite for trusting the existing layers in the diagnostic above.
3. **Deletion- and insertion-AUC** on GAT attention as the standard faithfulness handle (no retrain).
4. **Stability bounds.** Lipschitz constants on GAT attention with respect to graph-structural perturbations (edge addition/removal). Run the existing attention layer through the [](#subsec:Adversarial) perturbation set; this yields stability bounds *and* adversarial-robustness data simultaneously.

(subsec:CrossD)=
### Cross-Domain Generalization and Validation

The dissertation's primary evaluation is **automotive CAN** (Car-Hacking, ROAD, can-train-and-test), and the integrative thesis claim ([](#subsec:Integrative)) is grounded in this domain. To demonstrate that the framework's *graph-IDS-with-physics-prior* pattern generalises beyond CAN, **one** out-of-domain stress test on a physics-rich SCADA dataset (SWaT) is included as a validation experiment. Other ICS/network datasets (NSL-KDD, CICIDS2017, WADI, HAI, etc.) are **explicitly out of dissertation scope** — each would require its own preprocessing pipeline, threat model, and physics model, and would dilute rather than reinforce the integrative claim.

:::{table} Evaluation datasets — primary CAN-IDS suite plus one out-of-domain stress test
:label: tab:datasets

| **Dataset** | **Role** | **Domain** | **Modality** | **Attack Types** | **Physics Dynamics** |
|---|---|---|---|---|---|
| Car-Hacking (2015) [@Song2020carhacking] | Primary | Automotive | CAN Bus Messages | DoS, Fuzzy, Spoofing (RPM, Gear) | Available (Speed, RPM, Gear) |
| ROAD (2021) [@ROAD] | Primary | Automotive | CAN Bus Messages | Fabrication, Masquerade (physical verified) | High Quality (Real vehicle, dynamometer) |
| can-train-and-test [@Lampe2024cantrainandtest] | Primary | Automotive | CAN Bus Messages | Multiple attack types across vehicle splits | Available (multi-vehicle) |
| SWaT (2015) [@goh2016swatdataset] | OOD stress test | Water Treatment (SCADA) | 51 Sensors, 6 Actuators | Sensor Spoofing, Valve Injection, Backdoor | High (water treatment physics model) |

:::

(subsec:Streaming)=
### Online and Streaming Detection

Static graph snapshots are an evaluation convenience, not a deployment property. Three operational pieces close the gap to streaming inference.

- **Incremental graph updates:** Recomputing the full graph for every new CAN window is wasteful. A sliding-window graph adds new edges/nodes and expires old ones without full reconstruction. Temporal Graph Networks (TGN) [@rossi2020temporal] learn temporal embeddings that update continuously as events arrive.
- **Concept drift:** Attack patterns evolve over time, and vehicle behaviour itself changes with wear, environmental conditions, and software updates. The fusion agent must detect distributional shifts and adapt — either through online fine-tuning of GNN parameters or through drift-aware replay.
- **Latency constraints:** Streaming inference must still meet the <50 ms budget ([](#subsec:IntelKD)). Approaches that amortise GNN computation across incremental updates are required to hold this at scale.

(subsec:Adversarial)=
### Adversarial Robustness

As a security-critical component, the IDS itself becomes an attack target. Adversaries aware of the GNN-based detection pipeline may craft evasion attacks specifically designed to bypass it. Virtually all CAN-IDS evaluation in the surveys [@rajapaksha2022aiidssurvey; @Choi] uses *naïvely-injected* attacks (random payloads, replay) and almost none uses *physics-aware* or *estimator-aware* attacks. This subsection lays out the threat-model taxonomy that the framework's defences must address and the specific exploit modes that follow from it.

#### Threat-model taxonomy

The threat surface decomposes by *access location* (where the attacker injects), *capability* (read / write / replace), and *signature* (what must remain undetectable). The cross-product over the five pipeline stages — bus-injection [@Miller; @Cho], ByCAN slicing-template, EKF state estimation, PINN residual, and federated client (per [](#subsec:FL)) — together with the four resulting exploit modes (plausibility-band injection, slow-drift residual attacks, slicing-template poisoning, and graph-aware decoy attacks) are catalogued in `committee-questions/physics-dynamics.md` (Q1.2). The framework's GAT+VGAE branch is structurally protected from estimator-pipeline compromise because it does not depend on the estimator; the PINN branch is not protected, but the tier-based weighting caps the blast radius at $\lambda_{\max} = 0.3$ in the worst case, and the composition with the trust gates of [](#subsec:PINN) tightens it further — each gate failure further attenuates $\lambda_{\text{physics}}(s_t)$.

#### Evaluation protocol

Five deliverables operationalise the threat-model:

1. **Physics-aware adversarial training.** Generate physically plausible attacks (residuals matching the bicycle model under nominal Pacejka parameters) and adversarial-train the PINN against them. No prior CAN-IDS work uses an adversary that respects vehicle dynamics.
2. **Slicing-template attestation.** Treat the ByCAN template as a security artefact (signed, version-controlled, validated against OBD-II at deployment time). Engineering recommendation that does not appear in [@ByCAN; @Pese2019LibreCAN; @Ozdemir2024IVNSurvey].
3. **Innovation-sequence monitoring as a fusion-state feature.** Use the EKF innovation residuals as an *additional* feature in the fusion state of [](#subsec:DQN). This converts the estimator's internal belief into an attack signal and is a single-component change.
4. **Regime-conditioned plausibility bands.** Replace static $\pm 40°$ bounds with regime-conditioned ones (bounded by $\dot{\psi}$ and $v_x$). No new training required.
5. **Empirical stability bounds (no certification claim).** Compute Lipschitz constants on GAT attention with respect to bounded graph-structural perturbations from @zugner2018adversarial's perturbation set. This yields *empirical* stability data shared with [](#subsec:XAI) deliverable 4 — not full certified robustness. Certified randomised smoothing on graph models is itself an open research area, and ISO 26262 ASIL C/D certification is out of dissertation scope.

(subsec:FL)=
### Federated-Style Robustness to Non-IID Heterogeneity

:::{dropdown} Scope: simulated federation, not deployment claim
True federated deployment requires multi-vehicle CAN data with cross-device privacy constraints — neither is provided by the public CAN-IDS datasets the framework uses. The proposed evaluation simulates federation by sharding the existing centralised datasets (Car-Hacking, ROAD, can-train-and-test) by attack-class mix and treating each shard as a synthetic client. This measures the *algorithmic* robustness of FedAvg / FedProx / SCAFFOLD on CAN-IDS data under controllable non-IID heterogeneity — it is not a deployment claim, and it does not stand in for the privacy / Byzantine / compliance properties that real federated training would need to demonstrate. Actual federated deployment is contingent on fleet-data access (e.g., OEM partnership) and is future work outside the dissertation scope.
:::

Fleet-scale IDS training benefits from aggregating knowledge across vehicles without sharing raw CAN data — privacy, attack-diversity coverage, and edge-compute amortisation jointly motivate federation [@mcmahan2017fedavg]. The challenge is that fleet client distributions are non-IID along three independent axes — label shift (attack-exposure heterogeneity), feature shift (wear, environment, route), and concept shift (OEM-specific protocol semantics) — each of which breaks a different optimisation property of FedAvg and requires a qualitatively different remedy (SCAFFOLD on label shift, FedProx on feature shift, personalisation on concept shift). The FedAvg client-drift bound, the per-axis remedy fitness, the Byzantine-robust aggregation strategies (Krum, multi-Krum, median-of-means), and the DP-SGD × class-imbalance interaction (where the 927:1 imbalance over-noises minority gradients) are derived in `committee-questions/federated-optimization.md` (Q3.2). The framework's three-stage pipeline factors cleanly along the FL boundary:

:::{table} Federated body, local heads — per-component FL strategy
:label: tab:fl-decomposition

| Component                                                                    | Local | Shared | FL strategy                                                                                                              |
|------------------------------------------------------------------------------|-------|--------|--------------------------------------------------------------------------------------------------------------------------|
| Per-platform input projection (35-dim node feature → shared $d$-dim)         | ✓     |        | Absorbs OEM-specific feature semantics; cannot be shared across vehicles with different CAN signal layouts                |
| Shared GAT backbone                                                          |       | ✓      | Federated (FedAvg/SCAFFOLD); protocol-invariant features (timing anomalies, frequency deviations) generalise              |
| Per-platform output head                                                     | ✓     |        | Different attack-class distributions and OEM-specific semantics; clustered FL across OEM cohorts is a middle path         |
| OOV-robust embedding (hash variant)                                          |       | ✓      | Hash-based version federates cleanly; lookup-plus-UNK requires shared vocabulary which would leak per-OEM IDs              |
| VGAE encoder/decoder                                                         |       | ✓      | Reconstruction is symmetric across protocols; per-platform anomaly thresholds remain local                                |
| Fusion policy (DQN / Neural-LinUCB)                                          | ✓     |        | Federated initialisation, per-vehicle online adaptation; reward shift ([](#subsec:DQN)) is a local phenomenon             |

:::

This pattern — federated body, local heads — is the standard answer in personalised FL. The choice here is *which* component is local: the input projection (because OEM-specific) and the fusion head (because [](#subsec:Calibration) is per-vehicle). The FL setting also introduces a new attack surface (poisoned client updates) that connects to [](#subsec:Adversarial).

#### Evaluation protocol

Four deliverables operationalise the FL-style robustness extension:

1. **Empirical baseline sweep.** Run FedAvg, FedProx, and SCAFFOLD on a synthetic federated CAN setup constructed by sharding existing centralised datasets (Car-Hacking, ROAD, can-train-and-test) by attack-class mix to simulate axis-1 non-IID. Report convergence-rate vs. local-step count $E$.
2. **Architectural ablation for graph heterogeneity.** Compare (a) global per-feature projection, (b) per-platform input projection with shared backbone, (c) per-platform input *and* output heads. Hypothesis: (b) is sufficient when concept shift is small (intra-OEM) and (c) is required across OEMs.
3. **DP-SGD × curriculum interaction.** Re-derive the privacy accounting under amplification-by-sampling for the time-varying $p_t$ of [](#subsec:Curriculum) — a clean theoretical contribution at the intersection of [](#subsec:FL) and [](#subsec:Curriculum), and the only theoretical FL contribution within reach without fleet-data access.
4. **Byzantine red-team protocol.** Extend the threat-model taxonomy of [](#subsec:Adversarial) with poisoned-client attacks: single-client full-access, multi-client limited-access, gradient-inversion against DP-SGD.

### Consolidated deliverables backlog

Empirical post-hoc work on existing checkpoints is the highest cost-to-information-ratio set — it unlocks four chapters' worth of empirical claims with no retraining. The recommended sequencing is: (1) class-conditional ECE and risk-coverage curves on the calibration split ([](#subsec:Calibration)), (2) regime-stratified F1 by slip-angle bucket ([](#subsec:PINN)), (3) the @adebayo2018sanity sanity-check + deletion-AUC pass on GAT attention ([](#subsec:XAI)), and (4) the parameter-distance test for curriculum convergence ([](#subsec:Curriculum)). The retraining set follows: capacity-ratio sweep, $N \in \{2,3,4\}$ scaling, FL baseline sweep, and curriculum-momentum sensitivity.
