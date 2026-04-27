---
title: "1. Physics and Dynamic Controls"
---

## Question 1.1

> When should a detection system trust its physics-based priors versus defer to purely data-driven components? Discuss how model fidelity, operating conditions, and uncertainty interact in this decision.

### Three conditions for trusting physics, formalised

Trust physics only when *all three* of the following hold; the moment any one fails, the data-driven experts (GAT, VGAE) should dominate.

**1. Regime validity.** The dynamics model must be a faithful description of the current operating regime. Writing $\mathcal{M}_\Theta$ for the bicycle-plus-Pacejka model with parameters $\Theta$ from `paper/candidacy/appendix.md` §PINN Physics, the regime-validity gate is

$$
\mathcal{V}_{\text{regime}}(s_t) \;=\; \mathbb{1}\!\left[\,\bigl\| \mathcal{M}_\Theta(s_{t-1}) - s_t \bigr\|_2 \;\le\; \tau_{\text{model}}\,\right]
$$

evaluated against benign training data alone (i.e., the $\tau_{\text{model}}$ envelope is sized to model error, not to attack residuals). For the CAN dynamics in this framework, the binding regime constraints are: linear-tire-region operation ($|\delta| \le \delta^{\text{lin}}$, $|\alpha_f|, |\alpha_r| \le 4°$ on dry asphalt), small-angle steering, and longitudinal acceleration within powertrain envelope (`paper/candidacy/appendix.md` Eq. for $\dot{v}_x$). Outside that envelope — emergency maneuvers, low-friction surfaces, hard braking — the linear bicycle model diverges from real tire behaviour and the residual is dominated by model error rather than attack signal. @Chen2024CADD's analytical residual approach exhibits exactly this failure mode at high slip; the PINN can learn nonlinear corrections within a wider envelope but does not eliminate the boundary.

**2. Signal reliability.** The state vector $\mathbf{x}_t = (v_x, v_y, \dot{\psi}, \delta, a_x)$ must be observed with bounded uncertainty. Writing the observation pipeline as $s_t = h(z_t) + \eta_t$ with $z_t$ the raw CAN bytes, $h(\cdot)$ the ByCAN-extraction-plus-EKF state estimator, and $\eta_t$ the cumulative observation noise, the signal-reliability gate is

$$
\mathcal{V}_{\text{signal}}(s_t) \;=\; \mathbb{1}\!\left[\,\mathrm{tr}\bigl(\Sigma_{\eta}(t)\bigr) \;\le\; \tau_{\text{signal}}\,\right]
$$

where $\Sigma_\eta(t)$ is the EKF posterior covariance. Tier-1 deployment (DBC available) collapses $\Sigma_\eta$ to sensor noise; tier-2 (OBD-II ground truth) inflates it by the EKF process-noise contribution; tier-3 (ByCAN reverse engineering) inflates it further by the 80.21% slicing-accuracy bias [@ByCAN] from the data-extraction tiers in [](#subsec:PINN). *Crucially, $\Sigma_\eta$ is bias-dominated rather than noise-dominated under tier-3*, so the gate must be one-sided against systematic offset, not symmetric Gaussian.

**3. Residual uncertainty tightness.** The PINN's residual $r_t = \|\mathbf{x}_t - \hat{\mathbf{x}}_t\|_2$ from Eq. {eq}`eq-physics-score` is only an attack signal to the extent that it exceeds the *baseline* residual under benign operation. Calling that baseline distribution $p(r \mid \text{benign}, s)$ — a regime-conditioned distribution — the residual-uncertainty gate is

$$
\mathcal{V}_{\text{residual}}(s_t, r_t) \;=\; \mathbb{1}\!\left[\,p(r_t \mid \text{benign}, s_t) \;<\; \tau_{\text{ood}}\,\right]
$$

This is the operational form of the epistemic/aleatoric decomposition from Q2.1: $p(r \mid \text{benign}, s)$ has high variance in regimes that are poorly covered by the training distribution (epistemic), and the gate triggers an attack flag only when the *current* residual is implausible *given the regime*. The self-adaptive PINN weighting of @McClenny2023SAPINN and the NTK analysis of @Wang2022NTK provide the intra-training mechanism — the physics branch auto-shrinks when its gradient norms diverge from the data branch — but the deployment-time question of *when the residual itself is trustworthy* needs the regime-conditioned baseline above.

**Composite trust score.** Combining these gates with a continuous PINN weight $\lambda_{\text{physics}}(s_t)$:

$$
\lambda_{\text{physics}}(s_t) = \lambda_{\text{tier}} \cdot \mathcal{V}_{\text{regime}}(s_t) \cdot \mathcal{V}_{\text{signal}}(s_t) \cdot \mathcal{V}_{\text{residual}}(s_t, r_t)
$$

This is a deferral rule in the sense of Chow's reject option [@geifman2017selective]: the PINN expert is *rejected* (weight zeroed) on inputs where any one of the three conditions fails, and the fusion policy reweights to GAT and VGAE accordingly. The rejection set is operationally defined and inspectable, which is what the ISO 26262 ASIL C/D safety case from `paper/candidacy/introduction.md` Challenge 3 demands.

### Mapping the deployment tiers onto the trust conditions

The $\lambda_{\text{physics}}$ tier system in [](#subsec:PINN) is a *coarse* approximation of the composite trust score above — it conditions on signal availability only. The full mapping is:

| Tier | $\lambda_{\text{tier}}^{(0)}$ | $\lambda_{\max}$ | What's fixed | What's deferred to gates |
|---|---|---|---|---|
| 1: DBC available | 0.5 | 1.0 | $\mathcal{V}_{\text{signal}} = 1$ structurally | $\mathcal{V}_{\text{regime}}$, $\mathcal{V}_{\text{residual}}$ at runtime |
| 2: OBD-II ground truth | 0.3 | 0.5 | Lower $\mathcal{V}_{\text{signal}}$ ceiling | $\mathcal{V}_{\text{regime}}$, $\mathcal{V}_{\text{residual}}$ at runtime |
| 3: ByCAN extraction | 0.1 | 0.3 | $\mathcal{V}_{\text{signal}}$ degraded by 80.21% slicing accuracy [@ByCAN] | All three gates at runtime |
| Failed extraction | 0 (frozen) | 0 | $\mathcal{V}_{\text{signal}} = 0$ | None — physics branch disabled |

Tiers fix the *outer* envelope; the three gates fix the *inner*, sample-by-sample weighting. **Two important caveats follow from this mapping**: (i) at tier 3, $\Sigma_\eta$ is bias-dominated rather than noise-dominated, so the Gaussian-posterior interpretation underlying $\mathcal{V}_{\text{signal}}$ does not strictly apply — under tier 3 the PINN's role narrows from *deployment-time detector* to *training-time regulariser* on the GAT/VGAE branch, with $\lambda_{\max}=0.3$ as a hard cap rather than a learned weight; (ii) the current proposal stops at the outer envelope because the inner gates require regime-stratified evaluation that has not been run (deliverable: regime-stratified F1 in [](#subsec:PINN)). The PINN's load-bearing detector contribution therefore lives at tiers 1 and 2 (DBC or OBD-II ground truth); tier 3 is graceful-degradation engineering.

### How the framework operationalises deferral

| Mechanism | Role | Where |
|---|---|---|
| Tiered $\lambda_{\text{physics}}^{(0)}, \lambda_{\max}$ | Outer envelope; sets $\mathcal{V}_{\text{signal}}$ ceiling per deployment | [](#subsec:PINN) |
| Self-adaptive $\lambda$ via @McClenny2023SAPINN | Intra-training stabilisation; physics branch shrinks when gradient norms diverge | [](#subsec:PINN) (Adaptive $\lambda_{\text{physics}}$) |
| NTK analysis [@Wang2022NTK] | Theoretical justification for self-adaptive weighting | Same |
| GradNorm/PCGrad-style multi-objective balancing [@Bischof2024MultiObj] | Outperforms grid-searched static weights | Same |
| DQN/bandit fusion policy | Implicit regime-dependent deferral; up-weights GAT for confident predictions, defers to VGAE near decision boundary; PINN slots in as a third expert under simplex generalisation (Q4.2) | `paper/content/explainability.md` §DQN-Fusion Analysis, [](#fig-fusion); [](#subsec:DQN) |
| Selective-prediction risk-coverage curves | The natural evaluation protocol for the composite score $\lambda_{\text{physics}}(s_t)$ | Q2.1 |

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

### The compounding-uncertainty chain

Estimated states pass through four stages before reaching the PINN's residual loss, and each stage adds uncertainty *and* an attack surface. Writing the chain from raw bus to detection score:

$$
z_t \;\xrightarrow{\;\text{ByCAN slicing}\;}\; \tilde{z}_t \;\xrightarrow{\;\text{EKF estimation}\;}\; \hat{\mathbf{x}}_t \;\xrightarrow{\;\text{PINN}\;}\; r_t \;\xrightarrow{\;\text{score}\;}\; \text{Physics\_Score}_t
$$

The variance of the final score under benign operation factors approximately as

$$
\mathrm{Var}\!\left[r_t\right] \;\approx\; \underbrace{\mathrm{Var}\!\left[\eta^{\text{sensor}}\right]}_{\text{ECU sensor noise}} \;+\; \underbrace{B^2_{\text{slice}}}_{\text{ByCAN slicing bias}} \;+\; \underbrace{\mathrm{tr}(Q_{\text{EKF}})}_{\text{process noise}} \;+\; \underbrace{\mathrm{Var}\!\left[\epsilon_{\text{model}}\right]}_{\text{PINN model error}}
$$

The middle two terms are absent from the GAT and VGAE inputs entirely (`paper/content/methodology.md` §Graph Construction operates on byte-level features directly), which is why the data-driven branch is *more* robust to estimation pipeline issues but *less* sensitive to physics violations. The trade-off — and why this is a security boundary, not a preprocessing step — is that each new stage adds an attack surface that the byte-level GAT/VGAE pipeline does not expose. ByCAN's 80.21% slicing accuracy [@ByCAN] is a *bias* term ($B^2_{\text{slice}}$, not a noise term), so the inflation propagates as a systematic offset rather than a Gaussian residual; this is the operationally important asymmetry.

### Threat-model taxonomy

Three independent axes describe the adversary: *access location* (where on the chain they inject), *capability* (read, write, replace), and *signature* (what they need to leave undetectable). The cross-product is:

| Stage | Attacker access | Capability | Defence already in framework | Gap |
|---|---|---|---|---|
| Bus-injection (raw CAN) | Wired/wireless ECU compromise [@Miller; @Cho]; the canonical Jeep-hack threat model | Inject arbitrary frames at native bus rate | OOV-robust embedding (`paper/content/methodology.md` §Handling OOV IDs); GAT graph anomaly score; VGAE composite reconstruction | None for byte-level; no analysis of how injected frames propagate through ByCAN slicing |
| ByCAN slicing template | Pre-deployment poisoning of the DBSCAN + DTW templates | Replace template with crafted payload schema that crosses signal boundaries | Cross-validation via @Pese2019LibreCAN if OBD-II ground truth is available; plausibility clipping ($\|\delta\|<40°$, $\|\dot{\psi}\|<1$ rad/s) | The plausibility band is a wide *open* interval — values inside the band produce no clipping flag, so attacks are unconstrained within $\pm 40°$ |
| EKF state estimation | On-line frame injection that biases the innovation sequence | Slow-drift attacks that stay below the per-step innovation threshold but integrate over time | None — EKF is treated as black-box preprocessing | Innovation-sequence monitoring as a meta-detector is a known idea but not implemented |
| PINN residual | Any of the above propagate here | Inject *physically plausible* states that match the bicycle-model dynamics, defeating $\mathcal{V}_{\text{residual}}$ from Q1.1 | Self-adaptive $\lambda_{\text{physics}}$ [@McClenny2023SAPINN] dampens reliance when residual gradients diverge | No adversarial-training pass against physics-aware attacks |

@Choi's CAN-attack countermeasure survey and the AI-IDS survey [@rajapaksha2022aiidssurvey] both observe that virtually all CAN-IDS evaluation uses *naïvely-injected* attacks (random payloads, replay) and almost none use *physics-aware* attacks. Adding ByCAN-and-EKF-aware attackers to that taxonomy is a natural research contribution and aligns with the proposed adversarial robustness work in [](#subsec:Adversarial).

### How adversaries exploit specific stages

**Plausibility-band injection.** The fallback hierarchy in [](#subsec:PINN) discards extracted signals only if they fall *outside* the physical range ($|\delta| < 40°$, $|\dot{\psi}| < 1$ rad/s). Attacks that inject values inside the band produce no clipping flag and pass straight to the EKF. Defence: tighten the band per regime (e.g., $|\delta| < 4°$ on highway driving, derived from the same regime-validity gate $\mathcal{V}_{\text{regime}}$ from Q1.1) rather than the static bound.

**Slow-drift residual attacks.** An attacker who can write to the bus at sub-Hz rates can shift the steering-angle estimate by a small amount per step. Each step's EKF innovation stays below the per-step threshold; the cumulative shift over $\sim 10$ s exits the linear-tire region (Q1.1 condition 1) and silently breaks $\mathcal{V}_{\text{regime}}$ — at which point the PINN residual is dominated by model error and the attack is invisible to the residual gate. Defence: monitor the EKF innovation *sequence* (not just per-step) via a CUSUM or sliding-window mean test. This is the classical observer-fault-detection trick from @Ozdemir2024IVNSurvey applied to the estimator's internal state rather than the raw signal.

**Slicing-template poisoning.** ByCAN's DBSCAN + DTW template construction is offline and unprotected — an adversary with pre-deployment access (e.g., a poisoned dataset used for calibration) can craft payloads that cross signal boundaries in a way that biases the extracted $\delta$ or $\dot{\psi}$ in a chosen direction. Defence: cross-validation against OBD-II ground truth [@Pese2019LibreCAN] when available; otherwise, treat the slicing template as part of the security boundary and version-control it under attestation. The framework currently does not.

**Graph-aware decoy attacks.** @zugner2018adversarial demonstrates that GAT attention can be fooled by carefully chosen edge perturbations; the analogous attack on the estimation pipeline is an attacker who injects *additional* benign-looking frames with arbitration IDs that ByCAN groups with the steering-angle signal, biasing the slicing template's centroid. The current OOV-robust embedding handles novel attack IDs; it does not handle adversarial *benign-looking* IDs that distort the estimator's preprocessing.

### Defensive posture summary

| What's there | What's missing |
|---|---|
| DBC $\succ$ OBD-II $\succ$ ByCAN fallback hierarchy with plausibility clipping | The plausibility band is static rather than regime-conditioned |
| Self-adaptive $\lambda_{\text{physics}}$ shrinks the physics term when training gradients diverge | No deployment-time defence against physics-aware injection |
| Tier-based outer envelope on $\lambda_{\text{physics}}$ | No inner gates (regime, signal, residual) implemented (Q1.1) |
| GAT+VGAE branch operates on raw bytes and is unaffected by estimator compromise | The fusion policy has no signal that the estimator is compromised, so it cannot up-weight the data-driven branch in response |
| Adversarial robustness flagged as a research direction ([](#subsec:Adversarial)) | No attacker model, no red-team protocol, no certified bounds |

The framework's GAT+VGAE branch is structurally protected from estimator-pipeline compromise because it doesn't depend on the estimator at all. The PINN branch is *not* protected, but the tier-based weighting limits the blast radius — a tier-3 deployment (ByCAN extraction) caps PINN contribution at $\lambda_{\max} = 0.3$, so even total estimator compromise cannot drive the fusion decision more than 30%. This is a structural-defence-in-depth argument rather than a cryptographic one and should be made explicit in the threat-model section.
