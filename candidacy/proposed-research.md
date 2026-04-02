---
title: "Proposed Research"
---

## Proposed Research

(subsec:PINN)=
### Physics-Informed Neural Network (PINN)

#### Prior Work

Physics-informed machine learning (PIML) encodes domain-specific physical laws---typically as ODE/PDE residual penalties---into neural network training, producing models that respect known dynamics even under limited data {cite}`Wu2024PIMLReview`. Several recent works demonstrate the viability of this paradigm for anomaly detection in cyber-physical systems. Nandanoori et al. {cite}`Nandanoori2023PIConvAE` embed power-grid swing equations into a convolutional autoencoder loss, detecting false data injection (FDI) attacks with significantly fewer false positives than purely data-driven baselines. Wu et al. {cite}`Wu2025PIGCRN` combine graph convolutional and recurrent layers with physics-residual losses for chemical process networks, establishing an architecture precedent for coupling GNN-based feature extraction with physics-informed training---directly analogous to the GAT + physics loss proposed here.

The closest precedent to the present work is the Hybrid PINN (HPINN) of Vyas et al. {cite}`Vyas2023HPINN`, which uses a PINN to detect FDI attacks in cooperative adaptive cruise control (CACC) vehicle platoons. The HPINN encodes longitudinal dynamics (acceleration, spacing) and achieves high detection rates on simulated platoon data. However, HPINN is limited to *longitudinal* dynamics of platooning vehicles and has not been evaluated on real CAN traffic or lateral maneuvers. Our work extends the PINN concept in three directions: (1) encoding the full nonlinear bicycle model including lateral dynamics and Pacejka tire forces, (2) operating on reverse-engineered CAN signals rather than cooperative V2X data, and (3) integrating the PINN as one expert within a DQN-weighted ensemble rather than as a standalone detector.

#### Comparison to Classical Baselines

A natural question is whether a neural network is needed at all when vehicle dynamics are known analytically. The Context-Aware Anomaly Detection using vehicle Dynamics (CADD) system {cite}`Chen2024CADD` answers this partly: CADD uses classical bicycle-model residuals (no neural network) with OBD-II ground-truth signals, achieving >96% recall and <0.5% false positive rate on the ROAD dataset. This strong result validates the physics-based anomaly signal but also reveals the limitations of a purely analytical approach:

- **Model mismatch:** The linear bicycle model diverges from real tire behavior at high slip angles, during emergency maneuvers, and on low-friction surfaces. A PINN can learn nonlinear corrections beyond the analytical model.
- **Training integration:** A classical residual is a fixed function; it cannot serve as a differentiable loss term for joint training of the GAT and VGAE. The PINN's physics loss $L_{\text{physics}}$ regularizes the entire ensemble during backpropagation.
- **Graceful degradation:** When full dynamics signals are unavailable (common in raw CAN captures without DBC files), CADD cannot operate. The PINN framework degrades smoothly via adaptive $\lambda_{\text{physics}}$ weighting rather than failing entirely.

Ozdemir and Peng {cite}`Ozdemir2024IVNSurvey` categorize IVN anomaly detection methods as either *observer-based* (predict-then-compare, e.g., Kalman filter residuals) or *data-driven* (learned representations). The proposed PINN bridges both paradigms: it learns a dynamics model (data-driven) whose training is constrained by known physics (observer-based), combining the interpretability of residual-based detection with the flexibility of neural approximation.

#### PINN Architecture and Training

The PINN is a compact MLP trained on vehicle dynamics using CAN data extracted via ByCAN {cite}`ByCAN` reverse engineering and state estimation via Extended Kalman Filter (EKF). The architecture is specified in [](#tab:pinn-arch).

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

At inference, the PINN predicts the next vehicle state given a temporal sequence of observed states:

```{math}
:label: eq-pinn-prediction
\text{PINN}(\mathbf{x}_{t-\tau:t}) \rightarrow [\hat{v}_x^{t+1}, \hat{v}_y^{t+1}, \hat{\dot{\psi}}^{t+1}]
```

where $\mathbf{x}_{t-\tau:t} \in \mathbb{R}^{\tau \times 5}$ is a temporal window of vehicle states (longitudinal velocity $v_x$, lateral velocity $v_y$, yaw rate $\dot{\psi}$, steering angle $\delta$, and longitudinal acceleration $a_x$) extracted from CAN.

The PINN also regularizes the data-driven models through an augmented loss function:

```{math}
:label: eq-total-loss
L_{\text{total}} = L_{\text{detection}} + \lambda_{\text{physics}} \cdot L_{\text{physics}}
```

```{math}
:label: eq-physics-loss
L_{\text{physics}} = L_{\text{vx}} + L_{\text{vy}} + L_{\text{yaw}}
```

where each term penalizes the residual of the corresponding bicycle-model ODE constraint (detailed in Appendix [](#app:pinn-physics)).

**Adaptive $\lambda_{\text{physics}}$ weighting.** Rather than fixing $\lambda_{\text{physics}}$ to a static value, we adopt an adaptive weighting strategy. Wang et al. {cite}`Wang2022NTK` show from a Neural Tangent Kernel (NTK) perspective that static weighting causes PINNs to under-train either the data or physics branch, depending on relative gradient magnitudes. McClenny and Braga-Neto {cite}`McClenny2023SAPINN` address this with self-adaptive weights, parameterizing $\lambda_{\text{physics}}$ as a learnable scalar optimized jointly with the network. Bischof and Kraus {cite}`Bischof2024MultiObj` frame multi-objective loss balancing more generally, showing that gradient-based balancing (e.g., GradNorm, PCGrad) outperforms grid-searched static weights across physics-informed architectures. We propose initializing $\lambda_{\text{physics}}$ based on the deployment tier (see [Graceful Degradation](#pinn-graceful-degradation) below) and then allowing it to adapt during training via the self-adaptive approach of {cite}`McClenny2023SAPINN`, with a tier-dependent upper bound to prevent the physics term from dominating when signal quality is low.

#### Anomaly Detection via PINN

The PINN anomaly score is integrated into the DQN ensemble weighting as a third expert. The DQN automatically learns when to trust physics (high weight during normal driving) versus downweight physics (during aggressive maneuvers where nonlinear tire dynamics dominate). The PINN generates anomaly scores by measuring residuals between predicted and observed vehicle states:

```{math}
:label: eq-physics-score
\text{Physics\_Score}_t = \sigma\left(\left\|\mathbf{x}_t^{\text{measured}} - \hat{\mathbf{x}}_{t+1}^{\text{predicted}}\right\|_2\right)
```

Large prediction errors (physics violations) yield high anomaly scores. This provides an interpretable signal: "Yaw rate impossible given steering angle and velocity" or "Acceleration exceeds motor dynamics."

(pinn-graceful-degradation)=
#### Graceful Degradation

The PINN module is optional and its influence depends on three deployment tiers, with $\lambda_{\text{physics}}$ initialized per tier and adapted during training:

1. **Full dynamics available:** Extract vehicle speed, steering angle, and yaw rate via ByCAN + EKF. Initialize $\lambda_{\text{physics}}^{(0)} = 0.5$ with adaptive upper bound $\lambda_{\max} = 1.0$. All five input channels populated.

2. **Partial dynamics:** Extract only speed and throttle (limited CAN signal coverage). Estimate missing lateral states via EKF with increased process noise. Initialize $\lambda_{\text{physics}}^{(0)} = 0.1$ with $\lambda_{\max} = 0.3$. The self-adaptive optimizer can increase $\lambda$ if the available signals provide reliable gradients, but the upper bound prevents over-reliance on uncertain estimates.

3. **No dynamics:** If signal extraction fails or dynamics signals are unavailable, set $\lambda_{\text{physics}} = 0$ (non-learnable). The framework relies entirely on the GAT and VGAE data-driven models.

This tiered approach ensures robustness across diverse deployment scenarios. The adaptive weighting avoids the need to hand-tune $\lambda_{\text{physics}}$ per dataset while respecting signal-quality constraints.

#### Data Extraction: ByCAN Reverse Engineering

To obtain vehicle dynamics, we apply the ByCAN reverse engineering framework {cite}`ByCAN`. ByCAN achieves 80.21% slicing accuracy by analyzing CAN payloads at byte and bit levels, outperforming READ (51.99%) and CAN-D (63.88%) {cite}`ByCAN`. The extraction process entails four steps:

1. Load CAN frames from publicly available datasets {cite}`Song2020carhacking`, {cite}`Lampe2024cantrainandtest`, {cite}`ROAD`.
2. Apply DBSCAN clustering on byte-level features to identify signal boundaries.
3. Use Dynamic Time Warping template matching to align CAN sequences across vehicle models and identify consistent signal semantics (Vehicle Speed, Engine RPM, Throttle Position) {cite}`ByCAN`.
4. Extract labeled signals that appear consistently across manufacturers.

These extracted signals feed the EKF for state estimation and PINN training. If signal extraction fails, that particular dataset falls back to data-driven models only with $\lambda_{\text{physics}} = 0$.

**Limitations and fallback hierarchy.** The 80.21% slicing accuracy is a *signal boundary* metric---it measures whether ByCAN correctly identifies where one CAN signal ends and the next begins within a message payload. Errors in slicing directly corrupt the physical quantities fed to the PINN, particularly steering angle ($\delta$) and yaw rate ($\dot{\psi}$), which are critical inputs to the bicycle model. Missliced signals can introduce systematic bias rather than random noise, because adjacent signals in a CAN frame often encode related but distinct quantities (e.g., raw sensor counts vs. scaled physical values). LibreCAN {cite}`Pese2019LibreCAN` provides an alternative reverse-engineering approach using diagnostic (OBD-II) responses as ground truth, but requires physical access to the vehicle's OBD-II port during data collection.

To mitigate signal extraction risk, we propose the following fallback hierarchy:

1. **DBC file access (best case):** If the manufacturer's DBC database definition is available (common in OEM research partnerships), use it directly. This eliminates reverse-engineering error entirely.
2. **OBD-II ground truth:** Following CADD's approach {cite}`Chen2024CADD`, use OBD-II PID responses for vehicle speed, RPM, and throttle as ground truth to validate and calibrate ByCAN-extracted signals before PINN training.
3. **ByCAN reverse engineering (last resort):** Apply ByCAN {cite}`ByCAN` with post-hoc validation: cross-check extracted signal ranges against known physical bounds (e.g., steering angle $|\delta| < 40°$, yaw rate $|\dot{\psi}| < 1.0$ rad/s) and discard signals that fail plausibility checks. Supplement with LibreCAN {cite}`Pese2019LibreCAN` for cross-validation where OBD-II data is available in the dataset.

(subsec:DQN)=
### Dynamic Expert Fusion

The current framework implements two complementary formulations for learning dynamic fusion weights: a Deep Q-Network (DQN) and a Neural-LinUCB contextual bandit {cite}`xu2022neural`. Both operate on the same state and action spaces---a 15-dimensional vector of anomaly scores and confidence metrics from each expert, and $K=21$ discrete fusion weight settings---but differ in their modeling assumptions.

The contextual bandit formulation is arguably more principled for this problem: each CAN window graph is classified independently, so the fusion decision for one window does not affect the next. This eliminates the sequential MDP assumption (discount factor, target network, experience replay) that the DQN inherits but does not strictly require. The Neural-LinUCB agent decomposes the problem into deep representation learning (a neural backbone mapping states to embeddings) and shallow exploration via upper confidence bounds, providing principled uncertainty-driven exploration without the overhead of temporal credit assignment.

Both formulations currently fuse two experts (GAT and VGAE). The proposed extension scales fusion from 2-expert to 4-expert (GAT + VGAE + PINN + CWD) using either formulation, increasing the action space and state dimensionality accordingly.

#### Deep Q-Network Formulation

Deep Q-Networks combine Q-learning with neural networks to handle high dimensional state spaces {cite}`mnih2013playingatarideepreinforcement`. In traditional Q-learning, an agent learns a Q-table mapping with a (state, action) pair and is given a reward after an action. DQNs replace the Q-table with a neural network that approximated Q-values, enabling learning in more complex environments.

In the DQN formulation, the agent learns an optimal weighting policy $\pi(s)$ that dynamically assigns importance scores $\alpha = [\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}, \alpha_{\text{PINN}}, \alpha_{\text{CWD}}]$ to each expert model based on the current CAN message state $s_t$. The state $s_t$ is defined as the concatenation of anomaly scores and confidence scores from both experts. At each step $t$, the agent selects an action $a_t$ corresponding to a weight vector adjustment to minimize the detection loss. The network is trained by minimizing the temporal difference error using the Bellman equation:

```{math}
:label: eq-dqn-loss
L(\theta) = \mathbb{E}_{(s,a,r,s') \sim \mathcal{D}} \left[ \left( r + \gamma \max_{a'} Q(s', a'; \theta^-) - Q(s, a; \theta) \right)^2 \right]
```

where $\mathcal{D}$ is the experience replay buffer, $\theta$ represents the current network weights, $\theta^-$ are the target network weights, and $r$ is the reward derived from correct anomaly classification (e.g., +1 for correct detection, -1 for false positive). This formulation allows the ensemble to adaptively prioritize the most reliable expert for specific attack patterns (e.g., up-weighting VGAE for fuzzy attack vs. up-weighting GAT for gear attack), maximizing detection F1-score across diverse scenarios.

<!-- Figure: Learned Policy Across Datasets (2x2 grid: S01, S02, S03, S04 policy plots) -->

#### Preliminary DQN Results

Table [](#tab:ablation_DQN) details initial DQN results on training data compared to the GAT classifier and equal weighting to the GAT and VGAE models using the F1-Score metric. Initial results show promise, as the DQN policy performs at or above previous implementations. Figure [](#fig:2x2) plots the GAT and VGAE scores, with the learned $\alpha$ policy shown as the hue. Qualitatively, the policy tends to lean towards the GAT model when it makes confident predictions near the labels 0 and 1. When the GAT model scores a sample near the decision boundary of 0.5, the policy then up-weights VGAE. This is an example of a visualization that helps explain the Q learning policy, but further explainability techniques (Section [](#subsec:XAI)) will be implemented to gain a strong understanding of the model's decisions.

:::{table} Ablation Study Results (F1-Scores)
:label: tab:ablation_DQN

| **Dataset** | **GAT** | **E.W.** | **DQN** |
|-------------|---------|----------|---------|
| S01         | 97.07   | 97.43    | **98.49** |
| S02         | **99.54** | 99.51  | **99.53** |
| S03         | 94.71   | 95.83    | **97.32** |
| S04         | 64.81   | 67.93    | **88.60** |

**Column Legend:** GAT = GAT-only, E.W = Equal Weighting to GAT and VGAE, DQN= Dynamic Weighting from DQN model.
:::

(subsec:IntelKD)=
### Resource-Aware Knowledge Distillation

While previous work devised teacher-student parameter sizing following conventional wisdom using factors of 2, 5, 10, or 100, future work will incorporate both hardware constraints and recent research on distillation scaling to develop principled guidance for teacher and student sizing.

Automotive deployment requires <50 ms inference latency on ARM Cortex-A7 processors, with a safe general throughput of 50-75 MFLOP/s (accounting for memory overhead) {cite}`ARMCortexA7`. This latency constraint directly constrains the computational budget available for anomaly detection inference.

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

for a CAN graph with $n=37$ signals and $d=16$ embedding dimension across $4$ attention heads. While this model is safely under the max parameter limit, future work will need to ensure that every component and it's combination meets the computational limit of the hardware.

**Scaling Law Principles:**

Recent empirical research on knowledge distillation {cite}`distillation-scaling-laws` reveals that optimal teacher-student sizing depends on the target task complexity and available compute. While this research primarily studied large language models (143M-12.6B parameters), the underlying principles generalize to smaller domains:

1. Teacher size plateaus at 2-3x student size for most tasks: Beyond this ratio, further teacher scaling yields diminishing returns due to inference cost overhead. However, for simpler binary classification tasks (like benign vs. attack detection), more aggressive compression (>50x) is feasible because decision boundaries are simpler.

2. Capacity gap risk at extreme compression ratios: When teacher and student are too different in capacity, the student struggles to model teacher behavior. The current framework has a compression rate of 68x. Though results have been strong, future work will entail augmenting parameters to more appropriate compression ratios.

3. Teacher quality matters more than size: Student performance depends more on teacher quality than teacher size. A well trained smaller teacher is preferable to an under-trained larger teacher.

These principles will guide future work on the framework, ensuring appropriate compression ratios based on the resource constraints of onboard hardware.

(subsec:XAI)=
### Explainable Artificial Intelligence

Understanding why the ensemble flags a CAN sequence as anomalous is critical for trust and debugging. In addition to the PINN module, the use of widely adopted and novel XAI will be employed.

**Standard Methods: LIME and SHAP**

1. LIME (Local Interpretable Model-agnostic Explanations) {cite}`LIME` approximates local model behavior via linear surrogates. For a flagged CAN sequence, LIME perturbs individual message fields and measures impact on anomaly score {cite}`LIME`. Output: "Removing this signal reduces attack confidence by 15%," highlighting which CAN IDs contributed to detection.
2. SHAP (SHapley Additive exPlanations) {cite}`SHAP` computes feature importance via Shapley values from cooperative game theory. SHAP attributes each CAN signal's contribution to the ensemble decision, with theoretical guarantees on local accuracy and consistency {cite}`SHAP`. For CAN anomaly detection, SHAP shows: "This message sequence violates the typical pattern for Engine ECU; signal X was out-of-distribution by 3-sigma."

Both methods are model-agnostic and provide intuitive feature-level explanations. However, they treat CAN data as flat feature vectors, ignoring graph structure and temporal dynamics.

**Novel Methods: Orthogonal Explainability Perspectives**

To complement the standard methods of XAI, three additional approaches will be explored and determined if it provides strong interpretability:

1. **Counterfactual Analysis (CF-GNNExplainer):** For graph-structured CAN data, counterfactual explanations show minimal perturbations that flip predictions {cite}`CFGNNExplainer`. Example: "Removing the message relationship between Steering Angle and Yaw Rate signals flips the attack classification to benign." This reveals decision boundaries and what must change for the model to change its mind {cite}`CounterfactualExplainability`.

2. **Concept Activation Vectors (TCAV):** TCAV maps internal neural network activations to user-defined concepts without retraining {cite}`TCAV`. Example: "How much does the GAT layer respond to DoS-like behavior (high message frequency)?" or "Does the VGAE encode spoofing signatures?" TCAV provides global model behavior explanation (not per-sample), quantifying what high-level patterns the ensemble learned {cite}`TCAV`.

3. **Prototype-Based Learning:** Supplement ensemble with learned archetypal attack/benign patterns. Explanations: "This sequence matches DoS prototype with 94% similarity" or "Resembles Spoofing Attack Example 3" Unlike post-hoc methods, prototypes are faithful (model literally uses them) and transparent (users inspect training exemplars) {cite}`ProtoPNet`.

These methods are complementary to LIME/SHAP, addressing model-specific biases and providing multiple perspectives on why anomalies are detected. For safety-critical automotive systems, this multi-method approach ensures comprehensive interpretability.

(subsec:CrossD)=
### Cross-Domain Generalization and Validation

To demonstrate framework robustness beyond automotive CAN, additional validation will be done on diverse ICS/IDS datasets spanning network, critical infrastructure, and control systems domains. Table [](#tab:datasets) lists possible datasets to test this framework. This list is not exhaustive, and the specific datasets used will be decided at a future date.

:::{table} Possible Benchmark Intrusion Detection Datasets for Cross-Domain Evaluation
:label: tab:datasets

| **Dataset** | **Domain** | **Modality** | **Attack Types** | **Records** | **Physics Dynamics** |
|---|---|---|---|---|---|
| Car-Hacking (2015) {cite}`Song2020carhacking` | Automotive | CAN Bus Messages | DoS, Fuzzy, Spoofing (RPM, Gear) | 30--40 min (300 ea.) | Available (Speed, RPM, Gear) |
| ROAD (2021) {cite}`ROAD` | Automotive | CAN Bus Messages | Fabrication, Masquerade (physical verified) | 100+ hrs (>100K msgs) | High Quality (Real vehicle, dynamometer) |
| KDD'99 {cite}`stolfo1999kddcup99` | Network | TCP/IP Connections | DoS, Probe, R2L, U2R | 5M records | No (network traffic) |
| NSL-KDD (2009) {cite}`tavallaee2009nslkdd` | Network | TCP/IP Connections | DoS, Probe, R2L, U2R (refined KDD'99) | 125K train, 22K test | No (network traffic) |
| CICIDS2017 (2017) {cite}`sharafaldin2018cicids2017` | Network | Network Flows | DoS, DDoS, Brute-force, Botnet, Infiltration | 2.8M flows (80K CSV) | No (network traffic) |
| UNSW-NB15 (2015) {cite}`moustafa2015unswnb15` | Network | TCP/IP Connections | DoS, Exploits, Backdoor, Reconnaissance | 2.5M records (100K CSV) | No (network traffic) |
| SWaT (2015) {cite}`goh2016swatdataset` | Water Treatment (SCADA) | 51 Sensors, 6 Actuators | Sensor Spoofing, Valve Injection, Backdoor | 496K rows (1 week), 12% attacks | High (water treatment physics model) |
| WADI (2017) {cite}`ahmed2017wadi` | Water Distribution (SCADA) | 103 Sensors, 15 Actuators | Sensor Attacks, Logic Attacks, Actuator Attacks | 1.05M rows (2 weeks), 6% attacks | High (water distribution dynamics) |
| HAI (2020) {cite}`shin2020hai` | Critical Infrastructure (Hybrid) | Multiple Sensors/Actuators | Sensor Attacks, Valve Attacks, Logic Attacks | 80K rows (1 week) | Moderate (SCADA, process control) |

:::

### Online and Streaming Detection

The current framework operates on static graph snapshots constructed from fixed-size CAN windows. Real-world deployment, however, requires streaming inference where graphs are updated incrementally as new messages arrive.

- **Incremental graph updates:** Recomputing the full graph for every new CAN window is wasteful. Efficient approaches would maintain a sliding-window graph structure, adding new edges/nodes and expiring old ones without full reconstruction. Temporal Graph Networks (TGN) {cite}`rossi2020temporal` provide a foundation for this, learning temporal embeddings that update continuously as events arrive.
- **Concept drift:** Attack patterns evolve over time, and vehicle behavior itself changes with wear, environmental conditions, and software updates. The fusion agent must detect distributional shifts and adapt---either through online fine-tuning of GNN parameters or through drift-aware replay strategies.
- **Latency constraints:** Streaming inference must still meet the <50 ms latency budget (Section [](#subsec:IntelKD)). Approaches that amortize GNN computation across incremental updates are essential for satisfying this constraint at scale.

### Adversarial Robustness

As a security-critical component, the IDS itself becomes an attack target. Adversaries aware of the GNN-based detection pipeline may craft evasion attacks specifically designed to bypass it.

- **Graph adversarial attacks:** Edge and node perturbation attacks can fool GAT attention mechanisms by injecting carefully chosen CAN messages that appear benign to the graph structure while masking underlying attack patterns {cite}`zugner2018adversarial`.
- **Training data poisoning:** Fleet-collected datasets used for model updates are vulnerable to poisoning, where an attacker injects subtly mislabeled samples to degrade detection performance over time.
- **Certified robustness:** Randomized smoothing and other certification techniques can provide provable guarantees on detection stability under bounded perturbations. Adversarial training---augmenting the training set with adversarial examples---provides empirical robustness but increases computational cost.
- Given the security domain, robustness evaluation against adversarial graph perturbations is not merely academic but operationally necessary for deployment trust.

### Federated Learning Across Vehicles

Fleet-scale IDS training would benefit from aggregating knowledge across multiple vehicles without sharing raw CAN data, addressing both privacy requirements and the edge computing constraints identified in Challenge 2.

- **Privacy-preserving training:** Federated averaging allows each vehicle to train locally and share only model gradients, preventing exposure of proprietary CAN protocols or driving behavior data.
- **Data diversity for rare attacks:** Individual vehicles encounter limited attack diversity. Fleet-wide federated learning pools gradient information across vehicles, improving detection of rare attack types that any single vehicle may never observe in training.
- **Heterogeneous graph structures:** Different vehicle platforms have different ECU topologies, producing graphs with varying node counts and edge structures. Federated aggregation must handle this heterogeneity---either through shared feature extractors with platform-specific graph layers, or through graph-agnostic representation alignment.

### Multi-Dataset Joint Training

Current evaluation treats each dataset independently, training and testing separate models per dataset. A natural extension is joint training across multiple datasets with shared representations.

- **Shared feature extractors:** A common GNN backbone can learn protocol-invariant features (e.g., timing anomalies, frequency deviations) while domain-specific classification heads adapt to dataset-specific label semantics.
- **Few-shot adaptation:** With a strong shared backbone, adapting to a new vehicle platform or CAN protocol should require only a small number of labeled examples, enabling rapid deployment on unseen vehicles.
- **Cross-protocol transfer:** The graph construction approach (Section [](#alg-graph-construction)) generalizes beyond CAN to any message-based network protocol. Joint training across CAN, FlexRay, and Automotive Ethernet datasets would test whether learned representations transfer across protocol boundaries.
