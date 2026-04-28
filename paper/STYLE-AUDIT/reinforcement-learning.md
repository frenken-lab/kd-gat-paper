# Style audit — `paper/candidacy/committee-questions/reinforcement-learning.md`

**Status: closed 2026-04-27.** All **fix**-marked findings applied to the source file in §7.3. One **reject** finding (line 56 status cell) preserved as recorded. Three guide-gap candidates fed forward to §7.4 bite-back: R7 (sentence length / nested parentheticals), B9 (puffery — "principled," "rigorous," "elegant"), and a B6 refinement (split "natural" by register).

Audited 2026-04-27 against `paper/STYLE.md` v0.1 (six rules R1–R6, eight banned tells B1–B8). Source file unchanged in this phase per §7.1 (read-only).

**Counts.** R1: 0 | R2: 3 | R3: 0 | R5: 0 | R6: 0 | B1: 0 | B2: 2 | B3: 3 strong + 1 borderline | B4: 1 | B5: 0 | B6: 2 | B7: 2 | B8: 0 | guide-gap: 3 | factual: 1

**Triage.** Mark each finding **fix**, **defer**, or **reject** in the *Triage* column. Reject means the rule does not bite this case — feeds §7.4 bite-back. Defer parks the finding for later. Once a finding is marked **fix**, §7.3 applies the change.

---

## R1 — Section openers commit immediately

No violations. Every section heading has an opener that commits (definition, factual setup, structural promise, or declarative claim). Strongest examples: line 11 (proxy-reward definition), line 23 ("Five strategies, ordered by..."), line 82 (numerical setup), line 126 ("the simplex constraint... collapses to a single scalar, which masks the combinatorial pathology").

---

## R2 — Earn every list, table, and equation

Three section headings drop straight into a table with no setup paragraph.

| Line | Finding | Triage |
|---|---|---|
| 41 | `### Comparison` → table at line 43 with no setup paragraph between heading and table. **Proposed fix:** add one sentence after the heading, e.g. *"Each strategy targets one or both terms of the shift; the table below maps strategies to which term they address, online cost, theoretical guarantee, and current implementation status."* | |
| 51 | `### How this framework supports each strategy` → table at line 53 with no setup paragraph. **Proposed fix:** *"Each component already in place can be repurposed for one or more of the five strategies."* (also see B3 on the heading itself.) | |
| 111 | `### Comparison of approaches` → table at line 113 with no setup paragraph. **Proposed fix:** *"Six approaches map onto two axes: action-space dimensionality and coordination structure. The table below contrasts them on sample complexity, expressiveness, and pros/cons."* | |

---

## R3 — Math is embedded in narrative, not set apart

No violations. All four display equations (lines 13–15, 27–29, 84–88, 103–107) are introduced by a purpose-naming sentence and continue with prose that picks up where the equation left off.

---

## B1 — "canonical X"

Not present.

---

## B2 — "exactly the failure mode that motivates" / "exactly the X that Y"

| Line | Finding | Triage |
|---|---|---|
| 35 | "...periodic Neural-LinUCB backbone retraining (every 50 episodes) — the current implementation does standard SGD on the replay buffer, which is **exactly the setting** where offline-RL conservatism matters." **Proposed fix:** "...does standard SGD on the replay buffer — the setting where offline-RL conservatism matters." (Cut "exactly"; the setup already motivated this.) | |
| 136 | "...the modes are interpretable as attack-type-specific strategies, **exactly the structure** a continuous policy with KL-regularised exploration **would discover automatically** without enumerating the grid." **Proposed fix:** "...the modes are interpretable as attack-type-specific strategies — the structure a continuous policy with KL-regularised exploration recovers without enumerating the grid." | |

---

## B3 — "the framework already X" / "How this framework Y" framing

| Line | Finding | Triage |
|---|---|---|
| 23 | "Five strategies, ordered by what the framework already supports." Ordering criterion is itself promotional. **Proposed fix:** "Five strategies, in order of distance from the current implementation." (Same information; criterion is implementation maturity, not "what we have.") | |
| 51 | Heading `### How this framework supports each strategy`. **Proposed fix:** `### Existing components, by strategy` (or `### Existing support, by strategy`). The current heading reads as a sales pitch; the revised heading just labels the table. | |
| 124 | Heading `### How this framework should scale`. **Proposed fix:** `### Scaling to N=4`. | |
| 56 | Inside the table cell at line 56: "Deferral signal for strategy 2 — *already operational*." Borderline; status info in a status table is legitimate. Recommend **reject** unless you find it boastful in context. | |

---

## B4 — "moreover," "furthermore," "thus we see," "it is important to note that," "as we shall see"

| Line | Finding | Triage |
|---|---|---|
| 37 | "The composite trust score from Q1.1 **thus** does double duty: a regime-aware deferral rule for the *physics expert specifically*, and a deployment-time safety shield over the *whole policy*." **Proposed fix:** drop "thus": "The composite trust score from Q1.1 does double duty..." | |

---

## B5 — "honestly to downstream consumers" / corporate-speak

Not present.

---

## B6 — "naturally," "clearly," "obviously," "notably"

| Line | Finding | Triage |
|---|---|---|
| 37 | "The PINN residual gate $\mathcal{V}_{\text{regime}} \cdot \mathcal{V}_{\text{signal}} \cdot \mathcal{V}_{\text{residual}}$ from Q1.1 is the **natural** shield here..." "Natural" hides the actual reasoning ("the gate already produces a binary trust score that the shield can read directly"). **Proposed fix:** "The PINN residual gate from Q1.1 is the shield here — when any gate fails, $\lambda_{\text{physics}}\to 0$ is enforced exogenously..." (Cut "natural"; the next clause already explains why this gate fits.) | |
| 119 | "**Naturally** handles graceful degradation (a degraded expert is a subset action); interpretable" **Proposed fix:** "Handles graceful degradation by treating a degraded expert as a subset action; interpretable." (Move the parenthetical into the sentence; cut "naturally.") | |

---

## B7 — "in this section / paper / framework"

| Line | Finding | Triage |
|---|---|---|
| 9 | Heading `### What "reward shift" means in this framework`. "in this framework" is redundant inside the document. **Proposed fix:** `### What "reward shift" means here` or just `### What "reward shift" means`. | |
| 39 | "Two operational forms **in this framework**: (i) maintain an ensemble of reward coefficients..." **Proposed fix:** "Two operational forms: (i) maintain an ensemble of reward coefficients..." | |

---

## B8 — 4+ citation stacks

Not present. Largest stack is two citations (line 45, 47, 94), each carrying a distinct claim.

---

## R5 — Citations support specific claims

No violations. Each citation in the file supports a distinct claim; placement is mid-sentence or at table-row end. Strong example: lines 31 and 35 each thread a different paper to a specific contribution.

---

## R6 — Concrete images on abstract claims

No violations. Concrete imagery is generally well used:

- "Goodhart pathology" (line 19) — names a known failure mode rather than describing it abstractly.
- "the column space spanned by $\mathbf{A}_a$, the bonus widens" (line 33) — geometric.
- "gate-then-policy-then-bandit-deferral" (line 74) — the compound noun *is* the image.
- "the pathology becomes load-bearing" (line 126) — architectural.
- "degrade gracefully — a dropped or low-confidence expert simply has $\alpha_i \to 0$" (line 122) — operational.

---

## Guide-gap candidates (feed §7.4 bite-back)

These passages either pass all current rules but feel off, or surface a phenomenon no current rule covers.

| Line | Observation | Why it's a gap |
|---|---|---|
| 31 | 50+ word run-on sentence with nested parenthetical: *"Cheap to implement (sample $\boldsymbol{c}$ per episode from a Dirichlet centred on the hand-tuned values, in the spirit of the simulation-to-real domain randomisation of @tobin2017domainrand), no online adaptation required, and trades some peak performance on the tuned reward for robustness across the band."* | No current rule on sentence-length / nested-parenthetical readability. Earlier draft of §3 considered a "vary cadence" rule (cut for lack of bite). This passage is a candidate bite — suggests a future R7: "If a sentence runs over ~40 words and contains a nested parenthetical or three-clause coordination, break it." |
| 33, 122 | "principled" used as a quality claim: *"This is a **principled** *implicit* answer to reward shift..."* / *"with **Dirichlet** as the **principled-exploration** upgrade."* | No current banned tell covers the "principled / rigorous / elegant" class — assertions of mathematical or design quality that should be demonstrated, not asserted. Bite-back candidate B9: ban "principled," "rigorous," "elegant" as adjectives applied to the writer's own work. (Distinct from "principled" used technically, e.g., "principled Bayesian inference," which is a term of art.) |
| 138 vs. 101 | "**natural** parameterisation" (line 101) is a mathematical term of art (the obvious one; the canonical one). "**natural** compromise" (line 138) means "I want this to feel inevitable." | Same word, two registers. B6 currently bans "naturally" (adverb). Refinement candidate: extend B6 to ban "natural" *as an adjective applied to a design choice* (line 138), but keep the technical sense (line 101). The distinguisher: does "natural" mean "the unique mathematical object satisfying X" (keep) or "the choice the author wants to call out as obvious" (cut)? |

---

## Factual / consistency

Not a style-rule finding, but caught in the audit.

| Line | Finding | Triage |
|---|---|---|
| 19 | "The **four** strategies below tackle one or both terms; they are not interchangeable." There are **five** strategies listed (lines 25, 33, 35, 37, 39 — Train-time reward robustness, UCB deferral, Conservative offline updates, Safety shielding, Bayesian reward modelling). **Proposed fix:** "The five strategies below..." | |

---

## Notes for §7.2 triage

- The R2 violations (lines 41, 51, 111) are the highest-bite findings — they are the same opener-paragraph + table pattern that R2 was triangulated on.
- The B3 findings divide into two: heading-level promotion (lines 23, 51, 124), which is the same problem we fixed in Q2.1's renamed `Where the signals live...`; and an inline status note (line 56), which is borderline and may legitimately stay in a status table.
- Three guide-gap candidates suggest concrete additions to STYLE.md §3 / §4. None are urgent — bite-back is bundled (§7.4 says every ~3 files).
- One factual error caught (line 19, "four" → "five"). Worth fixing on the same pass.
