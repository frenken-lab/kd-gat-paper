---
title: "1. Physics and Dynamic Controls"
---

## Question 1.1

> When should a detection system trust its physics-based priors versus defer to purely data-driven components? Discuss how model fidelity, operating conditions, and uncertainty interact in this decision.

When should a detection system trust its physics-based priors versus defer to purely data-driven components? The short answer is “use both” — but this section will explore both _how_, and in what proportion, and when to override one over the the other.

Consider an umpire calling balls and strikes. The umpire has two sources of information: the geometry of the pitch — trajectory, release point, spin, where the ball crossed the plate, and a historical record of pitches seen before. A majority of pitches will be well-within the historical and physical state space, so both modalities will agree. However, say a pitcher throws a novel pitch compared to their historical record. Here, the umpire's memory would be unhelpful or even counterproductive, assigning high probability to a call built on zero relevant evidence. Conversely, if the umpire's position slowly drifts over the game's duration, the geometry is correct but its assigned confidence is miscalibrated against what this umpire actually calls. Finally, a knuckleball can result in an unpredictable path, and can break the constraints and assumptions of the trajectory model.

These three failure modes also appear in the CAN bus context which can more explicitly defined below:

- **OOD:** A novel attack pattern outside a model's training distribution gets a high-confidence benign classification with no evidential basis.
- **Model breakdown:** Pushing the vehicle into irregular states makes a PINN residual model error-dominated rather than attack-dominated. The physics still hold but its structural assumptions are violated.
- **Drift (miscalibration):** ByCAN's 80.21% slicing accuracy propagates as systematic bias into the EKF state estimate, so the confidence number attached to the physics call misrepresents actual uncertainty — the noise model is wrong, not the physics

### Formalizing the Decision: A Phase Diagram

These failure modes though different are not entirely independent. They can separate along two axes:

- If an input is within the physics model's assumptions.
- IF an input has been captured within a data-driven model's training coverage.

+++ {"type": "table"}

|                         | **In training distribution**                                                                   | **Out of distribution**                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **On physics surface**  | Both priors apply. Single-expert verdict suffices; fuse trivially.                             | Physics carries the trust. Dynamics are causally consistent; data-driven sees a rare pattern. |
| **Off physics surface** | Data-driven carries the trust. The pattern is familiar; physics sees an off-manifold residual. | Neither single prior is sufficient. The candidacy contribution lives here.                    |

+++

The first three cells are control conditions — one prior is sufficient to underwrite the trust claim. The bottom-right is the experimental condition: no single expert is qualified, and the answer has to come from a joint arbitration apparatus. This cell is operationally rare — the diagonal is where any sensible system already works. That rarity is the point. The diagonal is where the baseline delivers; the bottom-right is where the contribution has to.

### Operationalizing the Decision: Competence Gates

The diagram helps assign samples to failure modes, but there are additional considerations namely:

- **model fidelity:** Is the physics model's residual meaningfully interpretable here?
- **Operating conditions:** Are we inside the envelope where the model's assumptions hold?
- **Uncertainty:** Is the confidence number actually trustworthy, or is the noise model broken?

Each of these maps to a gate. All three gates are conjunctive — any failure pulls physics weight to zero.

$$
\lambda_{\text{physics}}(s_t) \;=\; \lambda_{\text{tier}} \cdot \underbrace{\mathbb{1}\!\left[\,\bigl\|\mathcal{M}_\Theta(s_{t-1}) - s_t\bigr\|_2 \le \tau_{\text{model}}\,\right]}_{\mathcal{V}_{\text{regime}}}\;\cdot\; \underbrace{\mathbb{1}\!\left[\,\mathrm{tr}(\Sigma_\eta(t)) \le \tau_{\text{signal}}\,\right]}_{\mathcal{V}_{\text{signal}}}\;\cdot\; \underbrace{\mathbb{1}\!\left[\,p(r_t \mid \text{benign}, s_t) < \tau_{\text{ood}}\,\right]}_{\mathcal{V}_{\text{residual}}}
$$

- **Operating conditions** ($\mathcal{V}_{\text{regime}}$): The bicycle model is only a good approximation inside the linear-tire region — $|\alpha_f|, |\alpha_r| \le 4°$ on dry asphalt. Outside that envelope the residual is model-error-dominated, not attack-dominated [@Chen2024CADD]. This is the knuckleball gate: it catches regime breakdown before the physics branch makes a call it has no business making.

- **Uncertainty** ($\mathcal{V}_{\text{signal}}$, on the cumulative noise covariance from $s_t = h(z_t) + \eta_t$): Tier 1 (DBC) collapses $\Sigma_\eta$ to sensor noise; tier 3 (ByCAN) inflates it by the 80.21% slicing-accuracy bias [@bycan_2024] that the Gaussian posterior reading then misrepresents. The gate fires when that inflation makes the confidence number unreliable — not when the signal is noisy, but when the noise model itself is wrong. This is the drift gate.

- **Model fidelity** ($\mathcal{V}_{\text{residual}}$): The gate fires when the residual is implausible _given the regime_, not just large. A large residual in a hard cornering maneuver is expected; the same residual on a straight highway is not. This operationalizes Q2.1's epistemic/aleatoric decomposition at runtime — regime-conditioned plausibility, not absolute magnitude.

The data-driven branch carries analogous gates. The GAT gate uses post-temperature-scaled softmax $p(y \mid x) > \tau_{\text{gat}}$; below threshold, GAT abstains and weight redistributes. Temperature scaling matters because raw softmax is overconfident by default [@guo2017calibration] — the gate without it is a confidence illusion, not a competence signal. The VGAE gate is inverted: composite reconstruction error exceeding $\tau_{\text{vgae}}$ flags OOD against benign training, and VGAE _gains_ weight when the gate fires — its OOD signal is the attack signal.

The five thresholds $\{\tau_{\text{model}}, \tau_{\text{signal}}, \tau_{\text{ood}}, \tau_{\text{gat}}, \tau_{\text{vgae}}\}$ are statistical fits to held-out benign data, not engineering constants. They share a maintenance loop with the joint calibration apparatus from Q2.1. Fitting them independently breaks the coverage claim: a physics gate calibrated on clean data and a VGAE gate calibrated on shifted data can simultaneously fire and suppress each other on the same input.

---

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

### Estimation chains introduce structured error, not noise

The key insight is not that estimated states add noise, but that they introduce _structured_ error — and that structure determines what defenses are valid. The residual variance decomposes as:

$$
\mathrm{Var}[r_t] \;\approx\; \mathrm{Var}\!\left[\eta^{\text{sensor}}\right] + B^2_{\text{slice}} + \mathrm{tr}(Q_{\text{EKF}}) + \mathrm{Var}\!\left[\epsilon_{\text{model}}\right]
$$

Three of four terms are processing artifacts, each with a distinct exploitable shape:

- **Bias** ($B^2_{\text{slice}}$): systematic offset that stays inside symmetric bounds. Correct defense: one-sided, not two-sided thresholds.
- **Temporal integration** ($\mathrm{tr}(Q_{\text{EKF}})$): sub-threshold drift accumulates silently across the filter window. Correct defense: temporally accumulating evidence, not per-step thresholds.
- **Regime-conditioned variance** ($\mathrm{Var}[\epsilon_{\text{model}}]$): model error dominates outside the valid operating envelope. An attacker inducing out-of-envelope behavior renders an absolute threshold uninformative. Correct defense: regime-conditioned bounds.

In CAN-IDS specifically, these map to slicing bias, EKF drift, and the bicycle model's linear-tire envelope — but the principle applies to any multi-stage estimation pipeline.

### Channel orthogonality as the structural defense

The data-driven branch reads raw bytes directly, bypassing the estimation chain entirely. This means chain corruption doesn't move it. An adversary must simultaneously mount a structurally _different_ attack on the byte-level branch, and those two attacks carry different signatures. **Channel orthogonality converts a single attack surface into two independent ones** — simultaneous compromise is detectable as inter-channel disagreement rather than a clean fusion outcome. This is the prerequisite for disagreement-as-information (Q2.2): without orthogonal channels, expert disagreement is correlated noise; with it, disagreement is diagnostic.

### Implications for adversarial evaluation

Existing CAN-IDS evaluations almost exclusively use naively injected attacks — random payloads, replay — none shaped to the variance decomposition above [@rajapaksha2022aiidssurvey]. The decomposition is itself a recipe for constructing structurally valid attacks: bias-shaped injections that evade symmetric bounds, sub-threshold drift that integrates silently, or regime-pushing maneuvers that make the physics residual uninterpretable. The contribution is thus both the defense architecture and the attack model — robustness claims remain undersupported until evaluation catches up to the threat model.
