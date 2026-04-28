---
title: "1. Physics and Dynamic Controls"
---

## Question 1.1

> When should a detection system trust its physics-based priors versus defer to purely data-driven components? Discuss how model fidelity, operating conditions, and uncertainty interact in this decision.

Model-based methods (physics, system dynamics) and data-based methods (ML, statistics) approach the same problem from opposite ends. Model-based starts from first principles and asks what behaviours are possible; data-based starts from observed signals and asks what function fits them. The defensible sharper form: both are estimators of the same underlying data-generating process, differing in their representational commitments rather than their target. Physics commits to a symbolic, compositional representation that extrapolates by structural argument. Data-driven methods commit to a parameterised representation that interpolates strongly inside the training distribution and degrades outside it. The symbolic-regression literature [@brunton2016sindy; @udrescu2020aifeynman] and the broader physics-informed ML programme [@raissi2019pinn] presuppose this view — they only make sense if data-driven methods are aiming at something a closed-form law could in principle express. Neither subsumes the other; the rest of this answer is about how to combine them so each one's blind spots don't dominate.

The two expert classes encode different priors over the same input. Physics encodes **structure without frequency** — the bicycle+Pacejka equations specify which dynamics are causally consistent, with no opinion about which are common. Data-driven encodes **frequency without structure** — the GAT decision boundary and VGAE benign manifold are fit from data, with no closed-form description of why those patterns exist. Two complementary inductive biases; neither subsumes the other. The trust decision factorizes along their independent axes: _is the input on a known **form**?_ (physics applicable) and _is the input in a covered **frequency**?_ (data-driven applicable).

### The four-cell phase diagram is the thesis statement

|                               | **Frequency: in training**                                                                       | **Frequency: OOD**                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| **Form: on physics surface**  | _Both priors apply._ Single-expert verdict suffices; fuse trivially.                             | _Physics carries the trust._ Dynamics are causally consistent; data-driven sees a rare pattern. |
| **Form: off physics surface** | _Data-driven carries the trust._ The pattern is familiar; physics sees an off-manifold residual. | _Neither single prior is sufficient._ The candidacy contribution lives here.                    |

The first three cells are _control conditions_ — the prior structure of one expert (or both) is enough to underwrite the trust claim. The fourth is the _experimental condition_ — no single expert is qualified, and the operational answer comes from the joint calibration apparatus spanning the Q1.1 gates below, Q2.1's conformal coverage, and Q4.1's safety shielding. The whole candidacy thesis is about making the bottom-right cell defensible. Empirically the off-diagonal is rare; that rarity is the point — the diagonal is where any sensible system already works, the bottom-right is where the contribution has to deliver.

### Per-sample arbitration via competence gates

The operational structure that the diagram dispatches into. Every expert carries a competence signal — not just the physics one.

**Physics: three gates, conjunctive.** Trust physics only when all three indicators hold; any failure pulls its weight to zero. Writing $\mathcal{M}_\Theta$ for the bicycle-plus-Pacejka model from [](#app:pinn-physics) and $r_t$ for the PINN residual from Eq. {eq}`eq-physics-score`:

$$
\lambda_{\text{physics}}(s_t) \;=\; \lambda_{\text{tier}} \cdot \underbrace{\mathbb{1}\!\left[\,\bigl\|\mathcal{M}_\Theta(s_{t-1}) - s_t\bigr\|_2 \le \tau_{\text{model}}\,\right]}_{\mathcal{V}_{\text{regime}}}\;\cdot\; \underbrace{\mathbb{1}\!\left[\,\mathrm{tr}(\Sigma_\eta(t)) \le \tau_{\text{signal}}\,\right]}_{\mathcal{V}_{\text{signal}}}\;\cdot\; \underbrace{\mathbb{1}\!\left[\,p(r_t \mid \text{benign}, s_t) < \tau_{\text{ood}}\,\right]}_{\mathcal{V}_{\text{residual}}}
$$

a Chow's reject option [@geifman2017selective] over the physics expert. The three indicators catch different failures:

- **Regime validity** ($\mathcal{V}_{\text{regime}}$, threshold sized to benign-training model error). Linear-tire region only ($|\alpha_f|, |\alpha_r| \le 4°$ on dry asphalt); outside that envelope the residual is model-error-dominated, not attack-dominated [@Chen2024CADD].
- **Signal reliability** ($\mathcal{V}_{\text{signal}}$, on the cumulative noise covariance from $s_t = h(z_t) + \eta_t$). Tier 1 (DBC) collapses $\Sigma_\eta$ to sensor noise; tier 3 (ByCAN) inflates it by the 80.21% slicing-accuracy bias [@ByCAN] that the Gaussian posterior reading then misrepresents.
- **Residual implausibility** ($\mathcal{V}_{\text{residual}}$). The operational form of Q2.1's epistemic/aleatoric decomposition: the gate fires when the residual is implausible _given the regime_, not just large.

**GAT gate.** Post-temperature-scaled softmax $p(y \mid x) > \tau_{\text{gat}}$; below threshold, GAT abstains and weight redistributes. Calibration matters because raw softmax is overconfident by default [@guo2017calibration].

**VGAE gate.** Composite reconstruction error exceeding $\tau_{\text{vgae}}$ flags OOD against benign training (§Composite VGAE Reconstruction Error). VGAE _gains_ weight when the gate fires — its OOD signal is the attack signal.

The five thresholds $\{\tau_{\text{model}}, \tau_{\text{signal}}, \tau_{\text{ood}}, \tau_{\text{gat}}, \tau_{\text{vgae}}\}$ are statistical fits to held-out benign data, not engineering constants. They share a maintenance loop with the rest of the joint calibration set in the [committee-questions index](index.md) — one natural-distribution split, one recalibration cadence. Treating them as five independent problems, which the field does, breaks the coverage claim Q2.1 builds toward.

The gates are how a sample gets _located_ in the phase diagram. Three of the four cells dispatch to a single-expert verdict — the gates' job is to identify which. The fourth cell is the load-bearing one: when the gates report no operational expert qualified, the joint apparatus (Q2.1 conformal set + Q4.1 shield) has to produce the action, because the diagram by itself does not.

### Tier mapping is the coarse outer envelope

The $\lambda_{\text{physics}}$ tier system in [](#subsec:PINN) conditions on signal availability only — the _outer_ envelope of the composite trust score. The three physics gates above are the _inner_ sample-by-sample weighting that the framework doesn't yet implement.

| Tier      | $\lambda_{\text{tier}}^{(0)}, \lambda_{\max}$ | What's fixed                                          | What gates supply at runtime |
| --------- | --------------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| 1: DBC    | 0.5, 1.0                                      | $\mathcal{V}_{\text{signal}} = 1$ structurally        | regime, residual             |
| 2: OBD-II | 0.3, 0.5                                      | Lower $\mathcal{V}_{\text{signal}}$ ceiling           | regime, residual             |
| 3: ByCAN  | 0.1, 0.3                                      | $\mathcal{V}_{\text{signal}}$ bias-dominated [@ByCAN] | all three                    |
| Failed    | 0, 0                                          | $\mathcal{V}_{\text{signal}} = 0$                     | physics off                  |

Tier 3's hard cap at $\lambda_{\max}=0.3$ reflects that the Gaussian-posterior reading of $\mathcal{V}_{\text{signal}}$ doesn't apply under bias-dominated noise; the PINN's role there narrows to _training-time regulariser_ on the GAT/VGAE branch, not deployment-time detector. Self-adaptive PINN weighting [@McClenny2023SAPINN] and the NTK analysis [@Wang2022NTK] handle that intra-training shrinkage; the gate set above handles deployment-time deferral. The rejection set is operationally inspectable — what the ISO 26262 ASIL C/D safety case from Challenge 3 demands.

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

Q1.1 argued the two priors are orthogonal — physics encodes structure, data-driven encodes frequency, both estimating the same underlying process. Q1.2 argues the two _channels_ through which they read that process are orthogonal too: physics reads its inputs through a four-stage estimation chain ($z_t \xrightarrow{\text{ByCAN}} \tilde{z}_t \xrightarrow{\text{EKF}} \hat{\mathbf{x}}_t \xrightarrow{\text{PINN}} r_t$), data-driven reads bytes directly. That estimation opens an attack surface is cybersec 101. The interesting claim is _what shape the surface has_.

### The variance equation is a defense-construction recipe

$$
\mathrm{Var}[r_t] \;\approx\; \mathrm{Var}\!\left[\eta^{\text{sensor}}\right] \;+\; B^2_{\text{slice}} \;+\; \mathrm{tr}(Q_{\text{EKF}}) \;+\; \mathrm{Var}\!\left[\epsilon_{\text{model}}\right]
$$

Three of the four terms are introduced _by processing_, and each has a different statistical shape that determines the form of the gate that defends it:

- **$B^2_{\text{slice}}$ — bias, not noise.** ByCAN's 80.21% slicing accuracy [@ByCAN] propagates as systematic offset, not Gaussian residual. Defense is _one-sided_ — OBD-II ground-truth cross-check [@Pese2019LibreCAN] or versioned template attestation. A symmetric outlier test misses bias-shaped attacks by construction.

- **$\mathrm{tr}(Q_{\text{EKF}})$ — time-integrating.** Each step is sub-threshold; the noise integrates over the filter window. Defense is _temporal_ — CUSUM on the innovation sequence [@Ozdemir2024IVNSurvey]. Per-step thresholds miss per-window drift by construction.

- **$\mathrm{Var}[\epsilon_{\text{model}}]$ — regime-conditioned.** Variance is high outside the linear-tire envelope. Defense is Q1.1's $\mathcal{V}_{\text{regime}}$. Absolute residual thresholds miss regime-dependent failure by construction.

The byte-level GAT/VGAE branch carries none of these terms — it doesn't traverse the chain. That's the channel-orthogonal defense: an attacker who corrupts the chain hasn't moved the data-driven pipeline at all.

### The threat taxonomy instantiates the recipe

Each known attack class maps to one of the term-by-term gates the framework currently doesn't have:

- **Slicing-template poisoning** ($B^2_{\text{slice}}$ gate). ByCAN's DBSCAN+DTW template construction is offline and unprotected; an adversary with pre-deployment access can craft payloads crossing signal boundaries to bias extracted $\delta$ or $\dot{\psi}$ in a chosen direction. Defended by OBD-II cross-validation when available; otherwise the template is part of the security boundary and needs versioned attestation.

- **Slow-drift residual attacks** ($\mathrm{tr}(Q_{\text{EKF}})$ gate). Sub-Hz writes shift the steering-angle estimate by sub-threshold amounts per step; cumulative drift over $\sim 10$ s silently exits the linear-tire regime, and the PINN residual becomes model-error-dominated. Innovation-sequence CUSUM is named as a gap, not shipped.

- **Plausibility-band injection** ($\mathrm{Var}[\epsilon_{\text{model}}]$ gate). The fallback hierarchy in [](#subsec:PINN) clips signals only outside $|\delta|<40°$, $|\dot{\psi}|<1$ rad/s; values inside the band pass to the EKF unflagged. Tightening to regime-conditioned bounds (highway: $|\delta|<4°$) is a one-line fix, not a research project.

- **Graph-aware decoy** [@zugner2018adversarial]. The byte-level branch isn't immune — GAT attention can be fooled by chosen edge perturbations, and adversarial benign-looking IDs can distort ByCAN's template centroids. The defense isn't "use bytes, they're safe"; it's that the two channels' attacks have _different signatures_, so simultaneous compromise requires two attacks of different kinds.

@Choi's CAN-attack countermeasure survey and the AI-IDS survey [@rajapaksha2022aiidssurvey] note that nearly all CAN-IDS evaluation uses _naïvely-injected_ attacks (random payloads, replay), almost none physics-aware. Adding ByCAN-and-EKF-aware attackers to the evaluation closes that gap.

### What the tier cap is admitting

The current $\lambda_{\max}=0.3$ cap on tier-3 deployments is a placeholder admission: "we can't yet tell which of the four terms got attacked, so bound the chain's total influence." The proposal is to replace the outer cap with the inner gates the variance equation tells you how to build, each shaped by its term's statistics (one-sided / temporal / regime-conditioned). Until they ship, the tier cap and the byte-level branch are structural defense-in-depth — not a cryptographic guarantee, but: even with full chain compromise, the data-driven branch is unaffected, and the fusion decision can't be moved more than 30%.

| What's there                                                                             | What's missing                                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| DBC $\succ$ OBD-II $\succ$ ByCAN fallback + static plausibility clip                     | Bands are static, not regime-conditioned                                                                     |
| Self-adaptive $\lambda_{\text{physics}}$ shrinks physics when training gradients diverge | No deployment-time defense against bias-shaped or time-integrating attacks                                   |
| Tier cap on $\lambda_{\text{physics}}$                                                   | No inner gates ($\mathcal{V}_{\text{regime}}$ at runtime, innovation-sequence monitor, template attestation) |
| GAT/VGAE on raw bytes — channel-orthogonal                                               | Fusion policy lacks an estimator-compromise signal — can't up-weight data-driven when the chain is hit       |

Q1 as a unified argument: Q1.1 says the priors are orthogonal and the bottom-right cell of the phase diagram is where the joint apparatus has to deliver; Q1.2 says the channels are orthogonal too, the variance equation is the recipe for the inner gates, and the tier cap is the framework's placeholder until they ship. Both axes serve the same load-bearing case — when no single expert is qualified, neither axis (priors, channels) has collapsed simultaneously. Both axes are also what supplies the **independence** condition Q2.2 requires for disagreement-as-information: without orthogonal priors and orthogonal channels, expert disagreement reduces to correlated noise, not diagnostic signal.
