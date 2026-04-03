---
title: "Ablation Study"
---

## Ablation Study

To assess the contribution of each model component, we perform ablation experiments comparing standalone and fused architectures. [](#tab:ablation_compact) summarizes F1-scores for the GAT-only and fusion setups across all datasets.

**Score Fusion:** During inference, predictions are fused using fixed performance-based weights as $P_{\text{fused}} = \omega_{\text{anomaly}} \cdot P_{\text{VGAE}} + \omega_{\text{GAT}} \cdot P_{\text{GAT}}$, where $\omega_{\text{anomaly}} = 0.15$ and $\omega_{\text{GAT}} = 0.85$. These weights (0.85, 0.15) were determined empirically based on validation performance.

:::{table} Ablation Study Results (F1-Scores)
:label: tab:ablation_compact

| **Dataset** | **GAT-Only** | **Fusion** | **Best** |
|---|---|---|---|
| S01 | **0.899** | 0.895 | GAT |
| S02 | **0.797** | 0.792 | GAT |
| S03 | 0.951 | 0.951 | Tie |
| S04 | **0.920** | 0.918 | GAT |
| CarH | 0.999 | 0.999 | Tie |
| CarS | 1.000 | 1.000 | Tie |
| **Mean** | **0.927** | **0.926** | -- |
:::

The ablation results show that GAT-only performs best or on par with the weighted fusion approach across all datasets, suggesting that simple linear fusion offers limited benefits over the standalone GAT classifier. Future work should explore more sophisticated fusion strategies, such as mixture-of-experts (MoE) architectures or attention-based fusion mechanisms, to better leverage the complementary strengths of both components.
