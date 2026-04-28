# Style audit — `paper/candidacy/proposed-research.md`

**Status: closed 2026-04-27.** All structural findings (D1–D5) and prose-level findings (R1, R4, R7, B3, B7) applied. R6 line 162–185 (FLOPs operating-envelope image) deferred — optional. B3 line 235 rejected as recommended (X-not-Y opener is the right move). Two open §7.4 bite-back items: (a) PINN architecture spec table hosting (proposed-research vs. methodology); (b) FLOPs-budget derivation hosting (same question). Two voice-anchor candidates flagged for the next sweep: line 235 X-not-Y opener, plus the integrative-thesis sentence at line 10.

Audited 2026-04-27 against `paper/STYLE.md` (R1–R7, B1–B8, with V1–V5 voice anchors). Source file unchanged in this phase per §7.1 (read-only). 345 lines, 11 numbered subsections plus the integrative narrative and the consolidated deliverables backlog.

**Counts (prose-level).** R1: 2 | R2: 2 | R3: 0 | R4: 3 | R6: 1 | R7: 2 | B1: 0 | B2: 0 | B3: 2 | B4: 1 | B6: 0 | B7: 1 | B8: 0 | guide-gap: 2 | factual: 0

**Counts (structural).** Duplication sites: 5 (see §Structural finding). These are the load-bearing issue and gate the prose-level fixes — applying R1–R7 inside a section that should be cut by 60% is paint on warped wood.

---

## Top-line read

The integrative narrative (§Integrative narrative, lines 7–31) and the per-subsection evaluation-deliverables lists are the file's load-bearing content — both unique to `proposed-research.md`, neither duplicated elsewhere. The duplication that bloats the file lives in the recap-paragraphs *between* the integrative tie and the deliverables: most subsections re-state the committee-question argument before pointing at it. The fix pattern is consistent across subsections — point and tie, don't recap.

The integrative thesis (operational rejection bound on the PINN-active subset) is the cleanest sentence in the file; it earns its place. Most other prose-level findings below are mild — the file is already audited-feeling at the sentence level. The R-counts are low because the duplication eats the page budget that prose tells would otherwise occupy.

---

## Structural finding — duplication with committee questions

Five sites. Each row gives the proposed-research location, what it duplicates, and the proposed pattern.

| # | Location | What it duplicates | Recommended action |
|---|---|---|---|
| D1 | Lines 58–67: §PINN "Adaptive $\lambda_{\text{physics}}$ weighting" — 4-sentence exposition citing @Wang2022NTK, @McClenny2023SAPINN, @Bischof2024MultiObj | These three citations and their roles are already threaded in `physics-dynamics.md` (Q1.1) lines 35 and 65 in service of the regime-validity gate. The proposed-research version re-derives the motivation. | **Cut** the 4-sentence exposition; replace with: *"Static $\lambda_{\text{physics}}$ under-trains either branch (NTK analysis [@Wang2022NTK]); we use the self-adaptive weighting of [@McClenny2023SAPINN] with a tier-dependent upper bound. Full motivation in Q1.1."* The bold-lead **Adaptive $\lambda_{\text{physics}}$ weighting** stays. |
| D2 | Lines 74–76: §PINN "Tier-3 caveat — detector vs. regulariser" dropdown | This paragraph is a re-stitching of `physics-dynamics.md` line 27 (signal-reliability gate, bias-dominated $\Sigma_\eta$) plus line 56 ("tier 3 is graceful-degradation engineering"). The closing sentence is the V5 voice anchor — duplicating it here weakens it there. | **Cut** the dropdown to one sentence inline above the trust-gates paragraph: *"Under tier-3, the PINN's role narrows from detector to training-time regulariser; full justification in Q1.1."* Remove the duplicate of V5's "structural-defence-in-depth" closer — that sentence belongs only in Q1.2. |
| D3 | Lines 86–97: §PINN "Graceful Degradation" — opener paragraph + 3-tier dropdown with $\lambda_{\text{physics}}^{(0)}$ initialisation values | The three deployment tiers and their $\lambda$ caps are already in `physics-dynamics.md` (Q1.1) lines 49–54 (the tier-mapping table with $\lambda_{\text{tier}}^{(0)}$, $\lambda_{\max}$, what's fixed, what's deferred). | **Cut** the dropdown; replace with: *"Per-tier $\lambda_{\text{physics}}^{(0)}$ initialisation and $\lambda_{\max}$ caps are tabulated in Q1.1 §Mapping the deployment tiers."* The opener paragraph can stay if the section title is reframed as "What graceful degradation buys here" — i.e., make it about the integrative role, not the tier mechanics. |
| D4 | Lines 125–140: §DQN "Scaling fusion from $N=2$ to $N=4$ experts" — opening paragraph + architectural-deltas table | The architectural-deltas table is line-for-line equivalent to `reinforcement-learning.md` (Q4.2) lines 134–139 (state dim / action dim / DQN head / Bandit head / Reward — 5 rows, same columns). The opening paragraph paraphrases Q4.2's "Scaling to N=4" preamble. | **Cut the table.** Replace the section with one paragraph: *"At $N=4$ the simplex constraint stops collapsing to a scalar; the discrete grid blows up to $K^N \approx 1.94 \times 10^5$. The proposed extension lifts the action representation to a continuous simplex via softmax or Dirichlet, replacing $\sqrt{K^N}$ regret with $\tilde{O}(d\sqrt{T})$. Full action-space derivation, regret-bound argument, and the empirical motivation (DQN already converges to ~5 discrete operating modes at $N=2$, [](#fig-fusion)) are in Q4.2."* The architectural-delta table belongs only in Q4.2. |
| D5 | Line 75 *and* line 297: the V5 voice-anchor closer ("structural-defence-in-depth ... not cryptographic") appears in §PINN tier-3 dropdown *and* in §Adversarial threat-model paragraph | Both paragraphs reach for the same closer phrase. Q1.2 line 122 already owns this landing. | **Cut** the duplicate uses. Line 297's adversarial paragraph keeps the integrative claim ("the tier-based weighting caps the blast radius at $\lambda_{\max} = 0.3$ in the worst case"); line 75 cuts entirely per D2. The V5 anchor stays unique to Q1.2. |

**Estimated impact.** Applying D1–D5 cuts roughly 35–45 lines (10–13% of the file) and removes the strongest perceived-duplication signal. The integrative thesis (§Integrative narrative), the deliverables blocks, and the FL `Federated body, local heads` table are unique and stay. The PINN architecture spec table (`tab:pinn-arch`, lines 44–56) is unique to this file and should also stay — it's not duplicated to `paper/content/methodology.md` (verified by grep).

**What remains structural after D1–D5.** Two open questions for §7.2 triage:
- Should the PINN architecture spec table live in `paper/content/methodology.md` (current-framework) instead, with `proposed-research` only carrying the *evaluation* deliverables? Doing so would shrink §PINN further but redirects the spec out of the candidacy-only build's standalone proposed-research view.
- §IntelKD's FLOPs-budget derivation (lines 162–185) — the equations and the GAT FLOP count are unique to this file but read more like a methodology fact than a research proposal. Same hosting question.

---

## R1 — Section openers commit immediately

Two violations.

| Line | Finding | Triage |
|---|---|---|
| 158 | §IntelKD opens with: *"While previous work devised teacher-student parameter sizing following conventional wisdom using factors of 2, 5, 10, or 100, future work will incorporate both hardware constraints and recent research on distillation scaling to develop principled guidance for teacher and student sizing."* — opener does scaffolding ("future work will incorporate ... to develop") and contains a B9-class puff ("principled guidance"). **Proposed fix:** *"Conventional teacher-student ratios (2×, 5×, 10×, 100×) are not principled — they ignore hardware ceilings and the capacity-gap law. Both bind here: a <50 ms ARM Cortex-A7 budget caps student parameters at $1.25 \times 10^6$, and the viable ratio scales with task complexity (Q3.1)."* — opens with the actual constraint, names the two binding considerations. | |
| 282 | §Streaming opens with: *"The current framework operates on static graph snapshots constructed from fixed-size CAN windows. Real-world deployment, however, requires streaming inference where graphs are updated incrementally as new messages arrive."* — opener is two declarative sentences, no commit; the "however" is a B4-adjacent stalling pivot. **Proposed fix:** *"Static graph snapshots are an evaluation convenience, not a deployment property. Three operational pieces close the gap to streaming inference."* — names the structure (three pieces, V2 form), earns the bullets that follow. | |

---

## R2 — Earn every list, table, and equation

Two violations.

| Line | Finding | Triage |
|---|---|---|
| 89–97 | §PINN Graceful Degradation: heading → one-sentence opener → dropdown with three numbered tiers. The opener does not name a structure ("three deployment tiers"); the dropdown is hidden behind an expander. **Proposed fix:** subsumed by D3 — cut the dropdown to a pointer and the R2 issue dissolves. | |
| 282–288 | §Streaming: heading → opener → bullet list of three concerns (incremental updates / concept drift / latency). The opener does not commit to "three operational pieces" or similar; the bullets land cold. **Proposed fix:** see R1 line 282 — the proposed opener earns the bullets. | |

---

## R3 — Math is embedded in narrative

No violations. Display equations at lines 62–66 (physics score), 165–170 (FLOPs budget), 175–183 (GAT FLOPs) are all introduced by purpose-naming sentences.

---

## R4 — State limits in plain words; no hedge phrases

Three violations.

| Line | Finding | Triage |
|---|---|---|
| 110 | *"Initial results **show promise**, as the DQN policy performs at or above previous implementations."* — "show promise" is hedge puffery. **Proposed fix:** *"Initial results are at or above the GAT and equal-weighting baselines (Table [](#tab:ablation_DQN)); the qualitative policy structure is described below."* — concrete claim, no puff. | |
| 110 | *"...further explainability techniques (Section [](#subsec:XAI)) will be implemented **to gain a strong understanding** of the model's decisions."* — "to gain a strong understanding" is mushy. **Proposed fix:** *"...further explainability techniques ([](#subsec:XAI)) will be applied per the disagreement protocol."* — names the operational mechanism. | |
| 185 | *"While this model is safely under the max parameter limit, future work will need to ensure that **every component and its combination** meets the computational limit of the hardware."* — bog-standard hedge that commits to nothing. **Proposed fix:** cut the sentence, or replace with: *"Margin against the $1.25 \times 10^6$ ceiling is $\sim 8\times$ at current GAT scale; the ratio sweep deliverable below stress-tests it."* | |

---

## R6 — Concrete images on abstract claims

One opportunity.

| Line | Finding | Triage |
|---|---|---|
| 162–185 | The FLOPs-budget derivation is correctly formal but the surrounding prose is dry: "automotive deployment requires <50 ms inference latency on ARM Cortex-A7 processors." A concrete image would help — *"The student has 50 ms before the safety system reports a stale fusion decision; on a Cortex-A7 at 50 MFLOP/s that buys $2.5 \times 10^6$ FLOPs and a $1.25 \times 10^6$-parameter ceiling."* — turns the abstract latency budget into an operating envelope (R6 archetype). Optional. | |

---

## R7 — Section heading is the question or its answer

Two topic-shaped headings.

| Line | Finding | Triage |
|---|---|---|
| 99 | `#### Data extraction` — topic label, doesn't say what about it. **Proposed fix:** `#### Where PINN inputs come from` (or `#### From CAN bytes to state vector`) — names the question the section answers. | |
| 188 | `#### Single-level reduction and capacity-gap law` — compound topic, doesn't commit. **Proposed fix:** `#### Why the inner KD loss is the only one solved here` or `#### Capacity-gap law and the inner KD loss` — the second names the structure that follows. | |

(Most other subsection headings are answer-shaped: `#### PINN architecture and training`, `#### Trust gates and composite trust score`, `#### Reward shift and safe adaptation under deployment`, `#### Threat-model taxonomy`. These are fine.)

---

## B3 — "the framework already X" / self-promotion in answers

Two findings.

| Line | Finding | Triage |
|---|---|---|
| 204 | §Calibration opener: *"The framework's **safety story** rests on the trust gates..."* — "safety story" is mild marketing register. **Proposed fix:** *"The trust gates ([](#subsec:PINN)) and deferral mechanisms ([](#subsec:DQN), [](#subsec:XAI)) only deliver if the underlying confidences are calibrated."* — drops "safety story" and the possessive "the framework's." | |
| 235 | §XAI opener: *"The XAI contribution of the dissertation **is not** "we applied five off-the-shelf explainers." The contribution is the **2×2 confidence × explainer-agreement diagnostic**..."* — strong X-not-Y framing, this is good — borderline B3 because of "the dissertation's contribution" register, but the structural move (refusing the obvious framing, naming what the contribution actually is) is correct. **Recommend reject** unless the "dissertation" possessive reads as boastful. | |

---

## B4 — stalling transitions

| Line | Finding | Triage |
|---|---|---|
| 282 | "...static graph snapshots constructed from fixed-size CAN windows. Real-world deployment, **however**, requires streaming inference..." — "however" is a stalling pivot. **Proposed fix:** subsumed by R1 line 282. | |

---

## B7 — "in this section / paper / framework"

| Line | Finding | Triage |
|---|---|---|
| 332 | *"This pattern — federated body, local heads — is the standard answer to architectural heterogeneity in personalised FL. **The CAN-IDS-specific contribution** is the choice of *which* component is local..."* — "the CAN-IDS-specific contribution" reads as B3-adjacent self-naming rather than B7 strictly. Borderline. **Proposed fix:** *"...is the standard answer in personalised FL. The choice here is *which* component is local: the input projection (because OEM-specific) and the fusion head (because [](#subsec:Calibration) is per-vehicle)."* | |

---

## Guide-gap candidates (feed §7.4 bite-back)

| Line | Observation | Why it's a gap |
|---|---|---|
| 235 | The XAI opener — `*The XAI contribution of the dissertation is **not** "we applied five off-the-shelf explainers." The contribution is the **2×2 confidence × explainer-agreement diagnostic**...*` — uses the X-not-Y reframe at section-opener scale (V4 form, but in an opener rather than mid-sentence). Possible voice-anchor candidate for the next sweep at `paper/STYLE-AUDIT/V3-candidates.md`. | Surfaces a section-opener variant of the V4 em-dash X-not-Y move. If it lands for Robert, it would seed a future R8 (X-not-Y as opener) alongside V4 (mid-sentence) and V5 (closer). |
| structural | The pointer-then-deliverables pattern that survives D1–D5 is itself a structural rule candidate: *"In a planning document that points at upstream derivations, each subsection should be one paragraph (integrative role) + pointer (`Q1.1`-style) + deliverables list. No re-derivation of the upstream argument."* | Not a §3 prose rule but an artefact-shape rule. Either lives in §7 application protocol or in a sister document about candidacy/proposed-research authoring. Bite-back candidate. |

---

## Notes for §7.2 triage

- **The five duplication findings (D1–D5) are the load-bearing issue.** The R1–R7 / B1–B8 findings are mild and can apply on top of, or independently from, the structural fix.
- D1–D5 net change is roughly −35–45 lines. None destroys content — every removed paragraph already has a pointer to where the content actually lives.
- D5 (the V5 closer duplicated to line 75 and 297) is the cheapest fix and protects the V-anchor's calibration value. Recommend high triage priority.
- The FLOPs-budget hosting question (proposed-research vs. methodology) is genuinely structural and not for this audit to decide — flag for the §7.4 bite-back pass.
- Two voice-anchor candidates surfaced (line 235 X-not-Y opener, plus the integrative thesis at line 10 if Robert reads it as landing-tier). Stash for the next V-anchor sweep.
