---
title: "1. Physics and Dynamic Controls"
---

## Question 1.1

> When should a detection system trust its physics-based priors versus defer to purely data-driven components? Discuss how model fidelity, operating conditions, and uncertainty interact in this decision.

**Thesis.** Trust physics when three conditions co-hold: (i) the dynamics model is *valid for the current regime*, (ii) the *state signals feeding it are reliable*, and (iii) the *residual uncertainty is tight enough* to distinguish attack-induced violations from modelling error. The moment any one fails, defer to the data-driven experts.

**Anchors in the current framework.**

- The proposed tiered $\lambda_{\text{physics}}$ schedule in [](#subsec:PINN) (`paper/candidacy/proposed-research.md` §PINN Graceful Degradation) formalises exactly this: full dynamics $\Rightarrow \lambda_{\text{physics}}^{(0)}=0.5$ with $\lambda_{\max}=1.0$; partial $\Rightarrow 0.1$ with cap $0.3$; none $\Rightarrow 0$ (non-learnable).
- Adaptive self-weighting via @McClenny2023SAPINN and @Wang2022NTK handles intra-regime uncertainty — the physics branch auto-shrinks when its gradient norms diverge from the data branch.
- The prior art for regime-dependent deferral already exists in the current ensemble: the DQN/bandit learns to up-weight GAT when its probability is confident and defer to VGAE near the decision boundary ([](#fig-fusion), `paper/content/explainability.md` §DQN-Fusion Analysis). PINN would plug into the same mechanism as a third expert ([](#subsec:DQN)).

**Open questions.**

- Regime classification is currently implicit (learned by the fusion head). No explicit regime detector (e.g., slip-angle threshold, Pacejka linear-region check) is built.
- No empirical regime-stratified evaluation exists. Gap: F1 vs. slip angle / longitudinal acceleration bucket, showing PINN weight collapse under high-slip maneuvers.
- Classical deferral theory (Chow's reject option, selective prediction via @geifman2017selective) is not yet cited or implemented; this is the natural theoretical foundation for "when to trust."

## Question 1.2

> How does reliance on estimated rather than directly measured states affect the reliability of a detection pipeline, and how might an adversary exploit this dependency?

**Thesis.** Estimation compounds uncertainty (sensor noise → extraction error → EKF process noise → PINN residual) and introduces a new attack surface *upstream* of the detector. A defender must treat state estimation as a first-class security boundary, not a preprocessing step.

**Anchors in the current framework.**

- The DBC $\succ$ OBD-II $\succ$ ByCAN fallback hierarchy is already specified in [](#subsec:PINN) (`paper/candidacy/proposed-research.md`, §Data Extraction fallback dropdown), including plausibility clipping ($|\delta|<40°$, $|\dot{\psi}|<1$ rad/s) and cross-validation via @Pese2019LibreCAN.
- ByCAN's 80.21% slicing accuracy [@ByCAN] is flagged as a *signal-boundary* metric — errors bias rather than randomize the PINN inputs (same proposed-research.md dropdown).
- The current GAT+VGAE framework is *not* exposed to this surface: it operates on arbitration-ID graphs and raw byte features directly from CAN, with no state estimator in the loop (`paper/content/methodology.md` §Graph Construction).

**Open questions.**

- No explicit threat model is written. Required: attacker-access taxonomy (bus-injection, OBD-II spoofing, OEM-internal CAN replay) and a mapping of each to the estimator components they can corrupt.
- Adversary-exploit hypotheses to evaluate:
  - Poisoning the byte-slice template (ByCAN's DBSCAN + DTW can be misled by a crafted payload schema that crosses signal boundaries).
  - Plausibility-band injection — attack values inside the $|\delta|<40°$ range produce no clipping flag.
  - Residual-slow-drift attacks that stay below the EKF innovation threshold per step but accumulate.
- @zugner2018adversarial covers graph adversarial attacks on GAT, but we have no analogous analysis for the estimation pipeline.
- Meta-detection (use the EKF innovation sequence itself as a detector feature) is a promising but unimplemented direction.
