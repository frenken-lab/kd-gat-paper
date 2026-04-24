---
title: "4. Reinforcement Learning"
---

## Question 4.1

> When the reward signal available at deployment differs from what was used during training, how should an RL-based system behave? Discuss strategies for safe adaptation under reward uncertainty.

**Thesis.** Treat deployment-time reward shift as a distribution-shift problem on the reward function. Four strategies, ordered by how much the framework already supports:

1. **Train-time reward robustness** — randomise reward coefficients during training (ensemble-over-rewards or domain-randomisation on the reward function) and pick the policy whose worst-case return is best. Cheap, no online adaptation required.
2. **Uncertainty-aware deferral at deployment** — the Neural-LinUCB agent (`paper/content/methodology.md:173`) already provides directed, uncertainty-scaled action selection via its UCB bonus. When deployment-time reward estimates become uncertain, the bonus widens, naturally deferring to exploration rather than exploiting a stale estimate.
3. **Conservative offline updates** — if the policy must update online, use offline-RL methods (CQL, BCQ) that penalise out-of-distribution actions relative to the training data. This avoids over-committing to reward-shifted actions.
4. **Safety shielding** — a hard constraint filter that overrides the learned policy when physics or safety invariants are violated. The proposed PINN residual ([](#subsec:PINN)) is the natural shield for this framework — $\lambda_{\text{physics}}$ gating already implements the mechanism.

**Anchors in the current framework.**

- Reward function defined in `paper/content/methodology.md:130`–`:140`: $R = \pm 3.0 + r_{\text{agree}} + r_{\text{conf}} + r_{\text{disagree}} + r_{\text{overconf}}$ + implicit balance term. Hand-tuned, fixed offline.
- UCB-driven exploration of Neural-LinUCB [@xu2022neural] is a partial answer to (2): the policy's confidence in each arm shrinks as $O(1/\sqrt{n_a})$, and the UCB bonus gives a principled deferral signal under sparse data.
- The 15-dimensional fusion state (`paper/content/methodology.md:126`) includes VGAE and GAT confidence terms, giving the agent access to downstream uncertainty signals it could use to detect reward-proxy drift.

**Open questions.**

- **No train-time reward-coefficient ablation.** An offline sensitivity study varying each of $r_{\text{agree}}, r_{\text{conf}}, r_{\text{disagree}}, r_{\text{overconf}}$ by $\pm 50\%$ and measuring policy F1 stability is the cheapest proxy for (1); not yet done.
- **No deployment-time adaptation implemented.** No online re-estimation of the reward, no drift monitor on the reward signal.
- **CQL / BCQ / shield-based RL** not cited or integrated. These refs are not yet in `paper/references/`.
- **PINN-as-shield** is logically natural ([](#subsec:PINN) already provides graceful $\lambda$ degradation) but not explicitly formulated as a safety filter on the fusion policy.

## Question 4.2

> As the number of experts in an ensemble grows, the fusion policy's action space scales combinatorially. Compare approaches for keeping multi-expert coordination tractable without sacrificing expressiveness.

**Thesis.** The current discrete action space — $K=21$ weight bins over $N=2$ experts — is tractable at 42 actions. Scaling to $N=4$ experts ([](#subsec:DQN): GAT + VGAE + PINN + CWD) with the same per-expert discretisation yields $21^4 \approx 1.94\times 10^5$ joint configurations, which is infeasible for DQN Q-learning and destructive for bandit regret bounds. Four viable approaches, ordered by expressiveness vs. sample complexity:

| Approach | Action dim | Expressiveness | Notes |
|---|---|---|---|
| **Continuous simplex action via softmax** | $O(N)$ | Full simplex | Policy outputs logits $\ell \in \mathbb{R}^N$, weights $\alpha = \text{softmax}(\ell)$. Use SAC/DDPG for DQN side, or linearly-parameterised bandit over the softmax output. |
| **Factored-action bandits** (one arm per expert) | $O(NK)$ | Limited — assumes per-expert independence | Loses inter-expert coordination; cheap but coarse. |
| **Hierarchical RL** | Meta $\{2^N\}$, inner $K$ per active subset | High | Meta-controller selects active subset (handles graceful degradation naturally); inner controller sets weights. Additional training complexity. |
| **Structured exploration via Dirichlet prior** | $O(N)$ | Full simplex | Parameterise a Dirichlet over $\alpha$, exploration via concentration; matches the "weights on a simplex" geometry directly. |

The continuous-simplex approach is the recommended default. It scales linearly in experts, matches graceful degradation (a dropped expert simply has $\alpha_i \to 0$), integrates with either DQN (continuous actor head) or Neural-LinUCB (regress over an $N$-dim representation), and preserves full simplex expressiveness.

**Anchors in the current framework.**

- `paper/candidacy/proposed-research.md` §Dynamic Expert Fusion (lines 118–157) already states the scaling target is $N=4$ experts and the bandit formulation's argument against sequential MDP overhead (lines 122–124) — consistent with (1) above.
- The existing fusion state is already a 15-dim feature vector (`paper/content/methodology.md:126`), which will extend to a 25+ dim vector with PINN and CWD experts; the per-expert confidence convention carries over cleanly to an $N$-dim softmax.
- DQN policy diversity at $N=2$ shows peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$ (`paper/content/explainability.md:42`, [](#fig-fusion)) — evidence that the policy is already discovering a small number of discrete strategies rather than a full grid, supporting factored or low-rank action representations.

**Open questions.**

- **No scaling experiment** has been run at $N=4$; the combinatorial-blow-up claim is argued, not measured.
- **Continuous-simplex formulation is not prototyped.** Required: an SAC or actor-critic head emitting $N$-dim logits, benchmarked against the current 21-bin DQN at $N=2$ to verify no regression before scaling to $N=4$.
- **Graceful degradation under expert dropout** needs an explicit test protocol — mask one expert at inference and measure F1 degradation; the continuous-simplex formulation should degrade smoothly, factored bandits more abruptly.
- **Exploration-regret bounds** for the chosen formulation at $N=4$ are not derived. For a principled answer, cite the Neural-LinUCB regret of $\tilde{O}(\sqrt{T})$ [@xu2022neural] and verify it scales favourably in the softmax-output representation.
