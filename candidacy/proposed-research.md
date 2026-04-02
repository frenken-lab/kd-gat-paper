---
title: "Proposed Research"
---

## Proposed Research

### Physics-Informed Neural Network (PINN)

#### Motivation and Design

Vehicle dynamics follow well-understood kinematic and dynamic equations. The current ensemble framework will be augmented with a PINN module that leverages these physics constraints as an orthogonal anomaly signal. The PINN operates in two modes: (1) standalone anomaly scorer, and (2) regularization term in the training loss function.

The key insight is that CAN injection attacks often violate physical constraints---for example, instantaneous acceleration changes that exceed motor capabilities, or steering angles and vehicle speeds that produce impossible yaw rates. The PINN detects these physics violations while remaining gracefully degradable if vehicle dynamics are unavailable.

#### PINN Architecture and Training

The PINN will be an MLP trained on vehicle dynamics using CAN data extracted via ByCAN {cite}`ByCAN` reverse engineering and state estimation via Extended Kalman Filter (EKF). At inference, the PINN predicts the next vehicle state given a temporal sequence of observed states:

```{math}
:label: eq-pinn-prediction
\text{PINN}(\mathbf{x}_{t-\tau:t}) \rightarrow [\hat{v}_x^{t+1}, \hat{v}_y^{t+1}, \hat{\dot{\psi}}^{t+1}]
```

where $\mathbf{x}_{t-\tau:t}$ is a temporal window of vehicle states (velocity, yaw rate, steering angle from CAN).

This PINN module can also help training of the deep learning models through augmenting the loss function:

```{math}
:label: eq-total-loss
L_{\text{total}} = L_{\text{detection}} + \lambda_{\text{physics}} \cdot L_{\text{physics}}
```

```{math}
:label: eq-physics-loss
L_{\text{physics}} = L_{\text{vx}} + L_{\text{vy}} + L_{\text{yaw}}
```

where each term enforces the corresponding ODE constraint. The weight $\lambda_{\text{physics}}$ controls regularization strength: $[0.3, 0.5]$ when full dynamics available, $[0.1, 0.2]$ when partial, and $0$ when unavailable. The physics loss penalizes violations of vehicle kinematic constraints (detailed in Appendix [](#app:pinn-physics)).

#### Anomaly Detection via PINN

The PINN anomaly score is integrated into the DQN ensemble weighting as a third expert. The DQN automatically learns when to trust physics (high weight during normal driving) versus downweight physics (during aggressive maneuvers where nonlinear tire dynamics dominate). The PINN generates anomaly scores by measuring residuals between predicted and observed vehicle states:

```{math}
:label: eq-physics-score
\text{Physics\_Score}_t = \sigma\left(\left\|\mathbf{x}_t^{\text{measured}} - \hat{\mathbf{x}}_{t+1}^{\text{predicted}}\right\|_2\right)
```

Large prediction errors (physics violations) yield high anomaly scores. This provides an interpretable signal: "Yaw rate impossible given steering angle and velocity" or "Acceleration exceeds motor dynamics."

#### Graceful Degradation

The PINN module is optional and it's influence will depend on three possible deployment scenarios:

1. **Full dynamics available:** Extract vehicle speed and steering angle via ByCAN, estimate yaw rate/lateral acceleration via EKF. Train PINN with $\lambda_{\text{physics}} \in [0.3, 0.5]$.

2. **Partial dynamics:** Extract only speed and throttle (limited CAN coverage). Estimate missing states via EKF. Train PINN with $\lambda_{\text{physics}} \in [0.1, 0.2]$.

3. **No dynamics:** If signal extraction fails or if dynamics are unavailable, set $\lambda_{\text{physics}} = 0$. Framework relies entirely data driven models.

This ensures robustness across diverse deployment scenarios without requiring perfect dynamics knowledge.

#### Data Extraction: ByCAN Reverse Engineering

To obtain vehicle dynamics, we apply the ByCAN reverse engineering framework {cite}`ByCAN`. ByCAN achieves 80.21% slicing accuracy by analyzing CAN payloads at byte and bit levels, outperforming READ (51.99%) and CAN-D (63.88%) {cite}`ByCAN`. The process entails four steps:

1. Load CAN frames from publicly available datasets {cite}`Song2020carhacking`, {cite}`Lampe2024cantrainandtest`, {cite}`ROAD`.
2. Apply DBSCAN clustering on byte-level features to identify signal boundaries.
3. Use Dynamic Time Warping template matching to align CAN sequences across vehicle models and identify consistent signal semantics (Vehicle Speed, Engine RPM, Throttle Position) {cite}`ByCAN`.
4. Extract labeled signals that appear consistently across manufacturers.

These extracted signals feed the EKF for state estimation and PINN training. If signal extraction fails, that particular dataset will fall back to data driven models only with $\lambda_{\text{physics}} = 0$.

### Deep Q-Network

#### Deep Q-Network Formulation

Deep Q-Networks combine Q-learning with neural networks to handle high dimensional state spaces {cite}`mnih2013playingatarideepreinforcement`. In traditional Q-learning, an agent learns a Q-table mapping with a (state, action) pair and is given a reward after an action. DQNs replace the Q-table with a neural network that approximated Q-values, enabling learning in more complex environments.

In this framework, the DQN agent learns an optimal weighting policy $\pi(s)$ that dynamically assigns importance scores $\alpha = [\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}, \alpha_{\text{PINN}}, \alpha_{\text{CWD}}]$ to each expert model based on the current CAN message state $s_t$. The state $s_t$ is defined as the concatenation of anomaly scores and confidence scores from both experts. At each step $t$, the agent selects an action $a_t$ corresponding to a weight vector adjustment to minimize the detection loss. The network is trained by minimizing the temporal difference error using the Bellman equation:

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
