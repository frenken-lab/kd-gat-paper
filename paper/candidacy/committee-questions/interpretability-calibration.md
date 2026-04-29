---
title: "2. Model Interpretability and Calibration"
---

## Scope of the chapter

While working through this section, three axes emerged as a means to evaluate a model: correctness, justification, and explanation. The table below defines each; though related, they are independent. An ideal model satisfies all three.

| Axis              | What it is                                                                                        | The question it answers                        |
| ----------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Correctness**   | Outcome — did the prediction match the label?                                                     | Did we get this one right?                     |
| **Justification** | Per-prediction warrant — was the apparatus entitled to assert this confidence given the input?    | Should we trust this prediction?               |
| **Explanation**   | Account of how the prediction was reached, ideally configured for a consumer (model, human, etc.) | How should I communicate a decision to others? |

Q2.1 investigates when a prediction is _justified_; Q2.2 investigates how to _explain_ a decision and/or a justification. These are complementary and both required — you do not explain away an unjustified prediction, and conversely you do not refuse to explain a justified one.

## Question 2.1

> What does it mean for a model to "know what it doesn't know"? Discuss how confidence calibration should be evaluated and maintained in safety-critical, class-imbalanced settings.

### What "know what it doesn't know" means

A useful model reports multiple things at once: a prediction, its confidence, and a retrospective account of how it reached that decision. Take an umpire at a baseball game. For every pitch there is the correctness of the call (strike or ball?), a justification (was the umpire in position with a clear view of the plate?), and an explanation (modern broadcasts overlay a bounding box showing the strike zone). Even if a system achieves sufficient correctness (e.g., 99.9% accuracy), a detector that cannot tell an operator whether _this particular alert_ is one of its rare errors offers a confidence score that is operationally meaningless — and operationally meaningless is worse than absent, because it crowds out the abstain signal.

A more formal approach runs through epistemology. Post-Gettier epistemology [@gettier1963justified] gives two complementary criteria for _justification_ — both per-prediction.

- **Reliabilism** [@goldman1979reliabilism] says a prediction is justified when produced by a process whose outputs track truth at the rate the process asserts; calibration is the engineering operationalisation.
- **Defeasibility** [@pollock1986contemporary; @lehrer1990knowledge] says it is justified when no fact about the input the process missed would undermine the conclusion; OOD detection is its operationalisation.

The distinction matters operationally: reliabilism licenses post-hoc calibration methods (temperature scaling, conformal prediction) as engineering fixes, while defeasibility says no calibration method saves a prediction made on an out-of-distribution input — the warrant is broken upstream of any score adjustment. Both have to hold: a reliably-trained classifier whose softmax matches accuracy on every class still loses justification once a regime change has invalidated its training distribution, and a justification produced by a broken process is Gettier-lucky, not warrant. The rest of this answer follows the reliabilist thread, because the question asks specifically about _evaluation_ and _maintenance_ — both reliability operations on the inference process. The justification-failure side closes the section in §4, where the joint calibration vector turns out to be the field's accumulated **inventory of justification failures**.

Beneath either criterion, uncertainty decomposes into two types that call for opposite operational responses [@kendall2017uncertainties].

| Type          | Source                                                                                     | Reducible?                           | What "calibrated" looks like                                  | Operational response                                                       |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Aleatoric** | Irreducible data noise — two CAN windows with identical byte profiles but different labels | No, even with infinite training data | Softmax near 0.5 on borderline cases                          | Trust the confidence; defer borderline cases for review                    |
| **Epistemic** | Model ignorance — finite training data, novel attack types, OOD inputs                     | Yes, shrinks with more / better data | Low confidence on OOD inputs — _not_ a confident wrong answer | Abstain via OOD detection [@OODSurvey; @OODDetection]; route to a fallback |

The split maps directly onto how a CAN IDS fails. Aleatoric uncertainty flags ambiguous benign/attack boundary windows; epistemic uncertainty flags attacks the training data never contained — the unknown-attack case where any single specialist breaks down [@OODFailures].

Modern deep networks fail at both, in a predictable direction. @guo2017calibration documents the systemic version: max-softmax confidence routinely exceeds empirical accuracy, and the gap widens with depth and capacity. @ovadia2019trust carries the result over to distribution shift: every post-hoc calibration method tested degrades under shift, but the ranking is preserved — deep ensembles and MC-dropout degrade most gracefully, isotonic regression worst. The structural takeaway is reliabilist — heterogeneous expert redundancy keeps the inference _process_ reliable across the shift; a one-shot post-hoc fit on a clean calibration set is a snapshot, not a reliable process.

### Additional Curveballs: Class Imbalance and Distribution Drift

**Class imbalance.** Standard calibration practice — average ECE on a held-out split — assumes the split looks like deployment. Under heavy class imbalance, that assumption breaks in three places, each with its own structural fix.

- **Aggregate ECE hides the failure that actually matters.** Expected Calibration Error [@guo2017calibration] averages the gap between predicted confidence and empirical accuracy across confidence bins. When the majority class dominates the held-out distribution, a model miscalibrated on the minority class still reports near-zero aggregate ECE. The minority class is precisely where miscalibration cost lives — a missed attack is a safety event. The fix is to condition on class: **class-conditional ECE** (per class, or _adaptive_ ECE with equal-mass bins) alongside **reliability diagrams stratified by class**.
- **Coverage-naive metrics hide selective-prediction failure.** The operating question for a safety-critical detector is not "what is the accuracy at full coverage?" but "what is the accuracy on the most-confident predictions, and how does the curve behave as coverage drops?" — @geifman2017selective's risk-coverage framing. A well-calibrated model's curve is monotone decreasing in coverage; non-monotonicity means the confidence signal is unreliable precisely where the operator most needs it.
- **Distribution-averaged metrics give no hard guarantee.** Both ECE and selective prediction average over a held-out distribution; neither gives the distribution-free coverage guarantee a safety case can rest on. Conformal prediction [@angelopoulos2023conformal] does — given a calibration set and miscoverage rate $\alpha$, prediction sets achieve marginal coverage $\geq 1-\alpha$ by construction. Under imbalance, _Mondrian_ conformal prediction conditions on class, lifting marginal to per-class coverage — the structural answer to the aggregate-ECE failure.

**Distribution drift.** A calibration guarantee that holds at deployment but not three months later is not a guarantee. Three operational pieces keep it alive.

- **Drift detection.** Confidence and OOD-score distributions are monitored online with a divergence test against the held-out reference distribution; drift past threshold triggers recalibration.
- **Re-calibration without labels.** Labelled drift events are rare in deployment; the most shift-resistant uncertainty signals — deep ensembles and MC-dropout [@ovadia2019trust] — need none. Disagreement _between_ heterogeneous experts plays the role that disagreement _with_ a label would, and is well-conditioned when experts use structurally complementary decision functions.
- **Online conformal recalibration.** Online conformal prediction maintains coverage under streaming non-stationary data with bounded memory. One held-out distribution split, one maintenance loop — covering every threshold in the deployed system.

### Plan what to implement

The conceptual move is to treat justification failure as one problem with five faces, not five problems — fit on one held-out split, recalibrated on one cadence.

| Failure type      | What goes wrong                                               | Measurement                                                    |
| ----------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| **Label**         | Score does not track empirical accuracy on the minority class | Class-conditional ECE; per-class reliability diagrams          |
| **Input**         | Apparatus is not qualified on this input                      | Mondrian conformal coverage on a held-out split                |
| **Cross-process** | Orthogonal experts contradict each other                      | Inter-expert disagreement as a label-free recalibration signal |
| **Bayesian**      | An estimator inside the apparatus is uncertain on this input  | Online conformal cadence on the estimator's confidence radius  |
| **Deployment**    | The deployed objective drifts from the training objective     | Drift detection + online recalibration                         |

The joint-fitting requirement is not administrative. Fitting the five failure types separately risks inconsistent coverage thresholds — a conformal abstain rule calibrated on a clean split and a drift detector calibrated on a shifted split can simultaneously fire and suppress each other on the same input, voiding the operational coverage guarantee at exactly the moment a safety case needs it. The contribution is not a new failure family but the claim that these five share a single calibration apparatus, fit jointly and recalibrated on one schedule — and that treating them as separate problems, which the field does, breaks the coverage guarantee at exactly the place a safety case needs it.

## Question 2.2

> When multiple explainability methods produce different explanations for the same prediction, how should a practitioner determine which explanation to trust and for whom?

### Defining explainer disagreement

A new dimension appears the moment there is more than one decision-maker: **disagreement**. Keeping with the baseball analogy, picture three umpires — two calling from different positions, one with final say.

For any pitch, the two callers can diverge across each of the three axes from Q2.1. Grouping by Hamming weight gives the full picture:

| Axes in disagreement | Count | What it looks like                                                   |
| -------------------- | ----- | -------------------------------------------------------------------- |
| 0                    | 1     | Total alignment                                                      |
| 1                    | 3     | One axis diverges — the standard XAI-disagreement cases              |
| 2                    | 3     | Two axes diverge — agreement on the third is suspect, often unearned |
| 3                    | 1     | Nothing in common                                                    |

That's $2^3 = 8$ caller states. A real ensemble of $n$ experts pushes the caller side to $2^{3\binom{n}{2}}$ pairwise-divergence states; the judge's action space scales with the policy's options. Enumeration doesn't scale — the rest of this section collapses the space by naming the structural conditions that make disagreement informative, and the failure modes that leave it unearned.

The standard XAI move when two explainers disagree is to pick the more faithful or stable method [@krishna2024disagreement]. The move here is the opposite — to read the disagreement _as information_ about the input or the model. The reframe matters because the experts feeding those explainers are structurally orthogonal — discriminative classification on raw features, generative reconstruction over relational structure, physics residual on derived state. Two explainers disagreeing across these are reporting on different decision functions that the fusion policy combined. The operator's question is therefore not "which explainer wins" but "is this disagreement information or noise," and that question has a definite answer per sample, set by the architecture and the Q2.1 calibration apparatus.

Two literatures bracket the answer. The epistemic side runs from Aumann's agreement theorem [@aumann1976agreeing] — rational Bayesians with common priors cannot persistently disagree unless their information differs — through the equal-weight / steadfast debate [@christensen2007epistemology; @kelly2010peer; @feldman2006epistemological] to the failure mode where unresolved expert disagreement becomes manufactured doubt [@oreskes2010merchants; @black2024lessdiscriminatory]. The ML side runs from the Krogh–Vedelsby ambiguity decomposition [@krogh1995neural] — ensemble error equals average individual error _minus_ disagreement — through query-by-committee active learning [@seung1992query] and disagreement-as-generalization-signal [@jiang2022disagreement; @baek2022agreement] to the Rashomon literature [@breiman2001statistical; @marx2020predictive; @damour2022underspecification] where equally-accurate models disagree without information. Both literatures converge on three conditions for productive disagreement: independence, boundedness, resolvability.

### When disagreement carries information

- **Independence — the disagreers see different things.** The Krogh–Vedelsby ambiguity term collapses if ensemble members compute the same function, and Galton's wisdom-of-crowds [@galton1907vox; @surowiecki2004wisdom] depends on uncorrelated errors. Heterogeneous experts buy independence by construction — an attack that fools one is unlikely to fool all.
- **Boundedness — magnitudes are comparable across experts.** Two confidence numbers are operationally comparable only when they share a calibration scale — boundedness is violated when one expert's confidence lives on a raw softmax scale and another's on a Mondrian-corrected scale, because comparison then requires first mapping both to a common coverage probability. Without the Q2.1 joint-calibration vector, "the explainers disagree" reduces to vibes. Boundedness is the bridge from "two explainers said different things" to "the disagreement is N standard deviations above benign baseline."
- **Resolvability — there is a downstream protocol that converts disagreement to action.** Adversarial-collaboration protocols in psychology force disputing experts to design joint experiments rather than argue indefinitely [@mellers2001adversarial]; the operational analogue is conformal abstain (Q2.1), human review on flagged inputs, and a physics-based safety shield (Q4.1). Without one of these, disagreement degenerates into the manufactured-doubt failure mode — the existence of disagreement is enough to force a non-decision, and an adversary can exploit that gap [@black2024lessdiscriminatory; @mougan2024iso26262].

### When disagreement is noise

- **Correlated experts → false consensus.** Ensemble members trained on overlapping data with shared inductive biases agree more than independent reasoners would; the apparent consensus is a measurement artefact. The orthogonality argument above guards against it; the federated setting in Q3.2 reintroduces the risk when client populations are non-IID-but-correlated.
- **Predictive multiplicity / Rashomon.** Two models that fit the training distribution equally well give _different_ per-sample verdicts and different feature attributions [@breiman2001statistical; @marx2020predictive; @hsu2022rashomon]. There is no measurement that picks the right one. Black, Raghavan & Barocas show this is empirically near-universal and frame it as an accountability problem [@black2022model]; the partial-order construction over Rashomon-set explanations [@partialorder2023] keeps only what every near-optimal model agrees on.
- **Underspecification.** Pipelines reliably produce models with equivalent test loss but materially different out-of-distribution behaviour [@damour2022underspecification]. An explainer is faithful to its model, but a different realisation from the same pipeline would have produced different reasoning — the multiplicity is upstream of the explainer [@krishna2024disagreement].

The Rashomon risk is _not_ defused by the heterogeneity argument — it lives one level up, in the calibration vector itself. The Hsu–Calmon Rashomon Capacity functional [@hsu2022rashomon] and the partial-order construction [@partialorder2023] are the constructive directions: keep what the Rashomon set agrees on, refuse to rank what it doesn't. Of the three conditions, _independence_ is built (Q1.1 / Q1.2 orthogonality), _boundedness_ is in progress (Q2.1 joint calibration), and _resolvability_ is partial — the abstain rule and physics-based shield are specified, the deferral protocol and Rashomon partial order are not yet wired. Wiring the latter requires: (1) a Rashomon-set enumeration procedure bounded by $\epsilon$-loss equivalence on the calibration split, (2) computing the partial order over per-sample attributions across the set, and (3) routing any disagreement outside the partial order's consensus region to the conformal abstain rule rather than forcing a verdict.

### The operational diagnostic

Cross-reference fusion confidence (Q2.1) with explainer agreement to locate which condition has failed on a given input.

| Fusion confidence | Explainer agreement | Failed condition                                                      | Operational action                                                                                                                  |
| ----------------- | ------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| High              | High                | None — informative agreement                                          | Surface to operator; render per audience (below)                                                                                    |
| High              | Low                 | Independence and boundedness hold; the explainers themselves disagree | Run @adebayo2018sanity sanity checks; cross-validate against the Rashomon partial order [@partialorder2023]; do not blame the model |
| Low               | High                | The experts agree on uncertainty                                      | Defer to human review (Q2.1 selective prediction) — honest epistemic uncertainty                                                    |
| Low               | Low                 | Resolvability — disagreement _and_ uncertainty                        | Conformal abstain / route to physics-based safety shield (Q4.1) — OOD on the operative envelope                                     |

Three of four cells diagnose the model or the input rather than the explainers. The high-confidence + low-agreement cell is the only one that genuinely indicts the explainer methodology — and even there, the action is to consult the Rashomon partial order, not to pick a single winner. A complementary move: require _consensus on the disqualification direction_. If one explainer flags a feature as critical and another flags it as irrelevant, the conservative action is to treat the input as one whose decision relies on a contested feature, regardless of which explainer is "right."

### Example Case Study

The four-cell diagnostic produces a trust verdict per input; the verdict still has to be rendered for the consumer. Each audience asks a different question of the same trust state at a different abstraction.

| Audience                                | Decision                                              | Abstraction         | Renderer                                                                                                                                                                       |
| --------------------------------------- | ----------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fleet operator                          | "Is this alert real?"                                 | Case-based          | Prototype-based [@ProtoPNet; @PrototypeLearning]                                                                                                                               |
| Developer                               | "Which feature drove the prediction?"                 | Feature attribution | LIME [@LIME], SHAP [@SHAP]                                                                                                                                                     |
| Safety engineer (anomaly localisation)  | "Which structural component flagged?"                 | Component-level     | Reconstruction-error decomposition over graph structure                                                                                                                        |
| Safety engineer (concept-level)         | "Does the model behave correctly across a concept?"   | Concept geometry    | TCAV [@TCAV]                                                                                                                                                                   |
| ISO 26262 auditor [@ISO26262SafetyCase] | "Where is the failure-mode boundary?"                 | Counterfactual      | CF-GNNExplainer [@CFGNNExplainer] — counterfactuals are appropriate here because failure-mode boundaries are defined by the nearest decision flip, not by gradient magnitude   |
| NIST AI RMF [@NISTAIRisk]               | "Does the model meet trustworthy-AI characteristics?" | Aggregate           | Triangulation across all panels above, filtered through the Rashomon partial order [@partialorder2023] — only characteristics every near-optimal model agrees on are certified |

Each flagged input produces a single report with one panel per audience reading from the same trust state. The remaining contribution is wiring the four-cell logic and the Rashomon partial order into the maintenance loop alongside the Q2.1 calibration apparatus, so disagreement on a deployed input produces an action rather than a stalemate.
