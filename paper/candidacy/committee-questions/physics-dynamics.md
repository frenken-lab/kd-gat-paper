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

|                         | **In training distribution**                                                                   | **Out of distribution**                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **On physics surface**  | Both priors apply. Single-expert verdict suffices; fuse trivially.                             | Physics carries the trust. Dynamics are causally consistent; data-driven sees a rare pattern. |
| **Off physics surface** | Data-driven carries the trust. The pattern is familiar; physics sees an off-manifold residual. | Neither single prior is sufficient. The candidacy contribution lives here.                    |

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

- **Uncertainty** ($\mathcal{V}_{\text{signal}}$, on the cumulative noise covariance from $s_t = h(z_t) + \eta_t$): Tier 1 (DBC) collapses $\Sigma_\eta$ to sensor noise; tier 3 (ByCAN) inflates it by the 80.21% slicing-accuracy bias [@ByCAN] that the Gaussian posterior reading then misrepresents. The gate fires when that inflation makes the confidence number unreliable — not when the signal is noisy, but when the noise model itself is wrong. This is the drift gate.

- **Model fidelity** ($\mathcal{V}_{\text{residual}}$): The gate fires when the residual is implausible _given the regime_, not just large. A large residual in a hard cornering maneuver is expected; the same residual on a straight highway is not. This operationalizes Q2.1's epistemic/aleatoric decomposition at runtime — regime-conditioned plausibility, not absolute magnitude.

The data-driven branch carries analogous gates. The GAT gate uses post-temperature-scaled softmax $p(y \mid x) > \tau_{\text{gat}}$; below threshold, GAT abstains and weight redistributes. Temperature scaling matters because raw softmax is overconfident by default [@guo2017calibration] — the gate without it is a confidence illusion, not a competence signal. The VGAE gate is inverted: composite reconstruction error exceeding $\tau_{\text{vgae}}$ flags OOD against benign training, and VGAE _gains_ weight when the gate fires — its OOD signal is the attack signal.

The five thresholds $\{\tau_{\text{model}}, \tau_{\text{signal}}, \tau_{\text{ood}}, \tau_{\text{gat}}, \tau_{\text{vgae}}\}$ are statistical fits to held-out benign data, not engineering constants. They share a maintenance loop with the joint calibration apparatus from Q2.1. Fitting them independently breaks the coverage claim: a physics gate calibrated on clean data and a VGAE gate calibrated on shifted data can simultaneously fire and suppress each other on the same input.

---

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

Q1.1 established that the physics and data-driven priors are orthogonal — they encode different things about the same underlying process. The follow-on question is whether the _channels_ those priors read through are equally orthogonal. The answer matters because channel orthogonality is what makes the system defensible under adversarial pressure.

### Estimation chains introduce structured error, not just noise

The naive answer to the question is that estimated states introduce noise, degrading reliability. The more interesting answer is that estimation chains introduce _structured_ error — and the structure is diagnostic. Each stage of the chain contributes a different statistical shape of error, and that shape determines what form of defense is valid. A defense correct for one shape is wrong by construction for another.

The variance of the physics branch's residual $r_t$ decomposes as:

$$
\mathrm{Var}[r_t] \;\approx\; \mathrm{Var}\!\left[\eta^{\text{sensor}}\right] \;+\; B^2_{\text{slice}} \;+\; \mathrm{tr}(Q_{\text{EKF}}) \;+\; \mathrm{Var}\!\left[\epsilon_{\text{model}}\right]
$$

Three of the four terms are introduced by processing, not by the underlying signal. Each has a distinct shape:

- **Bias** ($B^2_{\text{slice}}$): systematic offset, not symmetric noise. A symmetric outlier test misses it — the corrupted value stays inside the noise band, just shifted. The structurally correct defense is one-sided, not two-sided.
- **Temporal integration** ($\mathrm{tr}(Q_{\text{EKF}})$): each corrupted step is sub-threshold, but the effect accumulates over the filter window. A per-step threshold never fires. The structurally correct defense is temporal — evidence must accumulate across steps, not reset each time.
- **Regime-conditioned variance** ($\mathrm{Var}[\epsilon_{\text{model}}]$): model error is high outside the valid operating envelope. An attacker who pushes the system there makes the residual model-error-dominated. An absolute threshold sized to the in-regime case misses this. The structurally correct defense is regime-conditioned bounds, not global ones.

In the CAN bus system specifically, these terms map to ByCAN's slicing bias, EKF drift over the filter window, and the bicycle model's linear-tire envelope respectively — but the principle is general to any detection system reading through a multi-stage estimation chain.

### Channel orthogonality as the structural defense

The data-driven branch bypasses the estimation chain entirely — it reads raw bytes directly. This means chain corruption doesn't move it. An adversary who compromises the estimation chain has to simultaneously mount a structurally different attack on the byte-level branch to shift the fusion decision, and those two attacks have different signatures.

This is the load-bearing claim: **channel orthogonality converts a single attack surface into two independent ones**. It isn't "bytes are safe" — the data-driven branch has its own vulnerabilities, including graph-aware perturbations that exploit attention structure. The point is that the attack signatures don't overlap, so simultaneous compromise is detectable as disagreement between channels rather than a clean fusion outcome.

That independence condition is exactly what Q2.2 requires for disagreement-as-information. Without orthogonal channels, expert disagreement reduces to correlated noise. With it, disagreement is diagnostic.

### What this implies for adversarial evaluation

Nearly all existing CAN-IDS evaluation uses naively injected attacks — random payloads, replay — almost none are estimation-chain-aware [@rajapaksha2022aiidssurvey]. An attacker who understands the variance decomposition above can craft attacks shaped to each term: bias-shaped injections that stay inside symmetric bounds, sub-threshold drift that integrates silently, or regime-pushing maneuvers that make the physics residual uninterpretable. The current evaluation regime doesn't test any of these.

The contribution here is not just the defense architecture — it's the _attack model_. The variance equation is a recipe for constructing evaluation attacks that are structurally valid rather than naively injected. Until the evaluation catches up to the threat model, the system's robustness claims are undersupported.

---

Q1 as a unified argument: Q1.1 says the priors are orthogonal — physics encodes structure, data-driven encodes frequency — and the bottom-right cell of the phase diagram is where the joint apparatus has to deliver. Q1.2 says the channels are orthogonal too, and the variance decomposition is what makes that claim defensible rather than assumed. Both axes serve the same load-bearing case: when no single expert is qualified, neither axis has collapsed simultaneously.
