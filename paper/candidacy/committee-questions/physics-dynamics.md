---
title: "1. Physics and Dynamic Controls"
---

## Question 1.1

> When should a detection system trust its physics-based priors versus defer to purely data-driven components? Discuss how model fidelity, operating conditions, and uncertainty interact in this decision.

When should a detection system trust its physics-based priors versus defer to purely data-driven components? The naive answer is "use both" — but that just pushes the question back. Use both _how_, and in what proportion, and when does one override the other?

Start with something concrete. An umpire calling a pitch has two sources of information: where the ball crossed the plate (physics — trajectory, release point, spin) and what pitches from this pitcher have looked like all game (data — frequency, pattern). If the pitcher throws something he's never thrown before, the umpire's historical read is useless and the call has to come from geometry alone. If the ball clips a corner the umpire has been miscalling all night, the physics is right but the confidence is miscalibrated. Neither source is always dominant — the question is which one is _qualified_ on this pitch.

That's the real question for a CAN intrusion detection system too. Physics here means a bicycle model plus Pacejka tire dynamics — a closed-form description of what vehicle states are causally consistent. Data-driven means a graph attention network and variational autoencoder trained on observed CAN traffic. Both are estimating the same underlying process; the difference is what they assume about its structure. Physics commits to a symbolic, compositional representation that extrapolates by structural argument. Data-driven commits to a parameterized one that interpolates strongly inside the training distribution and degrades outside it. The symbolic regression literature [@brunton2016sindy; @udrescu2020aifeynman] and the physics-informed ML program [@raissi2019pinn] only make sense under this view — you'd only try to recover a closed-form law from data if you believed one was there to recover.

So the trust decision isn't "physics vs. data-driven" globally. It factorizes along two independent axes: _is the input on a known form?_ (physics applicable) and _is the input in a covered frequency?_ (data-driven applicable). Crossing those two binary questions gives a four-cell diagram, and that diagram is where the answer lives.

### The four-cell phase diagram

|                               | **Frequency: in training**                                                                     | **Frequency: OOD**                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Form: on physics surface**  | Both priors apply. Single-expert verdict suffices; fuse trivially.                             | Physics carries the trust. Dynamics are causally consistent; data-driven sees a rare pattern. |
| **Form: off physics surface** | Data-driven carries the trust. The pattern is familiar; physics sees an off-manifold residual. | Neither single prior is sufficient. The candidacy contribution lives here.                    |

The first three cells are control conditions — the prior structure of one expert is enough to underwrite the trust claim. The bottom-right is the experimental condition. No single expert is qualified, and the operational answer has to come from the joint calibration apparatus: the Q1.1 competence gates below, Q2.1's conformal coverage, and Q4.1's safety shielding. Empirically the bottom-right is rare — the diagonal is where any sensible system already works. That rarity is the point. The diagonal is where the baseline already delivers; the bottom-right is where the contribution has to.

### Per-sample arbitration via competence gates

The diagram tells you which cell a sample is in; the gates are what operationalize that. Every expert carries a competence signal — not just the physics one.

**Physics: three gates, conjunctive.** Writing $\mathcal{M}_\Theta$ for the bicycle-plus-Pacejka model and $r_t$ for the PINN residual:

$$
\lambda_{\text{physics}}(s_t) \;=\; \lambda_{\text{tier}} \cdot \underbrace{\mathbb{1}\!\left[\,\bigl\|\mathcal{M}_\Theta(s_{t-1}) - s_t\bigr\|_2 \le \tau_{\text{model}}\,\right]}_{\mathcal{V}_{\text{regime}}}\;\cdot\; \underbrace{\mathbb{1}\!\left[\,\mathrm{tr}(\Sigma_\eta(t)) \le \tau_{\text{signal}}\,\right]}_{\mathcal{V}_{\text{signal}}}\;\cdot\; \underbrace{\mathbb{1}\!\left[\,p(r_t \mid \text{benign}, s_t) < \tau_{\text{ood}}\,\right]}_{\mathcal{V}_{\text{residual}}}
$$

Any gate failure pulls physics weight to zero. The three gates catch different failures:

- **Regime validity** ($\mathcal{V}_{\text{regime}}$). The bicycle model is only a good approximation inside the linear-tire region — $|\alpha_f|, |\alpha_r| \le 4°$ on dry asphalt. Outside that envelope the residual is model-error-dominated, not attack-dominated [@Chen2024CADD]. Calls made outside that envelope aren't physics calls; they're model extrapolation dressed as physics.
- **Signal reliability** ($\mathcal{V}_{\text{signal}}$, on the cumulative noise covariance from $s_t = h(z_t) + \eta_t$). Tier 1 (DBC) collapses $\Sigma_\eta$ to sensor noise; tier 3 (ByCAN) inflates it by the 80.21% slicing-accuracy bias [@ByCAN] that the Gaussian posterior reading then misrepresents. The gate fires when that inflation makes the confidence number unreliable — not when the signal is noisy, but when the noise model itself is wrong.
- **Residual implausibility** ($\mathcal{V}_{\text{residual}}$). The operational form of Q2.1's epistemic/aleatoric decomposition: the gate fires when the residual is implausible _given the regime_, not just large. A large residual in a hard cornering maneuver is expected; the same residual on a straight highway is not.

**GAT gate.** Post-temperature-scaled softmax $p(y \mid x) > \tau_{\text{gat}}$; below threshold, GAT abstains and weight redistributes. Calibration matters because raw softmax is overconfident by default [@guo2017calibration] — the gate without temperature scaling isn't a competence signal, it's a confidence illusion.

**VGAE gate.** Composite reconstruction error exceeding $\tau_{\text{vgae}}$ flags OOD against benign training. VGAE _gains_ weight when the gate fires — its OOD signal is the attack signal, not a reason to distrust it.

The five thresholds $\{\tau_{\text{model}}, \tau_{\text{signal}}, \tau_{\text{ood}}, \tau_{\text{gat}}, \tau_{\text{vgae}}\}$ are statistical fits to held-out benign data, not engineering constants. They share a maintenance loop with the joint calibration apparatus from Q2.1 — one natural-distribution split, one recalibration cadence. Fitting them separately, which is the default, breaks the coverage claim: a physics gate calibrated on clean data and a VGAE gate calibrated on shifted data can simultaneously fire and suppress each other on the same input.

### Tier mapping as the coarse outer envelope

The gate structure above is sample-by-sample. The tier system is the coarse outer envelope that conditions on signal availability before the gates run.

| Tier      | $\lambda_{\text{tier}}^{(0)}, \lambda_{\max}$ | What's fixed                                          | What gates supply at runtime |
| --------- | --------------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| 1: DBC    | 0.5, 1.0                                      | $\mathcal{V}_{\text{signal}} = 1$ structurally        | regime, residual             |
| 2: OBD-II | 0.3, 0.5                                      | Lower $\mathcal{V}_{\text{signal}}$ ceiling           | regime, residual             |
| 3: ByCAN  | 0.1, 0.3                                      | $\mathcal{V}_{\text{signal}}$ bias-dominated [@ByCAN] | all three                    |
| Failed    | 0, 0                                          | $\mathcal{V}_{\text{signal}} = 0$                     | physics off                  |

Tier 3's hard cap at $\lambda_{\max}=0.3$ is an admission: the Gaussian-posterior reading of $\mathcal{V}_{\text{signal}}$ doesn't apply under bias-dominated noise, so the PINN's role at tier 3 narrows to training-time regularizer on the GAT/VGAE branch, not deployment-time detector. Self-adaptive PINN weighting [@McClenny2023SAPINN] and the NTK analysis [@Wang2022NTK] handle intra-training shrinkage; the gate set handles deployment-time deferral.

### What still needs to be built

The phase diagram and gate structure are specified; the measurement apparatus that makes them defensible is the part still to implement. Concretely:

- The three physics gates exist as design specs, not runtime components — $\mathcal{V}_{\text{regime}}$ and $\mathcal{V}_{\text{residual}}$ are not yet wired into the inference loop.
- The five thresholds are not yet fit jointly on a shared held-out split; they are currently set independently, which breaks the compositional coverage guarantee.
- The bottom-right cell of the phase diagram — where neither expert is qualified — currently routes to the Q4.1 safety shield by default. The conformal abstain rule from Q2.1 needs to be wired in as the intermediate step before shield activation, so the system has a graded response rather than a binary hand-off.

The contribution is making the bottom-right cell operationally defensible — not just having a fallback, but having a calibrated, auditable account of why the fallback fired.

---

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

Q1.1 argued the two priors are orthogonal — physics encodes structure, data-driven encodes frequency, both estimating the same underlying process. The follow-on question is whether the _channels_ those priors read through are equally orthogonal. It turns out they are, and that orthogonality is what makes the system defensible under adversarial pressure — but it also means there's an attack surface with a specific shape, and understanding that shape is how you build the right defenses.

Physics reads its inputs through a four-stage estimation chain: $z_t \xrightarrow{\text{ByCAN}} \tilde{z}_t \xrightarrow{\text{EKF}} \hat{\mathbf{x}}_t \xrightarrow{\text{PINN}} r_t$. Data-driven reads raw bytes directly. That the estimation chain opens an attack surface isn't surprising — it's cybersec 101. The interesting question is what shape that surface has, because the shape determines what defenses are structurally correct.

### The variance equation is a defense-construction recipe

$$
\mathrm{Var}[r_t] \;\approx\; \mathrm{Var}\!\left[\eta^{\text{sensor}}\right] \;+\; B^2_{\text{slice}} \;+\; \mathrm{tr}(Q_{\text{EKF}}) \;+\; \mathrm{Var}\!\left[\epsilon_{\text{model}}\right]
$$

Three of the four terms are introduced _by processing_, not by the underlying signal. Each has a different statistical shape, and that shape determines the form of the gate that defends it — symmetric outlier tests and per-step thresholds are wrong by construction for two of the three.

- **$B^2_{\text{slice}}$ — bias, not noise.** ByCAN's 80.21% slicing accuracy [@ByCAN] propagates as systematic offset, not Gaussian residual. A symmetric outlier test misses bias-shaped attacks because the corrupted value stays inside the noise band — it's just shifted. The correct defense is one-sided: OBD-II ground-truth cross-check [@Pese2019LibreCAN] when available, or versioned template attestation when not.

- **$\mathrm{tr}(Q_{\text{EKF}})$ — time-integrating.** Each corrupted step is sub-threshold; the effect integrates over the filter window. A per-step threshold never fires even as the cumulative drift silently exits the linear-tire regime. The correct defense is temporal: CUSUM on the innovation sequence [@Ozdemir2024IVNSurvey], which accumulates evidence across steps rather than resetting each time.

- **$\mathrm{Var}[\epsilon_{\text{model}}]$ — regime-conditioned.** Model variance is high outside the linear-tire envelope; an attacker who pushes the system there makes the residual model-error-dominated, not attack-dominated. An absolute residual threshold misses this because the threshold was sized to the in-regime case. The correct defense is Q1.1's $\mathcal{V}_{\text{regime}}$ gate — regime-conditioned bounds rather than global ones.

The byte-level GAT/VGAE branch carries none of these terms. It doesn't traverse the estimation chain, so chain corruption doesn't move it. That's the channel-orthogonal defense: an attacker who compromises the chain has to simultaneously compromise a structurally different channel to move the fusion decision, and those two attacks have different signatures.

### The threat taxonomy instantiates the recipe

Each known attack class maps to exactly one of the term-by-term gaps the framework currently has:

- **Slicing-template poisoning** ($B^2_{\text{slice}}$ gap). ByCAN's DBSCAN+DTW template construction is offline and unprotected; an adversary with pre-deployment access can craft payloads crossing signal boundaries to bias extracted $\delta$ or $\dot{\psi}$ in a chosen direction. Defended by OBD-II cross-validation when available; otherwise the template is part of the security boundary and needs versioned attestation.

- **Slow-drift residual attacks** ($\mathrm{tr}(Q_{\text{EKF}})$ gap). Sub-Hz writes shift the steering-angle estimate by sub-threshold amounts per step; cumulative drift over ~10 s silently exits the linear-tire regime, and the PINN residual becomes model-error-dominated. Innovation-sequence CUSUM closes this gap — it is named but not shipped.

- **Plausibility-band injection** ($\mathrm{Var}[\epsilon_{\text{model}}]$ gap). The current fallback clips signals only outside $|\delta|<40°$, $|\dot{\psi}|<1$ rad/s — values inside that band pass to the EKF unflagged. Tightening to regime-conditioned bounds (highway: $|\delta|<4°$) closes the gap. This is a one-line fix, not a research contribution, but it isn't done yet.

- **Graph-aware decoy** [@zugner2018adversarial]. The byte-level branch isn't immune — GAT attention can be fooled by chosen edge perturbations, and adversarial benign-looking IDs can distort ByCAN's template centroids. The defense isn't "bytes are safe"; it's that the two channels' attacks have _different signatures_, so simultaneous compromise requires two structurally different attacks. @Choi's CAN-attack countermeasure survey and the AI-IDS survey [@rajapaksha2022aiidssurvey] note that nearly all CAN-IDS evaluation uses naïvely-injected attacks — random payloads, replay — almost none physics-aware. Adding ByCAN-and-EKF-aware attackers to the evaluation closes that gap.

### What the tier cap is admitting, and what replaces it

The current $\lambda_{\max}=0.3$ cap on tier-3 deployments is a placeholder: "we can't yet tell which of the four variance terms got attacked, so bound the chain's total influence." The proposal is to replace the outer cap with inner gates shaped by the variance equation — one-sided for bias, temporal for drift, regime-conditioned for model error. Until those ship, the tier cap and the byte-level branch are structural defense-in-depth: even with full chain compromise, the data-driven branch is unaffected, and the fusion decision can't be moved more than 30%.

| What's there                                                                             | What's missing                                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| DBC $\succ$ OBD-II $\succ$ ByCAN fallback + static plausibility clip                     | Bands are static, not regime-conditioned                                                                     |
| Self-adaptive $\lambda_{\text{physics}}$ shrinks physics when training gradients diverge | No deployment-time defense against bias-shaped or time-integrating attacks                                   |
| Tier cap on $\lambda_{\text{physics}}$                                                   | No inner gates ($\mathcal{V}_{\text{regime}}$ at runtime, innovation-sequence monitor, template attestation) |
| GAT/VGAE on raw bytes — channel-orthogonal                                               | Fusion policy lacks an estimator-compromise signal — can't up-weight data-driven when the chain is hit       |

Q1 as a unified argument: Q1.1 says the priors are orthogonal and the bottom-right cell is where the joint apparatus has to deliver. Q1.2 says the channels are orthogonal too, and the variance equation is the recipe for the inner gates that make "channel orthogonal" a defensible claim rather than a design hope. Both axes serve the same load-bearing case — when no single expert is qualified, neither axis has collapsed simultaneously. And both axes are what supplies the **independence** condition Q2.2 requires for disagreement-as-information: without orthogonal priors and orthogonal channels, expert disagreement reduces to correlated noise, not diagnostic signal.
