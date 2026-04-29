---
title: "4. Reinforcement Learning"
---

## Question 4.1

> When the reward signal available at deployment differs from what was used during training, how should an RL-based system behave? Discuss strategies for safe adaptation under reward uncertainty.

As with any reward, it's only a proxy that attempts to efficiently steer a model towards ideal behavior in an environment. It depends on ground-truth labels that don't exist at runtime, and has to be represented in a way that's conducive to neural network architectures. At deployment or "in the wild," the system has to estimate whether its own decision was right, using its own confidence as evidence. This circularity is the core problem of all reinforcement learning - and by extention - all data-driven methods.

The total shift between training and deployment reward decomposes into two distinct phenomena:

$$
\underbrace{R_{\text{deploy}}(s, a) - R_{\text{train}}(s, a)}_{\text{total shift}} \;=\; \underbrace{\bigl(\mathbb{E}_{p_{\text{deploy}}(s)}[R] - \mathbb{E}_{p_{\text{train}}(s)}[R]\bigr)}_{\text{state-distribution shift}} \;+\; \underbrace{\bigl(R_{\text{true}} - R_{\text{train}}\bigr)}_{\text{proxy–target divergence}}
$$

The first term is covariate shift. This can take the shape of a different vehicle, road environment, or the natural degradation of a physical system and its sensing abilites. This can drift significantly from the proxy, where its typically trained on more ideal conditions and environments (ie vehicle model). Standard distribution-shift remedies apply: importance reweighting against $p_{\text{deploy}}/p_{\text{train}}$.

The second term is more pernicious. At deployment, $y_{\text{true}}$ is unknown, so the training reward gets replaced by an estimator $\hat{R}(s, a)$ — typically the model's own confidence, the very signal the policy is trying to fuse. Optimising a self-referential reward is the classical Goodhart pathology: the policy drives up $\hat{R}$ without driving up $R_{\text{true}}$. The five strategies below tackle one or both terms and are not interchangeable.

Connecting back to Q2.1, both terms are calibration objects — state-distribution calibration on the first, reward-proxy calibration on the second. They are effectively correction primitives for the Q2.1 maintenance loop applied to action selection. And proxy-target divergence is the one entry in that Q2.1 justification-failure inventory that the policy _creates itself_ — every other failure family drifts on environmental timescales, while reward-proxy drift moves with the policy's own optimization. Safe adaptation is therefore the Q2.2 resolvability condition applied to action selection: there has to be a downstream protocol that converts the policy's disagreement-with-itself into deferral or override, otherwise the policy Goodharts its own proxy with no external signal to stop it. The PINN safety shield from Q1.1 is structurally one such protocol — its authority rests on physics consistency rather than label-derived confidence, so a shift that drives the policy's reward proxy off-target doesn't move the shield's verdict in the same direction.

### Taxonomy of safe-adaptation strategies

Below is a potential taxonomy of strategies that fall into three categories according to _when_ they act and _which signal channel_ carries their authority:

**Pre-deployment robustness** — shape the policy to be insensitive to reward drift before deployment.

- _Domain randomisation on the reward coefficients_ [@iyengar2005robustmdp; @tobin2017domainrand]. Treat $\boldsymbol{c} = (c_{\text{agree}}, c_{\text{conf}}, c_{\text{disagree}}, c_{\text{overconf}})$ as a Dirichlet centred on the hand-tuned values; minimise worst-case return over the coefficient space: $\pi^\star = \arg\max_\pi \min_{\boldsymbol{c}\in\mathcal{C}} \mathbb{E}_{(s,a)\sim\rho^\pi}[R(s,a;\boldsymbol{c})]$. The DRL-IDS survey [@drlids_survey2024] flags this as one of the few interventions that survives heterogeneous-attack evaluation.
- _Bayesian reward as a prior_. Treat the reward population as a posterior $p(R \mid \mathcal{D})$ and act under the posterior mean with a CVaR penalty on the lower tail.

**Deployment-time deferral** — recognise drift online and defer rather than commit.

- _UCB deferral via Neural-LinUCB_ [@xu2022neural] (Eq. {eq}`eq-bandit-ucb`). The bonus $\beta\sqrt{\mathbf{z}^\top\mathbf{A}_a^{-1}\mathbf{z}}$ widens when recent states fall outside the column space of $\mathbf{A}_a$; the policy explores rather than exploiting a stale $\boldsymbol{\theta}_a$. The $\tilde{O}(\sqrt{T})$ regret bound carries to the Q4.2 simplex generalisation. **Already operational.**
- _Conservative offline updates_ on the periodic backbone retrain (every 50 episodes). Conservative Q-Learning [@kumar2020conservative] regularises Q-values to be lower bounds on OOD actions; Batch-Constrained Q-Learning [@fujimoto2019offpolicy] restricts the policy to the support of the offline data.
- _Thompson sampling over the per-arm reward posterior_ [@riquelme2018deep] — a drop-in randomised alternative to UCB with equivalent theoretical coverage.

**Channel-orthogonal shielding** — defense by reward-channel independence [@alshiekh2018shielding].

The PINN residual gate $\mathcal{V}_{\text{regime}}\cdot\mathcal{V}_{\text{signal}}\cdot\mathcal{V}_{\text{residual}}$ from Q1.1 is a hard filter over the policy's output. Because its authority rests on physics consistency rather than label-derived confidence, a shift that moves the policy's reward proxy off-target doesn't move the PINN model in the same direction. This gives the PINN a two for one in trust: it's backbone is explicitly defined (dynamic equations), and at deployment is more robust to drift compared to its data-driven peers.

### Strategy comparison

| Strategy                                                                      | Category           | Targets shift term | Online cost            | Theoretical guarantee                          | In framework        |
| ----------------------------------------------------------------------------- | ------------------ | ------------------ | ---------------------- | ---------------------------------------------- | ------------------- |
| Domain randomisation [@iyengar2005robustmdp; @tobin2017domainrand]            | Pre-deployment     | Both               | None — train-time only | Robust-MDP worst-case bound over $\mathcal{C}$ | No                  |
| Bayesian reward prior + CVaR                                                  | Pre-deployment     | Both               | None — train-time only | Bayes-optimal under prior                      | No                  |
| UCB deferral via Neural-LinUCB                                                | Deployment-time    | Both implicitly    | $O(d^2)$ per step      | $\tilde{O}(d\sqrt{T})$ regret [@xu2022neural]  | **Yes**             |
| Conservative offline updates [@kumar2020conservative; @fujimoto2019offpolicy] | Deployment-time    | Proxy–target       | Per backbone retrain   | $Q$ lower bound; bounded policy support        | Retrain hook exists |
| Thompson sampling [@riquelme2018deep]                                         | Deployment-time    | Both               | $O(d^2)$ per step      | Bayes-optimal regret                           | No                  |
| Safety shielding (PINN gates, Q1.1) [@alshiekh2018shielding]                  | Channel-orthogonal | Both — overrides   | $O(N)$ per step        | Hard constraint by construction                | Partial             |

### How the pieces compose at deployment

The three categories aren't alternatives — they compose into a single deployment-time architecture, each stage targeting a distinct failure mode.

1. Simplex policy (Q4.2) emits $\boldsymbol{\alpha}_t = \mathrm{softmax}(\boldsymbol{\ell}_t) \in \Delta^{N-1}$.
2. PINN trust gates (Q1.1) compute $\lambda_{\text{physics}}(s_t)$.
3. The shield projects $\boldsymbol{\alpha}_t$ onto the simplex subset consistent with $\alpha_{\text{PINN}} \le \lambda_{\text{physics}}(s_t)$ and renormalises.
4. Remaining mass redistributes to $\{\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}, \alpha_{\text{CWD}}\}$ via softmax restricted to the feasible subset.
5. Neural-LinUCB on the unprojected logits provides UCB-driven deferral when the _whole policy_ is uncertain, regardless of which expert.

Each stage is also a calibration object — gate thresholds (Q1.1), simplex-policy softmax temperature, bandit UCB confidence radius $\beta$ — so the Q2.1 joint-calibration apparatus covers all three as one correction problem. And each stage draws authority from a different signal channel — physics at the gates, label-derived confidence at the policy, reward history at the bandit — so no single drift event on one channel collapses the whole resolution protocol.

---

## Question 4.2

> As the number of experts in an ensemble grows, the fusion policy's action space scales combinatorially. Compare approaches for keeping multi-expert coordination tractable without sacrificing expressiveness.

The current implementation has two experts. The simplex constraint $\alpha_{\text{GAT}} + \alpha_{\text{VGAE}} = 1$ collapses to a single scalar — there's no coordination problem at $N=2$, just a dial. At $N=4$ (GAT + VGAE + PINN + CWD) the structure changes qualitatively, and a design choice that was invisible at $N=2$ becomes the dominant engineering problem.

### Where the blow-up comes from

The current implementation discretises each per-expert weight into $K=21$ bins. The joint action space, with the simplex constraint $\sum_i \alpha_i = 1$ enforced by normalisation, has:

$$
|\mathcal{A}_{\text{discrete}}(N, K)| \;=\; \binom{N + K - 1}{N - 1}
\quad\xrightarrow{N=4,\,K=21}\quad 2{,}024
\quad\xrightarrow{\text{free grid}}\quad K^N \approx 1.94\times 10^5
$$

Two things break under this growth, for different reasons.

**Q-learning exploration.** DQN [@mnih2013playingatarideepreinforcement; @mnih2015human] amortises Q-table size through function approximation, so the explicit table doesn't blow up — but the exploration problem does. With $\epsilon$-greedy at $\epsilon_0 = 0.2$, expected episodes to visit each action once is $K^N / \epsilon_0 \approx 10^6$ at $N=4$, which is far outside the per-graph episode budget.

**Linear-payoff bandits.** Neural-LinUCB [@xu2022neural] and NeuralUCB [@zhou2020neural] maintain a design matrix $\mathbf{A}_a \in \mathbb{R}^{d\times d}$ per arm. Memory grows as $O(K^N d^2)$, and the $\tilde{O}(\sqrt{KT})$ regret bound's $\sqrt{K}$ factor becomes $K^{N/2}$ — at $N=4$, roughly $440\times$ worse than at $N=2$ for fixed $T$. The DRL-IDS survey [@drlids_survey2024] flags this as the dominant failure mode of RL-based intrusion detectors as architectural complexity grows.

### The simplex geometry argues against discrete grids

The issue isn't really $N$ — it's the discrete grid. A full simplex parameterisation removes it. Let $\boldsymbol{\alpha} \in \Delta^{N-1}$ be the per-expert weight vector. Two natural parameterisations both yield $O(N)$ action dimension with full expressiveness:

$$
\boldsymbol{\alpha} = \mathrm{softmax}(\boldsymbol{\ell}),\qquad \boldsymbol{\ell} \in \mathbb{R}^N
\qquad\text{or}\qquad
\boldsymbol{\alpha} \sim \mathrm{Dirichlet}(\boldsymbol{\kappa}),\qquad \boldsymbol{\kappa} \in \mathbb{R}_{>0}^N
$$

The softmax form is the standard choice for stochastic actor-critic methods (SAC, A2C). The Dirichlet form adds an exploration knob — concentration $\kappa = \sum_i \kappa_i$ controls vertex- vs. mean-concentration, which maps naturally onto the observed behaviour at $N=2$: the current DQN converges to roughly five discrete operating modes with peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$. That's the policy discovering attack-type-specific strategies through a 21-bin grid — the same structure a continuous Dirichlet policy recovers without enumerating the grid, and with the exploration knob working in the right geometry.

Both lift the action representation off the grid entirely. The discrete-bandit regret penalty $\sqrt{K^N}$ becomes the continuous-action LinUCB rate $\tilde{O}(d\sqrt{T})$ with $d = O(N)$ — a qualitative improvement in how regret scales with ensemble size.

### Approach comparison

| Approach                           | Action dim              | Expressiveness         | Sample complexity                                  | Coordination             | Pros                                                                                                                                               | Cons                                                                                                                                             |
| ---------------------------------- | ----------------------- | ---------------------- | -------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Discrete grid** (current)        | $K^N$                   | Full grid              | $\tilde{O}(K^{N/2}\sqrt{T})$                       | Joint                    | Trivial; reuses existing 21-bin code                                                                                                               | Combinatorial blow-up; visit time exceeds training budget at $N=4$                                                                               |
| **Continuous simplex via softmax** | $N$                     | Full simplex           | $\tilde{O}(d\sqrt{T})$, $d=O(N)$                   | Joint                    | Linear in $N$; smooth gradient; integrates with SAC/DDPG or Neural-LinUCB on logits                                                                | Loses closed-form linear update of LinUCB; needs continuous-action variant                                                                       |
| **Dirichlet policy**               | $N$                     | Full simplex           | $\tilde{O}(d\sqrt{T})$ with structured exploration | Joint                    | Concentration-based exploration matches simplex geometry; natural uncertainty parameterisation; generalises observed multimodal behaviour at $N=2$ | Requires policy-gradient training; reparameterised gradient estimator more involved                                                              |
| **Factored per-expert bandits**    | $NK$                    | Per-expert independent | $\tilde{O}(N\sqrt{KT})$                            | None across experts      | Trivial regret scaling; closed-form LinUCB per arm preserved                                                                                       | Loses inter-expert coordination — assumes weights are conditionally independent given state, which [@riquelme2018deep] show is false in practice |
| **Hierarchical RL**                | Outer $2^N$, inner $K^{ | \text{subset}          | }$                                                 | High; subset-conditional | $\tilde{O}(2^N + \mathbb{E}[K^{                                                                                                                    | \text{subset}                                                                                                                                    | /2}\sqrt{T}])$ | Subset-level | Handles graceful degradation naturally; interpretable audit trail of which experts were active | Two-level credit assignment; outer subset exploration adds episode overhead |
| **Mixture-of-Experts gating**      | $N$ (gate output)       | Top-$k$ subset         | $\tilde{O}(d\sqrt{T})$ if gate is a bandit         | Implicit via gate        | Reuses MoE machinery; sparse forward pass                                                                                                          | Top-$k$ gating discards minority experts that rarely fire; not aligned with calibrated soft fusion                                               |

Continuous-simplex (softmax) is the recommended default. Dirichlet adds structured exploration that matches the simplex geometry and generalises the observed discrete modes at $N=2$. Both are linear in $N$, compatible with the existing 15-dim fusion state extended to ~25 dims at $N=4$, and degrade gracefully — a dropped or low-confidence expert has $\alpha_i \to 0$ without any architectural rewrite.

### What the transition to N=4 actually changes

| Component        | $N=2$ today                                        | $N=4$ proposed                                                                                                |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| State dim        | 15                                                 | $\approx 25$                                                                                                  |
| Action dim       | $K=21$ scalar $\alpha$                             | $N=4$ logits $\boldsymbol{\ell}$ → softmax                                                                    |
| DQN head         | $K$ Q-values                                       | Continuous-action actor (DDPG critic + actor on $\boldsymbol{\ell}$)                                          |
| Bandit head      | Per-arm $\mathbf{A}_a, \mathbf{b}_a$ over $K$ arms | Linear-payoff bandit on $\boldsymbol{\ell}$, single $\mathbf{A} \in \mathbb{R}^{N\times N}$ — $O(N^2)$ memory |
| Reward structure | Unchanged                                          | Unchanged — $r_{\text{agree}}$, $r_{\text{conf}}$ terms generalise to mean/variance over $N$ experts          |

The multimodal weight distribution at $N=2$ is actually evidence that the continuous-simplex move is right: the policy is already converging to discrete-mode behaviour through a 21-bin grid it doesn't need. At $N=4$ that grid becomes the bottleneck. The Dirichlet parameterisation is the natural way to preserve the interpretable discrete-mode structure while removing the combinatorial cost of discovering it by enumeration.
