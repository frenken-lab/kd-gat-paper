---
title: "4. Reinforcement Learning"
---

## Question 4.1

> When the reward signal available at deployment differs from what was used during training, how should an RL-based system behave? Discuss strategies for safe adaptation under reward uncertainty.

### Defining reward shift

The training reward Eq. {eq}`eq-reward` is a *proxy* — it depends on ground-truth labels $y_{\text{true}}$ unavailable at deployment. With deployed reward $R_{\text{deploy}}$ and training reward $R_{\text{train}}$, the shift decomposes into two distinct phenomena:

$$
\underbrace{R_{\text{deploy}}(s, a) - R_{\text{train}}(s, a)}_{\text{total shift}} \;=\; \underbrace{\bigl(\mathbb{E}_{p_{\text{deploy}}(s)}[R] - \mathbb{E}_{p_{\text{train}}(s)}[R]\bigr)}_{\text{state-distribution shift}} \;+\; \underbrace{\bigl(R_{\text{true}} - R_{\text{train}}\bigr)}_{\text{proxy–target divergence}}
$$

The first term is *covariate shift* on the fusion-state distribution — a different vehicle, fleet attack mix, or wear-induced drift changes which $s$ values are seen, proxy still well-calibrated. Standard distribution-shift remedies apply (importance reweighting against $p_{\text{deploy}}/p_{\text{train}}$).

The second term is more pernicious and specific to label-dependent rewards: at deployment, $y_{\text{true}}$ is unknown, so $R_{\text{train}}$ must be replaced by an estimator $\hat{R}(s, a)$ — typically the model's own confidence, the very signal the policy is trying to fuse. Optimising a self-referential reward is the classical Goodhart pathology: the policy drives up $\hat{R}$ without driving up $R_{\text{true}}$. The five strategies below tackle one or both terms and are not interchangeable. Both terms are calibration objects — state-distribution calibration on the first, reward-proxy calibration on the second — so the strategies are correction primitives for the Q2.1 maintenance loop applied to RL.

### Taxonomy of safe-adaptation strategies

Five strategies, ordered by distance from the current implementation.

**1. Train-time reward robustness (domain randomisation on $R$).** Treat the reward coefficients $\boldsymbol{c} = (c_{\text{agree}}, c_{\text{conf}}, c_{\text{disagree}}, c_{\text{overconf}})$ as a distribution rather than fixed values; minimise worst-case return:

$$
\pi^\star = \arg\max_{\pi}\; \min_{\boldsymbol{c} \in \mathcal{C}}\; \mathbb{E}_{(s,a)\sim\rho^\pi}\bigl[R(s, a; \boldsymbol{c})\bigr]
$$

The robust-MDP framing of @iyengar2005robustmdp: the policy holds if the deployment reward differs from any single training reward in a bounded set $\mathcal{C}$. Cheap — sample $\boldsymbol{c}$ per episode from a Dirichlet centred on the hand-tuned values (the simulation-to-real domain-randomisation move of @tobin2017domainrand). No online adaptation; trades peak performance on the tuned reward for robustness across the band. The DRL-IDS survey [@drlids_survey2024] flags this as one of the few interventions that survives evaluation across heterogeneous attack distributions.

**2. Uncertainty-aware deferral at deployment.** Neural-LinUCB [@xu2022neural] (Eq. {eq}`eq-bandit-ucb`) already implements directed exploration via the UCB bonus $\beta\sqrt{\mathbf{z}^\top\mathbf{A}_a^{-1}\mathbf{z}}$, which shrinks as $O(1/\sqrt{n_a})$ in visit count. The deferral interpretation: when the deployment reward distribution shifts, recent states $\mathbf{z}_t$ fall outside the column space of $\mathbf{A}_a$, the bonus widens, and the policy explores rather than exploiting a stale $\boldsymbol{\theta}_a$. The agent doesn't model shift directly; its uncertainty quantifies "how confident am I that this arm's expected reward still applies?" The $\tilde{O}(\sqrt{T})$ regret bound of @xu2022neural carries to the simplex generalisation from Q4.2 with the same rate.

**3. Conservative offline updates.** If the policy updates online from deployment data, the standard offline-RL recipe penalises out-of-distribution actions relative to the offline replay buffer. Conservative Q-Learning [@kumar2020conservative] regularises Q-values to be lower-bound estimates on OOD actions; Batch-Constrained Q-Learning [@fujimoto2019offpolicy] constrains the policy to the support of the offline data. Both belong on the periodic Neural-LinUCB backbone retrain (every 50 episodes) — the current implementation does standard SGD on the replay buffer, where offline-RL conservatism applies.

**4. Safety shielding.** A hard constraint filter overrides the learned policy when physics or safety invariants are violated [@alshiekh2018shielding]: the policy proposes $\boldsymbol{\alpha}_t$, the shield evaluates a constraint $\Phi(s_t, \boldsymbol{\alpha}_t)$, and either passes the action or projects it onto the constraint-satisfying subset. The PINN residual gate $\mathcal{V}_{\text{regime}} \cdot \mathcal{V}_{\text{signal}} \cdot \mathcal{V}_{\text{residual}}$ from Q1.1 is the shield — when any gate fails, $\lambda_{\text{physics}}\to 0$ is enforced exogenously regardless of policy state, so the composite trust score from Q1.1 does double duty: regime-aware deferral for the *physics expert specifically*, and a deployment-time safety shield over the *whole policy*.

**5. Bayesian reward modelling.** Treat reward as a random variable with posterior $p(R \mid \mathcal{D})$ and act under reward uncertainty. The posterior admits two operational forms: (i) ensemble the reward coefficients (the population from strategy 1) and act under the posterior mean with a CVaR penalty on the lower tail; (ii) Thompson sampling [@riquelme2018deep] over the per-arm posterior — drop-in for UCB, randomised rather than deterministic deferral. Both are unimplemented but cheap given the existing bandit infrastructure.

### Strategy comparison

The table compares the five strategies on shift term targeted, online cost, theoretical guarantee, and current status.

| Strategy | Targets which shift term | Online cost | Theoretical guarantee | Already in framework |
|---|---|---|---|---|
| 1. Domain randomisation [@iyengar2005robustmdp; @tobin2017domainrand] | Both | None — train-time only | Robust-MDP worst-case bound over $\mathcal{C}$ | No (open question) |
| 2. UCB deferral | Both (implicitly) | $O(d^2)$ per step (existing) | $\tilde{O}(d\sqrt{T})$ regret [@xu2022neural] | **Yes** — Neural-LinUCB |
| 3. Conservative offline updates [@kumar2020conservative; @fujimoto2019offpolicy] | Proxy–target divergence | Per backbone retrain | Conservative lower bound on $Q$; bounded policy support | No — backbone retrain hook exists but conservatism not added |
| 4. Safety shielding [@alshiekh2018shielding] | Both — overrides regardless | $O(N)$ per step | Hard constraint by construction | Partial — Q1.1 gates not yet wired into the fusion policy |
| 5. Bayesian reward (Thompson) | Both | $O(d^2)$ per step | Bayes-optimal regret under prior | No — Thompson variant not implemented |

### Mapping strategies to existing work

Each strategy rides on pieces already built; the table shows which piece carries which.

| Component | Existing role | Reward-shift role |
|---|---|---|
| Reward function Eq. {eq}`eq-reward` | F1-tied training signal | Coefficients are exactly the randomisation axis for strategy 1 |
| Neural-LinUCB UCB bonus | Directed exploration via Eq. {eq}`eq-bandit-ucb` | Deferral signal for strategy 2 — already operational |
| 15-dim fusion state | Includes VGAE+GAT confidence | Reward-proxy drift detector candidate; an EKF-innovation feature from Q1.2 would extend this to estimator-pipeline drift |
| Backbone retraining cycle | Periodic representation update every 50 episodes | The natural insertion point for CQL/BCQ-style conservative updates (strategy 3) |
| PINN composite trust score (Q1.1) | $\lambda_{\text{physics}}(s_t) = \lambda_{\text{tier}}\prod_i\mathcal{V}_i$ | Hard shield — strategy 4 — applied as a post-hoc filter over the fusion policy's output simplex |
| Continuous-simplex policy (Q4.2) | Linear-in-$N$ action representation | Required substrate for CQL/BCQ in continuous-action form; discrete 21-bin DQN cannot natively use them |

Strategy 2 is largely implemented; strategy 4's mechanism is specified in Q1.1 but not wired into the fusion policy; strategies 1, 3, 5 follow once the simplex formulation from Q4.2 lands.

### Composing the gates, policy, and bandit deferral

The three answers compose into a deployment-time architecture for safe adaptation:

1. Simplex policy (Q4.2) emits $\boldsymbol{\alpha}_t = \mathrm{softmax}(\boldsymbol{\ell}_t) \in \Delta^{N-1}$.
2. PINN trust gates (Q1.1) compute $\lambda_{\text{physics}}(s_t)$.
3. The shield (strategy 4) projects $\boldsymbol{\alpha}_t$ onto the simplex subset consistent with $\alpha_{\text{PINN}} \le \lambda_{\text{physics}}(s_t)$ and renormalises.
4. Remaining mass redistributes to $\{\alpha_{\text{GAT}}, \alpha_{\text{VGAE}}, \alpha_{\text{CWD}}\}$ via softmax restricted to the feasible subset.
5. Neural-LinUCB (strategy 2) on the unprojected logits provides UCB-driven deferral when the *whole policy* is uncertain, regardless of which expert.

Gate-then-policy-then-bandit-deferral is one decision pipeline, each stage targeting a distinct failure mode (regime mismatch, action-space combinatorics, reward-proxy drift). Each stage is also a calibration object — gate thresholds (Q1.1), simplex-policy softmax temperature, bandit UCB confidence radius $\beta$ — so the Q2.1 joint-calibration apparatus covers them as one correction problem at three points.

## Question 4.2

> As the number of experts in an ensemble grows, the fusion policy's action space scales combinatorially. Compare approaches for keeping multi-expert coordination tractable without sacrificing expressiveness.

### The scaling problem

The fusion policy chooses a weighting over $N$ experts. The current implementation discretises each per-expert weight into $K=21$ bins; at $N=2$ this collapses to a scalar $\alpha \in \{0, 0.05, \ldots, 1\}$, giving 21 joint actions. The general $N$-expert action space, with the simplex constraint $\sum_i \alpha_i = 1$ enforced ex post by normalisation, has

$$
|\mathcal{A}_{\text{discrete}}(N, K)| \;=\; \binom{N + K - 1}{N - 1}
\quad\xrightarrow{N=4,\,K=21}\quad 2{,}024
\quad\xrightarrow{N=4,\,K=21,\,\text{full grid}}\quad K^N \approx 1.94\times 10^5
$$

depending on whether the simplex is enforced at construction (binomial) or after a free $K^N$ grid (upper bound). Either way, the space grows *combinatorially* in $N$.

Two things break under this growth:

- **Q-learning** must estimate $Q(s, a)$ on every reachable $(s, a)$ pair. The DQN [@mnih2013playingatarideepreinforcement; @mnih2015human] amortises this through a function approximator, so the explicit Q-table does not blow up — but the *exploration* problem does. With $\epsilon$-greedy at $\epsilon_0 = 0.2$ the expected episodes to visit each action once is $K^N / \epsilon_0 \approx 10^6$ at $N{=}4$, infeasible at CAN's per-graph episode budget.
- **Linear-payoff bandits** (Neural-LinUCB [@xu2022neural], NeuralUCB [@zhou2020neural]) maintain a design matrix $\mathbf{A}_a \in \mathbb{R}^{d\times d}$ per arm. Memory grows as $O(K^N d^2)$, and the $\tilde{O}(\sqrt{KT})$ regret bound's $\sqrt{K}$ factor becomes $K^{N/2}$ — at $N=4$, $\sim 440\times$ worse than $N=2$ for fixed $T$.

The DRL-IDS survey [@drlids_survey2024] flags discretisation-induced action blow-up as the dominant failure mode of RL-based intrusion detectors as architectural complexity grows.

### The simplex geometry argues against discrete grids

A full simplex parameterisation removes the discretisation. Let $\boldsymbol{\alpha} \in \Delta^{N-1}$ be the per-expert weight vector. Two natural parameterisations of $\Delta^{N-1}$ both yield $O(N)$ action dimension with full expressiveness:

$$
\boldsymbol{\alpha} = \mathrm{softmax}(\boldsymbol{\ell}),\qquad \boldsymbol{\ell} \in \mathbb{R}^N
\qquad\text{or}\qquad
\boldsymbol{\alpha} \sim \mathrm{Dirichlet}(\boldsymbol{\kappa}),\qquad \boldsymbol{\kappa} \in \mathbb{R}_{>0}^N
$$

The softmax form is the standard choice for stochastic actor-critic methods (SAC, A2C); the Dirichlet form adds an exploration knob — concentration $\kappa = \sum_i \kappa_i$ controls vertex- vs. mean-concentration. Both lift the action representation off the grid entirely. The discrete-bandit regret penalty $\sqrt{K^N}$ becomes the continuous-action LinUCB rate $\tilde{O}(d\sqrt{T})$ with $d = O(N)$ — a quadratic-to-polynomial improvement.

### Approach comparison

Six approaches occupy different points on two axes — action-space dimensionality and coordination structure. The table contrasts them on sample complexity, expressiveness, and pros/cons.

| Approach | Action dim | Expressiveness | Sample complexity (informal) | Coordination | Pros | Cons |
|---|---|---|---|---|---|---|
| **Discrete grid** (current) | $K^N$ | Full grid | $\tilde{O}(K^{N/2}\sqrt{T})$ regret per-arm bandit | Joint | Trivial implementation; reuses existing 21-bin code | Combinatorial blow-up; visit time $\gg$ training budget |
| **Continuous simplex via softmax** | $N$ | Full simplex | $\tilde{O}(d\sqrt{T})$, $d=O(N)$ | Joint | Linear in $N$; matches simplex geometry; smooth gradient; integrates with SAC/DDPG-style DQN heads or Neural-LinUCB on logits | Loses closed-form linear update of LinUCB; needs continuous-action variant |
| **Dirichlet policy** | $N$ | Full simplex | $\tilde{O}(d\sqrt{T})$ with structured exploration | Joint | Concentration-based exploration matches "weights on a simplex" geometry; natural uncertainty parameterisation | Requires policy-gradient training; reparameterised gradient estimator more involved |
| **Factored per-expert bandits** | $NK$ | Per-expert independent | $\tilde{O}(N\sqrt{KT})$ regret | None across experts | Trivial regret scaling; closed-form LinUCB updates preserved per arm | Loses inter-expert coordination — assumes weights are conditionally independent given state, which @riquelme2018deep show is false in practice |
| **Hierarchical RL** | Outer $2^N$ subset, inner $K^{|\text{subset}|}$ | High; subset-conditional | $\tilde{O}(2^N + \mathbb{E}_{|\text{subset}|}[K^{|\text{subset}|/2}\sqrt{T}])$ | Subset-level coordination | Handles graceful degradation by treating a degraded expert as a subset action; interpretable | Two-level credit assignment; outer subset exploration adds episode overhead |
| **Mixture-of-Experts gating** | $N$ (gate output) | Top-$k$ subset | $\tilde{O}(d\sqrt{T})$ if gate is a bandit, else gradient-based | Implicit via gate | Reuses MoE machinery; sparse forward pass at inference | Top-$k$ gating discards minority experts that rarely fire; not aligned with calibrated soft fusion |

**Continuous-simplex (softmax) is the recommended default**; **Dirichlet** adds structured exploration. Both are linear in $N$, compatible with the existing 15-dim fusion state extended to $\sim 25$ dims, and degrade gracefully — a dropped or low-confidence expert has $\alpha_i \to 0$, no architectural rewrite. Hierarchical RL fits when subset-level interpretability matters (an audit trail of *which experts were active* per detection), at higher engineering cost.

### Scaling to N=4

The current $N=2$ implementation is anomalous from a scaling standpoint: the simplex constraint $\alpha_{\text{GAT}} + \alpha_{\text{VGAE}} = 1$ collapses to a single scalar, masking the combinatorial pathology. At $N=4$ ([](#subsec:DQN): GAT + VGAE + PINN + CWD) the pathology becomes load-bearing.

| Component | $N=2$ today | $N=4$ proposed | Action representation |
|---|---|---|---|
| State dim | 15 | $\approx 25$ | $f_\theta : \mathbb{R}^{d_s} \to \mathbb{R}^d$ shared backbone unchanged |
| Action dim | $K=21$ scalar $\alpha$ | $N=4$ logits $\boldsymbol{\ell}$ → $\mathrm{softmax}$ | Continuous simplex |
| DQN head | $K$ Q-values | Replace with continuous-action actor (e.g., DDPG critic + actor on $\boldsymbol{\ell}$) | Linear in $N$ |
| Bandit head | Per-arm $\mathbf{A}_a, \mathbf{b}_a$ over $K$ arms (Eq. {eq}`eq-bandit-ucb`) | Linear-payoff bandit on $\boldsymbol{\ell}$, single $\mathbf{A} \in \mathbb{R}^{N\times N}$ | $O(N^2)$ memory |
| Reward Eq. {eq}`eq-reward` | Unchanged structure | Unchanged structure (the $r_{\text{agree}}$, $r_{\text{conf}}$ terms generalise to mean/variance over $N$ experts) | — |

The continuous-action choice already has empirical support: the DQN at $N=2$ shows multimodal weight distributions with peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$ ([](#fig-fusion)) — the policy has converged to roughly five discrete operating modes rather than exploiting the full 21-bin resolution. So (i) the current discretisation is over-resolved even at $N=2$, and (ii) the modes are interpretable as attack-type-specific strategies — the structure a continuous policy with KL-regularised exploration recovers without enumerating the grid.

The Dirichlet policy bridges the discrete-mode behaviour observed today and the simplex geometry: $\boldsymbol{\kappa}(s) = g_\phi(s)$ outputs concentration parameters per state, and the resulting Dirichlet collapses near simplex vertices when one expert's confidence dominates and spreads when no expert is strongly preferred — a faithful generalisation of the observed multimodal distribution at $N=2$.

