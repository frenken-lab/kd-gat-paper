---
title: "2. Model Interpretability and Calibration"
---

## Question 2.1

> What does it mean for a model to "know what it doesn't know"? Discuss how confidence calibration should be evaluated and maintained in safety-critical, class-imbalanced settings.

### What "know what it doesn't know" means

A model "knows what it doesn't know" when its probabilistic output separates two qualitatively different kinds of uncertainty and communicates each honestly to downstream consumers. The canonical decomposition, formalised in the Bayesian deep-learning literature [@kendall2017uncertainties], is:

- **Aleatoric uncertainty** is irreducible noise inherent in the data — two CAN windows with identical byte profiles but different attack labels (class overlap near the decision boundary). No amount of additional data can collapse this. The correct behaviour is a softmax probability near 0.5 for binary classification, which a well-calibrated classifier produces automatically.
- **Epistemic uncertainty** is reducible ignorance about model parameters, arising from finite training data or from inputs that fall outside the training distribution (OOD samples). A model that has never seen a masquerade attack should output a low *confidence*, not a confident wrong prediction. Out-of-distribution detection is the operational form of this requirement [@OODSurvey; @OODDetection].

For a CAN IDS these map cleanly onto attack-type coverage: aleatoric uncertainty flags ambiguous benign/attack boundary cases; epistemic uncertainty flags attacks we have not seen during training — exactly the "specialist weakness" failure mode that motivates the ensemble ([](#fig-framework), [@OODFailures]).

A model that *fails* to know what it doesn't know tends to produce high-confidence wrong predictions on OOD inputs. @guo2017calibration documents this as a systemic property of modern deep networks: they are *overconfident*, their maximum-softmax probability systematically exceeds their empirical accuracy, and the gap widens with model depth and capacity. @ovadia2019trust extend this to distribution shift: every post-hoc calibration method they tested (temperature scaling, ensembles, Bayesian methods) degrades under shift, but the *ranking* is preserved — deep ensembles and MC-dropout degrade most gracefully, isotonic regression degrades worst. Both results directly motivate the ensemble design used here.

### Evaluation under class imbalance

Safety-critical automotive IDS inherits all these calibration failure modes and adds two that standard calibration practice ignores:

**Aggregate ECE is misleading under 927:1 imbalance.** Expected Calibration Error [@guo2017calibration] is an average over bins of the gap between predicted confidence and empirical accuracy. When 99.89% of samples are benign, the benign bin dominates the average and a model that is accurate on benign and *miscalibrated on the minority class* can still report near-zero aggregate ECE. The minority class is exactly where miscalibration hurts — a missed attack is a safety event. The fix is **class-conditional ECE** (compute ECE per class and report separately, or compute *adaptive* ECE with equal-mass bins) and reporting **reliability diagrams stratified by class**. The motivation for this is already implicit in the abstract's framing of imbalance as driving "poorly calibrated predictions" (`paper/content/introduction.md:15`) but the measurement is not yet there.

**Aggregate metrics hide selective-prediction failure.** In a safety-critical system the right operating question is *not* "what is the accuracy at 100% coverage?" but "what is the accuracy when we only act on the top-$k\%$ most confident predictions, and how does that curve look in the tails?" This is the risk-coverage framing of @geifman2017selective. A well-calibrated model's risk-coverage curve should be monotone decreasing with coverage; if it is non-monotone, the confidence signal is unreliable precisely where the operator most needs it (the tail of high-uncertainty samples deferred for human review or ECU shutdown).

**Conformal prediction for coverage guarantees.** Neither ECE nor selective prediction gives a hard guarantee; both are averaged over a held-out distribution. For ISO 26262 ASIL C/D-equivalent claims, a *distribution-free* coverage guarantee is preferable. Conformal prediction [@angelopoulos2023conformal] provides exactly this: given a calibration set and a user-chosen miscoverage rate $\alpha$, the method produces prediction sets whose marginal coverage is $\geq 1-\alpha$ by construction, with no modelling assumptions. Under imbalance, *Mondrian* conformal prediction conditions on class to produce class-conditional coverage guarantees — directly addressing the aggregate-ECE failure above.

A pragmatic evaluation protocol for this framework:

1. Temperature-scale the fused ensemble output on a held-out calibration split.
2. Report class-conditional ECE, class-conditional Brier score, and per-class reliability diagrams.
3. Plot risk-coverage curves with 95% bootstrap bands over seeds (consistent with the ablation protocol of `paper/content/ablation.md` §Seed Variance).
4. Fit a Mondrian conformal predictor per-class on the calibration split and report the *coverage gap* (empirical $-$ nominal) on held-out test data, with per-class breakdown.

### Maintenance under operational drift

"Maintenance" implies the calibration guarantee must hold *after* deployment, which raises three operational challenges:

- **Drift detection.** Predicted-confidence histograms and VGAE reconstruction-error distributions (`paper/content/explainability.md` §Composite VGAE Reconstruction Error) can be monitored online with a population stability index or Kolmogorov–Smirnov statistic. Drift past threshold triggers re-calibration.
- **Re-calibration without labels.** Label-free approaches — @ovadia2019trust's deep ensembles and MC-dropout — provide the most degradation-resistant uncertainty under shift. The current framework's ensemble is *de facto* a small deep ensemble; its disagreement rate between GAT and VGAE is a usable drift signal already available in the 15-dim fusion state (`paper/content/methodology.md:126`).
- **Conformal recalibration.** Online conformal prediction can maintain coverage guarantees under streaming non-stationary data with bounded additional memory; this is a natural pairing with the streaming-detection direction of `paper/candidacy/proposed-research.md` §Online and Streaming Detection.

### How the current framework addresses "know what it doesn't know"

The framework contains the structural pieces for epistemic-uncertainty awareness, but does not yet measure or expose them formally:

| Mechanism | Role | Where |
|---|---|---|
| VGAE reconstruction error (composite: node + neighbour + CAN-ID) | OOD/epistemic score for unknown-attack generalisation | `paper/content/explainability.md:21`, [](#fig-reconstruction) |
| GAT softmax probability | Aleatoric (boundary) confidence; overconfident by default [@guo2017calibration] | `paper/content/methodology.md:128` |
| 15-dim fusion state (VGAE/GAT confidences, latent statistics) | Inputs already available to an uncertainty head | `paper/content/methodology.md:126` |
| Neural-LinUCB UCB bonus | Directed exploration under epistemic uncertainty; bonus shrinks as $O(1/\sqrt{n_a})$ [@xu2022neural] | `paper/content/methodology.md:173` |
| DQN fusion weight distribution (peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$) | Emergent attack-type-specific strategies; interpretable but unlabelled by uncertainty | `paper/content/explainability.md:42` |

Three pieces are missing and correspond to the open questions below: formal calibration measurement, selective-prediction evaluation, and conformal coverage guarantees.

### Open questions

- **No calibration experiment yet exists.** Closing this gap is cheap (post-hoc evaluation on existing checkpoints) and unlocks strong answers to Q1.1 (when to trust physics), Q3.3 (curriculum-induced miscalibration), and Q4.1 (UCB drift detection).
- **Epistemic vs. aleatoric decomposition is implicit.** The fusion head currently blends the two. A principled answer would output both a predicted label and a VGAE-based epistemic score, with a joint threshold; this is consistent with the proposed PINN residual as a *third* orthogonal epistemic signal ([](#subsec:PINN)).
- **Class-conditional conformal prediction under 927:1 imbalance is unstudied in CAN IDS.** The calibration set must contain enough minority-class examples; this interacts with the curriculum design (Q3.3) and is a concrete experimental contribution.
- **Online recalibration** to handle operational drift is proposed in `paper/candidacy/proposed-research.md` §Online and Streaming Detection but not yet integrated with a calibration objective.

## Question 2.2

> When multiple explainability methods produce different explanations for the same prediction, how should a practitioner determine which explanation to trust and for whom?

**Thesis.** There is no universally correct explanation. Trustworthiness depends on three independent criteria — *faithfulness* (does the explanation track what the model actually uses?), *stability* (does it persist under small input perturbations?), and *audience fit* (does the abstraction level match the consumer's decision?). Triangulate across explainers rather than picking one; disagreement between explainers is informative, not noise.

**Anchors in the current framework.**

- Multiple inspection layers already exist and can serve as a natural triangulation set: GAT attention weights (`paper/content/explainability.md` §GAT Attention, [](#fig-attention)), UMAP embedding clusters (§UMAP, [](#fig-umap)), VGAE composite reconstruction error (§Composite VGAE), DQN fusion-weight distributions (§DQN-Fusion Analysis, [](#fig-fusion)).
- The proposed XAI extension in `paper/candidacy/proposed-research.md` §Explainable AI (lines 206–228) enumerates LIME [@LIME], SHAP [@SHAP], TCAV [@TCAV], counterfactual explanations [@CFGNNExplainer; @CounterfactualExplainability], and ProtoPNet [@ProtoPNet]. Each targets a different audience: LIME/SHAP for feature-level attribution (developer/operator), TCAV for concept-level behaviour (safety engineer), prototypes for case-based reasoning (fleet analyst).

**Open questions.**

- **Faithfulness is not measured.** Standard metrics — deletion-AUC, insertion-AUC, and the @adebayo2018sanity model- and data-randomization sanity checks — should be added. An explanation that survives model randomization is *not* faithful and must be rejected.
- **Stability is not measured.** Perturbation-robustness (e.g., Lipschitz bounds of the explainer) is unreported for GAT attention.
- **Audience mapping is not written.** Required: a table mapping each audience (fleet operator, safety engineer, developer, ISO auditor) to the explainer that answers their decision-relevant question, with the faithfulness/stability scores attached.
- **Disagreement-as-signal.** Explainer disagreement is informative of both model uncertainty and explainer unreliability; no protocol currently disambiguates the two. A principled approach: when GAT-attention and SHAP disagree, check fusion confidence — high confidence + disagreement implicates the explainer; low confidence + disagreement implicates the model (ties to Q2.1).
