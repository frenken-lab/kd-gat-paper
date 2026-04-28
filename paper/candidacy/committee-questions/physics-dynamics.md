---
title: "1. Physics and Dynamic Controls"
---

## Question 1.1

> When should a detection system trust its physics-based priors versus defer to purely data-driven components? Discuss how model fidelity, operating conditions, and uncertainty interact in this decision.

Trusting a physics prior at deployment time is a conjunction, not a scalar: regime, signal, and residual fail independently and for different reasons.

### Three conditions for trusting physics

Trust physics only when *all three* of the following hold; the moment any one fails, the data-driven experts (GAT, VGAE) should dominate.

**1. Regime validity.** The dynamics model must faithfully describe the current operating regime. Writing $\mathcal{M}_\Theta$ for the bicycle-plus-Pacejka model from [](#app:pinn-physics), the gate is

$$
\mathcal{V}_{\text{regime}}(s_t) \;=\; \mathbb{1}\!\left[\,\bigl\| \mathcal{M}_\Theta(s_{t-1}) - s_t \bigr\|_2 \;\le\; \tau_{\text{model}}\,\right]
$$

with the $\tau_{\text{model}}$ envelope sized to model error on benign training data, not attack residuals. Binding regime constraints: linear-tire-region operation ($|\delta| \le \delta^{\text{lin}}$, $|\alpha_f|, |\alpha_r| \le 4°$ on dry asphalt), small-angle steering, longitudinal acceleration inside the powertrain envelope ([](#app:pinn-physics)). Outside that envelope — emergency maneuvers, low-friction surfaces, hard braking — the linear model diverges from real tire behaviour and the residual is model-error-dominated rather than attack-signal-dominated. @Chen2024CADD's analytical residual approach exhibits this failure at high slip; the PINN learns nonlinear corrections within a wider envelope but does not eliminate the boundary.

**2. Signal reliability.** The state vector $\mathbf{x}_t = (v_x, v_y, \dot{\psi}, \delta, a_x)$ must be observed with bounded uncertainty. With observation pipeline $s_t = h(z_t) + \eta_t$ — $z_t$ raw CAN bytes, $h(\cdot)$ ByCAN-extraction + EKF, $\eta_t$ cumulative noise — the gate is

$$
\mathcal{V}_{\text{signal}}(s_t) \;=\; \mathbb{1}\!\left[\,\mathrm{tr}\bigl(\Sigma_{\eta}(t)\bigr) \;\le\; \tau_{\text{signal}}\,\right]
$$

where $\Sigma_\eta(t)$ is the EKF posterior covariance. Tier-1 (DBC) collapses $\Sigma_\eta$ to sensor noise; tier-2 (OBD-II ground truth) inflates it by EKF process noise; tier-3 (ByCAN) inflates it further by the 80.21% slicing-accuracy bias [@ByCAN] (data-extraction tiers in [](#subsec:PINN)). Under tier-3, $\Sigma_\eta$ is bias-dominated, so the gate must be one-sided against systematic offset, not symmetric Gaussian.

**3. Residual uncertainty tightness.** The PINN's residual $r_t = \|\mathbf{x}_t - \hat{\mathbf{x}}_t\|_2$ from Eq. {eq}`eq-physics-score` is an attack signal only to the extent that it exceeds the baseline under benign operation. With regime-conditioned baseline $p(r \mid \text{benign}, s)$, the gate is

$$
\mathcal{V}_{\text{residual}}(s_t, r_t) \;=\; \mathbb{1}\!\left[\,p(r_t \mid \text{benign}, s_t) \;<\; \tau_{\text{ood}}\,\right]
$$

This is the operational form of the epistemic/aleatoric decomposition from Q2.1: $p(r \mid \text{benign}, s)$ has high variance in regimes poorly covered by training (epistemic), and the gate fires only when the *current* residual is implausible *given the regime*. Self-adaptive PINN weighting [@McClenny2023SAPINN] and the NTK analysis [@Wang2022NTK] handle this *intra-training* — the physics branch shrinks when its gradient norms diverge from the data branch — but the deployment-time question of *when the residual itself is trustworthy* needs the regime-conditioned baseline above.

**Composite trust score.** Combining the gates into a continuous PINN weight $\lambda_{\text{physics}}(s_t)$:

$$
\lambda_{\text{physics}}(s_t) = \lambda_{\text{tier}} \cdot \mathcal{V}_{\text{regime}}(s_t) \cdot \mathcal{V}_{\text{signal}}(s_t) \cdot \mathcal{V}_{\text{residual}}(s_t, r_t)
$$

This is a deferral rule in the sense of Chow's reject option [@geifman2017selective]: the PINN expert is *rejected* (weight zeroed) when any one of the three conditions fails, and the fusion policy reweights to GAT and VGAE. The rejection set is operationally defined and inspectable — what the ISO 26262 ASIL C/D safety case from Challenge 3 demands.

The thresholds $\tau_{\text{model}}$, $\tau_{\text{signal}}$, $\tau_{\text{ood}}$ are themselves calibration parameters — statistical fits to the training-residual distribution — not engineering constants. Their joint calibration with classifier outputs is treated in Q2.1; the curriculum-induced drift that propagates through them is in Q3.3.

### Mapping the deployment tiers onto the trust conditions

The $\lambda_{\text{physics}}$ tier system in [](#subsec:PINN) is a *coarse* approximation of the composite trust score above — it conditions on signal availability only. The full mapping:

| Tier | $\lambda_{\text{tier}}^{(0)}$ | $\lambda_{\max}$ | What's fixed | What's deferred to gates |
|---|---|---|---|---|
| 1: DBC available | 0.5 | 1.0 | $\mathcal{V}_{\text{signal}} = 1$ structurally | $\mathcal{V}_{\text{regime}}$, $\mathcal{V}_{\text{residual}}$ at runtime |
| 2: OBD-II ground truth | 0.3 | 0.5 | Lower $\mathcal{V}_{\text{signal}}$ ceiling | $\mathcal{V}_{\text{regime}}$, $\mathcal{V}_{\text{residual}}$ at runtime |
| 3: ByCAN extraction | 0.1 | 0.3 | $\mathcal{V}_{\text{signal}}$ degraded by 80.21% slicing accuracy [@ByCAN] | All three gates at runtime |
| Failed extraction | 0 (frozen) | 0 | $\mathcal{V}_{\text{signal}} = 0$ | None — physics branch disabled |

Tiers fix the *outer* envelope; the three gates fix the *inner*, sample-by-sample weighting. **Two caveats**: (i) at tier 3, $\Sigma_\eta$ is bias-dominated, so the Gaussian-posterior interpretation behind $\mathcal{V}_{\text{signal}}$ does not strictly apply — the PINN's role narrows from *deployment-time detector* to *training-time regulariser* on the GAT/VGAE branch, with $\lambda_{\max}=0.3$ as a hard cap; (ii) the proposal stops at the outer envelope because the inner gates require regime-stratified evaluation against benign training data. The PINN's load-bearing detector contribution lives at tiers 1 and 2; tier 3 is graceful-degradation engineering.

### Existing deferral mechanisms

| Mechanism | Role | Where |
|---|---|---|
| Tiered $\lambda_{\text{physics}}^{(0)}, \lambda_{\max}$ | Outer envelope; sets $\mathcal{V}_{\text{signal}}$ ceiling | [](#subsec:PINN) |
| Self-adaptive $\lambda$ via @McClenny2023SAPINN | Intra-training; physics branch shrinks when gradient norms diverge | [](#subsec:PINN) (Adaptive $\lambda_{\text{physics}}$) |
| NTK analysis [@Wang2022NTK] | Justifies self-adaptive weighting | Same |
| GradNorm/PCGrad-style multi-objective balancing [@Bischof2024MultiObj] | Outperforms grid-searched static weights | Same |
| DQN/bandit fusion policy | Regime-dependent deferral; confident-GAT up-weighting, VGAE near boundary; PINN as third expert under Q4.2 simplex | §DQN-Fusion Analysis; [](#fig-fusion); [](#subsec:DQN) |
| Selective-prediction risk-coverage curves | Evaluation protocol for $\lambda_{\text{physics}}(s_t)$ | Q2.1 |

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

Estimated states are not measurements — they're a chain of inference, and every link is both an uncertainty source and an attack surface.

### The compounding-uncertainty chain

Estimated states pass through four stages before reaching the PINN's residual loss, each adding uncertainty *and* an attack surface. The chain:

$$
z_t \;\xrightarrow{\;\text{ByCAN slicing}\;}\; \tilde{z}_t \;\xrightarrow{\;\text{EKF estimation}\;}\; \hat{\mathbf{x}}_t \;\xrightarrow{\;\text{PINN}\;}\; r_t \;\xrightarrow{\;\text{score}\;}\; \text{Physics\_Score}_t
$$

Variance under benign operation factors approximately as

$$
\mathrm{Var}\!\left[r_t\right] \;\approx\; \underbrace{\mathrm{Var}\!\left[\eta^{\text{sensor}}\right]}_{\text{ECU sensor noise}} \;+\; \underbrace{B^2_{\text{slice}}}_{\text{ByCAN slicing bias}} \;+\; \underbrace{\mathrm{tr}(Q_{\text{EKF}})}_{\text{process noise}} \;+\; \underbrace{\mathrm{Var}\!\left[\epsilon_{\text{model}}\right]}_{\text{PINN model error}}
$$

The middle two terms are absent from the GAT/VGAE inputs (§Graph Construction operates on byte-level features), so the data-driven branch is *more* robust to estimation-pipeline issues but *less* sensitive to physics violations. The PINN reads the chain; the GAT and VGAE read the raw bytes — the two branches share no inputs by construction. The trade-off — and why this is a security boundary, not a preprocessing step — is that each new stage adds an attack surface that the byte-level GAT/VGAE pipeline does not expose. ByCAN's 80.21% slicing accuracy [@ByCAN] is a *bias* term ($B^2_{\text{slice}}$, not noise), so the inflation propagates as systematic offset rather than Gaussian residual — the operationally important asymmetry.

### Threat-model taxonomy

Three axes: *access location* (where on the chain), *capability* (read, write, replace), and *signature* (what must stay undetectable). Cross-product:

| Stage | Attacker access | Capability | Defence already in framework | Gap |
|---|---|---|---|---|
| Bus-injection (raw CAN) | Wired/wireless ECU compromise [@Miller; @Cho] | Arbitrary frames at bus rate | OOV-robust embedding (§Handling OOV IDs); GAT/VGAE anomaly + reconstruction | Byte-level fine; no frame-propagation analysis through ByCAN |
| ByCAN slicing template | Pre-deployment poisoning of DBSCAN + DTW templates | Crafted payload schema crossing signal boundaries | Cross-validation via @Pese2019LibreCAN if OBD-II ground truth available; plausibility clipping ($\|\delta\|<40°$, $\|\dot{\psi}\|<1$ rad/s) | Wide open band — attacks within $\pm 40°$ produce no clip flag |
| EKF state estimation | On-line injection biasing innovation sequence | Slow-drift below per-step threshold, integrating over time | None; EKF black-boxed | Innovation-sequence monitoring — known idea, not implemented |
| PINN residual | Propagated from above | *Physically plausible* states matching bicycle dynamics, defeating $\mathcal{V}_{\text{residual}}$ (Q1.1) | Self-adaptive $\lambda_{\text{physics}}$ [@McClenny2023SAPINN] when residual gradients diverge | No adversarial-training pass against physics-aware attacks |

@Choi's CAN-attack countermeasure survey and the AI-IDS survey [@rajapaksha2022aiidssurvey] note that nearly all CAN-IDS evaluation uses *naïvely-injected* attacks (random payloads, replay), almost none *physics-aware*. Adding ByCAN-and-EKF-aware attackers to the taxonomy fills the gap.

### How adversaries exploit specific stages

**Plausibility-band injection.** The fallback hierarchy in [](#subsec:PINN) discards extracted signals only when they fall *outside* the physical range ($|\delta| < 40°$, $|\dot{\psi}| < 1$ rad/s). Values inside the band produce no clipping flag and pass to the EKF. Defence: tighten per-regime ($|\delta| < 4°$ on highway, derived from $\mathcal{V}_{\text{regime}}$ in Q1.1), not the static bound.

**Slow-drift residual attacks.** Sub-Hz writes shift the steering-angle estimate by a small amount per step. Each step's EKF innovation stays below threshold; the cumulative shift over $\sim 10$ s exits the linear-tire region (Q1.1 condition 1) and silently breaks $\mathcal{V}_{\text{regime}}$ — the PINN residual is now model-error-dominated and the attack is invisible to the residual gate. Defence: monitor the EKF innovation *sequence* via CUSUM or sliding-window mean. The classical observer-fault-detection trick [@Ozdemir2024IVNSurvey] applied to the estimator's internal state, not the raw signal. The general pattern: per-step thresholds miss per-window drift, and defence requires a detector whose natural time scale matches the attack's.

**Slicing-template poisoning.** ByCAN's DBSCAN + DTW template construction is offline and unprotected. An adversary with pre-deployment access (poisoned calibration dataset) can craft payloads crossing signal boundaries to bias extracted $\delta$ or $\dot{\psi}$ in a chosen direction. Defence: cross-validate against OBD-II ground truth [@Pese2019LibreCAN] when available; otherwise treat the template as part of the security boundary and version-control under attestation.

**Graph-aware decoy attacks.** @zugner2018adversarial shows GAT attention can be fooled by chosen edge perturbations; the analogous estimation-pipeline attack injects *benign-looking* frames whose arbitration IDs ByCAN groups with the steering-angle signal, biasing the template centroid. OOV-robust embedding handles novel attack IDs; it does not handle adversarial *benign-looking* IDs that distort the estimator's preprocessing.

### Defensive posture summary

| What's there | What's missing |
|---|---|
| DBC $\succ$ OBD-II $\succ$ ByCAN fallback hierarchy with plausibility clipping | Band is static, not regime-conditioned |
| Self-adaptive $\lambda_{\text{physics}}$ shrinks physics term when training gradients diverge | No deployment-time defence against physics-aware injection |
| Tier-based outer envelope on $\lambda_{\text{physics}}$ | No inner gates (regime, signal, residual) implemented (Q1.1) |
| GAT+VGAE branch on raw bytes, unaffected by estimator compromise | Fusion policy has no estimator-compromise signal — cannot up-weight the data-driven branch |
| Adversarial robustness flagged as research direction ([](#subsec:Adversarial)) | No attacker model, red-team protocol, or certified bounds |

The GAT+VGAE branch is structurally protected from estimator-pipeline compromise: it doesn't depend on the estimator. The PINN branch is *not* protected, but the tier-based weighting limits the blast radius — a tier-3 deployment (ByCAN extraction) caps PINN contribution at $\lambda_{\max} = 0.3$, so even total estimator compromise cannot drive the fusion decision more than 30%. This is a structural-defence-in-depth argument rather than a cryptographic one.
