# GSN Schema — Mapping the kd-gat Argument DAG to Goal Structuring Notation

This file specifies a Goal Structuring Notation (GSN) data model for the candidacy argument and maps every field in the existing schema (`DAG.md`) to a GSN element, link, or decorator. The intended use is twofold: (1) decide whether to rebrand `gsn-dag.yaml` to a GSN-conformant encoding, and (2) if so, give a one-pass migration recipe.

Authoritative source: **SCSC GSN Community Standard, Version 3, May 2021**, published by the SCSC Assurance Case Working Group (ACWG). All quoted normative text below is from that document; section identifiers (e.g. `1:2.1.4`) are the standard's own. The PDF was retrieved via the SCSC site — see "Sources" at end. Where the standard is silent, we cite OntoGSN ([arxiv:2506.11023](https://arxiv.org/abs/2506.11023)) as a peer-reviewed formalization.

## 1. Core elements

GSN defines six core element types (§1:2.1.1). One paragraph each, with the canonical visual symbol the standard prescribes (Table 1:2-1) and the corresponding YAML record shape used in this repo.

**Goal — claim that forms part of the argument.** Rendered as a rectangle. Quote (§1:2.1.4, Table 1:2-1): *"A goal, rendered as a rectangle, presents a claim forming part of the argument."* Goals are the only element type that may be either developed (supported by sub-Goals, a Strategy, or a Solution) or undeveloped (terminal pending further work).

```yaml
- id: G1
  type: Goal
  statement: "Class-conditional coverage holds under joint fitting on CAN data"
  undeveloped: false      # see §3 for the decorator
  public: false           # only relevant in modular cases
```

**Strategy — reasoning step that decomposes a Goal into sub-Goals.** Rendered as a parallelogram. Quote: *"A strategy, rendered as a parallelogram, describes the inference that exists between a goal and its supporting goal(s)."* Strategies do not themselves close a Goal — they justify the decomposition into supporting Goals/Solutions. They are the GSN analogue of the existing `derivation` record's `warrant`.

```yaml
- id: S1
  type: Strategy
  statement: "Argue by composition of class-conditional coverage with deployable compression"
  undeveloped: false
```

**Solution — reference to an evidence item that directly supports a Goal.** Rendered as a circle. Quote: *"A solution, rendered as a circle, presents a reference to an evidence item."* Solutions are leaves in the SupportedBy spine and never themselves carry sub-elements.

```yaml
- id: Sn1
  type: Solution
  statement: "Empirical AUROC ≥ 0.95 on ROAD test split"
  evidence_ref: "results/roc.csv"
  citation: null            # set when the solution is a cited result
```

**Context — contextual artefact bounding a Goal or Strategy.** Rendered as a rectangle with rounded ends (a stadium). Quote: *"A context, rendered as shown left, presents a contextual artefact. This can be a reference to contextual information, or a statement."* Context is *attached* to (not supports) a Goal/Strategy via InContextOf.

```yaml
- id: C1
  type: Context
  statement: "ASIL C/D under ISO 26262; embedded Cortex-A7/A53 envelope (K1, K2)"
```

**Assumption — intentionally unsubstantiated statement.** Rendered as an oval with a small "A" tag at top- or bottom-right. Quote: *"An assumption, rendered as an oval with the letter 'A' at the top- or bottom-right, presents an intentionally unsubstantiated statement."* Carries no Solution beneath it; the `A` tag is part of the symbol, not a separate element.

```yaml
- id: A1
  type: Assumption
  statement: "CAN protocol lacks message authentication (K5)"
  citation: "kim2018"      # in this repo, every Assumption SHOULD carry a cite-key
```

**Justification — rationale for a Strategy or Goal.** Rendered as an oval with a small "J" tag at top- or bottom-right. Quote: *"A justification, rendered as an oval with the letter 'J' at the top- or bottom-right, presents a statement of rationale."* Distinct from Assumption: a Justification explains *why a Strategy is appropriate*; an Assumption is a premise treated as true.

```yaml
- id: J1
  type: Justification
  statement: "Composition is sound because joint fit preserves marginal coverage"
```

## 2. Core link types

GSN defines exactly two relationship types (§1:2.1.5, Table 1:2-2). Both are directed, with the arrow pointing from source (parent) to target (child).

**SupportedBy** — solid line with a *closed/solid* arrowhead. Quote (Table 1:2-2): *"SupportedBy, rendered as a line with a solid arrowhead, allows support relationships between elements to be documented. Permitted 'supported by' connections are: goal-to-goal, goal-to-strategy, goal-to-solution, strategy to goal."*

**InContextOf** — solid line with an *open/hollow* arrowhead. Quote: *"InContextOf, rendered as a line with a hollow arrowhead, declares a contextual relationship. Permitted 'in context of' connections are: goal-to-context, goal-to-assumption, goal-to-justification, strategy-to-context, strategy-to-assumption and strategy-to-justification."*

The standard further constrains the graph (§1:2.2.2): *"A GSN goal structure is a directed acyclic graph. … SupportedBy relationships shall not be constructed so as to directly or indirectly allow a goal to support itself."* This matches the existing DAG's acyclicity invariant.

```yaml
links:
  - from: G1
    to: S1
    type: SupportedBy        # Goal → Strategy
  - from: S1
    to: G2
    type: SupportedBy        # Strategy → Goal
  - from: G2
    to: Sn1
    type: SupportedBy        # Goal → Solution
  - from: G1
    to: C1
    type: InContextOf        # Goal → Context
  - from: S1
    to: J1
    type: InContextOf        # Strategy → Justification
```

A linter can validate every link's `(source.type, target.type, link.type)` triple against the two permitted-connection lists above. OntoGSN (§3 of arxiv:2506.11023) encodes the same rules as SWRL constraints over OWL classes `Goal`, `Strategy`, `Solution`, `Assumption`, `Justification`, `ArtefactReference`.

## 3. Decorators

Decorators modify an element without changing its type.

**Undeveloped** — hollow diamond at the bottom centre of the element. Quote (§1:2.1.4, Table 1:2-1): *"Undeveloped element decorator, rendered as a hollow diamond applied to the bottom centre of an element, indicates that a line of argument has not been developed. It can apply to goals (as below) and strategies."* **This is the GSN equivalent of `asserted_claim` in the current schema — the load-bearing equivalence for the rebrand.** A Goal carrying this decorator is exactly a node the gap-walker should flag as terminal-and-not-closed.

**Uninstantiated** — hollow triangle, used inside Patterns to mark elements awaiting parameter binding. Standard quote (§1:3.3): *"Decorators can be overlaid to denote that the attached element requires both further development and instantiation."* Combined with Undeveloped this gives a "diamond + triangle" decorator. **This is the closest GSN concept to `instantiates` in the current schema, but it is a Pattern-level mechanism (§1:3) rather than a per-instance link** — see §6.

**Public** — miniature module symbol superimposed at top-right. Quote (§1:4.2.2): *"Public Decorator, rendered as a miniature module symbol and superimposed on a goal, solution, context, assumption or justification symbol at the top right. This indicates that the element is publicly visible in one or more interfaces of the module and can be referenced as an away element."* Only relevant once the argument is split into Modules (§4 below).

```yaml
- id: G_open
  type: Goal
  statement: "Coverage void under independent calibration is closed"
  undeveloped: true        # the asserted-gap marker
  uninstantiated: false
  public: false
```

## 4. Module structure (brief)

GSN supports modular safety cases (§1:4) via four reference elements that point into other modules: Away Goal, Away Solution, Away Context, Away Assumption, Away Justification, plus Module Reference and Contract Reference. Quote (§1:4.2.2): *"An away goal reference repeats a claim presented in another argument module."* Each reference carries both an element identifier and the source `{module identifier}`. Public-decorated elements in module M are the legal targets of an Away reference from module M'.

For the candidacy DAG, modules become relevant only if (a) the thesis-layer and instance-layer split is reified as two modules, or (b) the constraint set `K1..K9` becomes a separately-versioned context module. Until then, all elements live in a single implicit module (the standard explicitly permits this: §1:4.1.2 — *"the concept of an argument module exists even in core GSN, however it is often implicit in non-modular representations"*).

## 5. Mapping table — current schema → GSN

The mapping below treats every `claims` and `derivations` record in `gsn-dag.yaml` as a GSN element or link.

| current schema | GSN element/link | notes |
|---|---|---|
| `top_claim` | Goal (root) | `C-thesis` becomes the root Goal of the argument. |
| `derived_claim` | Goal (non-leaf) | Standard Goal; supported by ≥1 Strategy or further Goals. |
| `asserted_claim` | Goal + `undeveloped: true` | The load-bearing equivalence: hollow-diamond decorator (§1:2.1.4). |
| `domain_axiom` (with citation) | Assumption | Per §1:2.1.4: "intentionally unsubstantiated statement"; this repo's discipline (citation required) is stricter than the standard. |
| `empirical` | Solution | Direct evidence; `evidence_ref` field carries the artefact path. |
| `cited_result` | Solution + `citation` | A Solution whose evidence artefact is an external publication. |
| `derivation` (record) | Strategy + 2× SupportedBy | One Strategy node S; SupportedBy from parent Goal to S; SupportedBy from S to each premise Goal/Solution. |
| `derivation.warrant` | `Strategy.statement` | Direct: the warrant text becomes the Strategy statement. |
| `derivation.conclusion` | parent Goal of the Strategy | SupportedBy: Goal → Strategy. |
| `derivation.premises[i]` | child of the Strategy | SupportedBy: Strategy → Goal/Solution. |
| `derivation.kind: proposed` | Strategy + `undeveloped: true` | Open derivation = undeveloped Strategy (§1:2.1.4 covers Goals *and* Strategies). |
| `derivation.kind: asserted` | Strategy + `undeveloped: true` | Same as `proposed`; the standard does not distinguish them. |
| `derivation.open_question` | Justification attached InContextOf | A Justification node carrying the open-question text, linked InContextOf from the Strategy. |
| constraint (`K*`, `layer: constraint`) | Context | Top-level Contexts; attached InContextOf from the Goals or Strategies they govern. |
| `claim.layer: thesis` vs `instance` | Module split (optional) | Two argument modules tied via Away Goals; not required, but legible if adopted. |
| `claim.instantiates: <thesis-id>` | **No direct GSN equivalent.** | See §6 — closest match is the Pattern–Instantiation mechanism (§1:3.5), but that is template-level not edge-level. **Flag as an extension question for the rebrand.** |
| `claim.formal_object: bool` | (no equivalent) | Drop or keep as a non-GSN annotation; the standard is silent. |
| `claim.status: gap` | `undeveloped: true` | Redundant once `asserted_claim` → undeveloped Goal. |
| `claim.citations` | `Solution.citation` / `Assumption.citation` | Bib keys live on Solutions and Assumptions; current dual-typed `citations` field collapses cleanly. |

Where the standard is opinionated (Goal/Strategy/Solution/Context/Assumption/Justification, the two link types, Undeveloped) the mapping is mechanical. The extension questions concentrate on `instantiates` (no GSN edge type for "instance-of") and `formal_object` (no GSN concept).

## 6. Conformant YAML data model

The conformant encoding hoists today's `claims` + `derivations` into a single `elements` list plus an explicit `links` list. The walker's closure semantics (`is_closed`) survive verbatim if we read `undeveloped: true` as the new failure condition in place of `kind == "asserted_claim"`.

```yaml
# data/gsn/gsn-dag.yaml  (proposed)
module:
  id: kdgat-thesis
  description: "kd-gat candidacy argument"

elements:
  # Root claim
  - id: G-thesis
    type: Goal
    statement: "Adaptive fusion of graph-based ensembles meets ASIL C/D CAN-IDS bar"
    undeveloped: false

  # Decomposition step
  - id: S-thesis
    type: Strategy
    statement: "Argue by composition of class-conditional coverage with deployable compression"
    undeveloped: true            # was derivation.kind: proposed

  # Supporting Goals
  - id: G-coverage
    type: Goal
    statement: "Class-conditional coverage holds under joint fitting"
    undeveloped: true            # was kind: asserted_claim (N03)

  # Cited evidence
  - id: Sn-decoupled
    type: Solution
    statement: "Decoupled approval of safety-critical ML actions is sound"
    citation: ["amodei2016concrete", "krakovna2020specification", "uesato2020decoupled"]

  # Constraint as Context
  - id: C-asil
    type: Context
    statement: "ASIL C/D under ISO 26262 (K2); ISO/PAS 8800:2024 SOTIF extension (K3)"

  # Domain assumption with required citation
  - id: A-can
    type: Assumption
    statement: "CAN protocol lacks message authentication (K5)"
    citation: "paper/content/introduction.md:8-10"

links:
  - {from: G-thesis,   to: S-thesis,      type: SupportedBy}
  - {from: S-thesis,   to: G-coverage,    type: SupportedBy}
  - {from: S-thesis,   to: Sn-decoupled,  type: SupportedBy}
  - {from: G-thesis,   to: C-asil,        type: InContextOf}
  - {from: G-coverage, to: A-can,         type: InContextOf}
```

A validator over this file enforces three invariants from the standard: (1) every link's source/target type pair is on the §1:2.1.4 permitted-connections list; (2) the graph is acyclic (§1:2.2.2); (3) every Assumption carries `citation` (this repo's discipline beyond the standard).

## 7. Consequences for the candidacy DAG

If the rebrand is adopted, the changes are confined to the encoding and tooling — none of the closure semantics or the gap-walker's logic change in shape:

- **Field renames:** `kind: top_claim|derived_claim → type: Goal`; `kind: asserted_claim → type: Goal, undeveloped: true`; `kind: empirical|cited_result → type: Solution`; `kind: domain_axiom → type: Assumption`; `derivation → Strategy + two SupportedBy edges`.
- **What falls out:** the `kind` enum on claims (subsumed by `type` + `undeveloped`); the dual-typed `citations` field (lives on Solution and Assumption only); the `claim.status` enum (subsumed by `undeveloped`).
- **Extension question:** `instantiates` has no native GSN edge. Three options — (a) drop it and let thesis ↔ instance be implicit cross-module Away references, (b) hoist thesis and instance into separate modules and use Away Goals (§1:4.2), (c) keep `instantiates` as a non-standard annotation and document it in this schema.
- **Walker refit:** the existing `is_closed` swaps `c.kind == "asserted_claim"` for `c.undeveloped == True` and treats Strategies analogously to derivations. The OR (multiple Strategies under one Goal) and AND (multiple SupportedBy children of one Strategy) semantics in `DAG.md` §Closure-semantics are preserved; the standard does not prescribe AND/OR semantics, so this remains a local convention.
- **Tooling that becomes available:** [Astah GSN](https://astah.net/products/astah-gsn/) and ACEditor render the diamond decorator natively; OntoGSN (arxiv:2506.11023) provides an OWL+SWRL ruleset that can replay the §1:2.1.4 permitted-connections check; SCSC GSN-conformant Word/PowerPoint templates accompany the standard.
- **Reviewer alignment:** ISO 26262 / DO-178C / EASA reviewers and the OEM safety teams the candidacy targets already speak GSN. The rebrand is mostly terminological — the DAG already encodes the right semantic structure.
- **Scope of work:** ~40 minutes to rewrite `gsn-dag.yaml` as `gsn-dag.yaml` per §6; ~1 hour to refit the walker in `tools/gsn/` (path TBD); the `K1..K9` constraints are already in a parallel `constraints:` block and become Context elements with no semantic change.

The single decision that does not have a clean default is `instantiates`. The recommendation, pending agreement: keep `instantiates` as a non-standard annotation tagged in the YAML as `x_instantiates:` (the `x_` prefix flags it as outside the standard) and revisit if/when the thesis layer is hoisted to its own GSN module.

## Sources

- **SCSC GSN Community Standard, Version 3 (May 2021).** Published by the SCSC Assurance Case Working Group. PDF retrieved via [scsc.uk/scsc-141c](https://scsc.uk/scsc-141c). All section identifiers (`1:2.1.4`, `1:4.2.2`, etc.) and quoted normative text in this file are from the v3 PDF. Tables 1:2-1 (core elements), 1:2-2 (relationships), 1:4-1 (modular extensions) are the authoritative figures.
- **GSN Community Standard Version 1 (November 2011).** Earlier edition retrieved via the same SCSC site, used as cross-check for the symbol shapes; v3 supersedes v1 throughout.
- **Kelly & Weaver, "The Goal Structuring Notation – A Safety Argument Notation"**, *Proc. DSN-2004 Workshop on Assurance Cases* — the canonical academic introduction. [Konkuk-hosted PDF](http://dslab.konkuk.ac.kr/Class/2012/12SIonSE/Key%20Papers/The%20Goal%20Structuring%20Notation%20_%20A%20Safety%20Argument%20Notation.pdf) was inaccessible from this environment; we relied on the v3 standard's prose, which subsumes the 2004 paper's content.
- **OntoGSN — A 1:1 OWL formalisation of GSN Community Standard v3** ([arxiv:2506.11023](https://arxiv.org/abs/2506.11023)). Used to confirm the legal-connection rules and the Boolean encoding of decorators (`undeveloped`, `away`, `public`) as data properties on a `GSNElement` superclass.
- **Open Autonomy Safety Case Framework** ([arxiv:2404.05444](https://arxiv.org/abs/2404.05444)). Cited for parallel application of GSN to autonomous-vehicle ASIL space — context, not a normative source.

**Inaccessible sources (flagged):** Kelly's 1998 York PhD thesis (`kelly1998arguing`) was not retrieved — full text not available without library access; the v3 standard supersedes it for normative purposes. The peer-reviewed safetyengineering.wordpress.com summary was used to cross-check symbol shapes during the v3 PDF parse and is a secondary source, not a primary one.
