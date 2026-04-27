---
title: "2. Model Interpretability and Calibration"
---

## Question 2.1

> What does it mean for a model to "know what it doesn't know"? Discuss how confidence calibration should be evaluated and maintained in safety-critical, class-imbalanced settings.

### What "know what it doesn't know" means

A model "knows what it doesn't know" when its probabilistic output separates two qualitatively different kinds of uncertainty and communicates each honestly to downstream consumers. The canonical decomposition, formalised in the Bayesian deep-learning literature [@kendall2017uncertainties], is:

- **Aleatoric uncertainty** is irreducible noise inherent in the data — two CAN windows with identical byte profiles but different attack labels (class overlap near the decision boundary). No amount of additional data can collapse this. The correct behaviour is a softmax probability near 0.5 for binary classification, which a well-calibrated classifier produces automatically.
- **Epistemic uncertainty** is reducible ignorance about model parameters, arising from finite training data or from inputs that fall outside the training distribution (OOD samples). A model that has never seen a masquerade attack should output a low *confidence*, not a confident wrong prediction. Out-of-distribution detection is the operational form of this requirement [@OODSurvey; @OODDetection].

For a CAN IDS these map cleanly onto attack-type coverage: aleatoric uncertainty flags ambiguous benign/attack boundary cases; epistemic uncertainty flags attacks we have not seen during training — exactly the "specialist weakness" failure mode that motivates the ensemble [@OODFailures].

A model that *fails* to know what it doesn't know tends to produce high-confidence wrong predictions on OOD inputs. @guo2017calibration documents this as a systemic property of modern deep networks: they are *overconfident*, their maximum-softmax probability systematically exceeds their empirical accuracy, and the gap widens with model depth and capacity. @ovadia2019trust extend this to distribution shift: every post-hoc calibration method they tested (temperature scaling, ensembles, Bayesian methods) degrades under shift, but the *ranking* is preserved — deep ensembles and MC-dropout degrade most gracefully, isotonic regression degrades worst. Both results directly motivate the ensemble design used here.

### Evaluation under class imbalance

Safety-critical automotive IDS inherits all these calibration failure modes and adds two that standard calibration practice ignores:

**Aggregate ECE is misleading under 927:1 imbalance.** Expected Calibration Error [@guo2017calibration] is an average over bins of the gap between predicted confidence and empirical accuracy. When 99.89% of samples are benign, the benign bin dominates the average and a model that is accurate on benign and *miscalibrated on the minority class* can still report near-zero aggregate ECE. The minority class is exactly where miscalibration hurts — a missed attack is a safety event. The fix is **class-conditional ECE** (compute ECE per class and report separately, or compute *adaptive* ECE with equal-mass bins) and reporting **reliability diagrams stratified by class**. The motivation for this is already implicit in the abstract's framing of imbalance as driving "poorly calibrated predictions" (`paper/content/introduction.md:15`) but the measurement is not yet there.

**Aggregate metrics hide selective-prediction failure.** In a safety-critical system the right operating question is *not* "what is the accuracy at 100% coverage?" but "what is the accuracy when we only act on the top-$k\%$ most confident predictions, and how does that curve look in the tails?" This is the risk-coverage framing of @geifman2017selective. A well-calibrated model's risk-coverage curve should be monotone decreasing with coverage; if it is non-monotone, the confidence signal is unreliable precisely where the operator most needs it (the tail of high-uncertainty samples deferred for human review or ECU shutdown).

**Conformal prediction for coverage guarantees.** Neither ECE nor selective prediction gives a hard guarantee; both are averaged over a held-out distribution. For ISO 26262 ASIL C/D-equivalent claims, a *distribution-free* coverage guarantee is preferable. Conformal prediction [@angelopoulos2023conformal] provides exactly this: given a calibration set and a user-chosen miscoverage rate $\alpha$, the method produces prediction sets whose marginal coverage is $\geq 1-\alpha$ by construction, with no modelling assumptions. Under imbalance, *Mondrian* conformal prediction conditions on class to produce class-conditional coverage guarantees — directly addressing the aggregate-ECE failure above.

A pragmatic evaluation protocol — temperature-scale on a held-out calibration split; report class-conditional ECE, Brier score, per-class reliability diagrams, and risk-coverage curves; fit Mondrian conformal predictors and report per-class coverage gap — is operationalised in [](../proposed-research.md#subsec:Calibration) deliverables 1–4.

### Maintenance under operational drift

"Maintenance" implies the calibration guarantee must hold *after* deployment, which raises three operational challenges:

- **Drift detection.** Predicted-confidence histograms and VGAE reconstruction-error distributions (`paper/content/explainability.md` §Composite VGAE Reconstruction Error) can be monitored online with a population stability index or Kolmogorov–Smirnov statistic. Drift past threshold triggers re-calibration.
- **Re-calibration without labels.** Label-free approaches — @ovadia2019trust's deep ensembles and MC-dropout — provide the most degradation-resistant uncertainty under shift. The current framework's ensemble is *de facto* a small deep ensemble; its disagreement rate between GAT and VGAE is a usable drift signal already available in the 15-dim fusion state (`paper/content/methodology.md:126`).
- **Conformal recalibration.** Online conformal prediction can maintain coverage guarantees under streaming non-stationary data with bounded additional memory; this is a natural pairing with the streaming-detection direction of [](#subsec:Streaming).

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
- **Online recalibration** to handle operational drift is proposed in [](#subsec:Streaming) but not yet integrated with a calibration objective.

## Question 2.2

> When multiple explainability methods produce different explanations for the same prediction, how should a practitioner determine which explanation to trust and for whom?

### What "trustworthy explanation" means, formally

There is no universally correct explanation; trustworthiness factors into three independent criteria. Conflating them is the most common error in XAI practice [@ModelInterpretability].

**1. Faithfulness — does the explanation track what the model actually uses?** Writing $f$ for the model, $x$ for the input, and $E(x)$ for an explanation that ranks input components by importance, the standard operationalisations are:

$$
\mathrm{AUC}_{\text{del}}(E, f, x) = \int_0^1 f\bigl(x \setminus E_{\le k}\bigr)\,dk
\qquad
\mathrm{AUC}_{\text{ins}}(E, f, x) = \int_0^1 f\bigl(\emptyset \cup E_{\le k}\bigr)\,dk
$$

— deletion-AUC drops the top-$k$ components ranked by $E$ and measures how fast the prediction collapses; insertion-AUC adds them back and measures how fast it recovers. A faithful explanation has *low* deletion-AUC and *high* insertion-AUC. An *unfaithful* explanation passes the model-randomisation and data-randomisation **sanity checks** of @adebayo2018sanity: if the explanation looks the same when the model's weights are randomised, the "explanation" is decorative — it tracks input statistics rather than model behaviour. This is the disqualifying test, applied first.

**2. Stability — does it persist under small input perturbations?** A useful explanation should not change discontinuously when $x$ is perturbed to $x + \delta$ for small $\delta$. The Lipschitz formulation:

$$
\mathrm{Stab}(E, f, x; r) = \max_{\|\delta\|\le r}\;\frac{\bigl\|E(x + \delta) - E(x)\bigr\|}{\|\delta\|}
$$

Low Lipschitz constant means stable; large means brittle. For graph models, $\delta$ should respect the graph structure (small edge perturbations on the input graph, not arbitrary feature noise). Stability is necessary but not sufficient for trust — a constant explanation is perfectly stable and perfectly useless.

**3. Audience fit — does the abstraction level match the consumer's decision?** This is a stakeholder-engineering criterion, not a mathematical one. A fleet operator deciding whether to dispatch a tow truck needs a case-based explanation ("this CAN sequence resembles known DoS prototypes"); a developer debugging a false positive needs feature attribution ("removing the engine-RPM signal would have flipped the decision"); an ISO 26262 auditor [@ISO26262Part1; @ISO26262SafetyCase] needs concept-level evidence ("the model's response to high-frequency injection scales linearly with frequency, as expected"). The same prediction warrants different explanations for these three audiences; an explanation that is faithful and stable but mis-targeted is operationally useless.

A useful explanation requires *all three*: pass the sanity check, satisfy a stability bound, match the audience's decision granularity. Most explainers in the literature [@LIME; @SHAP; @TCAV; @ProtoPNet; @CFGNNExplainer] provide one or two; none provides all three by construction.

### A triangulation protocol for disagreement

Rather than picking a single explainer, evaluate multiple and treat disagreement as a *signal*. The diagnostic move is to cross-reference explainer agreement with Q2.1's calibration framework:

| Fusion confidence | Explainer agreement | Diagnostic interpretation | Operational action |
|---|---|---|---|
| High | High | Trustworthy decision and explanation | Surface to operator |
| High | Low | Model is confident but explainers disagree → likely **explainer unreliability** | Run @adebayo2018sanity sanity checks; cross-validate explainers on a calibration set; do not blame the model |
| Low | High | Model is uncertain but explainers agree on *what little signal exists* → **honest epistemic uncertainty** | Defer to human review (selective-prediction action of Q2.1) |
| Low | Low | Model is uncertain *and* explainers disagree → **OOD input** | Conformal-prediction abstain / route to PINN safety shield (Q4.1) |

This 2×2 is the operational core of "disagreement is informative, not noise." Notably, only the *high-confidence + low-agreement* cell unambiguously implicates the explainer; the other failure modes implicate the model or the input. The protocol therefore protects the model's reputation against unfaithful explainers — important under ISO 26262 review where a single brittle explainer can otherwise force unwarranted model rejection.

A complementary aggregation move under disagreement is to require *consensus on the disqualification direction* — if any explainer flags an input feature as critical and another flags it as irrelevant, the conservative move is to assume both, i.e., treat the input as one whose decision relies on a contested feature. This is the dual of disagreement-as-signal: agreement is informative *for trust*; disagreement is informative *for caution*.

### Audience-explainer mapping

Each XAI method targets a distinct level of abstraction; matching the level to the consumer's decision is what audience fit means in practice.

| Audience | Decision they need to make | Required abstraction | Recommended explainer | Faithfulness handle | Stability handle |
|---|---|---|---|---|---|
| Fleet operator | "Is this alert real or noise?" | Case-based — match against known patterns | Prototype-based [@ProtoPNet; @PrototypeLearning] | Inherent (model literally uses prototypes) | High by construction (prototypes are fixed) |
| Developer | "Why did the model fire? Which feature drove it?" | Feature-level attribution | LIME [@LIME], SHAP [@SHAP] | Deletion-/insertion-AUC; @adebayo2018sanity sanity checks | Lipschitz on perturbations of $x$ |
| Safety engineer | "Does the model behave correctly across a *concept* (e.g., DoS frequency response)?" | Concept-level | TCAV [@TCAV] | Concept-vector statistical testing (built into TCAV) | Concept-vector stability across user-defined concepts |
| ISO 26262 auditor [@ISO26262SafetyCase] | "Where is the failure-mode boundary?" | Counterfactual — "what's the smallest perturbation that flips the decision?" | CF-GNNExplainer [@CFGNNExplainer; @CounterfactualExplainability] | Built-in: counterfactual is, by definition, an action on the model | Boundary smoothness; small input changes should yield small counterfactuals |
| NIST AI RMF [@NISTAIRisk] | "Does the model meet trustworthy-AI characteristics?" | Aggregate (multiple methods) | Triangulation across all of the above | Documented per-method | Documented per-method |

**Layered rendering of the same prediction.** The framework should produce, for any flagged CAN sequence, *all five* explanations and surface them in a single audit-ready report. The fleet operator reads only the prototype panel; the auditor reads all five. This is a presentation-layer commitment, not an architectural one — the model produces the same outputs in either case.

### How this framework's existing layers form a triangulation set

The existing inspection layers — GAT attention weights ([](#fig-attention)), VGAE composite reconstruction error decomposed into node/neighbour/CAN-ID components ([](#fig-reconstruction)), UMAP of GAT penultimate-layer embeddings ([](#fig-umap)), and DQN fusion-weight distributions ([](#fig-fusion); see `paper/content/explainability.md`) — already span feature-level attribution, reconstruction-based attribution, latent-space concept geometry, and decision-process interpretability. Together they constitute a triangulation set even before the proposed XAI extension. [](#subsec:XAI) adds LIME [@LIME], SHAP [@SHAP], TCAV [@TCAV], CF-GNNExplainer [@CFGNNExplainer], and ProtoPNet [@ProtoPNet] to complete the audience-explainer mapping above.

### Open questions

- **Faithfulness is not measured for any current layer.** Deletion-AUC and insertion-AUC on GAT attention, and the @adebayo2018sanity model- and data-randomisation sanity checks, should be the first additions. An attention-weight visualisation that survives model randomisation is *decorative*, not faithful, and must be rejected — the absence of this check in CAN-IDS XAI literature is a gap the framework is positioned to close.
- **Stability is not measured.** Lipschitz bounds on GAT attention with respect to graph-structural perturbations (edge addition/removal) are unreported. The graph-adversarial-attack literature [@zugner2018adversarial] from [](#subsec:Adversarial) provides the natural perturbation set; running the existing attention layer through it gives both stability bounds *and* adversarial robustness data simultaneously.
- **Audience-decision protocols.** The mapping table above is a recommendation; in practice the relevant decisions for each audience need to be elicited from real fleet operators, safety engineers, and OEM compliance teams. This is qualitative research that is not currently scoped but is necessary for a defensible NIST AI RMF [@NISTAIRisk] compliance argument.
- **Disagreement protocol calibration.** The 2×2 confidence-vs-agreement diagnostic relies on the calibrated confidence from Q2.1. Until class-conditional ECE and conformal coverage are measured (Q2.1 open questions), the "high confidence" cell is not operationally trustworthy.
- **Explainer agreement metric.** "Agreement" between LIME/SHAP feature attributions is straightforward (cosine similarity over normalised attribution vectors), but agreement between LIME and TCAV (different abstractions) requires a unifying metric — either projecting to a common feature basis or comparing top-$k$ predictive features. The XAI literature has no consensus answer; this is a methodological contribution available within the framework.
- **Tie-in to selective prediction.** The low-confidence + low-agreement diagnostic ("OOD input") naturally feeds into the conformal-prediction abstain mechanism from Q2.1. Composing the two — abstain on (low-conf ∪ low-agreement) rather than on low-conf alone — is a stricter selective-prediction rule that has not been studied in the calibration literature and is empirically tractable on this framework's existing layers.
