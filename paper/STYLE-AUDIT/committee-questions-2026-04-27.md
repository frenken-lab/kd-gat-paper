# Style audit pass — committee-questions/* (2026-04-27)

**Status: closed 2026-04-27.** Three Q files swept and applied in one pass: `federated-optimization.md` (cold, never audited), `physics-dynamics.md` (post-V-anchor revision), `interpretability-calibration.md` (post-V-anchor revision). `reinforcement-learning.md` was previously closed in a separate audit (`reinforcement-learning.md` audit doc, status closed 2026-04-27).

Audited against `paper/STYLE.md` (R1–R7, B1–B8, with V1–V5 voice anchors). Findings applied directly per Robert's instruction to ship fixes without per-file long-form audit docs.

---

## Q3 — `federated-optimization.md` (213 lines, three questions)

Counts: R7+B3: 5 | B6: 4 | R4: 1. No R1, R2, R3, R5, B1, B2, B4, B7, B8 violations — the prose was clean at the sentence level; the issues clustered at heading shapes and the "natural" hedge.

| ID | Line | Finding | Applied |
|---|---|---|---|
| F1 | 47 | Heading `### How this framework maps onto the bilevel view` (R7+B3). | `### The current single-level reduction` |
| F2 | 65 | Heading `### Why FL is the natural fit` (R7+B6 — "natural" applied to a design choice). | `### Why FL applies to fleet-scale IDS` |
| F3 | 107 | "the **well-known** 'drift' pathology" (R4 hedge). | "the drift pathology" |
| F4 | 125 | "...the **natural** answer to graph heterogeneity below" (B6). | "...the answer to graph heterogeneity below" |
| F5 | 127 | Heading `### Graph-heterogeneity-specific challenges` (R7 topic). | `### Why standard FL remedies miss graph heterogeneity` |
| F6 | 144 | Heading `### The Byzantine-robustness dimension` (R7 topic). | `### Defending against poisoned client updates` |
| F7 | 158 | Heading `### How this framework would adopt FL` (R7+B3). | `### FL adoption per pipeline stage` |
| F8 | 168 | "the **natural** federation target ... the **natural** personalisation point" (B6 ×2). | "the federation target ... the personalisation point" |
| F9 | 196 | Heading `### How the curriculum in this framework behaves` (R7+B3). | `### Anti-curriculum with difficulty-aware replay` |

Voice-anchor candidates surfaced (for the next sweep at `V3-candidates.md`):
- L31: *"the teacher–student capacity gap that still permits successful transfer is **not** monotone in either teacher or student size; it has a sweet spot that **shrinks** as task complexity grows"* — X-not-Y opener with continuation that names the structure. V4-related move (em-dash X-not-Y) but as opener.
- L174: **"No, not in general."** — bold-dispatch opener for a question-shaped heading. Distinct from V1/V3 opener forms.

---

## Q1 — `physics-dynamics.md` (V2 / V4 / V5 source file)

Counts: B1: 1 | B2: 1 | B7: 1 | R7+B3: 1. The file was already revised to extract V2/V4/V5; remaining hits were stragglers.

| ID | Line | Finding | Applied |
|---|---|---|---|
| P1 | 19 | "@Chen2024CADD's analytical residual approach exhibits **exactly this** failure mode at high slip" (B2 — "exactly this" pattern flagged in RL audit too). | "exhibits this failure mode at high slip" |
| P2 | 19 | "For the CAN dynamics **in this framework**, the binding regime constraints are:" (B7). | "For CAN dynamics, the binding regime constraints are:" |
| P3 | 58 | Heading `### How the framework operationalises deferral` (R7+B3). | `### Existing deferral mechanisms` |
| P4 | 95 | Table cell: "the **canonical** Jeep-hack threat model" (B1). | "the Jeep-hack threat model" |

---

## Q2 — `interpretability-calibration.md` (V1 / V3 source file)

Counts: B6: 1 | R7+B3: 1. Cleanest of the three — V1 and V3 carry most of the prose.

| ID | Line | Finding | Applied |
|---|---|---|---|
| I1 | 52 | Table cell: "the **natural** input to an uncertainty head" (B6). | "the input to an uncertainty head" |
| I2 | heading | `### How this framework's existing layers form a triangulation set` (R7+B3). | `### Existing inspection layers as a triangulation set` |

---

## Patterns across all three files

- **R7+B3 heading rewrites** are the dominant finding (7 across the three files). The fix pattern is consistent: `How [this framework / X] does Y` → answer-shape (e.g., `### Existing deferral mechanisms`, `### FL adoption per pipeline stage`). The RL audit already recorded the same pattern (`### How this framework supports each strategy` → `### Existing components, by strategy`); this generalises across the candidacy.
- **B6 "natural" applied to design choices** (5 hits across federated and interpretability files). The RL audit's guide-gap candidate — extending B6 to ban "natural" as adjective for design choices, while keeping the technical sense ("natural distribution," "natural parameterisation," "natural $0.1\%$–$3\%$ base rate") — should be promoted to a §3 rule refinement on the next bite-back pass.
- **No R1, R2, R3 violations** across any of the three Q files. The committee-questions content is well-structured at the section level; the audit value here is in micro-tells (B1, B2, B6, B7) and heading-shape (R7).

---

## Notes for §7.4 bite-back (next pass)

- **Promote B6 refinement** (natural-as-design-choice) to a rule clarification in §3/§4. Five hits across this pass meet the bite threshold.
- **R7 heading-shape catches `How [framework] X` reliably.** The pattern is now triangulated across Q3 (×4), Q1 (×1), Q2 (×1), Q4 (×3 from the prior audit), proposed-research (×0 — caught and fixed). Worth adding to the §5 cheat sheet as an explicit anti-pattern.
- **Two new V-anchor candidates** from Q3 (L31 X-not-Y opener, L174 bold-dispatch opener). Add to next `V3-candidates.md` sweep.

---

## Change-log entry to add to `paper/STYLE.md` §6

```
| 2026-04-27 | Style audit + apply pass on `proposed-research.md` and three committee-question files (`federated-optimization.md`, `physics-dynamics.md`, `interpretability-calibration.md`). proposed-research: D1–D5 structural cuts (~35 lines, eliminating duplication of Q1.1 trust-gates / Q4.2 architectural-deltas) + 8 prose fixes (R1, R4, R7, B3, B7). Q3: 9 fixes (5×R7+B3 heading rewrites, 4×B6 natural-as-design-choice). Q1: 4 fixes (B1 canonical, B2 exactly-this, B7 in-this-framework, R7+B3 heading). Q2: 2 fixes (B6, R7+B3 heading). Two new V-anchor candidates from Q3 stashed for next sweep (L31 X-not-Y opener, L174 bold-dispatch opener). | First post-V3-anchors application pass. |
```
