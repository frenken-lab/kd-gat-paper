---
title: "4. Reinforcement Learning"
---

## Question 4.1

> When the reward signal available at deployment differs from what was used during training, how should an RL-based system behave? Discuss strategies for safe adaptation under reward uncertainty.

Any reward is a proxy — it attempts to steer a model toward ideal behavior using signals that depend on ground-truth labels that don't exist at runtime. At deployment the system has to estimate whether its own decision was right, using its own confidence as evidence. This circularity is the core problem of reinforcement learning, and by extension all data-driven methods.

The total shift between training and deployment reward decomposes into two distinct phenomena:

$$
\underbrace{R_{\text{deploy}}(s, a) - R_{\text{train}}(s, a)}_{\text{total shift}} \;=\; \underbrace{\bigl(\mathbb{E}_{p_{\text{deploy}}(s)}[R] - \mathbb{E}_{p_{\text{train}}(s)}[R]\bigr)}_{\text{state-distribution shift}} \;+\; \underbrace{\bigl(R_{\text{true}} - R_{\text{train}}\bigr)}_{\text{proxy–target divergence}}
$$

The first term is covariate shift — a different vehicle, road environment, or sensor degradation pulling the state distribution away from training conditions. Standard remedies apply: importance reweighting against $p_{\text{deploy}}/p_{\text{train}}$.

The second term is more pernicious. At deployment $y_{\text{true}}$ is unknown, so the training reward is replaced by an estimator $\hat{R}(s, a)$ — typically the model's own confidence, the very signal the policy is trying to fuse. Optimising a self-referential reward is the classical Goodhart pathology: the policy drives up $\hat{R}$ without driving up $R_{\text{true}}$. Both terms are calibration objects connecting back to Q2.1 — state-distribution calibration on the first, reward-proxy calibration on the second. Proxy-target divergence is the one failure mode the policy _creates itself_; every other failure drifts on environmental timescales, while this one moves with the policy's own optimization.

### Taxonomy of safe-adaptation strategies

Three categories of strategy, distinguished by _when_ they act and _which signal channel_ carries their authority:

**Pre-deployment robustness** — shape the policy to be insensitive to reward drift before deployment.

- _Domain randomisation on reward coefficients_ [@iyengar2005robustmdp; @tobin2017domainrand]. Treat $\boldsymbol{c} = (c_{\text{agree}}, c_{\text{conf}}, c_{\text{disagree}}, c_{\text{overconf}})$ as a Dirichlet centred on hand-tuned values; minimise worst-case return over the coefficient space: $\pi^\star = \arg\max_\pi \min_{\boldsymbol{c}\in\mathcal{C}} \mathbb{E}[R(s,a;\boldsymbol{c})]$. The DRL-IDS survey [@drlids_survey2024] flags this as one of the few interventions that survives heterogeneous-attack evaluation.
- _Bayesian reward prior_. Treat the reward population as a posterior $p(R \mid \mathcal{D})$ and act under the posterior mean with a CVaR penalty on the lower tail.

**Deployment-time deferral** — recognise drift online and defer rather than commit.

- _UCB deferral via Neural-LinUCB_ [@xu2022neural]. The bonus $\beta\sqrt{\mathbf{z}^\top\mathbf{A}_a^{-1}\mathbf{z}}$ widens when recent states fall outside the column space of $\mathbf{A}_a$; the policy explores rather than exploiting a stale estimate. **Already operational.**
- _Conservative offline updates_ on periodic backbone retrains. Conservative Q-Learning [@kumar2020conservative] regularises Q-values as lower bounds on OOD actions; BCQ [@fujimoto2019offpolicy] restricts the policy to the support of offline data.
- _Thompson sampling_ [@riquelme2018deep] — a drop-in randomised alternative to UCB with equivalent theoretical coverage.

**Channel-orthogonal shielding** — defense by reward-channel independence [@alshiekh2018shielding].

The PINN residual gate from Q1.1 acts as a hard filter over the policy's output. Because its authority rests on physics consistency rather than label-derived confidence, a shift that moves the policy's reward proxy off-target doesn't move the shield's verdict in the same direction. Physics gives the shield a structural advantage at deployment: its backbone is explicitly defined by dynamic equations rather than learned from data, so it is insensitive to the proxy-target divergence term by construction.

### Strategy comparison

| Strategy                                               | Category           | Targets shift term | Online cost   | Guarantee                     | In framework |
| ------------------------------------------------------ | ------------------ | ------------------ | ------------- | ----------------------------- | ------------ |
| Domain randomisation [@iyengar2005robustmdp]           | Pre-deployment     | Both               | None          | Robust-MDP worst-case bound   | No           |
| Bayesian reward prior + CVaR                           | Pre-deployment     | Both               | None          | Bayes-optimal under prior     | No           |
| UCB deferral via Neural-LinUCB [@xu2022neural]         | Deployment-time    | Both               | $O(d^2)$/step | $\tilde{O}(d\sqrt{T})$ regret | **Yes**      |
| Conservative offline updates [@kumar2020conservative]  | Deployment-time    | Proxy–target       | Per retrain   | $Q$ lower bound               | Partial      |
| Thompson sampling [@riquelme2018deep]                  | Deployment-time    | Both               | $O(d^2)$/step | Bayes-optimal regret          | No           |
| Safety shielding (PINN gates) [@alshiekh2018shielding] | Channel-orthogonal | Both — overrides   | $O(N)$/step   | Hard constraint               | Partial      |

### How the pieces compose at deployment

The three categories aren't alternatives — they compose into a single architecture, each stage targeting a distinct failure mode:

1. Simplex policy (Q4.2) emits $\boldsymbol{\alpha}_t = \mathrm{softmax}(\boldsymbol{\ell}_t) \in \Delta^{N-1}$.
2. PINN trust gates (Q1.1) compute $\lambda_{\text{physics}}(s_t)$.
3. The shield projects $\boldsymbol{\alpha}_t$ onto the simplex subset consistent with $\alpha_{\text{PINN}} \le \lambda_{\text{physics}}(s_t)$ and renormalises.
4. Remaining mass redistributes to $\{\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}, \alpha_{\text{CWD}}\}$ via softmax restricted to the feasible subset.
5. Neural-LinUCB on the unprojected logits provides UCB-driven deferral when the whole policy is uncertain.

Each stage is also a calibration object — gate thresholds, simplex-policy temperature, bandit UCB radius $\beta$ — so the Q2.1 joint-calibration apparatus covers all three as one correction problem. Each stage draws authority from a different signal channel, so no single drift event collapses the whole resolution protocol.

---

## Question 4.2

> As the number of experts in an ensemble grows, the fusion policy's action space scales combinatorially. Compare approaches for keeping multi-expert coordination tractable without sacrificing expressiveness.

The current implementation has two experts. The simplex constraint $\alpha_{\text{GAT}} + \alpha_{\text{VGAE}} = 1$ collapses to a single scalar — there is no coordination problem at $N=2$, just a dial. At $N=4$ (GAT + VGAE + PINN + CWD) the structure changes qualitatively, and a design choice invisible at $N=2$ becomes the dominant engineering problem.

### Where the blow-up comes from

With the current 21-bin discretisation per expert, the joint action space under the simplex constraint is:

$$
|\mathcal{A}_{\text{discrete}}(N, K)| \;=\; \binom{N + K - 1}{N - 1}
\quad\xrightarrow{N=4,\,K=21}\quad 2{,}024
\quad\xrightarrow{\text{free grid}}\quad K^N \approx 1.94\times 10^5
$$

Two things break under this growth. **Q-learning exploration:** with $\epsilon$-greedy at $\epsilon_0 = 0.2$, expected episodes to visit each action once is $K^N / \epsilon_0 \approx 10^6$ at $N=4$ — far outside the per-graph episode budget. **Linear-payoff bandits:** Neural-LinUCB [@xu2022neural] maintains a design matrix $\mathbf{A}_a \in \mathbb{R}^{d\times d}$ per arm, so memory grows as $O(K^N d^2)$ and the regret bound's $\sqrt{K}$ factor becomes $K^{N/2}$ — roughly $440\times$ worse than at $N=2$ for fixed $T$.

### The simplex geometry argues against discrete grids

The issue isn't really $N$ — it's the discrete grid. A full simplex parameterisation removes it. Two natural parameterisations yield $O(N)$ action dimension with full expressiveness:

$$
\boldsymbol{\alpha} = \mathrm{softmax}(\boldsymbol{\ell}),\qquad \boldsymbol{\ell} \in \mathbb{R}^N
\qquad\text{or}\qquad
\boldsymbol{\alpha} \sim \mathrm{Dirichlet}(\boldsymbol{\kappa}),\qquad \boldsymbol{\kappa} \in \mathbb{R}_{>0}^N
$$

The softmax form is standard for actor-critic methods (SAC, A2C). The Dirichlet form adds a structured exploration knob — concentration $\kappa = \sum_i \kappa_i$ controls vertex- vs. interior-concentration, which maps naturally onto the observed behavior at $N=2$: the current DQN converges to roughly five discrete operating modes at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$. That's the policy discovering attack-type-specific strategies through a 21-bin grid — the same structure a continuous Dirichlet policy recovers without enumerating the grid.

Both lift the action representation off the grid entirely. The discrete-bandit regret penalty $\sqrt{K^N}$ becomes the continuous-action LinUCB rate $\tilde{O}(d\sqrt{T})$ with $d = O(N)$ — a qualitative improvement in how regret scales with ensemble size.

### Approach comparison

| Approach                         | Action dim                     | Sample complexity            | Coordination | Pros                                                                      | Cons                                                           |
| -------------------------------- | ------------------------------ | ---------------------------- | ------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Discrete grid** (current)      | $K^N$                          | $\tilde{O}(K^{N/2}\sqrt{T})$ | Joint        | Trivial; reuses existing code                                             | Combinatorial blow-up at $N=4$                                 |
| **Continuous simplex / softmax** | $N$                            | $\tilde{O}(d\sqrt{T})$       | Joint        | Linear in $N$; smooth gradient; integrates with SAC/Neural-LinUCB         | Loses closed-form LinUCB update                                |
| **Dirichlet policy**             | $N$                            | $\tilde{O}(d\sqrt{T})$       | Joint        | Structured exploration; generalises observed multimodal behavior at $N=2$ | Requires policy-gradient training                              |
| **Factored per-expert bandits**  | $NK$                           | $\tilde{O}(N\sqrt{KT})$      | None         | Trivial regret scaling; closed-form LinUCB preserved                      | Loses inter-expert coordination [@riquelme2018deep]            |
| **Hierarchical RL**              | Outer $2^N$, inner conditional | High                         | Subset-level | Handles graceful degradation; interpretable audit trail                   | Two-level credit assignment overhead                           |
| **Mixture-of-Experts gating**    | $N$                            | $\tilde{O}(d\sqrt{T})$       | Implicit     | Sparse forward pass; reuses MoE machinery                                 | Top-$k$ discards minority experts; misaligned with soft fusion |

Continuous-simplex (softmax) is the recommended default. Dirichlet adds structured exploration matching the simplex geometry and generalising the discrete modes observed at $N=2$. Both are linear in $N$, compatible with the existing fusion state extended to $\sim$25 dims at $N=4$, and degrade gracefully — a dropped expert has $\alpha_i \to 0$ without architectural rewrite.
