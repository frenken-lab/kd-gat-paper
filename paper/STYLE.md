# Writing Style Guide — kd-gat-paper

This guide captures the prose targets for the paper, candidacy report, and committee-question answers in this repository. It is grounded in passages from writers whose prose works, plus passages from this paper's own draft that already work, with explicit counter-examples drawn from earlier revisions.

The methodology section comes first so the rules are auditable: every rule has to trace back to an exemplar quote and a counter-example. If a rule cannot, it is decoration and gets cut.

The methodology lives in this file (not in any model's weights) so any future editor — human or model — can extend the rules using the same procedure that produced them.

---

## 1. Methodology

How rules in this guide are added, validated, and removed.

### 1.1 Extract (per exemplar)

For each exemplar source — textbook chapter, blog post, paper section — read the piece in full and annotate at six scales:

- **Section-opener moves.** What does the first paragraph of a section actually do? (set stakes, give a concrete image, pose a question, frame a paradox, define a term, recap and pivot)
- **Paragraph shape.** Topic sentence → evidence → bridge. Length distribution. When does the writer use a list or table vs. prose?
- **Sentence-level cadence.** Sentence-length variance. Active vs. passive. Where citations and parentheticals land in the sentence.
- **Math/figure entry.** What does the prose do *before* the equation or figure, and *after* it? Is the equation introduced by name or by purpose?
- **Vocabulary register.** What jargon is defined vs. assumed? What concrete images recur? What metaphors are load-bearing?
- **Negative space.** What constructions never appear? (the LLM tells the writer refuses)

Every observation is pinned to an exact quote from the exemplar. No claim without an anchor passage.

### 1.2 Triangulate

A pattern enters the rules only if **at least two exemplars** do it. One-off tics are voice-specific to a single writer, not transferable rules.

Conflicts stay explicit. If Karpathy uses long looping sentences and Vaswani uses short declarative ones, the rule is "match cadence to register" with both examples quoted side-by-side, not flattened to a single sentence-length number.

### 1.3 Bite test against the draft

For each candidate rule, find a passage in this repository's own draft (committee questions, methodology, results, etc.) where the rule has *visible bite*: what specifically violates it now, and what specifically would change. If a rule has no observable effect on real prose in this repo, it is decoration. Cut it.

The bite test is the single most important step. It is the difference between a style guide that does work and a style guide that decorates the repo.

### 1.4 Bias check

For each rule, ask: does this explain something the editor *had to change* in revision, or something the editor would have written that way by default? If the latter, the rule is suspect — the editor's defaults are being laundered as policy.

Each surviving rule must be falsifiable. A reader should be able to mark a passage "violates rule N" with finger-pointing precision: which sentence, which clause, what the corrected version reads like.

### 1.5 Voice-anchor priority

When external-exemplar patterns conflict with the user's own voice anchors — passages of the user's writing he is happy with — voice anchors win. The external exemplars exist to expand the toolkit, not to overwrite the writer's voice.

### 1.6 Removal rule

A rule that has not bitten any draft revision in 30 days of editing is a candidate for removal. Style guides that grow without pruning become noise.

### 1.7 Where new rules come from

Three sources:

1. **Exemplar extraction** (§1.1–1.2) — patterns triangulated across writers.
2. **Editor feedback** — when the user corrects a revision with reasoning that generalizes, the correction becomes a candidate rule and follows §1.3–1.4.
3. **LLM-tell audits** — phrases or moves that show up disproportionately in machine-generated drafts and never in the exemplars enter the banned-tells list with a before/after.

---

## 2. Exemplars

| # | Source | Status |
|---|---|---|
| E1 | Distill — Olah & Carter, *Feature Visualization* | Extracted (§2.1) |
| E2 | Lilian Weng — *What are Diffusion Models?* | Extracted (§2.2) |
| E3 | Karpathy — *The Unreasonable Effectiveness of Recurrent Neural Networks* | Extracted (§2.3) |
| E4 | Zhang et al., *Dive into Deep Learning* — Ch. 1 (d2l.ai) | Extracted (§2.4) — substituted for Goodfellow Ch. 6 (fetch truncated) |
| E5 | 3Blue1Brown — *Essence of Linear Algebra: Vectors* | Extracted (§2.5) — substituted for Strang OCW (video metadata only) |
| E6 | Vaswani et al. — §3.1–3.2 of *Attention Is All You Need* | Extracted (§2.6) |
| V1 | Q2.1 opener of `interpretability-calibration.md` | Anchored (§2.7) |
| V2 | Q1.1 three-conditions structure of `physics-dynamics.md` | Anchored (§2.8) |
| V3 | Q2.1 §"Maintenance under operational drift" opener of `interpretability-calibration.md` | Anchored (§2.9) |
| V4 | Q1.2 §"compounding-uncertainty chain" closing of `physics-dynamics.md` | Anchored (§2.10) |
| V5 | Q1.2 closing of `physics-dynamics.md` (defensive-posture summary) | Anchored (§2.11) |

Triangulation has six external sources (E1, E2, E3, E4, E5, E6) plus five voice anchors (V1–V5). Rules in §3 cite ≥2 exemplars per the methodology.

### 2.1 E1 — Distill: Feature Visualization

Olah & Carter, *Feature Visualization*, Distill (2017). https://distill.pub/2017/feature-visualization/

**Section-opener moves.** Two patterns — declarative fact, and intuitive-attempt-then-subversion:

> "Neural networks are, generally speaking, differentiable with respect to their inputs."

> "If you want to visualize features, you might just optimize an image to make neurons fire. Unfortunately, this doesn't really work."

The second pattern is especially strong: pose the natural reader hypothesis, then immediately undermine it. Earns the rest of the section by giving the reader a problem to follow.

**Paragraph shape.** Conceptual goal, then concrete operationalisation:

> "If we want to understand individual features, we can search for examples where they have high values — either for a neuron at an individual position, or for an entire channel."

Paragraphs run 3–5 sentences; the piece alternates prose with labeled tables when explaining parallel concepts.

**Math / figure entry.** Names the object, defines notation inline, then states the formula:

> "Following that work, we begin by computing the Gram matrix G of the channels, where G_{i,j} is the dot product between..."

Captions interpret figures rather than describing them: e.g., "reveals four different, curvy facets." Prose does the work; the figure is the evidence, not the claim.

**Vocabulary register.** Anthropomorphic framing for technical phenomena:

> "These patterns seem to be the images kind of cheating, finding ways to activate neurons that don't occur in real life."

Recurring metaphors: geometric (basis vectors, activation space) and optimization (search, descent).

**Negative space.** Hedges replaced with direct admissions of uncertainty:

> "The diversity term can take a variety of forms, and we don't have much understanding of their benefits yet."

Notably absent: "furthermore," "it is worth noting that," apologetic qualifiers, inflated formality.

### 2.2 E2 — Lilian Weng: Diffusion Models

Weng, *What are Diffusion Models?* (2021). https://lilianweng.github.io/posts/2021-07-11-diffusion-models/

**Section-opener moves.** Direct formal setup; capability-gate framing:

> "Given a data point sampled from a real data distribution $\mathbf{x}_0 \sim q(\mathbf{x})$, let us define a forward diffusion process"

> "If we can reverse the above process and sample from $q(\mathbf{x}_{t-1} | \mathbf{x}_t)$, we will be able to recreate the true sample"

The "if we can ... we will be able to" pattern is a recurring move: framing each section around what becomes possible once a piece falls into place.

**Paragraph shape.** Implementation detail → empirical result → limitation, building momentum into the next improvement:

> "The forward variances are set to be a sequence of linearly increasing constants in [Ho et al. (2020)]... Diffusion models in their experiments showed high-quality samples but still could not achieve competitive model log-likelihood"

Paragraphs vary 2–3 sentences for technical micro-paragraphs to 8–12 for derivations. Prose is preferred over lists except for algorithm pseudocode.

**Sentence cadence.** Short setup followed by extended equations; citations mid-sentence in brackets:

> "Recall that Langevin dynamics can sample data points from a probability density distribution using only the score $\nabla_{\mathbf{x}} \log q(\mathbf{x})$ in an iterative process."

Causal openings ("Because they found that...") used as pivots, not "moreover."

**Math / figure entry.** Prose names the object, then equation restates formally; post-derivation prose summarises:

> "The step sizes are controlled by a variance schedule $\{\beta_t \in (0, 1)\}_{t=1}^T$." [equation follows]

> "Let's label each component in the variational lower bound loss separately:" [labeled equations follow]

**Vocabulary register.** Jargon assumed, intuitive framing alongside:

> "According to the manifold hypothesis, most of the data is expected to concentrate in a low dimensional manifold"

> "Zero convolutions protect this back-bone by eliminating random noise as gradients in the initial training steps."

Domain terms coexist with verbs that carry intuition ("protect," "eliminating noise"), bridging rigor and accessibility without condescension.

**Negative space.** Never uses "it is important to note," "interestingly," "as we shall see," "thus we have shown," "moreover." Transitions are structural (section headers, equation labels) not connective tissue.

### 2.3 E3 — Karpathy: RNN Effectiveness

Karpathy, *The Unreasonable Effectiveness of Recurrent Neural Networks* (2015). https://karpathy.github.io/2015/05/21/rnn-effectiveness/

**Section-opener moves.** Personal anecdote that names stakes:

> "There's something magical about Recurrent Neural Networks (RNNs). I still remember when I trained my first recurrent network..."

Voice anchor caveat: this opener is right for a popular blog post, wrong for a TMLR paper. The transferable move is "open with stakes," not "open with autobiography." (See §3 R1.)

**Paragraph shape.** Topic sentence establishes concept; example or code demonstrates; closing sentence pivots forward. Demonstration sections (Linux code, Shakespeare) are long blocks with brief analytical interjections.

**Sentence cadence.** Short declarative openings, then expansion:

> "A glaring limitation of Vanilla Neural Networks (and also Convolutional Networks) is that their API is too constrained..."

Active voice dominates; passive is rare and confined to definitional moments. Citations nest mid-sentence without breaking rhythm. Parentheticals add color or scope, not uncertainty.

**Math / figure entry.** Concrete scenario before formalism:

> "Here is an implementation of the step function in a Vanilla RNN:"

The problem is framed *before* the code block, making the notation purposeful rather than ornamental.

**Vocabulary register.** Recurring conceptual metaphor that grounds abstraction:

> "If training vanilla neural nets is optimization over functions, training recurrent nets is optimization over programs."

Technical terms introduced inline via apposition.

**Negative space.** No "furthermore," "thus," "moreover." Observations stated as discoveries ("I've witnessed their power") rather than claims requiring softening. Paragraphs end decisively; no trailing "further research needed" deflections.

### 2.4 E4 — Zhang et al., Dive into Deep Learning, Ch. 1

Zhang, Lipton, Li, Smola, *Dive into Deep Learning*, Ch. 1 Introduction. https://d2l.ai/chapter_introduction/index.html

This source replaces the originally-planned Goodfellow Ch. 6, whose deeplearningbook.org HTML page exceeds the WebFetch extractor's context limit (Ch. 1 / intro pages hit the same truncation). d2l.ai is split into per-section HTML pages, which fit. Both books occupy the same "textbook discipline; definitions before notation" slot.

**Section-opener moves.** Historical contrast that pivots to the new paradigm:

> "Until recently, nearly every computer program that you might have interacted with during an ordinary day was coded up as a rigid set of rules..."

> "Fortunately for the growing community of machine learning scientists, many tasks that we would like to automate do not bend so easily to human ingenuity."

The opener gives the reader something to push off from (rule-based programming) and pivots to why ML is necessary. No "in this chapter we" scaffold.

**Paragraph shape.** Exposition → bulleted concrete scenarios; paragraphs run 100–200 words and break into lists before cognitive load peaks. Lists are used for parallel concrete examples ("Write a program that predicts tomorrow's weather..."), continuous prose elsewhere.

**Sentence cadence.** Short declaratives follow longer complex sentences for rhythmic emphasis:

> "For these problems, even elite programmers would struggle to code up solutions from scratch. The reasons can vary."

Mid-sentence "in other words" restatements signal that clarity, not elegance, is the goal.

**Math / figure entry.** Concrete sensory detail before notation:

> "the microphone will collect roughly 44,000 samples. Each sample is a measurement of the amplitude of the sound wave. What rule could map reliably from a snippet of raw audio to confident predictions {yes, no}..."

Numbers and physical setup ground the math before the symbols arrive. Figures introduced with forward-facing context ("as illustrated in Fig. 1.1.1"), not backward references.

**Vocabulary register.** Technical terms paired with domestic metaphors:

> "You can think of the parameters as knobs that we can turn, manipulating the behavior of the program."

Recurring concrete images: knobs (parameters), the whiteboard (design process), the mushroom and the death-cap (decision under uncertainty). Each metaphor anchors one abstract idea.

**Negative space.** No "moreover," "furthermore," "it is interesting to note," "one might say." Direct imperatives ("Imagine," "Consider") and colloquial connectors ("Say that," "Well,") instead.

### 2.5 E5 — 3Blue1Brown, Essence of Linear Algebra: Vectors

Sanderson (3Blue1Brown), *Vectors, what even are they?* https://www.3blue1brown.com/lessons/vectors

This source replaces the originally-planned Strang OCW Lecture 1, whose page is video metadata with no transcript. 3Blue1Brown's lesson page has full prose alongside the video. Both occupy the "concrete-first pedagogy" slot.

**Section-opener moves.** Stakes-by-necessity, not curiosity:

> "The fundamental building block for linear algebra is the vector, so it's worth making sure we're all on the same page about *what* exactly a vector *is*."

The opener tells the reader why this needs to be settled before anything else. Not "let's define a vector" — "we have to agree on this or the rest fails."

**Paragraph shape.** Announce a structural taxonomy, then elaborate each branch:

> "You see, broadly speaking there are three distinct-but-related interpretations of vectors, which I'll call the physics student perspective, the computer science perspective, and the mathematician's perspective."

The three perspectives become the spine of the rest of the lesson — the same heading-promises-structure move as V2 in the user's draft.

**Sentence cadence.** Short definitional claims alternate with longer conditional sentences:

> "What defines a given vector is its length and the direction it's pointing, but as long as those two facts are the same you can move it around and it's still the same vector."

Contrasting "but" clauses create pivot points where nuance is added without a separate transition word.

**Math / figure entry.** Method in motion before notation:

> "When you take their vector sum using this tip to tail method, you can think of a four step path from the tail of the first to the tip of the second: Walk 1 to the right, then 2 up, then 3 to the right, then 1 down."

Prose narrates the operation step by step before any symbols. The equations arrive as formalisation of an action already understood.

**Vocabulary register.** Jargon paired with colloquial anchoring:

> "In the lingo, you'd be modeling houses as two-dimensional vectors, where 'vector' is pretty much a fancy word for list, and what makes it two-dimensional is the fact that its length is two."

"Lingo" is acknowledged as such; "fancy word for list" gives the reader an instant intuitive grip.

**Negative space.** No "arguably," "it could be said," "moreover," "furthermore," no apologetic framing:

> "In truth, it doesn't matter whether you think of vectors as fundamentally being arrows in space that happen to have a nice numerical representation, or fundamentally as lists of numbers that happen to have a nice geometric interpretation."

"In truth" earns its place because it pivots to a settling conclusion, not a hedge.

### 2.6 E6 — Vaswani et al., Attention §3.1–3.2

Vaswani et al., *Attention Is All You Need* (2017), §3.1–3.2. https://arxiv.org/html/1706.03762v7

**Section-opener moves.** Definition-first; abstract-frame-first.

> "The encoder is composed of a stack of N=6 identical layers." (§3.1)

> "An attention function can be described as mapping a query and a set of key-value pairs to an output, where the query, keys, values, and output are all vectors." (§3.2)

No motivation precedes the definition. The heading is enough; the opener gets to work.

**Paragraph shape.** Short and densely packed. The Encoder subsection is one paragraph: definition (1 sentence), two sub-layers (2 sentences), residual connection formula (1 sentence), dimension justification (1 sentence). No topic-sentence scaffold; facts accumulate.

**Sentence cadence.** Variance is minimal — most sentences run 15–20 words, declarative, active. Parentheticals are rare. Citations cluster at paragraph ends. One long sentence in §3.2.1 is offloaded to a footnote rather than swelling the main clause.

**Math / figure entry.** Single procedural sentence before the equation:

> "In practice, we compute the attention function on a set of queries simultaneously..."

Equation (1) follows immediately, then two comparison paragraphs (dot-product vs. additive attention) and a footnote-heavy justification of the scaling. The formula is embedded in narrative flow, not enshrined.

**Vocabulary register.** Technical terms assumed, not defined inline ("residual connection," "layer normalization," "softmax," "dot-product attention"). One exception: "auto-regressive" gets one inline gloss. Concrete imagery is physical/geometric (stacking, projection, masking).

**Negative space.** Never uses "it has been argued," "one might expect," "it is well known," "moreover," "thus," "in conclusion," rhetorical questions, or motivation-through-contrast. The writing moves forward; it rarely pauses to justify choices retrospectively.

### 2.7 V1 — Q2.1 opener (operating-envelope image)

`paper/candidacy/committee-questions/interpretability-calibration.md` lines 9–22 (post-revision, 2026-04-27).

> "A useful detector reports two things at once: a prediction, and how much weight to put on it. The second number is what 'knowing what you don't know' actually amounts to — and on a CAN bus it has to do real work, because the cost of a false alert and the cost of a missed attack live on opposite ends of the same operating envelope. A 99% accurate detector that cannot tell the operator whether *this particular alert* is one of the 1% errors offers a confidence number that means nothing.
>
> Two distinct things drive that uncertainty, and they call for opposite responses [@kendall2017uncertainties]. [comparison table follows]"

**Moves.**

- *Stakes-image opener:* the operating-envelope image gives the abstract claim ("calibration matters in safety-critical settings") something physical to hold.
- *Two-numbers framing:* the section is structured around "the second number," which threads through the rest.
- *Concrete pivot:* the 99% example makes the abstract claim falsifiable in one sentence.
- *Earns the table:* the bridge sentence ("Two distinct things drive that uncertainty, and they call for opposite responses") names what the table is for. The table is no longer cold-dropped.

This is the user's own demonstration that R1 + R2 + R7 (see §3) can land together in a single opener.

### 2.8 V2 — Q1.1 three-conditions structure

`paper/candidacy/committee-questions/physics-dynamics.md` lines 9–11.

> "### Three conditions for trusting physics
>
> Trust physics only when *all three* of the following hold; the moment any one fails, the data-driven experts (GAT, VGAE) should dominate."

**Moves.**

- *Heading promises a structure* (three conditions, not "considerations" or "factors").
- *Opener names the structure* and delivers the rule ("Trust physics only when all three") in the first six words.
- *Earns the numbered list:* the list isn't decoration; it is the body of the promise.
- *Concrete pivot in the same sentence:* "the moment any one fails" — direct, operational, no hedge.

This is the user's demonstration that headings, openers, and lists can collaborate. R1 (commit immediately) + R2 (earn what follows) read as one move here.

### 2.9 V3 — Q2.1 §"Maintenance under operational drift" opener (tautology-landing)

`paper/candidacy/committee-questions/interpretability-calibration.md` line 38 (post-revision, 2026-04-27).

> "A calibration guarantee that holds at deployment but not three months later is not a guarantee. Three operational pieces keep it alive."

**Moves.**

- *Tautology-landing opener:* "X that doesn't hold is not X" forces a definitional revisit. The circularity is rhetorical, not logical — *guarantee* carries an implicit temporal scope, and the opener makes that scope visible in one sentence.
- *Three earns the bullets:* the second sentence commits to a count ("three operational pieces") rather than a hedge ("several considerations"). V2's commit-to-structure move in bridge form.
- *Two-sentence opener doing R1 + R2 together:* sentence one earns the heading by reframing what *maintenance* requires; sentence two earns the apparatus.

V3 demonstrates that R1 admits a tautology-landing form alongside V1's stakes-image form — two distinct opener shapes under the same rule.

### 2.10 V4 — Q1.2 §"compounding-uncertainty chain" closing (em-dash X-not-Y reframe)

`paper/candidacy/committee-questions/physics-dynamics.md` line 87.

> "The trade-off — and why this is a security boundary, not a preprocessing step — is that each new stage adds an attack surface that the byte-level GAT/VGAE pipeline does not expose."

**Moves.**

- *Mid-sentence frame correction:* the em-dashes interrupt the trade-off claim to insert "and why this is a security boundary, not a preprocessing step." The reader's mental model is corrected mid-sentence rather than after the fact.
- *X-not-Y inside the dashes:* "security boundary, not a preprocessing step" forces the reader to commit to one frame and reject the other in five words.
- *Closing clause carries the consequence:* "an attack surface that the byte-level GAT/VGAE pipeline does not expose" lands what the reframing earned.

V4 demonstrates a sentence-internal move not currently named in §3 — the em-dash X-not-Y reframe as paragraph-closing landing. Candidate seed for a future rule once a second exemplar with the same move is identified.

### 2.11 V5 — Q1.2 closing (register-shift closer)

`paper/candidacy/committee-questions/physics-dynamics.md` line 122.

> "...the tier-based weighting limits the blast radius — a tier-3 deployment (ByCAN extraction) caps PINN contribution at $\lambda_{\max} = 0.3$, so even total estimator compromise cannot drive the fusion decision more than 30%. This is a structural-defence-in-depth argument rather than a cryptographic one."

**Moves.**

- *Concrete bound under abstract phrase:* "limits the blast radius" → "$\lambda_{\max} = 0.3$" → "30%". R6's concrete-images discipline in three escalating steps — abstract image, formal cap, plain-English consequence.
- *Register-shift closer:* "This is a structural-defence-in-depth argument rather than a cryptographic one." The closing sentence names the *kind* of argument just made, directing the reader's takeaway. Distinct from naming the content.
- *X-rather-than-Y in the closer:* "structural ... rather than cryptographic" forces the reader to retain the right frame for what was just shown.

V5 demonstrates the register-shift closer as paragraph-close discipline. Karpathy's "training recurrent nets is optimization over programs" does the same kind of work. Candidate for promotion to a §3 rule (R8: paragraph closers name the argument's *kind*) once a second exemplar is identified.

---

## 3. Rules

Six rules. Each cites at least two exemplars and points at a specific passage in this repo where it has bite. Rules are revisable — the change log (§6) tracks edits.

### R1 — Section openers commit immediately

**What it says.** The first paragraph of a section does real work: set stakes, name a structure, give a concrete image, define a term, or pose a question. It does not say "In this section we will..." or "In what follows we present..." or any other scaffolding sentence. The heading already promised the topic; the opener earns it.

**Why.** Scaffolding sentences are pure noise. The reader has accepted the question or answer by reading the heading (R7 makes that promise concrete). Restating the topic wastes the most attention-rich position in the section.

**Anchors.**
- Vaswani §3.1: "The encoder is composed of a stack of N=6 identical layers." (definition-first)
- Distill: "If you want to visualize features, you might just optimize an image to make neurons fire. Unfortunately, this doesn't really work." (intuitive setup → subversion)
- Weng: "Given a data point sampled from a real data distribution $\mathbf{x}_0 \sim q(\mathbf{x})$, let us define a forward diffusion process" (formal setup, no preamble)
- d2l.ai: "Until recently, nearly every computer program that you might have interacted with during an ordinary day was coded up as a rigid set of rules..." (historical contrast that pivots)
- 3B1B: "The fundamental building block for linear algebra is the vector, so it's worth making sure we're all on the same page about *what* exactly a vector *is*." (stakes-by-necessity)
- V1: "A useful detector reports two things at once: a prediction, and how much weight to put on it." (stakes by image)
- V2: "Trust physics only when *all three* of the following hold." (commits to the structure in six words)
- V3: "A calibration guarantee that holds at deployment but not three months later is not a guarantee." (tautology-landing opener)

**Bite.** Q2.1 §"What 'know what it doesn't know' means" was previously: *"A model 'knows what it doesn't know' when its probabilistic output separates two qualitatively different kinds of uncertainty and communicates each honestly to downstream consumers. The canonical decomposition, formalised in the Bayesian deep-learning literature, is: [bullets]."* The opener was a cold definition handing off to a list. The revision (V1) opens with the operating-envelope image and earns the table.

**Counter-example.**
> "In this subsection we discuss how to evaluate calibration under class imbalance. There are several considerations."

Both sentences are scaffold. Cut. The heading already says "Evaluation under class imbalance"; the body should start working.

### R2 — Earn every list, table, and equation

**What it says.** A bulleted list, table, or display equation in the body of a section is only valid if the prose immediately preceding it sets up *what work the apparatus does*. Heading → bullet list with no setup paragraph is a violation. Heading → opener that names the structure → list/table is the right shape.

**Why.** Apparatus dropped without setup makes the reader do the work of figuring out why it's there. The opener-paragraph + apparatus pattern is *the* most-triangulated move across the exemplars.

**Anchors.**
- V1: opener paragraph names "two distinct things drive that uncertainty" → comparison table.
- V3: "Three operational pieces keep it alive." → bullet list of drift-detection / re-calibration / online-conformal pieces. The bridge sentence commits to the count and the apparatus follows.
- Distill: prose lays out the optimization-as-search frame, then a labeled table of objectives.
- Vaswani: "In practice, we compute the attention function on a set of queries simultaneously..." → Equation (1) → comparison paragraphs.
- Weng: "Let's label each component in the variational lower bound loss separately:" → labeled equations.

**Bite.** Q2.1's old aleatoric/epistemic block dropped a bulleted list as the section's first apparatus. The fix added a stakes-paragraph + bridge sentence and replaced the bullets with a comparison table.

**Counter-example.**
> "### Maintenance under operational drift
>
> - Drift detection. ...
> - Re-calibration without labels. ..."

Heading → bullets is wrong order. The revision added: *"A calibration guarantee that holds at deployment but not three months later is not a guarantee. Three operational pieces keep it alive."* — opener earns the bullets.

### R3 — Math is embedded in narrative, not set apart

**What it says.** Prose names the mathematical object by purpose before the equation appears. The equation formalises what the prose already said. Prose continues from the equation, sometimes summarising what just happened. Equations are not introduced by "we have," "the following equation shows," or "consider the following." They are introduced by what they are *for*.

**Why.** Equations dropped without prose preamble force the reader to re-derive the author's intent. The before/after sentences are where understanding lives — they tell the reader what to take away from the symbols.

**Anchors.**
- Vaswani: "In practice, we compute the attention function on a set of queries simultaneously..." → Equation (1) → "The two most commonly used attention functions are additive attention, and dot-product attention." (the post-equation prose contrasts what the equation just defined.)
- Weng: "The step sizes are controlled by a variance schedule $\{\beta_t \in (0, 1)\}_{t=1}^T$." → equation; later, post-derivation: "Let's label each component in the variational lower bound loss separately:" → labeled result.
- Distill: "we begin by computing the Gram matrix G of the channels, where G_{i,j} is the dot product between..." → formula. Names the object and its index convention before the symbols.
- d2l.ai: "the microphone will collect roughly 44,000 samples. Each sample is a measurement of the amplitude of the sound wave." → "What rule could map reliably from a snippet of raw audio to confident predictions {yes, no}..." Sensory grounding before any formalism.
- 3B1B: "Walk 1 to the right, then 2 up, then 3 to the right, then 1 down." Narrates the operation as a walk before introducing coordinates.

**Bite.** Q2.2's deletion-AUC / insertion-AUC equations follow the rule already: *"Formally, with f the model, x the input, and E(x) ranking components by importance:"* names the variables before the equation. Keep this pattern when adding new methodology equations.

**Counter-example.**
> "The following equation captures the idea: $\mathrm{ECE} = \sum_b \frac{|B_b|}{n}|\mathrm{acc}(B_b) - \mathrm{conf}(B_b)|$."

"The following equation" tells the reader nothing about purpose. Replace with: *"ECE is an average over confidence bins of the gap between predicted confidence and empirical accuracy:"* — purpose first, symbols second.

### R4 — State limits in plain words; never use hedge phrases

**What it says.** When acknowledging uncertainty, scope, or open problems, name them directly. Never use: "it is well known that," "one might argue," "as we shall see," "thus we have shown," "moreover," "furthermore," "it is important to note," "interestingly," "naturally," "clearly," "obviously," "notably," "it is worth noting that." These are LLM tells. They add tokens without information.

**Why.** Skilled writers state limits in plain terms ("the diversity term can take a variety of forms, and we don't have much understanding of their benefits yet") rather than dressing them up. The hedge phrases above are conspicuously absent from every external exemplar.

**Anchors.**
- Distill: "The diversity term can take a variety of forms, and we don't have much understanding of their benefits yet." (states the limit; no hedge)
- Karpathy: "I've witnessed their power..." (claims observation as discovery; no softening)
- Vaswani: spare and forward-moving; no "in conclusion" or "as we shall see" anywhere in §3.
- Weng: moves problem → solution without "furthermore" or "moreover."
- d2l.ai: uses imperatives ("Imagine," "Consider") and colloquial connectors ("Say that," "Well,") instead of "moreover" / "it is interesting to note."
- 3B1B: "In truth, it doesn't matter whether you think of vectors as fundamentally being arrows in space..." — direct settling claim, not a hedge.

**Bite.** Q2.1 dropped *"Both results directly motivate the ensemble design used here"* — a self-justifying transition that read as marketing. The revision: *"The structural takeaway is that heterogeneous expert redundancy is what buys calibration *under shift*; a one-shot post-hoc fit on a clean calibration set does not."*

**Counter-example.**
> "Moreover, it is important to note that this calibration approach has limitations under distribution shift. Naturally, future work will need to address these."

Cut "moreover," "it is important to note that," "naturally," and the entire second sentence (it commits to nothing). The remaining direct claim: *"This calibration approach has limitations under distribution shift."*

### R5 — Citations support specific claims; they do not decorate

**What it says.** Each citation must be in service of a specific claim. Place mid-sentence so it does not disrupt cadence, or at paragraph end if it is a bibliographic block. Do not stack 4+ citations in a row without each contributing a distinct claim. Do not cite to dress up an unsupported assertion.

**Why.** Decorative citations create the appearance of evidence without the substance. They are a research-paper-LLM tell.

**Anchors.**
- Weng: "[Ho et al. (2020)]" mid-sentence in brackets, never disrupting clause flow; each citation supports a specific empirical or methodological claim.
- Vaswani: citations cluster at paragraph ends, in service of paragraph-scope claims.
- Karpathy: citations nested mid-sentence; never decorative.

**Bite.** Q2.1 originally cited [@guo2017calibration; @ovadia2019trust] back-to-back as if interchangeable. The revision threads them: Guo documents systemic overconfidence; Ovadia extends to distribution shift. Each citation now supports a distinct claim. Q2.2's [@LIME; @SHAP; @TCAV; @ProtoPNet; @CFGNNExplainer] stack should be audited next pass — five citations in one place is a smell.

**Counter-example.**
> "Calibration is a serious problem [@A; @B; @C; @D; @E]."

Five citations for one assertion is decoration. Either pick the canonical reference and quote what it actually shows, or break the claim into the parts each citation specifically supports.

### R6 — Concrete images carry abstract claims

**What it says.** When making a structural or abstract claim, attach a concrete image — physical, geometric, operational, or analogical. "The cost of a false alert and the cost of a missed attack live on opposite ends of the same operating envelope" outperforms "calibration matters in safety-critical settings" because the reader has something to hold.

**Why.** Abstract claims slide off the reader. Concrete images stick. This is the Karpathy / Olah signature, and it is what the user's V1 opener already does.

**Anchors.**
- Karpathy: "If training vanilla neural nets is optimization over functions, training recurrent nets is optimization over programs." (geometric metaphor that grounds the rest of the post)
- Distill: "These patterns seem to be the images kind of cheating, finding ways to activate neurons that don't occur in real life." (anthropomorphic image; sticks)
- V1: "the cost of a false alert and the cost of a missed attack live on opposite ends of the same operating envelope" (operational image)
- V2: "the moment any one fails" (concrete pivot in a structural rule)
- V5: "the tier-based weighting limits the blast radius — ... caps PINN contribution at $\lambda_{\max} = 0.3$ ... cannot drive the fusion decision more than 30%" (abstract image → formal cap → plain-English consequence)
- d2l.ai: "You can think of the parameters as knobs that we can turn, manipulating the behavior of the program." (domestic metaphor for an abstract concept)
- 3B1B: "'vector' is pretty much a fancy word for list" (jargon defused with colloquial anchoring)

**Bite.** The Q2.1 opener replaced *"separates two qualitatively different kinds of uncertainty and communicates each honestly to downstream consumers"* (abstract, soft) with the operating-envelope image (concrete, falsifiable).

**Counter-example.**
> "In safety-critical applications, calibration is of paramount importance."

No image; abstract; entirely deletable. Replace with the specific cost being paid, the specific operator action being denied, or the specific failure mode being courted.

**Image inventory** (positive companion to R6). Recurring archetypes from §2 and the V-anchors. Scan this list before reaching for an abstract noun — the rule is "pick from the palette," not the platitude "be concrete."

| Archetype | Example | Source |
|---|---|---|
| Anthropomorphism | "these images cheating, finding ways to activate neurons that don't occur in real life" | Distill (E1) |
| Domestic objects | "parameters as knobs that we can turn" | d2l.ai (E4) |
| Code / programs | "training recurrent nets is optimization over programs" | Karpathy (E3) |
| Geometry / operating envelope | "opposite ends of the same operating envelope" | V1 |
| Walks / paths | "Walk 1 to the right, then 2 up..." | 3B1B (E5) |
| Stacking | "stack of N=6 identical layers" | Vaswani (E6) |
| Failure / threshold | "the moment any one fails" | V2 |
| Load-bearing / structural | "the pathology becomes load-bearing" | Q4.2 of `reinforcement-learning.md` |
| Blast radius / containment | "the tier-based weighting limits the blast radius" | V5 |

The list extends as new archetypes get triangulated across exemplars and V-anchors. Mechanical use under deadline: when the next sentence wants an abstract structural noun, scan this list first.

### R7 — Section arc: heading is the question or its answer; body is setup → solution

**What it says.** Each section answers one specific question. The heading is *either* the question (`What is reward shift?`) *or* the answer/concept being defined (`Defining reward shift`, `The simplex argument against discrete grids`, `Three conditions for trusting physics`). Topic-shaped headings are out: `Reward shift in this framework`, `About reward shift`, `Considerations for reward shift`. After the heading, the body walks setup → solution in that order — smooth, brief, and the exit lands rather than trailing off.

**Why.** Topic headings leave the reader to infer what question is being answered. That work belongs to the writer. Forcing the heading to be question-shaped or answer-shaped forces the writer to think backwards from what the reader needs — which is the discipline that produces pedagogical prose. The setup→solution body arc is the most-triangulated section structure across the exemplars. (LLM-specific note: this rule exists partly because language-model writers do not naturally pose a reader's question before generating tokens; R7 operationalises the discipline so the prose can't drift back to topic-mode.)

**Anchors.**
- **3B1B**: the lesson title itself is *"Vectors, what even are they?"* — the heading *is* the question.
- **V2** (`physics-dynamics.md` Q1.1): `### Three conditions for trusting physics` — heading names the answer (the structure); the section delivers it.
- **Distill**: section opens with *"If you want to visualize features, you might just optimize an image to make neurons fire. Unfortunately, this doesn't really work."* — paragraph arc is question (how to visualise?) → setup (the obvious approach) → answer (it doesn't work).
- **d2l.ai**: section openers move historical contrast (setup) → why ML works here (solution) — same arc inside each section.

**Bite.** Q4.1 §1 was originally `### What "reward shift" means in this framework` (topic + framework-localiser). The first audit pass cut "in this framework" → `### What "reward shift" means here` — fixed B7 but heading was still topic-shaped. Editor pushback on that pass: *"open should be like 'Defining reward shift' or 'What is reward shift'"* — i.e., the heading must commit to a question or answer, not a topic. Final: `### Defining reward shift`. The body already had setup→solution structure (proxy → notation → decomposition → two terms); the heading now matches.

**Counter-examples.**
> `### Reward shift in this framework`
> `### About reward shift`
> `### Considerations for reward shift`

All three are topic labels. The reader has to read the body to know what question is being answered. Replace with: `### What is reward shift?` / `### Defining reward shift` / `### Why the deployed reward differs from training`.

---

## 4. Banned LLM tells

Phrases or moves that appear in machine-generated drafts and never in the four extracted exemplars. Each entry has the offending construction, why it's a tell, and a before/after either drawn from this repo's revision history or reconstructed faithfully.

### B1 — "The canonical X" / "the canonical decomposition"

**Why it's a tell.** Academic puffery. "Canonical" rarely adds information; usually the writer means "standard" or "most-cited," and even those are usually deletable.

**Before.**
> "The canonical decomposition, formalised in the Bayesian deep-learning literature, is..."

**After.**
> "Two distinct things drive that uncertainty, and they call for opposite responses."

### B2 — "exactly the failure mode that motivates"

**Why it's a tell.** Self-justifying. The reader can draw the connection between the problem and the solution; saying "exactly the failure mode that motivates X" forecloses their interpretation and feels like marketing.

**Before.**
> "Epistemic uncertainty flags attacks we have not seen during training — exactly the 'specialist weakness' failure mode that motivates the ensemble."

**After.**
> "Epistemic uncertainty flags attacks the training data never contained — the unknown-attack case where any single specialist breaks down."

### B3 — "directly motivates the design used here" / "the framework already exposes"

**Why it's a tell.** Self-promotion in answer to a substantive question. The reader asked about X; answering "and our framework does X" reframes the question as an opportunity to market.

**Before.**
> "Both results directly motivate the ensemble design used here." / "The framework already exposes uncertainty-relevant signals at multiple points."

**After.**
> "The structural takeaway is that heterogeneous expert redundancy is what buys calibration under shift." / "Where the signals live, and what's still to build" (heading reframed away from boast).

### B4 — "moreover," "furthermore," "thus we see," "it is important to note that," "as we shall see"

**Why it's a tell.** Stalling transitions. None of the four exemplars uses any of these. They add tokens without advancing the argument.

**Before.**
> "Moreover, it is important to note that this calibration approach has limitations under distribution shift."

**After.**
> "This calibration approach has limitations under distribution shift." (And often even this sentence can be cut if the limitation is named elsewhere.)

**Connector-verb vocabulary** (positive companion to B4). B4 bans the bad connectors. The list below is a starter palette of positive linking verbs that did real work in this repo's prose. When B4 catches a bad connector, the writer needs a replacement; this is the starter set.

| Verb | What it links | Example |
|---|---|---|
| *admits* | abstract → concrete instantiation | "That posterior admits two operational forms here" |
| *rides on* | new claim → existing substrate | "each strategy rides on pieces already built" |
| *carries* | role → mechanism | "the table shows which piece carries which strategy" |
| *limits / caps* | claim → quantitative bound | "the tier-based weighting limits the blast radius"; "caps PINN contribution at $\lambda_{\max} = 0.3$" |
| *and therefore* | mechanism → consequence (sentence-merger) | "...is enforced exogenously regardless of what the policy learned, and therefore the trust score does double duty" |
| *amounts to* | technical term → reader-meaning | "what 'knowing what you don't know' actually amounts to" |
| *plays the role of* | analogy / functional swap | "disagreement between GAT and VGAE confidences plays the same role as disagreement with a label" |

Add to this list as new linking verbs are spotted in revisions; tag each by what it links so the palette stays tool-shaped, not vocabulary-shaped.

### B5 — "honestly to downstream consumers" / "communicates honestly"

**Why it's a tell.** Corporate-speak. "Honestly" applied to a probabilistic output is anthropomorphism without payoff.

**Before.**
> "...communicates each honestly to downstream consumers."

**After.**
> "...has to do real work, because the cost of a false alert and the cost of a missed attack live on opposite ends of the same operating envelope."

### B6 — "naturally," "clearly," "obviously," "notably"

**Why it's a tell.** Empty intensifiers. They tell the reader how to feel about the claim instead of letting the claim earn its own reaction. If something is clear, it does not need to be labeled clear.

**Before.**
> "Naturally, the next step is conformal recalibration. Clearly, this generalises to the streaming case."

**After.**
> "The next step is conformal recalibration; it generalises to the streaming case."

### B7 — "in this section / paper, we propose / discuss / present"

**Why it's a tell.** Restates the heading. Wastes the opener position.

**Before.**
> "In this section, we discuss how confidence calibration should be evaluated under class imbalance."

**After.**
> "Standard calibration practice — average ECE on a held-out split — falls apart on a 927:1 imbalance." (R1: commit immediately.)

### B8 — Five-or-more-citation decoration stacks

**Why it's a tell.** Citation laundering: looks like evidence, isn't.

**Before.**
> "Calibration matters in safety-critical settings [@A; @B; @C; @D; @E]."

**After.**
> "@guo2017calibration documents that max-softmax confidence routinely exceeds empirical accuracy. @ovadia2019trust extends the result to distribution shift." (Each citation now carries a specific claim.)

---

## 5. Voice-of cheat sheet

One screen. No exemplars, no citations. Pure muscle memory for a writing pass.

- **Open with work, not scaffold.** Heading already names the topic. The opener sets stakes, names a structure, defines a term, or gives a concrete image. Never "In this section..."
- **Earn every list, table, and equation.** A setup paragraph or bridge sentence names what work the apparatus does, before it appears.
- **Math by purpose, not by name.** Prose names the object before the symbols. Recap after the equation if the reader needs to be told what just happened.
- **State limits plainly.** No "moreover," "furthermore," "naturally," "clearly," "as we shall see," "it is important to note that," "interestingly."
- **No self-promotion in answers.** "The framework already" / "directly motivates" / "exactly the failure mode that motivates" — cut. Answer the question.
- **Citations carry specific claims.** Each citation supports a distinct point; no five-deep stacks; placement mid-sentence or paragraph-end, not inside the verb phrase.
- **Concrete images on abstract claims.** Operational, geometric, or analogical — give the reader something physical to hold.
- **Section heading is the question or its answer.** "Defining X" or "What is X" — never "X in this framework" or "About X." Section body walks setup → solution.
- **Voice-anchor wins ties.** When an external pattern would feel false in the user's voice, the user's voice wins (§1.5).

---

## 6. Change log

| Date | Change | Trigger |
|---|---|---|
| 2026-04-27 | File created with methodology, exemplar list, scaffolding for §3–§5, seed banned-tells list. | Q2.1 revision pass surfaced the need for a durable artifact. |
| 2026-04-27 | §2.1, §2.2, §2.3, §2.6 populated from WebFetch extractions of Distill, Weng, Karpathy, Vaswani. §2.7, §2.8 populated from the post-revision Q2.1 opener and Q1.1 three-conditions structure. §3 populated with R1–R6, each triangulated across ≥2 exemplars and bite-tested against the Q2.1 revision. §4 expanded from 6 seed entries to B1–B8 with before/after pairs. §5 cheat sheet written. | Initial extraction pass. |
| 2026-04-27 | E4 (Goodfellow Ch. 6) and E5 (Strang Ch. 1) marked as failed-to-extract; substitute candidates listed. | WebFetch returned content-truncated for E4 and metadata-only for E5. |
| 2026-04-27 | E4 retried with d2l.ai Ch. 1 substitute (Goodfellow HTML still hits truncation on Ch. 1 too); E5 retried with 3Blue1Brown vectors lesson substitute. Both extractions succeeded; §2.4 and §2.5 populated; R1, R3, R4, R6 anchors extended; status table and triangulation note updated. | Editor pushback: do not accept poor fetch results without retrying. |
| 2026-04-27 | Added §7 Application protocol (five phases: audit → triage → apply → bite-back → removal). Audit documents land at `paper/STYLE-AUDIT/<filename>.md`. | Editor request for a written application methodology, not chat-only. |
| 2026-04-27 | First §7.1–§7.3 pass on `reinforcement-learning.md` complete. Twelve fixes applied. | Initial calibration audit (§7.9). |
| 2026-04-27 | Added R7 (heading is the question or its answer; body is setup → solution). Refined R1's *Why* to reference R7. Added section-heading line to §5 cheat sheet. | Editor pushback on the first audit pass: *"open should be like 'Defining reward shift' or 'What is reward shift' and then a smooth and brief walkthrough, setup, solution."* The first audit cut "in this framework" via B7 but left the heading topic-shaped — R7 makes the heading-shape rule explicit. |
| 2026-04-27 | Added image inventory under R6 (anthropomorphism / domestic / code / geometry / walks / stacking / failure-threshold / load-bearing) and connector-verb vocabulary under B4 (*admits, rides on, carries, limits/caps, and therefore, amounts to, plays the role of*) as positive-space companions. V3+ candidates surfaced separately at `paper/STYLE-AUDIT/V3-candidates.md` for editor validation before they enter §2. | Editor + cross-Claude diagnosis: STYLE.md was a hygiene tool with a hard ceiling; juice is voice-specific and AI cannot reliably generate it. The right complement is positive-space references (palette + connector list) attached to existing rules, plus more user-validated voice anchors — not a "write with juice" rule. |
| 2026-04-27 | First triage of `paper/STYLE-AUDIT/V3-candidates.md`. Three anchors promoted: V3 (C4 — tautology-landing opener, `interpretability-calibration.md` line 38), V4 (C2 — em-dash X-not-Y mid-sentence reframe, `physics-dynamics.md` line 87), V5 (C3 — register-shift closer, `physics-dynamics.md` line 122). Three skips: C1 (mild parallel image; the paragraph's actual landing is later), C5 (functional engineering tag, not landing-tier), C6 (closer is too 2x2-table-specific to transfer). R1 anchors extended with V3; R2 anchors extended with V3 bridge; R6 anchors and image inventory extended with V5 ("blast radius / containment" archetype). V4 and V5 are currently anchors-only — a second exemplar of em-dash X-not-Y and of register-shift closer would promote them to §3 rule candidates (R8 register-shift-closer). | First V3-candidates triage pass; pending Robert's review. |
| 2026-04-27 | Style audit + apply pass on `proposed-research.md` and three committee-question files (`federated-optimization.md`, `physics-dynamics.md`, `interpretability-calibration.md`). proposed-research: D1–D5 structural cuts (~35 lines, eliminating duplication of Q1.1 trust-gates and Q4.2 architectural-deltas) + 8 prose fixes (R1, R4, R7, B3, B7). Q3: 9 fixes (5× R7+B3 heading rewrites, 4× B6 natural-as-design-choice). Q1: 4 fixes (B1 canonical, B2 exactly-this, B7 in-this-framework, R7+B3 heading). Q2: 2 fixes (B6, R7+B3 heading). Two new V-anchor candidates from Q3 stashed for next sweep (L31 X-not-Y opener, L174 bold-dispatch opener). Closure docs at `paper/STYLE-AUDIT/proposed-research.md` and `paper/STYLE-AUDIT/committee-questions-2026-04-27.md`. | First post-V3-anchors application pass. |
| 2026-04-27 | §7.4 bite-back candidates surfaced from the application pass: (a) **B6 refinement** — extend B6 to ban "natural" as adjective for design choices, while keeping the technical sense ("natural distribution," "natural parameterisation"). Five hits across the pass meet the bite threshold. (b) **§5 cheat sheet anti-pattern** — `### How [framework] X` heading shape is now triangulated across Q3 (×4), Q1 (×1), Q2 (×1), Q4 (×3 prior). Worth an explicit cheat-sheet line. Both deferred to the next bite-back pass. | Aggregation across audit + apply passes. |
| 2026-04-28 | Compression pass on Q2 (`interpretability-calibration.md`, −6.5%) and Q4 (`reinforcement-learning.md`, −7.8%): V1 (Q2.1 opener) and V3 (§Maintenance opener) preserved verbatim; V3's "Three operational pieces" promise restored by folding bullet 4 (joint gate refit) into bullet 3 (online conformal recalibration). Applied two `reinforcement-learning.md` audit guide-gap candidates to the live file: (a) cut "principled implicit answer" (B9 puffery candidate, strategy 2) and "natural compromise" (B6 design-adjective refinement, Q4.2 closer); (b) renamed `### Connection to Q1.1 (PINN trust gates) and Q4.2 (simplex policy)` → `### Composing the gates, policy, and bandit deferral` (R7 answer-shape). Compression pass on `proposed-research.md` (−10.1%) — tightened §Integrative narrative, §PINN architecture/trust-gates, §Reward shift, §Calibration, §FL opening, §Adversarial intro, and the eval-protocol bullet bodies. Restructured `eq-gat-flops` to remove the mixed `\quad &`/`&` alignment block and the `( 33K params)` extra-space bug. Added a new subsection to `introduction.md` — *The methodological thesis: calibration as the unifying axis* — porting the multi-axis calibration thread from `committee-questions/index.md` into the introduction (single paragraph stating the thesis, table-deferred to the index). Fixed a corrupted `:::{figure}` directive at `introduction.md` L119 that had been collapsed onto one line with `🏷️` standing in for `:label:`. | User-requested compression and intro thread-port. |

### Outstanding

- B5–B8 are pre-validation entries from the bias-check (§1.4); each needs its bite test confirmed against an actual passage in the draft, not just reconstructed examples.
- Extend §3 with rules from future editor-feedback sessions; each new rule must clear §1.3 and §1.4 before promotion.

---

## 7. Application protocol

The methodology in §1 governs how rules are added to this guide. The protocol below governs how the guide is *applied* to draft prose. Five phases with explicit gates between them; the gates are the point.

### 7.1 Audit (read-only)

For each prose file under `paper/`, produce a structured audit at `paper/STYLE-AUDIT/<filename>.md`. No edits to the source file in this phase.

For each finding, record one row:

`<rule-id>: line N — "<offending span>" → "<proposed replacement>"`

Sweep, in this order:

1. **Section openers.** For each heading, identify the opener move and flag R1 violations.
2. **Lists, tables, display equations.** Identify the setup paragraph (or absence) preceding each apparatus; flag R2.
3. **Math entries.** Flag R3 violations — no purpose-naming, "the following equation," bare "we have."
4. **Banned tells.** Grep for B1–B8 phrases; flag every occurrence with line number and surrounding clause.
5. **Citation density.** Flag stacks of four or more citations (R5 decoration test).
6. **Abstract claims.** For each structural assertion, flag whether a concrete image (R6) would help.
7. **Guide gaps.** Passages that pass all rules but still feel off — flag as "guide-gap candidate." Feeds §7.4.

The audit document is plain markdown, greppable and diffable. It is the artefact reviewed in §7.2.

### 7.2 Triage

Editor walks the audit and marks each finding:

- **fix** — accept the proposed replacement.
- **defer** — fix later. Park in the file's Outstanding section.
- **reject** — the rule does not bite this case. Rule may need refinement (feeds §7.4).

Triage decisions are written in the audit document beside each finding. The document is the durable record, not a chat message.

### 7.3 Apply (gated by triage)

For findings marked **fix**, apply the change. Diffs are batched per file — one cohesive diff per file, not per-finding noise. The editor approves the file diff before it hits disk.

After all fix-marked findings in a file are applied, mark the audit document closed. Do not carry stale audits forward.

### 7.4 Bite-back

Every ~3 files audited, or whenever rejections accumulate, aggregate §7.2 rejections and §7.3 surprises into changes to the guide itself:

- **§6 change-log entries** when an existing rule needs refinement.
- **§3 new-rule candidates** when a pattern emerges that no current rule covers.
- **§4 banned-tells additions** when a new LLM-tell phrase shows up in the wild.
- **§2 new V-anchors** when a passage of the editor's writing becomes a teaching example for an existing rule.

Each new or changed rule must pass §1.3 (bite test) and §1.4 (bias check) before promotion. Without §7.4 the guide ossifies — applied but never improved.

### 7.5 Removal sweep

When §3 reaches ~10 rules, or quarterly, walk §3 and §4 against §1.6: any rule or banned-tell that has not bitten any audit in 30 days is a candidate for cut. Decoration is the silent failure mode of style guides.

### 7.6 Scope

- **In:** any prose file under `paper/` — committee questions, candidacy chapters, paper content, appendices.
- **Out:** code, schemas, configs, generated tables, BibTeX files, `README.md`, `CLAUDE.md`. Style for code is out of scope for this artefact.

### 7.7 Order

Order of files audited is the editor's call. Default is numerical / TOC order (Q1.1 → Q4.2 → proposed-research → main paper sections), but pick the file the editor is least happy with. The protocol is order-independent.

### 7.8 What this protocol is not

- Not a one-pass sweep. Each file goes through §7.1–§7.4 independently.
- Not a CI linter. §7.1 needs human judgment, not regex.
- Not infallible. §7.4 exists because the guide will be wrong sometimes.

### 7.9 Calibration

The first three §7.1 audits calibrate the per-file effort. Time and rejection rate are empirical, not estimated — record both in §6 so future iterations have a baseline.
