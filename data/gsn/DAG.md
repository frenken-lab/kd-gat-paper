# Argument DAG — Schema, Review, and Constraints

Consolidated reference. **As of 2026-05-07d the YAML (`gsn-dag.yaml`) is GSN-conformant**; the authoritative schema is `GSN_SCHEMA.md` (Goal Structuring Notation, SCSC v3 2021). This file kept the original DAG framing for review continuity; the schema section below describes the home-rolled model that was migrated *from*. Closure semantics survive verbatim: `kind == "asserted_claim"` becomes `undeveloped: true` on a Goal; `derivation.kind ∈ {proposed, asserted}` becomes `undeveloped: true` on a Strategy.

The argument encodes the candidacy thesis as a directed AND/OR graph. Walking back from the top claim surfaces structural gaps mechanically: undeveloped Goals + undeveloped Strategies on the critical path are the work that closes the thesis.

## Schema

### Claims

| Field | Type | Notes |
|---|---|---|
| `id` | string | `Nxx` from the original encoding; `C-*` top-level composite; `K*` global constraints. |
| `label` | string | Short name. |
| `kind` | enum | `top_claim` / `derived_claim` / `asserted_claim` / `domain_axiom` / `empirical` / `cited_result` |
| `layer` | enum | `thesis` / `instance` / `constraint` |
| `status` | enum | `current` / `proposed` / `assumed` / `gap` |
| `formal_object` | bool | Mathematical object backing? |
| `description` | string | Prose. |
| `instantiates` | id (opt) | Instance → thesis claim it realizes. |
| `citations` | list (opt) | Bib keys; `cited_result` / `domain_axiom` only. |

### Derivations

| Field | Type | Notes |
|---|---|---|
| `id` | string | `D-*` |
| `conclusion` | claim id | Exactly one. |
| `premises` | list of claim ids | AND-conjoined; all must be closed. |
| `kind` | enum | `derived` / `proposed` / `empirical` / `cited` / `asserted` |
| `warrant` | string | Why these premises license the conclusion. |
| `open_question` | string (opt) | What's missing. |
| `citations` | list (opt) | Bib keys. |

### Closure semantics

A claim is **closed** if (a) its kind is `domain_axiom` / `empirical` / `cited_result`, OR (b) at least one of its derivations is closed. A derivation is closed if `kind` is not `proposed` / `asserted` AND all premises are closed. Multiple derivations of one conclusion = OR-alternatives; premises within one derivation = AND-conjoined. (Standard AND/OR-graph convention; cf. Nilsson 1980, Russell & Norvig §4.) `proposed` / `asserted` derivations participate in the graph (so the gap report can flag them) but do not close their conclusion.

### Layers

- **`thesis`** — abstract requirement; names no specific model.
- **`instance`** — the candidacy's chosen realization; carries `instantiates: <thesis-id>`.
- **`constraint`** — global precondition (hardware, regulatory, threat model, dataset reality). Listed in a top-level `constraints:` section parallel to `claims:`; merged into the same id namespace by the walker loader.

A separate validation pass uses `instantiates`: every thesis-layer `derived_claim` should have ≥1 closed instance pointing at it via `instantiates`.

## Walker

```
is_closed(c):
  if c.kind in {empirical, cited_result, domain_axiom}: return True
  if c.kind == asserted_claim: return False
  for d in derivations(c):
    if d.kind in {proposed, asserted}: continue
    if all(is_closed(p) for p in d.premises): return True
  return False

report_gaps(c):
  if is_closed(c): return
  if c.kind == asserted_claim: emit asserted_gap; return
  if no derivations(c): emit no_derivation_gap; return
  for d in derivations(c):
    if d.kind in {proposed, asserted}: emit open_derivation_gap(d)
    for p in d.premises where not is_closed(p): report_gaps(p)
```

```python
import yaml
doc = yaml.safe_load(open("gsn-dag.yaml"))
all_claims = doc["claims"] + doc.get("constraints", [])
claims = {c["id"]: c for c in all_claims}
deriv = {}
for d in doc["derivations"]:
    deriv.setdefault(d["conclusion"], []).append(d)

CLOSED = {"domain_axiom", "empirical", "cited_result"}
OPEN = {"proposed", "asserted"}
memo = {}

def is_closed(cid):
    if cid in memo: return memo[cid]
    memo[cid] = False
    c = claims[cid]
    if c["kind"] in CLOSED: memo[cid] = True
    elif c["kind"] != "asserted_claim":
        for d in deriv.get(cid, []):
            if d.get("kind") in OPEN: continue
            if all(is_closed(p) for p in d["premises"]):
                memo[cid] = True; break
    return memo[cid]
```

Output for current `gsn-dag.yaml` (GSN-conformant; see `GSN_SCHEMA.md` for the conformant walker over `elements` + `links`):

```
GAP (open strategy S-thesis -> C-thesis)
GAP (open strategy S-N02-instance -> N02-instance)
GAP (undeveloped goal): N03 — Coverage void under independent calibration
GAP (undeveloped goal): N50 — Mondrian abstain-rate is operationally bounded under K7 imbalance
```

Two undeveloped Goals (G1 = N03 critical; G3 = N50 major), two undeveloped Strategies (S-thesis: thesis-layer composition; S-N02-instance: instance-layer composition). G2 (decoupled approval) closed by N31 as a Solution with citations `[amodei2016concrete, krakovna2020specification, uesato2020decoupled]`.

Two regression tests the spec must pass:
1. **OR semantics** — two derivations of one conclusion, one closed, one with an `asserted_claim` premise: no gap.
2. **Open derivation** — `derivation.kind: proposed` with all premises closed: conclusion is open-derivation gap.

## Constraints

Nine global preconditions. Every instance-layer claim should respect each applicable constraint; the walker treats them as ordinary claims (typically `domain_axiom` or `cited_result`) loaded into the claim id namespace.

| ID | Label | Source |
|---|---|---|
| K1 | Embedded-hardware envelope (Cortex-A7/A53; 173K params; 7 ms/window) | `paper/content/introduction.md:21-23` |
| K2 | ASIL C/D under ISO 26262 | `paper/content/introduction.md:25-27` |
| K3 | ISO/PAS 8800:2024 (AI-in-vehicle SOTIF extension) | `iso8800` |
| K4 | UN R155 / WP.29 IDS regulatory mandate (EU type-approval since 2022/2024) | `unece_r155` |
| K5 | CAN protocol lacks authentication | `paper/content/introduction.md:8-10` |
| K6 | Per-window detection semantic (vs FPGA per-message at 0.24 ms/msg; 36 µs/frame at 500 kbps) | `fpga_ids_ecu_2024`, `real_time_zero_day_fpga_2024` |
| K7 | Class imbalance 36:1 to 927:1 across CAN-IDS datasets | `paper/content/experiments.md:27` |
| K8 | DBC unavailability + ByCAN tier (80% slicing, 69% labeling, 50% on Vehicle-Speed) | `bycan_2024` |
| K9 | Cross-vehicle generalization is orthogonal future work | `paper/content/methodology.md:50`, `iv_ids_survey_2025` |

K1, K2, K6 are load-bearing for on-device deployability; K7 forces class-conditional evaluation; K8 sets the tier envelope on the PINN-active subset; K3 + K4 are the regulatory backstop for why the IDS exists at all.

## Review

The DAG is the right *family* of formalism — restores edge orientation and closure semantics the original hypergraph lost. Verdict: **keep with revisions; rebrand to GSN.**

### Comparison to adjacent formalisms

- **GSN (Goal Structuring Notation)**, SCSC Community Standard v3 (2021). Goal / Strategy / Solution / Assumption + undeveloped-diamond decorator (= `asserted_claim`). Standard for ISO 26262 / DO-178C safety cases. Mapping is mechanical: `top_claim` / `derived_claim` → Goal; `derivation` → Strategy; `empirical` / `cited_result` → Solution; `domain_axiom` → Assumption with citation; `asserted_claim` → undeveloped Goal. Gain: terminology and tooling ISO 26262 reviewers already speak; tooling (Astah GSN, ACEditor) renders the diamond decorator natively. Cost: ~40 minutes mapping the YAML to a GSN-conformant schema (e.g. OntoGSN).
- **Toulmin layout** (claim / grounds / warrant / backing / qualifier / rebuttal). Richer; the DAG's `warrant` field already does Toulmin-warrant work. Promotion to backing / qualifier / rebuttal slots optional once contested premises arise.
- **Concept maps** (Novak & Cañas, IHMC 2006). Propositions hierarchically arranged with labeled links; no derivation / assertion distinction. The original hypergraph encoding was effectively a degraded concept map — fails gap detection.
- **Dung argumentation frameworks**. Attack relations + grounded / preferred / stable extensions. Aimed at adversarial argument; nothing here is being attacked. Correctly excluded.
- **Proof DAGs** (Lean Mathlib4; visualised on `lean-perfectoid-spaces`). Closest technical analogue: lemmas closed by proofs whose premises are other lemmas, terminating at axioms. The candidacy DAG is a proof DAG with non-formal closure kinds. "Argument" is therefore the wrong genre label — "warranted-claim DAG" or "GSN goal structure" is closer.
- **Bayesian networks** (Pearl). Probabilistic, not deductive — wrong tool.
- **IBIS** (Kunz & Rittel). Design rationale, not derivation. Historical interest only.

### Technical correctness

- **"AND/OR" label.** Standard convention (Nilsson 1980; AIMA §4) is node-typed; the DAG's edge-typed encoding (premises-list = AND, derivation-set = OR) is consistent provided the convention is stated, not a misuse.
- **Walker history.** Original walker treated derivations as AND-conjoined (visited every premise of every derivation), reporting asserted premises as gaps even when an OR-alternative closed the conclusion. Fixed to OR semantics with derivation-kind awareness.
- **`asserted_claim` vs `domain_axiom`.** Both terminal-with-no-derivation, but axioms close (legitimate terminus) and asserted claims gap. The distinction is enforced by requiring `domain_axiom` to carry a citation or external-standard reference; otherwise it demotes to `asserted_claim`. N31 (decoupled approval) was demoted on this basis, then promoted to `cited_result` once the safety-RL citations were located in `candidacy.bib`.
- **Schema misuses caught and fixed.** Empty-premise empirical derivations (D-N04, D-N27) dropped — empirical claims close by their kind alone, the derivations were ambiguous. N13 (composite trust score) was a `derived_claim` with no derivation; closed via new D-N13 from N14 / N15 / N16 runtime gates. `kind: proposed` derivations were ignored by the walker; now treated as open-derivation gaps.

### Status of required fixes (post-restructure)

| Fix | Status |
|---|---|
| Walker OR semantics | DONE |
| Walker derivation-kind handling | DONE |
| `domain_axiom` admissibility (require citation) | DONE — N31 promoted with citations |
| Un-derived `derived_claim` (N13) | DONE — D-N13 added with N14 / N15 / N16 |
| Constraints lifted to first-class | DONE — K1–K9 in top-level `constraints:` |
| Thesis / instance layer split | DONE — 8 thesis + 12 instance claims |
| Rebrand to GSN | DONE — `gsn-dag.yaml` is GSN-conformant; schema in `GSN_SCHEMA.md`; `layer` / `instantiates` / `formal_object` retained as non-conformant annotations |
| Promote arxiv preprints to conference DOIs | DEFERRED — venue mapping not unambiguous |
| Mondrian abstain-rate inflation under K7 (G3) | FILED as N50 — content-side decision deferred (bound empirically / change mechanism / accept) |

## Open work

- **G1 (N03 coverage void)** — derive simultaneous fire+suppress on CAN data under independent fitting. Critical asserted gap; closing it converts the thesis from design document to formal result.
- **G3 (N50 Mondrian abstain-rate bound)** — under K7 imbalance, classwise conformal predictors are documented to inflate prediction sets on rare classes (Ding et al., OpenReview Dtxc7mlKRg). Three options: (a) bound empirically; (b) replace N17 with pooled-class + imbalance correction; (c) accept and quantify in the candidacy text. Major; content-side decision.
- **D-thesis composition** — compose any class-conditional coverage mechanism with any deployable-compression strategy under K1 + K6 + K7. Open derivation at thesis layer.
- **D-N02-instance composition** — compose Mondrian conformal abstain (N17) with PINN safety shield (N12) on the joint-fit apparatus (N01-instance), conditional on N50. Open derivation at instance layer; the formal contribution of the thesis.

## Files in this directory

- `gsn-dag.yaml` — authoritative DAG instance.
- This file (`DAG.md`) — consolidated schema, review, and constraint inventory.
- `AUDIT.md` — audit of the original hypergraph encoding.
- `legacy/` (suggested) — original `nodes.json` / `hyperedges.json` / `mental_models.json` / `README.md`.
