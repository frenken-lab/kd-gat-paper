# `fusion` — DQN Fusion Weight Distribution

## What it shows
Distribution of the DQN bandit fusion weight α (0 = full VGAE, 1 = full GAT) across evaluated graphs, split by traffic class. Multimodal peaks at α ∈ {0, 0.2, 0.4, 0.6, 0.8} are evidence of attack-type-specific fusion strategies.

## Data
Flat array of evaluation records:

```json
[{ "alpha": 0.73, "label": 1, "attack_type": "DoS" }]
```

Source: `data/dqn_policy.parquet`. Currently 1,873 records (real data).

## Sources
- Discussed in §DQN-Fusion Analysis of the paper and Q4.2 of `paper/candidacy/committee-questions/reinforcement-learning.md`.
- SveltePlot: `RectY` (via `binX`), `RuleY`, attack-type color legend, toggle buttons per attack type.

## Status
**Real data, complete.** Wishlist had "fusion policy" — already implemented. Future extension: continuous-action variant if Q4.2's simplex policy lands (see `committee-questions/reinforcement-learning.md` §Scaling to N=4).
