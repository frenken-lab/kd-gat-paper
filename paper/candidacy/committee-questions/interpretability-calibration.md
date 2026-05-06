---
title: "2. Model Interpretability and Calibration"
---

While working through this section, three axes emerged as a means to evaluate a model: correctness, justification, and explanation. Though related, they are independent — an ideal model satisfies all three.

+++ {"type": "table"}

| Axis              | What it is                                                                                     | The question it answers                 |
| ----------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Correctness**   | Outcome — did the prediction match the label?                                                  | Did we get this one right?              |
| **Justification** | Per-prediction warrant — was the apparatus entitled to assert this confidence given the input? | Should we trust this prediction?        |
| **Explanation**   | Account of how the prediction was reached, configured for a consumer                           | How should I communicate this decision? |

+++

Q2.1 investigates when a prediction is _justified_; Q2.2 investigates how to _explain_ a decision and/or a justification. These are complementary — you do not explain away an unjustified prediction, and you do not refuse to explain a justified one.

## Question 2.1

> What does it mean for a model to "know what it doesn't know"? Discuss how confidence calibration should be evaluated and maintained in safety-critical, class-imbalanced settings.

### What "know what it doesn't know" means

A model reports multiple signals at once: a prediction, its confidence, and a retrospective account of how it reached that decision. Take an umpire at a baseball game. For every pitch there is the correctness of the call (strike or ball?), a justification (was the umpire in position with a clear view of the plate?), and an explanation (modern broadcasts overlay a bounding box showing the strike zone). Even at 99.9% accuracy, a detector that cannot tell an operator whether _this particular alert_ is one of its rare errors offers a confidence score that is operationally meaningless — and operationally meaningless is worse than absent, because it crowds out the abstain signal.

Post-Gettier epistemology [@gettier1963justified] gives two complementary criteria for per-prediction justification:

- **Reliabilism** [@goldman1979reliabilism]: a prediction is justified when produced by a process whose outputs track truth at the rate the process asserts — calibration is the engineering operationalisation.
- **Defeasibility** [@pollock1986contemporary]: it is justified when no fact about the input the process missed would undermine the conclusion — OOD detection is its operationalisation.

The distinction matters: reliabilism licenses post-hoc calibration methods (temperature scaling, conformal prediction) as engineering fixes; defeasibility says no calibration method saves a prediction on an OOD input — the warrant is broken upstream of any score adjustment. Both must hold. The rest of this answer follows the reliabilist thread, because the question asks specifically about _evaluation_ and _maintenance_. The justification-failure side closes in §4, where the joint calibration vector turns out to be the field's accumulated inventory of justification failures.

Uncertainty decomposes into two types that call for opposite operational responses [@kendall2017uncertainties]:

+++ {"type": "table"}

| Type          | Source                                                             | Reducible? | Operational response                                      |
| ------------- | ------------------------------------------------------------------ | ---------- | --------------------------------------------------------- |
| **Aleatoric** | Irreducible data noise — identical byte profiles, different labels | No         | Trust the confidence; defer borderline cases              |
| **Epistemic** | Model ignorance — OOD inputs, novel attack types                   | Yes        | Abstain via OOD detection [@OODSurvey]; route to fallback |

+++

Modern deep networks fail at both in a predictable direction: max-softmax confidence routinely exceeds empirical accuracy, the gap widens with depth [@guo2017calibration], and every post-hoc calibration method degrades under distribution shift — though deep ensembles and MC-dropout degrade most gracefully [@ovadia2019trust]. The structural takeaway is reliabilist: heterogeneous expert redundancy keeps the inference _process_ reliable across shift; a one-shot post-hoc fit on a clean calibration set is a snapshot, not a reliable process.

### Evaluation under class imbalance

Standard calibration practice — average ECE on a held-out split — assumes the split looks like deployment. Under heavy imbalance that assumption breaks in three places:

- **Aggregate ECE hides the failure that matters.** When the majority class dominates the held-out distribution, a model miscalibrated on the minority class still reports near-zero aggregate ECE. The fix is **class-conditional ECE** with reliability diagrams stratified by class.
- **Coverage-naive metrics hide selective-prediction failure.** The operative question is not "accuracy at full coverage" but how the risk-coverage curve behaves as coverage drops [@geifman2017selective]. Non-monotonicity means the confidence signal is unreliable precisely where the operator most needs it.
- **Distribution-averaged metrics give no hard guarantee.** Both ECE and selective prediction average over a held-out distribution; neither gives the distribution-free coverage guarantee a safety case can rest on. _Mondrian_ conformal prediction [@angelopoulos2023conformal] conditions on class, lifting marginal to per-class coverage — the structural answer to the aggregate-ECE failure.

### Maintenance under distribution drift

A calibration guarantee that holds at deployment but not three months later is not a guarantee. Three operational pieces keep it alive: online drift detection against a held-out reference distribution; label-free recalibration via disagreement between heterogeneous experts (well-conditioned when experts use complementary decision functions); and online conformal recalibration maintaining coverage under streaming non-stationary data with bounded memory.

The conceptual move is to treat justification failure as one problem with five faces, not five problems — fit on one held-out split, recalibrated on one cadence:

+++ {"type": "table"}

| Failure type      | What goes wrong                                     | Measurement                                                  |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| **Label**         | Score does not track accuracy on the minority class | Class-conditional ECE; per-class reliability diagrams        |
| **Input**         | Apparatus is not qualified on this input            | Mondrian conformal coverage                                  |
| **Cross-process** | Orthogonal experts contradict each other            | Inter-expert disagreement as label-free recalibration signal |
| **Bayesian**      | An estimator inside the apparatus is uncertain      | Online conformal cadence on estimator confidence radius      |
| **Deployment**    | Deployed objective drifts from training objective   | Drift detection + online recalibration                       |

+++

Fitting the five failure types separately risks inconsistent coverage thresholds — a conformal abstain rule calibrated on a clean split and a drift detector calibrated on a shifted split can simultaneously fire and suppress each other on the same input, voiding the operational coverage guarantee at exactly the moment a safety case needs it. The contribution is the claim that these five share a single calibration apparatus, fit jointly and recalibrated on one schedule — and that treating them as separate problems, which the field does, breaks the guarantee at the place that matters most.

## Question 2.2

> When multiple explainability methods produce different explanations for the same prediction, how should a practitioner determine which explanation to trust and for whom?

### Defining explainer disagreement

The standard XAI move when two explainers disagree is to pick the more faithful or stable method [@krishna2024disagreement]. The move here is the opposite — to read disagreement _as information_ about the input or the model. The experts feeding those explainers are structurally orthogonal: discriminative classification on raw features, generative reconstruction over relational structure, physics residual on derived state. Two explainers disagreeing across these report on different decision functions that the fusion policy combined. The operator's question is therefore not "which explainer wins" but "is this disagreement information or noise" — a question with a definite answer per sample, set by the architecture and the Q2.1 calibration apparatus.

### Defining explainer disagreement

For any prediction, two explainers can diverge across each of the three axes from Q2.1. Grouping by Hamming weight gives the full disagreement space:

+++ {"type": "table"}

| Axes in disagreement | Count | What it looks like                                          |
| -------------------- | ----- | ----------------------------------------------------------- |
| 0                    | 1     | Total alignment                                             |
| 1                    | 3     | One axis diverges — the standard XAI-disagreement cases     |
| 2                    | 3     | Two axes diverge — agreement on the third is often unearned |
| 3                    | 1     | Nothing in common                                           |

+++

A real ensemble of $n$ experts pushes pairwise-divergence states to $2^{3\binom{n}{2}}$; enumeration doesn't scale, so the question reduces to: which structural conditions make disagreement informative rather than noise?

The standard XAI move is to pick the more faithful or stable method [@krishna2024disagreement]. The move here is the opposite — to read disagreement _as information_. The experts feeding those explainers are structurally orthogonal: discriminative classification on raw features, generative reconstruction over relational structure, physics residual on derived state. Two explainers disagreeing across these report on different decision functions the fusion policy combined. The operator's question is therefore not "which explainer wins" but "is this disagreement information or noise" — a question with a definite per-sample answer set by the architecture and the Q2.1 calibration apparatus.

Both the epistemic literature (Aumann [@aumann1976agreeing], Krogh–Vedelsby ambiguity decomposition [@krogh1995neural]) and the ML literature (Rashomon [@breiman2001statistical], underspecification [@damour2022underspecification]) converge on three conditions for productive disagreement: independence, boundedness, resolvability.

### When disagreement carries information

- **Independence:** the disagreers see different things. Heterogeneous experts buy this by construction — an attack that fools one is unlikely to fool all; the Krogh–Vedelsby ambiguity term collapses when ensemble members compute the same function.
- **Boundedness:** magnitudes are comparable across experts. Without the Q2.1 joint-calibration vector, "the explainers disagree" reduces to vibes. Boundedness converts "two explainers said different things" to "the disagreement is $N$ standard deviations above benign baseline."
- **Resolvability:** there is a downstream protocol that converts disagreement to action — conformal abstain (Q2.1), human review, or the physics-based safety shield (Q4.1). Without one, disagreement degenerates into manufactured doubt that an adversary can exploit [@black2024lessdiscriminatory].

### When disagreement is noise

- **Correlated experts → false consensus.** Shared inductive biases inflate apparent agreement; the federated setting (Q3.2) reintroduces this risk under non-IID-but-correlated clients.
- **Predictive multiplicity / Rashomon.** Two equally-accurate models give different per-sample verdicts — no measurement picks the right one [@marx2020predictive]. The partial-order construction [@partialorder2023] keeps only what every near-optimal model agrees on.
- **Underspecification.** Different pipeline realisations produce equivalent test loss but different reasoning; the multiplicity is upstream of the explainer [@damour2022underspecification].

### Composing both

Cross-reference fusion confidence (Q2.1) with explainer agreement to locate the failed condition:

+++ {"type": "table"}

| Fusion confidence | Explainer agreement | Failed condition                            | Action                                                                         |
| ----------------- | ------------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| High              | High                | None                                        | Surface to operator                                                            |
| High              | Low                 | Explainers disagree despite held confidence | Sanity checks [@adebayo2018sanity]; Rashomon partial order [@partialorder2023] |
| Low               | High                | Experts agree on uncertainty                | Human review — honest epistemic uncertainty                                    |
| Low               | Low                 | Resolvability                               | Conformal abstain / safety shield (Q4.1)                                       |

+++

Of the three conditions, _independence_ is built (Q1.1/Q1.2 orthogonality), _boundedness_ is in progress (Q2.1 joint calibration), and _resolvability_ is the open gap — the abstain rule exists but the Rashomon partial order is not yet wired. Until it is, the pipeline can diagnose which condition failed on any input; it cannot yet guarantee every failure resolves to a principled action.
