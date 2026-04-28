# Voice-anchor candidates — pass 1

Surfaced 2026-04-27 from passages of Robert's prose read in this session: `physics-dynamics.md`, `interpretability-calibration.md` (post-Q2.1 revision), `reinforcement-learning.md` (post-§7.3). V1 (Q2.1 opener) and V2 (Q1.1 three-conditions) are already anchored in `paper/STYLE.md` §2; passages from those neighborhoods are excluded here.

**Triage.** Mark each candidate **anchor** or **skip** in the right column.

- **anchor** = quote in §2 of `paper/STYLE.md` as V3 / V4 / V5 / ... with annotation of what specifically lands.
- **skip** = my read is wrong about what lands here, or the passage is flat in your ear.

For any **skip**, a one-line note about *why* it's flat would tighten the calibration — what I'm hearing as a punchy landing might actually be ordinary, in which case the same misread will surface other false positives.

**Wider sweep.** These six are from files I've already read this session. If you want a wider candidate base before triaging, I'd read `federated-optimization.md`, `proposed-research.md`, and the main paper content (`paper/content/*.md`).

---

| ID | Where | Passage | What lands (my read) | Triage |
|---|---|---|---|---|
| C1 | `physics-dynamics.md`, §"Composite trust score" closing (line ~56) | *"Tiers fix the **outer** envelope; the three gates fix the **inner**, sample-by-sample weighting."* | Outer/inner parallel + the apposition ("sample-by-sample weighting") that quietly upgrades "inner" from spatial to operational. One sentence sets up the rest of the section. | **skip** — competent transition; the "outer/inner" image is mild relative to V1's "operating envelope." The same paragraph's closing sentence ("tier 3 is graceful-degradation engineering") is the actual landing — same register-shift move as C3. |
| C2 | `physics-dynamics.md`, Q1.2 §"compounding-uncertainty chain" (line ~87) | *"The trade-off — and why this is a security boundary, not a preprocessing step — is that each new stage adds an attack surface that the byte-level GAT/VGAE pipeline does not expose."* | The X-not-Y reframing inside the em-dashes lands the paragraph: the reader's mental model gets corrected mid-sentence, and the closing clause delivers the consequence ("attack surface ... does not expose"). | **anchor → V4** — em-dash X-not-Y mid-sentence reframe is a sentence-internal move not currently named in §3. |
| C3 | `physics-dynamics.md`, Q1.2 closing (line ~122) | *"...the tier-based weighting limits the blast radius — a tier-3 deployment (ByCAN extraction) caps PINN contribution at $\lambda_{\max} = 0.3$, so even total estimator compromise cannot drive the fusion decision more than 30%. This is a structural-defence-in-depth argument rather than a cryptographic one."* | Concrete numerical bound (30%) followed by register-of-final-framing ("structural ... not cryptographic"). The frame names what kind of argument the paragraph just made — directs the reader's takeaway. | **anchor → V5** — register-shift closer is the strongest single move in the candidate set; seed for a future R8 (paragraph closers name the argument's *kind*). |
| C4 | `interpretability-calibration.md`, Q2.1 §"Maintenance under operational drift" opener (line ~38) | *"A calibration guarantee that holds at deployment but not three months later is not a guarantee."* | Tautology-landing — the claim is logically contradictory ("X that doesn't hold is not X") and forces the reader to re-examine what *guarantee* requires. Sets up the next three operational pieces without scaffolding. | **anchor → V3** — tautology-landing opener is a distinct R1 form from V1's stakes-image opener; widens the opener vocabulary. |
| C5 | `reinforcement-learning.md`, Q4.2 §"Approach comparison" closing paragraph (line ~128 post-§7.3) | *"...degrade gracefully — a dropped or low-confidence expert simply has $\alpha_i \to 0$, no architectural rewrite required."* | "Degrade gracefully" → concrete mechanism ($\alpha_i \to 0$) → closing tag ("no rewrite required") that collapses the engineering implication into a five-word landing. | **skip** — standard R6 execution. The closing tag ("no architectural rewrite required") is functional engineering prose, not landing-tier vivid; anchoring it dilutes the V-set without adding a move. |
| C6 | `interpretability-calibration.md`, Q2.2 §"triangulation protocol" closing of the table (line ~99) | *"Only the **high-confidence + low-agreement** cell unambiguously implicates the explainer; the other failure modes implicate the model or the input."* | Mass discrimination via the diagnostic table — one cell is named, then "the other failure modes" carries the rest. Parallel verb (*implicates*) on each side of the semicolon does the linking work. | **skip** — closer is too tied to a specific 2x2 disagreement-table apparatus to transfer; R2's "earn the table" already covers the discipline. |

---

## Notes for the next pass

- Once any of C1–C6 is marked **anchor**, I'll add a §2 V3+ entry to `paper/STYLE.md` with the passage quoted in full and the moves identified — same structure as V1 and V2.
- The V-anchors are calibration material for "this passage is flat for Robert" detection in future audits. The more validated anchors, the more reliable the detector.
- If most of these are skipped, the read I'm using for "what lands" is miscalibrated; tell me which ones are flat and why, and I'll recalibrate before surfacing more candidates.

---

## Triage record (2026-04-27)

**Result.** Three anchors (C2 → V4, C3 → V5, C4 → V3), three skips (C1, C5, C6). Triage performed by the model on Robert's instruction, pending Robert's review of the §2 entries written into `paper/STYLE.md`.

**Patterns to watch for in the next candidate sweep.**

- The strongest single move in this set was the *register-shift closer* (C3 → V5) — naming the *kind* of argument the paragraph just made. If this move recurs once in the next sweep, it should promote to a §3 rule (R8 candidate).
- The em-dash X-not-Y reframe (C2 → V4) is also a candidate-rule seed, but only one exemplar this pass.
- Skip-mode pattern: I read parallel structure as landing-tier when it's only competent transition (C1) and read final-clause tags as five-word-landings when they're functional engineering prose (C5). Recalibrate the "what lands" detector by demanding a vivid concrete *image* or a *register-shift*, not just rhythmic parallelism.

**Next sweep candidate sources** (still unread this session): `paper/candidacy/committee-questions/federated-optimization.md`, `paper/candidacy/proposed-research.md`, `paper/content/*.md`.
