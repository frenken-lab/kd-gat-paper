---
title: "2. Model Interpretability and Calibration"
---

## Scope of the chapter

Three axes determine whether a prediction supports a defensible safety case. They are independent: a prediction can be correct or wrong, justified or unjustified, explained or unexplained in any combination, and the safety case needs all three to be addressed.

| Axis | What it is | The question it answers | Treated in |
|---|---|---|---|
| **Correctness** | Outcome — did the prediction match the label? | Did we get this one right? | Training, experiments, ablations |
| **Justification** | Per-prediction warrant — was the apparatus entitled to assert this confidence given the input? | Should we trust this prediction? | Q2.1, threaded through Q1.1 (gates) and Q4.1 (reward proxy) |
| **Explanation** | Account of how the prediction was reached, rendered for a consumer | What do we tell the operator / auditor / engineer? | Q2.2 |

Q2.1 establishes when a prediction is *justified*. Q2.2 establishes how a justified or unjustified prediction is *explained*. Neither substitutes for the other — you do not explain away an unjustified prediction, and you do not refuse to explain a justified one.

## Question 2.1

> What does it mean for a model to "know what it doesn't know"? Discuss how confidence calibration should be evaluated and maintained in safety-critical, class-imbalanced settings.

### What "know what it doesn't know" means

A useful detector reports two things at once: a prediction, and how much weight to put on it. The second number is what "knowing what you don't know" actually amounts to — and on a CAN bus it has to do real work, because the cost of a false alert and the cost of a missed attack live on opposite ends of the same operating envelope. A 99% accurate detector that cannot tell the operator whether *this particular alert* is one of the 1% errors offers a confidence number that means nothing.

Post-Gettier epistemology [@gettier1963justified] gives two complementary criteria for *justification* — both per-prediction. **Reliabilism** [@goldman1979reliabilism] says a prediction is justified when produced by a process whose outputs track truth at the rate the process asserts; calibration is the engineering operationalisation. **Defeasibility** [@pollock1986contemporary; @lehrer1990knowledge] says it is justified when no fact about the input the process missed would undermine the conclusion; OOD detection is its operationalisation. Both have to hold: a reliably-trained classifier whose softmax matches accuracy on every class still loses justification once a regime change has invalidated its training distribution, and a justification produced by a broken process is Gettier-lucky, not warrant. The rest of this answer follows the reliabilist thread, because the question asks specifically about *evaluation* and *maintenance* — both reliability operations on the inference process. The justification-failure side closes the section in §4, where the joint calibration vector turns out to be the field's accumulated **inventory of justification failures**.

Beneath either criterion, uncertainty itself decomposes into two species that call for opposite operational responses [@kendall2017uncertainties].

| Type | Source | Reducible? | What "calibrated" looks like | Operational response |
|---|---|---|---|---|
| **Aleatoric** | Irreducible data noise — two CAN windows with identical byte profiles but different labels | No, even with infinite training data | Softmax near 0.5 on borderline cases | Trust the confidence; defer borderline cases for review |
| **Epistemic** | Model ignorance — finite training data, novel attack types, OOD inputs | Yes, shrinks with more / better data | Low confidence on OOD inputs — *not* a confident wrong answer | Abstain via OOD detection [@OODSurvey; @OODDetection]; route to a fallback |

The split lines up neatly with how a CAN IDS fails. Aleatoric uncertainty flags ambiguous benign/attack boundary windows. Epistemic uncertainty flags attacks the training data never contained — the unknown-attack case where any single specialist breaks down [@OODFailures].

Modern deep networks fail at both, and they fail in a predictable direction. @guo2017calibration documents the systemic version: max-softmax confidence routinely exceeds empirical accuracy, and the gap widens with depth and capacity — networks are overconfident by default. @ovadia2019trust carries the result over to distribution shift. Every post-hoc calibration method tested — temperature scaling, ensembles, MC-dropout, Bayesian methods — degrades under shift, but the *ranking* is preserved: deep ensembles and MC-dropout degrade most gracefully, isotonic regression worst. The structural takeaway is reliabilist — heterogeneous expert redundancy keeps the inference *process* reliable across the shift; a one-shot post-hoc fit on a clean calibration set is not a reliable process, it is a snapshot.

### Evaluation under class imbalance

Standard calibration practice — average ECE on a held-out split — falls apart on a 927:1 imbalance. Three fixes are required before any confidence-based selective-prediction rule means what its name suggests.

**Aggregate ECE hides the failure that actually matters.** Expected Calibration Error [@guo2017calibration] averages the gap between predicted confidence and empirical accuracy across confidence bins. When 99.89% of samples are benign, the benign bin dominates; a model accurate on benign and *miscalibrated on the minority class* still reports near-zero aggregate ECE. The minority class is precisely where miscalibration cost lives — a missed attack is a safety event. The fix is **class-conditional ECE** (per class, or *adaptive* ECE with equal-mass bins) alongside **reliability diagrams stratified by class**.

**Coverage-naive metrics hide selective-prediction failure.** The operating question for a safety-critical detector is not "what is the accuracy at 100% coverage?" but "what is the accuracy on the top-$k\%$ most confident predictions, and how does the curve behave in the tails?" — @geifman2017selective's risk-coverage framing. A well-calibrated model's curve is monotone decreasing in coverage; non-monotonicity means the confidence signal is unreliable precisely where the operator most needs it — the high-uncertainty tail flagged for human review or ECU shutdown.

**Conformal prediction for guaranteed coverage.** Neither ECE nor selective prediction gives a hard guarantee; both average over a held-out distribution. ISO 26262 ASIL C/D-equivalent claims need something stronger: a distribution-free coverage guarantee. Conformal prediction [@angelopoulos2023conformal] provides exactly that — given a calibration set and miscoverage rate $\alpha$, prediction sets achieve marginal coverage $\geq 1-\alpha$ by construction, no modelling assumptions. Under imbalance, *Mondrian* conformal prediction conditions on class for class-conditional coverage — the structural answer to the aggregate-ECE failure.

The evaluation protocol follows: temperature-scale on a held-out split; report class-conditional ECE, Brier score, per-class reliability diagrams; plot risk-coverage curves; fit Mondrian conformal predictors and report the per-class coverage gap.

### Maintenance under operational drift

A calibration guarantee that holds at deployment but not three months later is not a guarantee. Three operational pieces keep it alive.

- **Drift detection.** Confidence histograms and VGAE reconstruction-error distributions (§Composite VGAE Reconstruction Error) are monitored online via population stability index or Kolmogorov–Smirnov; drift past threshold triggers recalibration.
- **Re-calibration without labels.** Labelled drift events are rare in deployment; the most shift-resistant uncertainty signals — deep ensembles and MC-dropout [@ovadia2019trust] — need none. Disagreement *between* the GAT and VGAE confidences plays the role disagreement *with* a label would, and is already exposed in the 15-dim fusion state. The signal is well-conditioned because the branches use complementary decision functions — discriminative classification on the GAT, generative reconstruction on the VGAE, physics-residual on the PINN over structurally orthogonal estimated-state input — so attacks evading one are unlikely to evade all three.
- **Online conformal recalibration with joint gate refit.** Online conformal prediction maintains coverage under streaming non-stationary data with bounded memory, pairing with the streaming-detection direction in [](#subsec:Streaming). The same cadence handles the Q1.1 gate thresholds ($\tau_{\text{model}}$, $\tau_{\text{signal}}$, $\tau_{\text{ood}}$), which drift with the same statistics that drive classifier miscalibration — one held-out natural-distribution split, one maintenance loop.

### Where the signals live, and what's still to build

The pipeline already carries uncertainty-relevant signals. The measurement layer that turns them into a defensible coverage claim is the part still to build.

| Signal | What it carries | Where it lives |
|---|---|---|
| VGAE reconstruction error (composite: node + neighbour + CAN-ID) | OOD / epistemic score, useful for unknown-attack generalisation | [](#fig-reconstruction) |
| GAT softmax probability | Aleatoric (boundary) confidence; expected to be overconfident by default [@guo2017calibration] | §Methodology |
| 15-dim fusion state | All confidence signals in one place — the input to an uncertainty head | §Methodology |
| Neural-LinUCB UCB bonus | Directed exploration under epistemic uncertainty; bonus shrinks as $O(1/\sqrt{n_a})$ [@xu2022neural] | §Methodology |
| DQN fusion-weight distribution | Emergent attack-type-specific strategies (peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$); interpretable but not labelled by uncertainty | §DQN-Fusion Analysis |

Outstanding work: class-conditional ECE, per-class risk-coverage curves, and Mondrian conformal predictors on a held-out split — applied to the joint calibration vector enumerated in the [committee-questions index](index.md): classifier logits, per-expert competence gates (Q1.1 at tier 1; VGAE/GAT abstain thresholds at every tier), inter-branch disagreement (Q4.2), UCB confidence radius (Q4.1), reward proxy (Q4.1). Read through defeasibility, the vector is an **inventory of justification failures** — five places where a missed fact about the input would undermine an otherwise-reliable prediction. Each row is a kind of justification failure the field has handled separately: classifier miscalibration is a *label* failure (the score does not track empirical accuracy on the minority class); regime / signal / OOD violations at the physics gate are *input* failures (the apparatus is not qualified on this input); inter-branch disagreement is a *cross-process* failure (orthogonal experts contradict each other); the UCB radius is a *Bayesian* failure (the reward estimator is uncertain on this input); reward-proxy drift is a *deployment-time* failure — and the only entry in the inventory the policy creates in itself (see Q4.1). The contribution is not a new failure family. It is the claim that these five share a single calibration apparatus, fit jointly on one held-out split and recalibrated on one cadence — and that treating them as separate problems, which the field does, breaks the operational coverage guarantee at exactly the place a safety case needs it.

## Question 2.2

> When multiple explainability methods produce different explanations for the same prediction, how should a practitioner determine which explanation to trust and for whom?

### Defining explainer disagreement

Two explainers run on the same CAN window and return different attributions. The standard XAI move is to pick the more faithful method, the more stable one, or the one whose abstraction matches the audience [@krishna2024disagreement]. The move here is the opposite — to read the disagreement *as information* about the input or the model, and to pick a single explainer only when the architecture forecloses that reading. The reframe matters because the experts feeding those explainers are structurally orthogonal: GAT classifies on byte-level features, VGAE reconstructs neighbour structure, PINN checks a physics residual on estimated state. Two explainers disagreeing across these are not failing as XAI methods — they are reporting on different decision functions that the fusion policy combined. The operator's question is therefore not "which explainer wins" but "is this disagreement information or noise," and that question has a definite answer per sample, set by the architecture and the calibration apparatus from Q2.1.

Two literatures bracket the answer. The epistemic side runs from Aumann's agreement theorem [@aumann1976agreeing] — rational Bayesians with common priors cannot persistently disagree unless their information differs — through the equal-weight / steadfast debate over how to aggregate peer judgements [@christensen2007epistemology; @kelly2010peer; @feldman2006epistemological] to the political failure mode where unresolved expert disagreement becomes manufactured doubt [@oreskes2010merchants; @black2024lessdiscriminatory]. The ML side runs from the Krogh–Vedelsby ambiguity decomposition [@krogh1995neural] — ensemble error equals average individual error *minus* disagreement, so disagreement is mathematically part of accuracy under independence — through query-by-committee active learning [@seung1992query] and disagreement-as-generalization-signal [@jiang2022disagreement; @baek2022agreement] to the Rashomon / predictive-multiplicity literature [@breiman2001statistical; @marx2020predictive; @damour2022underspecification] where equally-accurate models disagree without information. Both literatures converge on three conditions for productive disagreement: independence, boundedness, resolvability.

### When disagreement carries information

Three conditions, each enforced (or not) by a specific piece of the architecture.

- **Independence — the disagreers see different things.** The Krogh–Vedelsby ambiguity term collapses if ensemble members compute the same function, and Galton's wisdom-of-crowds [@galton1907vox; @surowiecki2004wisdom] depends on uncorrelated errors. Heterogeneous experts buy independence by construction: discriminative classification on byte features, generative reconstruction over neighbour structure, physics residual on estimated state. An attack that fools one is unlikely to fool all three, and an explainer riding on each reports a different view of the same window.
- **Boundedness — magnitudes are comparable across experts.** Two confidence numbers are operationally comparable only when they share a calibration scale. Without the Q2.1 joint-calibration vector — class-conditional ECE, Mondrian conformal coverage, per-expert competence gates fit on a single held-out split — "the explainers disagree" reduces to vibes. Boundedness is the bridge from "two explainers said different things" to "the disagreement is N standard deviations above benign baseline."
- **Resolvability — there is a downstream protocol that converts disagreement to action.** Adversarial-collaboration protocols in psychology force disputing experts to design joint experiments rather than argue indefinitely [@mellers2001adversarial]; the IDS analogue is conformal abstain (Q2.1), human review on flagged windows, and the PINN safety shield (Q4.1). Without one of these, disagreement degenerates into the manufactured-doubt failure mode at the deployment layer — the existence of disagreement is enough to force a non-decision, and an adversary or a defendant can exploit that gap [@black2024lessdiscriminatory; @mougan2024iso26262].

### When disagreement is noise

Each condition has a corresponding failure mode in the literature. The three together cover when the four-cell diagnostic below is empty.

- **Correlated experts → false consensus.** The Galton failure case: ensemble members trained on overlapping data with shared inductive biases agree more than independent reasoners would, and the apparent consensus is a measurement artefact. The orthogonality argument above is what guards against it; the federated setting in Q3.2 reintroduces the risk when client populations are non-IID-but-correlated.
- **Predictive multiplicity / Rashomon.** Two models that fit the training distribution equally well give *different* per-sample verdicts and different feature attributions [@breiman2001statistical; @marx2020predictive; @hsu2022rashomon]. There is no measurement that picks the right one. Black, Raghavan & Barocas show this is empirically near-universal and frame it as an accountability problem [@black2022model]; the partial-order construction over Rashomon-set explanations [@partialorder2023] keeps only what every near-optimal model agrees on. In safety-critical scene understanding the gap between Rashomon-set explanations is large enough to produce operationally different ISO 26262 audits [@rashomonstreets2025].
- **Underspecification.** Pipelines reliably produce models with equivalent test loss but materially different out-of-distribution behaviour [@damour2022underspecification]. An explainer is faithful to its model, but a different realisation from the same pipeline would have produced a different reasoning — the multiplicity is upstream of the explainer. The empirical version: practitioners running LIME / SHAP / Integrated Gradients on the *same* model resolve the resulting disagreement by ad-hoc trust rather than principle [@krishna2024disagreement].

The Rashomon risk is *not* defused by the heterogeneity argument — it lives one level up, in the calibration vector itself. Two equally-accurate trainings of the same architecture can produce different per-sample weightings of the same five-object vector, and detecting when that has happened is the open piece. The Hsu–Calmon Rashomon Capacity functional [@hsu2022rashomon] and the partial-order construction over Rashomon-set explanations [@partialorder2023] are the constructive directions: keep what the Rashomon set agrees on, refuse to rank what it doesn't. Of the three conditions, *independence* is built (Q1.1 / Q1.2 orthogonality), *boundedness* is in progress (Q2.1 joint calibration), and *resolvability* is partial — the abstain rule and PINN shield are specified, the deferral protocol and Rashomon partial order are not yet wired.

### The operational diagnostic

Cross-reference fusion confidence (Q2.1) with explainer agreement to locate which condition has failed on a given window.

| Fusion confidence | Explainer agreement | Failed condition | Operational action |
|---|---|---|---|
| High | High | None — informative agreement | Surface to operator; render per audience (below) |
| High | Low | Independence and boundedness hold; the explainers themselves disagree | Run @adebayo2018sanity sanity checks; cross-validate against the Rashomon partial order [@partialorder2023]; do not blame the model |
| Low | High | The experts agree on uncertainty | Defer to human review (Q2.1 selective prediction) — honest epistemic uncertainty |
| Low | Low | Resolvability — disagreement *and* uncertainty | Conformal abstain / route to PINN safety shield (Q4.1) — OOD on the operative envelope |

Three of four cells diagnose the model or the input rather than the explainers. The high-confidence + low-agreement cell is the only one that genuinely indicts the explainer methodology — and even there, the action is to consult the Rashomon partial order, not to pick a single winner. A complementary move under disagreement: require *consensus on the disqualification direction*. If one explainer flags a feature as critical and another flags it as irrelevant, the conservative action is to treat the window as one whose decision relies on a contested feature, regardless of which explainer is "right."

### Delivery: rendering the trust state per audience

The same per-sample trust state is rendered at the abstraction the consumer can act on. The audience-explainer mapping is delivery, not the substantive answer.

| Audience | Decision | Abstraction | Renderer | Existing layer that already serves it |
|---|---|---|---|---|
| Fleet operator | "Is this alert real?" | Case-based | Prototype-based [@ProtoPNet; @PrototypeLearning] | DQN fusion-weight distributions ([](#fig-fusion)) — interpretable peaks at $\alpha \in \{0, 0.2, 0.4, 0.6, 0.8\}$ as attack-type-specific strategies |
| Developer | "Which feature drove the prediction?" | Feature attribution | LIME [@LIME], SHAP [@SHAP] | GAT attention weights ([](#fig-attention)) |
| Safety engineer (anomaly localisation) | "Which structural component flagged?" | Component-level | VGAE reconstruction decomposition | VGAE composite reconstruction error: node + neighbour + CAN-ID ([](#fig-reconstruction)) |
| Safety engineer (concept-level) | "Does the model behave correctly across a concept?" | Concept geometry | TCAV [@TCAV] | UMAP of GAT penultimate embeddings ([](#fig-umap)) |
| ISO 26262 auditor [@ISO26262SafetyCase] | "Where is the failure-mode boundary?" | Counterfactual | CF-GNNExplainer [@CFGNNExplainer] | None — added by [](#subsec:XAI) |
| NIST AI RMF [@NISTAIRisk] | "Does the model meet trustworthy-AI characteristics?" | Aggregate | Triangulation across the above + Rashomon partial order [@partialorder2023] | None — composed at the report layer |

Each flagged window produces a single report with one panel per audience reading from the same trust state. The remaining contribution is the diagnostic itself — wiring the four-cell logic and the Rashomon partial order into the maintenance loop alongside the Q2.1 calibration apparatus, so disagreement on a deployed window produces an action rather than a stalemate.
