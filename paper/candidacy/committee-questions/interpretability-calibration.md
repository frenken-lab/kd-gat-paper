---
title: "2. Model Interpretability and Calibration"
---

## Question 2.1

> What does it mean for a model to "know what it doesn't know"? Discuss how confidence calibration should be evaluated and maintained in safety-critical, class-imbalanced settings.

### What "know what it doesn't know" means

A useful detector reports two things at once: a prediction, and how much weight to put on it. The second number is what "knowing what you don't know" actually amounts to — and on a CAN bus it has to do real work, because the cost of a false alert and the cost of a missed attack live on opposite ends of the same operating envelope. A 99% accurate detector that cannot tell the operator whether *this particular alert* is one of the 1% errors offers a confidence number that means nothing.

Two distinct things drive that uncertainty, and they call for opposite responses [@kendall2017uncertainties].

| Type | Source | Reducible? | What "calibrated" looks like | Operational response |
|---|---|---|---|---|
| **Aleatoric** | Irreducible data noise — two CAN windows with identical byte profiles but different labels | No, even with infinite training data | Softmax near 0.5 on borderline cases | Trust the confidence; defer borderline cases for review |
| **Epistemic** | Model ignorance — finite training data, novel attack types, OOD inputs | Yes, shrinks with more / better data | Low confidence on OOD inputs — *not* a confident wrong answer | Abstain via OOD detection [@OODSurvey; @OODDetection]; route to a fallback |

The split lines up neatly with how a CAN IDS fails. Aleatoric uncertainty flags ambiguous benign/attack boundary windows. Epistemic uncertainty flags attacks the training data never contained — the unknown-attack case where any single specialist breaks down [@OODFailures].

Modern deep networks fail at both, and they fail in a predictable direction. @guo2017calibration documents the systemic version: max-softmax confidence routinely exceeds empirical accuracy, and the gap widens with depth and capacity — networks are overconfident by default. @ovadia2019trust carries the result over to distribution shift. Every post-hoc calibration method tested — temperature scaling, ensembles, MC-dropout, Bayesian methods — degrades under shift, but the *ranking* is preserved: deep ensembles and MC-dropout degrade most gracefully, isotonic regression worst. The structural takeaway is that heterogeneous expert redundancy is what buys calibration *under shift*; a one-shot post-hoc fit on a clean calibration set does not.

### Evaluation under class imbalance

Standard calibration practice — average ECE on a held-out split — falls apart on a 927:1 imbalance. Three things have to be fixed before any selective-prediction rule built on confidence will mean what its name suggests.

**Aggregate ECE hides the failure that actually matters.** Expected Calibration Error [@guo2017calibration] averages, across confidence bins, the gap between predicted confidence and empirical accuracy. When 99.89% of samples are benign, the benign bin dominates the average; a model that is accurate on benign and *miscalibrated on the minority class* still reports near-zero aggregate ECE. The minority class is precisely where miscalibration costs lives — a missed attack is a safety event. The fix is **class-conditional ECE** (compute per class and report separately, or use *adaptive* ECE with equal-mass bins) alongside **reliability diagrams stratified by class**.

**Coverage-naive metrics hide selective-prediction failure.** The right operating question for a safety-critical detector is not "what is the accuracy at 100% coverage?" but "what is the accuracy on the top-$k\%$ most confident predictions, and how does that curve behave in the tails?" — the risk-coverage framing of @geifman2017selective. A well-calibrated model's risk-coverage curve is monotone decreasing in coverage; if it is non-monotone, the confidence signal is unreliable precisely where the operator most needs it — the high-uncertainty tail flagged for human review or ECU shutdown.

**Conformal prediction for guaranteed coverage.** Neither ECE nor selective prediction gives a hard guarantee; both are averages over a held-out distribution. ISO 26262 ASIL C/D-equivalent claims call for something stronger: a distribution-free coverage guarantee. Conformal prediction [@angelopoulos2023conformal] provides exactly that — given a calibration set and a chosen miscoverage rate $\alpha$, the method produces prediction sets with marginal coverage $\geq 1-\alpha$ by construction, with no modelling assumptions. Under imbalance, *Mondrian* conformal prediction conditions on class to deliver class-conditional coverage — the structural answer to the aggregate-ECE failure above.

The evaluation protocol falls out of these three points: temperature-scale on a held-out split, report class-conditional ECE, Brier score, and per-class reliability diagrams, plot risk-coverage curves, then fit Mondrian conformal predictors and report the per-class coverage gap.

### Maintenance under operational drift

A calibration guarantee that holds at deployment but not three months later is not a guarantee. Three operational pieces keep it alive.

- **Drift detection.** Predicted-confidence histograms and VGAE reconstruction-error distributions (§Composite VGAE Reconstruction Error) can be monitored online with a population stability index or a Kolmogorov–Smirnov statistic. Drift past threshold triggers re-calibration.
- **Re-calibration without labels.** Labelled drift events are rare in deployment; the most degradation-resistant uncertainty signals under shift — deep ensembles and MC-dropout [@ovadia2019trust] — are exactly the ones that need none. Disagreement *between* the GAT and VGAE confidences plays the same role as disagreement *with* a label, and that disagreement is already exposed in the 15-dim fusion state.
- **Online conformal recalibration.** Online conformal prediction maintains coverage under streaming non-stationary data with bounded additional memory — a natural pairing with the streaming-detection direction in [](#subsec:Streaming).

### Where the signals live, and what's still to build

The pipeline already carries several uncertainty-relevant signals; what sits on top of them — the measurement layer that turns those signals into a defensible coverage claim — is the part of the answer that is still future work.

| Signal | What it carries | Where it lives |
|---|---|---|
| VGAE reconstruction error (composite: node + neighbour + CAN-ID) | OOD / epistemic score, useful for unknown-attack generalisation | [](#fig-reconstruction) |
| GAT softmax probability | Aleatoric (boundary) confidence; expected to be overconfident by default [@guo2017calibration] | §Methodology |
| 15-dim fusion state | All confidence signals in one place — the input to an uncertainty head | §Methodology |
| Neural-LinUCB UCB bonus | Directed exploration under epistemic uncertainty; bonus shrinks as $O(1/\sqrt{n_a})$ [@xu2022neural] | §Methodology |
| DQN fusion-weight distribution | Emergent attack-type-specific strategies (peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$); interpretable but not labelled by uncertainty | §DQN-Fusion Analysis |

The outstanding work is class-conditional ECE, per-class risk-coverage curves, and Mondrian conformal predictors fit on a held-out split. That apparatus is what turns the signals above into the operational coverage guarantee the question asks for.

## Question 2.2

> When multiple explainability methods produce different explanations for the same prediction, how should a practitioner determine which explanation to trust and for whom?

### What "trustworthy explanation" means

Run two explainers on the same prediction and you will often get different answers. There is no universally correct explanation, only explanations that are trustworthy on their own terms — and trustworthiness is the conjunction of three independent properties. Conflating them is the most common error in XAI practice [@ModelInterpretability].

**1. Faithfulness — does the explanation track what the model actually uses?** The standard operationalisations are deletion- and insertion-AUC: deletion-AUC drops the top-$k$ components ranked by the explanation and measures how fast the prediction collapses; insertion-AUC adds them back and measures how fast it recovers. A faithful explanation has *low* deletion-AUC and *high* insertion-AUC. Formally, with $f$ the model, $x$ the input, and $E(x)$ ranking components by importance:

$$
\mathrm{AUC}_{\text{del}}(E, f, x) = \int_0^1 f\bigl(x \setminus E_{\le k}\bigr)\,dk
\qquad
\mathrm{AUC}_{\text{ins}}(E, f, x) = \int_0^1 f\bigl(\emptyset \cup E_{\le k}\bigr)\,dk
$$

The complementary screen is the model- and data-randomisation **sanity checks** of @adebayo2018sanity: an explanation that looks the same when the model's weights are randomised tracks input statistics rather than model behaviour, and is decorative.

**2. Stability — does it persist under small input perturbations?** A useful explanation should not change discontinuously when the input is perturbed slightly. Formally, the local Lipschitz constant of $E$ at $x$ over a perturbation ball of radius $r$:

$$
\mathrm{Stab}(E, f, x; r) = \max_{\|\delta\|\le r}\;\frac{\bigl\|E(x + \delta) - E(x)\bigr\|}{\|\delta\|}
$$

Low Lipschitz constant means stable; large means brittle. For graph models, $\delta$ should respect the graph structure (small edge perturbations on the input graph, not arbitrary feature noise). Stability is necessary but not sufficient for trust — a constant explanation is perfectly stable and perfectly useless.

**3. Audience fit — does the abstraction level match the consumer's decision?** This is a stakeholder-engineering criterion, not a mathematical one. A fleet operator deciding whether to dispatch a tow truck needs a case-based explanation ("this CAN sequence resembles known DoS prototypes"); a developer debugging a false positive needs feature attribution ("removing the engine-RPM signal would have flipped the decision"); an ISO 26262 auditor [@ISO26262Part1; @ISO26262SafetyCase] needs concept-level evidence ("the model's response to high-frequency injection scales linearly with frequency, as expected"). The same prediction warrants different explanations for these three audiences; an explanation that is faithful and stable but mis-targeted is operationally useless.

A useful explanation requires *all three*: pass the sanity check, satisfy a stability bound, match the audience's decision granularity. Most explainers in the literature [@LIME; @SHAP; @TCAV; @ProtoPNet; @CFGNNExplainer] provide one or two; none provides all three by construction.

### A triangulation protocol for disagreement

Rather than picking a single explainer, evaluate multiple and treat disagreement as a signal. Cross-referencing fusion confidence (from Q2.1) with explainer agreement yields four cases:

| Fusion confidence | Explainer agreement | Diagnostic interpretation | Operational action |
|---|---|---|---|
| High | High | Trustworthy decision and explanation | Surface to operator |
| High | Low | Model is confident but explainers disagree → likely **explainer unreliability** | Run @adebayo2018sanity sanity checks; cross-validate explainers on a calibration set; do not blame the model |
| Low | High | Model is uncertain but explainers agree on *what little signal exists* → **honest epistemic uncertainty** | Defer to human review (selective-prediction action of Q2.1) |
| Low | Low | Model is uncertain *and* explainers disagree → **OOD input** | Conformal-prediction abstain / route to PINN safety shield (Q4.1) |

Only the *high-confidence + low-agreement* cell unambiguously implicates the explainer; the other failure modes implicate the model or the input. This matters under ISO 26262 review, where a single brittle explainer can otherwise force unwarranted model rejection.

A complementary aggregation move under disagreement is to require *consensus on the disqualification direction* — if any explainer flags an input feature as critical and another flags it as irrelevant, the conservative move is to assume both, i.e., treat the input as one whose decision relies on a contested feature.

### Audience-explainer mapping

Each XAI method targets a distinct level of abstraction; matching the level to the consumer's decision is what audience fit means in practice.

| Audience | Decision they need to make | Required abstraction | Recommended explainer | Faithfulness handle | Stability handle |
|---|---|---|---|---|---|
| Fleet operator | "Is this alert real or noise?" | Case-based — match against known patterns | Prototype-based [@ProtoPNet; @PrototypeLearning] | Inherent (model literally uses prototypes) | High by construction (prototypes are fixed) |
| Developer | "Why did the model fire? Which feature drove it?" | Feature-level attribution | LIME [@LIME], SHAP [@SHAP] | Deletion-/insertion-AUC; @adebayo2018sanity sanity checks | Lipschitz on perturbations of $x$ |
| Safety engineer | "Does the model behave correctly across a *concept* (e.g., DoS frequency response)?" | Concept-level | TCAV [@TCAV] | Concept-vector statistical testing (built into TCAV) | Concept-vector stability across user-defined concepts |
| ISO 26262 auditor [@ISO26262SafetyCase] | "Where is the failure-mode boundary?" | Counterfactual — "what's the smallest perturbation that flips the decision?" | CF-GNNExplainer [@CFGNNExplainer; @CounterfactualExplainability] | Built-in: counterfactual is, by definition, an action on the model | Boundary smoothness; small input changes should yield small counterfactuals |
| NIST AI RMF [@NISTAIRisk] | "Does the model meet trustworthy-AI characteristics?" | Aggregate (multiple methods) | Triangulation across all of the above | Documented per-method | Documented per-method |

**Layered rendering.** Each flagged CAN sequence produces all five explanations together in one report, with separate panels per audience.

### Existing inspection layers as a triangulation set

The existing inspection layers — GAT attention weights ([](#fig-attention)), VGAE composite reconstruction error decomposed into node/neighbour/CAN-ID components ([](#fig-reconstruction)), UMAP of GAT penultimate-layer embeddings ([](#fig-umap)), and DQN fusion-weight distributions ([](#fig-fusion)) — already span feature-level attribution, reconstruction-based attribution, latent-space concept geometry, and decision-process interpretability. [](#subsec:XAI) adds LIME [@LIME], SHAP [@SHAP], TCAV [@TCAV], CF-GNNExplainer [@CFGNNExplainer], and ProtoPNet [@ProtoPNet] to complete the audience-explainer mapping above.
